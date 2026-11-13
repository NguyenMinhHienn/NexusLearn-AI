import { describe, it, expect } from 'vitest';
import {
  estimateTextTokens,
  checkQuota,
  PROMPT_OVERHEAD,
  OUTPUT_RESERVE,
} from '../src/services/quotaService';
import { SUBSCRIPTION_PLANS } from '../src/services/billingService';

describe('AI Token Quota & Cost Estimation Engine', () => {
  it('estimates Vietnamese and English text tokens conservatively (~3 chars/token)', () => {
    expect(estimateTextTokens('')).toBe(0);
    expect(estimateTextTokens('abc')).toBe(1);
    expect(estimateTextTokens('Xin chào thế giới AI')).toBe(Math.ceil(20 / 3));
  });

  it('allows actions when estimated cost fits within remaining quota', () => {
    const user = { token_quota: 15_000, tokens_used: 5_000 };
    const cost = PROMPT_OVERHEAD + estimateTextTokens('Sample context') + OUTPUT_RESERVE.chat;
    const result = checkQuota(user, cost);

    expect(result.ok).toBe(true);
    expect(result.remaining).toBe(10_000);
    expect(result.estimated).toBe(cost);
  });

  it('blocks actions accurately when estimated cost exceeds remaining quota', () => {
    const user = { token_quota: 15_000, tokens_used: 14_200 };
    const analyzeCost = PROMPT_OVERHEAD + OUTPUT_RESERVE.analyze; // 4,100 tokens
    const result = checkQuota(user, analyzeCost);

    expect(result.ok).toBe(false);
    expect(result.remaining).toBe(800);
    expect(result.estimated).toBe(4100);
  });

  it('maintains strictly increasing daily quotas across SaaS subscription tiers', () => {
    expect(SUBSCRIPTION_PLANS.free.dailyTokens).toBe(15_000);
    expect(SUBSCRIPTION_PLANS.pro.dailyTokens).toBeGreaterThan(SUBSCRIPTION_PLANS.free.dailyTokens);
    expect(SUBSCRIPTION_PLANS.unlimited.dailyTokens).toBeGreaterThan(SUBSCRIPTION_PLANS.pro.dailyTokens);
  });
});
