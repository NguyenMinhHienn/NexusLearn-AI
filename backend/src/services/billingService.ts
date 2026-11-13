import Stripe from 'stripe';
import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { ensureSchema } from './schemaService';
import { syncUserQuota } from './quotaService';

export type PlanId = 'free' | 'pro' | 'unlimited';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  badge: string;
  dailyTokens: number;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  monthlyCents: number;
  yearlyCents: number;
  taglineVi: string;
  taglineEn: string;
  featuresVi: string[];
  featuresEn: string[];
}

export const SUBSCRIPTION_PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Starter Free',
    badge: 'FREE',
    dailyTokens: 15_000,
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    monthlyCents: 0,
    yearlyCents: 0,
    taglineVi: 'Khởi đầu học tập thông minh mỗi ngày',
    taglineEn: 'Smart daily learning starter',
    featuresVi: [
      '15.000 AI Tokens tự động hồi mỗi ngày',
      'Bản đồ tư duy Knowledge Map 3 cấp độ',
      'Tạo Flashcard 3D & Trắc nghiệm tiêu chuẩn',
      'Gia sư AI cơ bản trên từng tài liệu',
    ],
    featuresEn: [
      '15,000 AI Tokens refilled every day',
      '3-level interactive Knowledge Maps',
      'Standard 3D Flashcards & AI Quizzes',
      'Document-scoped AI Tutor',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Scholar Pro',
    badge: 'PRO',
    dailyTokens: 300_000,
    monthlyPriceUsd: 9,
    yearlyPriceUsd: 84,
    monthlyCents: 900,
    yearlyCents: 8400,
    taglineVi: 'Gấp 20x hạn mức AI cho sinh viên & người đi làm',
    taglineEn: '20x AI quota for serious learners & professionals',
    featuresVi: [
      '300.000 AI Tokens / ngày (gấp 20 lần gói Free)',
      'Phân tích PDF học thuật dài & YouTube tốc độ cao',
      'Trợ lý AI MCP & Phòng Ôn Tập đa tài liệu không gián đoạn',
      'Huy hiệu PRO nổi bật & Quản lý hóa đơn qua Stripe',
    ],
    featuresEn: [
      '300,000 AI Tokens / day (20x Free tier)',
      'Priority long-PDF & YouTube lecture processing',
      'Uninterrupted Multi-Doc Review & MCP AI Assistant',
      'Verified PRO badge & Stripe invoice management',
    ],
  },
  unlimited: {
    id: 'unlimited',
    name: 'Research Max',
    badge: 'MAX',
    dailyTokens: 1_000_000,
    monthlyPriceUsd: 19,
    yearlyPriceUsd: 180,
    monthlyCents: 1900,
    yearlyCents: 18000,
    taglineVi: 'Sức mạnh tối đa cho nghiên cứu chuyên sâu & nhóm',
    taglineEn: 'Maximum throughput for heavy research & labs',
    featuresVi: [
      '1.000.000 AI Tokens / ngày (gấp 66 lần gói Free)',
      'Ưu tiên luồng xử lý mô hình Gemini 2.5 mới nhất',
      'Không giới hạn kho lưu trữ bản đồ tri thức & Flashcard',
      'Huy hiệu MAX cao cấp & Hỗ trợ ưu tiên 24/7',
    ],
    featuresEn: [
      '1,000,000 AI Tokens / day (66x Free tier)',
      'Highest priority Gemini 2.5 model routing',
      'Unlimited Knowledge Graph & Flashcard decks',
      'Executive MAX badge & 24/7 priority support',
    ],
  },
};

export function isStripeConfigured(): boolean {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  return key.startsWith('sk_test_') || key.startsWith('sk_live_');
}

export function getStripeMode(): 'test' | 'live' | 'unconfigured' {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unconfigured';
}

export function getStripeClient(): Stripe | null {
  const key = (process.env.STRIPE_SECRET_KEY || '').trim();
  if (!key) return null;
  return new Stripe(key);
}

export function resolveSafeFrontendOrigin(requestOrigin?: string): string {
  const configuredFrontend = (process.env.FRONTEND_URL || '').trim();
  if (configuredFrontend) return configuredFrontend.replace(/\/+$/, '');

  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,https://nexus-learn-ai-omega.vercel.app')
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (requestOrigin) {
    const clean = requestOrigin.trim().replace(/\/+$/, '');
    if (allowed.includes(clean) || clean.startsWith('http://localhost:')) {
      return clean;
    }
  }
  return allowed[0] || 'http://localhost:5173';
}

