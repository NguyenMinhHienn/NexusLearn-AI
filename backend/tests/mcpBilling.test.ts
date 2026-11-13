import { describe, it, expect } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createBillingMcpServer } from '../src/mcp/billingMcpServer';

describe('Official Model Context Protocol (MCP) Billing Server', () => {
  it('exposes spec-compliant MCP tools and resources over InMemoryTransport', async () => {
    const mcpServer = createBillingMcpServer({});
    const mcpClient = new Client({ name: 'vitest-mcp-client', version: '1.0.0' });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
      mcpServer.connect(serverTransport),
      mcpClient.connect(clientTransport),
    ]);

    try {
      const { tools } = await mcpClient.listTools();
      const toolNames = tools.map(t => t.name);
      expect(toolNames).toContain('list_subscription_plans');
      expect(toolNames).toContain('get_user_billing_status');
      expect(toolNames).toContain('create_upgrade_checkout');
      expect(toolNames).toContain('open_billing_portal');

      const { resources } = await mcpClient.listResources();
      expect(resources.some(r => r.uri === 'nexuslearn://billing/plans')).toBe(true);

      const resourcePayload = await mcpClient.readResource({ uri: 'nexuslearn://billing/plans' });
      expect(resourcePayload.contents.length).toBe(1);

      const planResult = await mcpClient.callTool({
        name: 'list_subscription_plans',
        arguments: {},
      });
      const textBlock = (planResult.content as Array<{ type: string; text?: string }>)[0];
      const parsed = JSON.parse(textBlock.text || '{}');
      expect(parsed.action).toBe('plan_catalog');
      expect(Array.isArray(parsed.plans)).toBe(true);
      expect(parsed.plans.length).toBe(3);

      // Unauthenticated call to create_upgrade_checkout must return auth_required guard
      const checkoutResult = await mcpClient.callTool({
        name: 'create_upgrade_checkout',
        arguments: { planId: 'pro', billingCycle: 'monthly' },
      });
      const checkoutText = (checkoutResult.content as Array<{ type: string; text?: string }>)[0];
      const checkoutParsed = JSON.parse(checkoutText.text || '{}');
      expect(checkoutParsed.action).toBe('auth_required');
      expect(checkoutParsed.authenticated).toBe(false);
    } finally {
      await Promise.allSettled([mcpClient.close(), mcpServer.close()]);
    }
  });
});
