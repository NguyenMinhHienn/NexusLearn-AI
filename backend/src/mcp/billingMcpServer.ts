import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  SUBSCRIPTION_PLANS,
  createStripeCheckoutSession,
  createStripePortalUrl,
  getUserBillingOverview,
  isStripeConfigured,
  getStripeMode,
} from '../services/billingService';

export interface McpBillingContext {
  userId?: number;
  origin?: string;
}

/**
 * Official Model Context Protocol (MCP) Server for NexusLearn AI Billing & Subscriptions.
 *
 * Exposes standardized MCP Resources and Tools so any MCP-compatible AI Host
 * (our built-in Gemini 2.5 Agent over InMemoryTransport, or external hosts like
 * Claude Desktop / Cursor / Antigravity over StdioServerTransport) can inspect
 * user quotas, compare tiers, and create live Stripe Checkout sessions safely.
 *
 * Security boundary: MCP tools NEVER mutate user balances or grant Pro status directly.
 * Upgrades are exclusively fulfilled via cryptographically verified Stripe Webhooks
 * and server-to-server session verification (`fulfillCheckoutSession`).
 */
export function createBillingMcpServer(ctx: McpBillingContext = {}): McpServer {
  const server = new McpServer({
    name: 'nexuslearn-billing-mcp',
    version: '1.0.0',
  });

  // ─── MCP Resource: Subscription Catalog ──────────────────────────────
  server.registerResource(
    'subscription-plans',
    'nexuslearn://billing/plans',
    {
      title: 'NexusLearn AI Subscription Plans',
      description: 'Complete catalog of NexusLearn AI tiers, token quotas, and Stripe billing cycles.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              stripeConfigured: isStripeConfigured(),
              stripeMode: getStripeMode(),
              plans: Object.values(SUBSCRIPTION_PLANS),
            },
            null,
            2
          ),
        },
      ],
    })
  );

  // ─── MCP Tool 1: List Subscription Plans ─────────────────────────────
  server.registerTool(
    'list_subscription_plans',
    {
      title: 'List Subscription Plans',
      description:
        'List all NexusLearn AI subscription plans (Free, Scholar Pro, Research Max) with USD prices, daily AI token quotas, and features.',
      inputSchema: {},
    },
    async () => {
      const payload = {
        action: 'plan_catalog',
        stripeConfigured: isStripeConfigured(),
        stripeMode: getStripeMode(),
        plans: Object.values(SUBSCRIPTION_PLANS).map((p) => ({
          id: p.id,
          name: p.name,
          badge: p.badge,
          dailyTokens: p.dailyTokens,
          monthlyPriceUsd: p.monthlyPriceUsd,
          yearlyPriceUsd: p.yearlyPriceUsd,
          taglineVi: p.taglineVi,
          taglineEn: p.taglineEn,
          featuresVi: p.featuresVi,
          featuresEn: p.featuresEn,
        })),
      };
      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
  );

  // ─── MCP Tool 2: Inspect User Quota & Billing Status ─────────────────
  server.registerTool(
    'get_user_billing_status',
    {
      title: 'Get User Billing & Quota Status',
      description:
        'Inspect the authenticated user current subscription tier (free/pro/unlimited), daily AI token usage, remaining tokens, next refill time, and recent Stripe invoices.',
      inputSchema: {
        userId: z
          .number()
          .int()
          .positive()
          .optional()
          .describe('Optional user ID when running via standalone admin stdio transport.'),
      },
    },
    async (args) => {
      const targetUserId = ctx.userId ?? args.userId;
      if (!targetUserId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'auth_required',
                authenticated: false,
                message: 'User is browsing as a guest. Ask them to sign in at /login to inspect personal token usage or upgrade.',
                loginUrl: '/login',
              }),
            },
          ],
        };
      }

      const overview = await getUserBillingOverview(targetUserId);
      const remaining = Math.max(
        0,
        (overview.user?.token_quota || 0) - (overview.user?.tokens_used || 0)
      );

      const payload = {
        action: 'billing_status',
        authenticated: true,
        planTier: overview.currentPlan.id,
        planName: overview.currentPlan.name,
        badge: overview.currentPlan.badge,
        tokenQuota: overview.user?.token_quota || 15000,
        tokensUsed: overview.user?.tokens_used || 0,
        tokensRemaining: remaining,
        nextQuotaReset: overview.user?.next_quota_reset || null,
        recentTransactions: overview.transactions,
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(payload) }],
      };
    }
  );

  // ─── MCP Tool 3: Create Stripe Upgrade Checkout Session ──────────────
  server.registerTool(
    'create_upgrade_checkout',
    {
      title: 'Create Stripe Upgrade Checkout Session',
      description:
        'Generate a live Stripe Checkout session URL so the user can upgrade to Scholar Pro ($9/mo or $84/yr, 300k tokens/day) or Research Max ($19/mo or $180/yr, 1M tokens/day).',
      inputSchema: {
        planId: z
          .enum(['pro', 'unlimited'])
          .describe("Target plan tier: 'pro' (Scholar Pro) or 'unlimited' (Research Max)."),
        billingCycle: z
          .enum(['monthly', 'yearly'])
          .default('monthly')
          .describe("Billing interval: 'monthly' or 'yearly' (22% discount)."),
      },
    },
    async ({ planId, billingCycle }) => {
      if (!ctx.userId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'auth_required',
                authenticated: false,
                message: 'User must sign in first before starting a Stripe Checkout session.',
                loginUrl: '/login',
              }),
            },
          ],
        };
      }

      const selectedPlan = SUBSCRIPTION_PLANS[planId];
      const amountUsd =
        billingCycle === 'yearly' ? selectedPlan.yearlyPriceUsd : selectedPlan.monthlyPriceUsd;

      try {
        const checkout = await createStripeCheckoutSession({
          userId: ctx.userId,
          planId,
          billingCycle,
          origin: ctx.origin,
          source: 'mcp_agent',
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'checkout_ready',
                planId,
                planName: selectedPlan.name,
                badge: selectedPlan.badge,
                billingCycle,
                amountUsd,
                dailyTokens: selectedPlan.dailyTokens,
                checkoutUrl: checkout.checkoutUrl,
                mode: checkout.mode,
              }),
            },
          ],
        };
      } catch (err: any) {
        if (err?.code === 'STRIPE_NOT_CONFIGURED') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  action: 'stripe_setup_needed',
                  planId,
                  planName: selectedPlan.name,
                  badge: selectedPlan.badge,
                  billingCycle,
                  amountUsd,
                  dailyTokens: selectedPlan.dailyTokens,
                  billingPageUrl: '/app/billing',
                  message:
                    'STRIPE_SECRET_KEY has not been added to backend/.env yet. Direct the user to /app/billing where they can open the 2-step Stripe Test Key setup guide.',
                }),
              },
            ],
          };
        }
        throw err;
      }
    }
  );

  // ─── MCP Tool 4: Open Stripe Customer Billing Portal ─────────────────
  server.registerTool(
    'open_billing_portal',
    {
      title: 'Open Stripe Customer Billing Portal',
      description:
        'Generate a secure Stripe Customer Billing Portal link so an existing subscriber can download PDF invoices, update payment methods, or cancel auto-renewal.',
      inputSchema: {},
    },
    async () => {
      if (!ctx.userId) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'auth_required',
                authenticated: false,
                loginUrl: '/login',
              }),
            },
          ],
        };
      }

      try {
        const portalUrl = await createStripePortalUrl(ctx.userId, ctx.origin);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'portal_ready',
                portalUrl,
              }),
            },
          ],
        };
      } catch {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                action: 'billing_page_fallback',
                billingPageUrl: '/app/billing',
                message:
                  'User does not have an active Stripe portal session yet or Portal is managed via /app/billing.',
              }),
            },
          ],
        };
      }
    }
  );

  return server;
}

// Allow running as a standalone stdio MCP server (`npm run mcp:billing`)
if (require.main === module) {
  (async () => {
    const server = createBillingMcpServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('NexusLearn Billing MCP Server running on stdio');
  })().catch((err) => {
    console.error('Fatal MCP Server error:', err);
    process.exit(1);
  });
}