export interface CreateCheckoutParams {
  userId: number;
  planId: 'pro' | 'unlimited';
  billingCycle: BillingCycle;
  origin?: string;
  source?: 'web_pricing' | 'quota_modal' | 'mcp_agent';
}

export async function createStripeCheckoutSession(params: CreateCheckoutParams) {
  await ensureSchema();
  const { userId, planId, billingCycle, origin, source = 'web_pricing' } = params;

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error('Invalid subscription plan selected');
  }

  const stripe = getStripeClient();
  if (!stripe) {
    const err: any = new Error('Stripe secret key is not configured yet');
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  const [users] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, name, stripe_customer_id FROM users WHERE id = ?',
    [userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  const user = users[0];
  let customerId: string | undefined = user.stripe_customer_id || undefined;

  // Verify or create Stripe customer
  if (customerId) {
    try {
      const existing = await stripe.customers.retrieve(customerId);
      if ((existing as any).deleted) customerId = undefined;
    } catch {
      customerId = undefined;
    }
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { user_id: String(user.id) },
    });
    customerId = customer.id;
    await pool.query('UPDATE users SET stripe_customer_id = ? WHERE id = ?', [customerId, user.id]);
  }

  const unitAmount = billingCycle === 'yearly' ? plan.yearlyCents : plan.monthlyCents;
  const interval: 'month' | 'year' = billingCycle === 'yearly' ? 'year' : 'month';
  const baseUrl = resolveSafeFrontendOrigin(origin);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    client_reference_id: String(user.id),
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `NexusLearn AI — ${plan.name} (${billingCycle === 'yearly' ? 'Annual' : 'Monthly'})`,
            description: `${plan.dailyTokens.toLocaleString('en-US')} AI Tokens / day · Instant activation`,
          },
          unit_amount: unitAmount,
          recurring: { interval },
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: String(user.id),
      plan_id: planId,
      billing_cycle: billingCycle,
      source,
    },
    subscription_data: {
      metadata: {
        user_id: String(user.id),
        plan_id: planId,
        billing_cycle: billingCycle,
      },
    },
    success_url: `${baseUrl}/app/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/app/billing?canceled=1`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url!,
    plan,
    billingCycle,
    amountUsd: unitAmount / 100,
    mode: getStripeMode(),
  };
}

