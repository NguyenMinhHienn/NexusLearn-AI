import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { FunctionDeclaration, SchemaType } from '@google/generative-ai';
import { createBillingMcpServer, McpBillingContext } from './billingMcpServer';
import { genAI, getActiveModel, AiLang } from '../services/geminiAiService';

const NO_THINKING = { thinkingConfig: { thinkingBudget: 0 } } as any;
const MAX_HISTORY_TURNS = 10;

function mapJsonTypeToGemini(type?: string): SchemaType {
  switch (type) {
    case 'number':
      return SchemaType.NUMBER;
    case 'integer':
      return SchemaType.INTEGER;
    case 'boolean':
      return SchemaType.BOOLEAN;
    case 'array':
      return SchemaType.ARRAY;
    case 'object':
      return SchemaType.OBJECT;
    default:
      return SchemaType.STRING;
  }
}

/**
 * Converts standard MCP JSON Schema (draft-07) returned by `mcpClient.listTools()`
 * into Google Gemini's strict `FunctionDeclaration['parameters']` schema
 * (stripping `$schema` and `additionalProperties` which Gemini rejects).
 */
function convertMcpSchemaToGeminiParams(inputSchema: any): any | undefined {
  if (!inputSchema || typeof inputSchema !== 'object') return undefined;
  const rawProps = inputSchema.properties || {};
  const keys = Object.keys(rawProps);
  if (keys.length === 0) return undefined;

  const properties: Record<string, any> = {};
  for (const key of keys) {
    const prop = rawProps[key] || {};
    const converted: any = {
      type: mapJsonTypeToGemini(prop.type),
    };
    if (prop.description) converted.description = String(prop.description);
    if (Array.isArray(prop.enum) && prop.enum.length > 0 && converted.type === SchemaType.STRING) {
      converted.enum = prop.enum.map(String);
      converted.format = 'enum';
    }
    properties[key] = converted;
  }

  const required = Array.isArray(inputSchema.required)
    ? inputSchema.required.filter((k: string) => keys.includes(k))
    : undefined;

  return {
    type: SchemaType.OBJECT,
    properties,
    ...(required && required.length > 0 ? { required } : {}),
  };
}

export interface AgentChatResponse {
  text: string;
  mcpToolsUsed: string[];
  billingAction?: any;
}

/**
 * Executes a Global AI Assistant turn wired to `nexuslearn-billing-mcp`
 * over the official Model Context Protocol (`Client` <-> `InMemoryTransport` <-> `McpServer`).
 */
export async function runMcpGlobalChat(
  message: string,
  history: { role: 'user' | 'model'; text: string }[],
  lang: AiLang,
  ctx: McpBillingContext
): Promise<AgentChatResponse> {
  const mcpServer = createBillingMcpServer(ctx);
  const mcpClient = new Client({
    name: 'nexuslearn-gemini-host',
    version: '1.0.0',
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([
    mcpServer.connect(serverTransport),
    mcpClient.connect(clientTransport),
  ]);

  const mcpToolsUsed: string[] = [];
  let billingAction: any = null;

  try {
    // 1. Discover MCP tools dynamically over the MCP JSON-RPC protocol
    const { tools: discoveredTools } = await mcpClient.listTools();

    const functionDeclarations: FunctionDeclaration[] = discoveredTools.map((t) => {
      const parameters = convertMcpSchemaToGeminiParams(t.inputSchema);
      return {
        name: t.name,
        description: t.description || t.name,
        ...(parameters ? { parameters } : {}),
      };
    });

    const activeModelName = await getActiveModel();
    const langInstruction =
      lang === 'en'
        ? 'IMPORTANT: Always respond in ENGLISH.'
        : 'QUAN TRỌNG: Luôn trả lời bằng TIẾNG VIỆT.';

    const model = genAI.getGenerativeModel({
      model: activeModelName,
      systemInstruction: `Bạn là Trợ lý AI thông minh của NexusLearn AI — nền tảng E-learning hiện đại được kết nối trực tiếp với hệ thống quản lý gói cước qua chuẩn Model Context Protocol (MCP).
- Khi người dùng hỏi về hạn mức AI token còn lại, gói hiện tại, bảng giá các gói (Free / Scholar Pro / Research Max), nâng cấp tài khoản, mua gói Pro, hoặc quản lý hóa đơn Stripe: HÃY GỌI NGAY các công cụ MCP tương ứng (\`get_user_billing_status\`, \`list_subscription_plans\`, \`create_upgrade_checkout\`, \`open_billing_portal\`).
- Tuyệt đối KHÔNG tự bịa số dư token hay tự bịa đường link thanh toán; luôn lấy dữ liệu thực từ MCP Tool.
- Khi đã tạo phiên thanh toán (\`checkout_ready\`), hãy thông báo ngắn gọn, lịch sự để người dùng bấm vào Thẻ Thanh Toán Stripe hiển thị ngay bên dưới tin nhắn (không cần dán URL dài ngoằng nếu không cần thiết).
- Với các câu hỏi học tập thông thường, hãy hỗ trợ súc tích, rõ ràng, thân thiện.
${langInstruction}`,
      tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
      generationConfig: NO_THINKING,
    });

    const trimmed = history.slice(-MAX_HISTORY_TURNS);
    while (trimmed.length && trimmed[0].role !== 'user') trimmed.shift();

    const chatSession = model.startChat({
      history: trimmed.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    });

    let result = await chatSession.sendMessage([{ text: message }]);
    let response = result.response;

    // 2. Agentic MCP Tool-Calling Loop (up to 3 hops)
    for (let step = 0; step < 3; step++) {
      const calls = response.functionCalls();
      if (!calls || calls.length === 0) break;

      const toolResponseParts: any[] = [];

      for (const call of calls) {
        mcpToolsUsed.push(call.name);
        try {
          const mcpResult = await mcpClient.callTool({
            name: call.name,
            arguments: (call.args as Record<string, unknown>) || {},
          });

          const rawText = Array.isArray(mcpResult.content)
            ? mcpResult.content
                .filter((c: any) => c.type === 'text')
                .map((c: any) => c.text)
                .join('\n')
            : '{}';

          let parsed: any = { raw: rawText };
          try {
            parsed = JSON.parse(rawText);
          } catch {
            // keep raw string fallback
          }

          if (parsed && parsed.action) {
            billingAction = parsed;
          }

          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: parsed,
            },
          });
        } catch (toolErr: any) {
          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: { error: toolErr?.message || 'MCP tool execution error' },
            },
          });
        }
      }

      result = await chatSession.sendMessage(toolResponseParts);
      response = result.response;
    }

    return {
      text: response.text(),
      mcpToolsUsed: Array.from(new Set(mcpToolsUsed)),
      ...(billingAction ? { billingAction } : {}),
    };
  } finally {
    await Promise.allSettled([mcpClient.close(), mcpServer.close()]);
  }
}

