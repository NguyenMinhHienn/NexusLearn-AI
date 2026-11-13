import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import {
  SUBSCRIPTION_PLANS,
  BillingCycle,
  createStripeCheckoutSession,
  verifyCheckoutSessionForUser,
  createStripePortalUrl,
  cancelActiveSubscription,
  getUserBillingOverview,
  fulfillCheckoutSession,
  handleSubscriptionDeleted,
  getStripeClient,
  isStripeConfigured,
  getStripeMode,
} from '../services/billingService';

const router = Router();

/**
 * Raw-body Stripe Webhook endpoint (`POST /api/billing/webhook`).
 * Mounted in `server.ts` with `express.raw({ type: 'application/json' })` BEFORE `express.json()`
 * so HMAC-SHA256 cryptographic signature verification succeeds byte-for-byte.
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const stripe = getStripeClient();
  const webhookSecret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

  if (!stripe || !webhookSecret) {
    return res.status(400).json({ message: 'Stripe webhook secret is not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ message: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err: any) {
    console.error('⚠️ Stripe Webhook signature verification failed:', err?.message || err);
    return res.status(400).json({ message: `Webhook Error: ${err?.message || 'Invalid signature'}` });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await fulfillCheckoutSession(session, 'stripe_webhook');
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
      default:
        break;
    }

    return res.json({ received: true });
  } catch (err: any) {
    console.error('Stripe Webhook processing error:', err?.message || err);
    return res.status(500).json({ message: 'Webhook fulfillment error' });
  }
}

// Public plan catalog (used by Landing Page & Pricing preview)
router.get('/plans', (_req: Request, res: Response) => {
  res.json({
    stripeConfigured: isStripeConfigured(),
    stripeMode: getStripeMode(),
    plans: Object.values(SUBSCRIPTION_PLANS),
  });
});

// Authenticated user billing overview + transaction ledger
router.get('/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const overview = await getUserBillingOverview(req.user.id);
    return res.json(overview);
  } catch (err: any) {
    console.error('Billing overview error:', err);
    return res.status(500).json({ message: 'Không tải được thông tin gói cước' });
  }
});

// Create Stripe Checkout Session
router.post('/checkout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const { planId, billingCycle, source } = req.body || {};

    if (planId !== 'pro' && planId !== 'unlimited') {
      return res.status(400).json({ message: 'Gói nâng cấp không hợp lệ' });
    }

    const cycle: BillingCycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;

    const checkout = await createStripeCheckoutSession({
      userId: req.user.id,
      planId,
      billingCycle: cycle,
      origin,
      source: source === 'quota_modal' ? 'quota_modal' : 'web_pricing',
    });

    return res.json(checkout);
  } catch (err: any) {
    if (err?.code === 'STRIPE_NOT_CONFIGURED') {
      return res.status(503).json({
        code: 'STRIPE_NOT_CONFIGURED',
        message: 'Chưa cấu hình STRIPE_SECRET_KEY trên Backend.',
      });
    }
    console.error('Stripe checkout creation error:', err?.message || err);
    return res.status(500).json({ message: err?.message || 'Không tạo được phiên thanh toán Stripe' });
  }
});

// Server-to-server verification upon returning from Stripe Checkout (`?session_id=cs_test_...`)
router.post('/verify-session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const { sessionId } = req.body || {};
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ message: 'Missing sessionId' });
    }

    const result = await verifyCheckoutSessionForUser(sessionId.trim(), req.user.id);
    return res.json(result);
  } catch (err: any) {
    const status = err?.statusCode || (err?.code === 'STRIPE_NOT_CONFIGURED' ? 503 : 500);
    console.error('Verify Stripe session error:', err?.message || err);
    return res.status(status).json({ message: err?.message || 'Không xác minh được phiên thanh toán' });
  }
});

// Open Stripe Customer Billing Portal
router.post('/portal', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    const url = await createStripePortalUrl(req.user.id, origin);
    return res.json({ url });
  } catch (err: any) {
    console.error('Billing portal error:', err?.message || err);
    return res.status(400).json({
      code: 'PORTAL_UNAVAILABLE',
      message: err?.message || 'Không mở được Stripe Billing Portal',
    });
  }
});

// Direct cancel fallback (also cancels in Stripe if subscription exists)
router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.id) return res.status(401).json({ message: 'Unauthorized' });
    const result = await cancelActiveSubscription(req.user.id);
    return res.json({
      message: 'Đã hủy gói nâng cấp và chuyển về gói Miễn phí',
      user: result.user,
    });
  } catch (err: any) {
    console.error('Cancel subscription error:', err?.message || err);
    return res.status(500).json({ message: 'Lỗi khi hủy gói đăng ký' });
  }
});

export default router;