/**
 * Idempotently fulfills a paid Stripe Checkout Session.
 * Safe to invoke from BOTH Stripe Webhooks and redirect verification:
 * `stripe_session_id` has a UNIQUE constraint in `payment_transactions`.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  triggerSource: 'stripe_webhook' | 'stripe_verify' | 'mcp_agent' = 'stripe_webhook'
) {
  await ensureSchema();

  if (session.payment_status !== 'paid' && session.status !== 'complete') {
    return { fulfilled: false, reason: 'Session not paid yet' };
  }

  const userId = Number(session.metadata?.user_id || session.client_reference_id);
  const rawPlan = (session.metadata?.plan_id || 'pro') as PlanId;
  const planId: PlanId = rawPlan === 'unlimited' ? 'unlimited' : 'pro';
  const billingCycle: BillingCycle = session.metadata?.billing_cycle === 'yearly' ? 'yearly' : 'monthly';
  const plan = SUBSCRIPTION_PLANS[planId];

  if (!userId || isNaN(userId)) {
    throw new Error('Missing user_id in Stripe session metadata');
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null;
  const subscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null;
  const paymentIntent =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null;
  const amountCents = session.amount_total ?? (billingCycle === 'yearly' ? plan.yearlyCents : plan.monthlyCents);
  const currency = session.currency || 'usd';
  const originSource = session.metadata?.source === 'mcp_agent' ? 'mcp_agent' : triggerSource;

  // Idempotent ledger insert (INSERT IGNORE prevents double fulfillment)
  const [insertRes] = await pool.query<ResultSetHeader>(
    `INSERT IGNORE INTO payment_transactions
      (user_id, stripe_session_id, stripe_payment_intent, plan_id, billing_cycle, amount_cents, currency, status, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
    [userId, session.id, paymentIntent, planId, billingCycle, amountCents, currency, originSource]
  );

  // Always ensure user tier & quota reflect the active subscription
  await pool.query(
    `UPDATE users
     SET plan_tier = ?,
         token_quota = ?,
         tokens_used = CASE WHEN plan_tier <> ? THEN 0 ELSE tokens_used END,
         stripe_customer_id = COALESCE(?, stripe_customer_id),
         stripe_subscription_id = COALESCE(?, stripe_subscription_id),
         plan_expires_at = NULL
     WHERE id = ?`,
    [planId, plan.dailyTokens, planId, customerId, subscriptionId, userId]
  );

  const syncedUser = await syncUserQuota(userId);
  return {
    fulfilled: true,
    alreadyProcessed: insertRes.affectedRows === 0,
    planId,
    billingCycle,
    dailyTokens: plan.dailyTokens,
    user: syncedUser,
  };
}

export async function verifyCheckoutSessionForUser(sessionId: string, userId: number) {
  const stripe = getStripeClient();
  if (!stripe) {
    const err: any = new Error('Stripe is not configured');
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const sessionOwner = Number(session.metadata?.user_id || session.client_reference_id);
  if (sessionOwner !== userId) {
    const err: any = new Error('Session does not belong to current user');
    err.statusCode = 403;
    throw err;
  }

  return fulfillCheckoutSession(session, 'stripe_verify');
}

export async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await ensureSchema();
  const subId = subscription.id;
  const userIdMeta = Number(subscription.metadata?.user_id || 0);

  if (subId) {
    await pool.query(
      `UPDATE users
       SET plan_tier = 'free', token_quota = 15000, stripe_subscription_id = NULL, plan_expires_at = NULL
       WHERE stripe_subscription_id = ?`,
      [subId]
    );
  } else if (userIdMeta > 0) {
    await pool.query(
      `UPDATE users
       SET plan_tier = 'free', token_quota = 15000, stripe_subscription_id = NULL, plan_expires_at = NULL
       WHERE id = ?`,
      [userIdMeta]
    );
  }
}

export async function createStripePortalUrl(userId: number, origin?: string): Promise<string> {
  const stripe = getStripeClient();
  if (!stripe) {
    const err: any = new Error('Stripe is not configured');
    err.code = 'STRIPE_NOT_CONFIGURED';
    throw err;
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT stripe_customer_id FROM users WHERE id = ?',
    [userId]
  );
  const customerId = rows[0]?.stripe_customer_id;
  if (!customerId) {
    throw new Error('No active Stripe customer found for this account');
  }

  const baseUrl = resolveSafeFrontendOrigin(origin);
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/app/billing`,
  });
  return portal.url;
}

export async function cancelActiveSubscription(userId: number) {
  await ensureSchema();
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT stripe_subscription_id, plan_tier FROM users WHERE id = ?',
    [userId]
  );
  const subId = rows[0]?.stripe_subscription_id;
  const stripe = getStripeClient();

  if (stripe && subId) {
    try {
      await stripe.subscriptions.cancel(subId);
    } catch (e: any) {
      console.warn('Stripe subscription cancel warning:', e?.message || e);
    }
  }

  await pool.query(
    `UPDATE users
     SET plan_tier = 'free',
         token_quota = 15000,
         tokens_used = LEAST(tokens_used, 15000),
         stripe_subscription_id = NULL,
         plan_expires_at = NULL
     WHERE id = ?`,
    [userId]
  );

  const synced = await syncUserQuota(userId);
  return { user: synced };
}

export async function getUserBillingOverview(userId: number) {
  await ensureSchema();
  const user = await syncUserQuota(userId);
  const [transactions] = await pool.query<RowDataPacket[]>(
    `SELECT id, stripe_session_id, plan_id, billing_cycle, amount_cents, currency, status, source, created_at
     FROM payment_transactions
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  const activeTier = ((user?.plan_tier as PlanId) || 'free') in SUBSCRIPTION_PLANS
    ? (user?.plan_tier as PlanId)
    : 'free';

  return {
    stripeConfigured: isStripeConfigured(),
    stripeMode: getStripeMode(),
    currentPlan: SUBSCRIPTION_PLANS[activeTier],
    plans: Object.values(SUBSCRIPTION_PLANS),
    user,
    transactions,
  };
}
