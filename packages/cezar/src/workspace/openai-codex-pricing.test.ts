import { describe, expect, it } from 'vitest';
import { estimateOpenAiCodexUsd, OPENAI_CODEX_RATE_CARD } from './openai-codex-pricing.ts';

const usage = { inputTokens: 1_000_000, cachedInputTokens: 400_000, outputTokens: 200_000 };

describe('OpenAI Codex token-rate estimate', () => {
  it('prices only the uncached input remainder at the normal input rate', () => {
    expect(estimateOpenAiCodexUsd('openai/gpt-6.1-sol', usage)).toBeCloseTo(3.24, 10);
    expect(estimateOpenAiCodexUsd('gpt-6-sol', usage)).toBeCloseTo(3.28, 10);
    expect(estimateOpenAiCodexUsd('gpt-5.6-sol', usage)).toBeCloseTo(6.56, 10);
    expect(OPENAI_CODEX_RATE_CARD).toMatchObject({
      kind: 'token-rate-estimate',
      rateCardAsOf: '2026-11-15',
      currency: 'USD',
    });
  });

  it('refuses aliases, incomplete measurements and impossible cache totals', () => {
    expect(estimateOpenAiCodexUsd('default', usage)).toBeUndefined();
    expect(estimateOpenAiCodexUsd('openai/gpt-6.1-sol', { ...usage, cachedInputTokens: undefined }))
      .toBeUndefined();
    expect(estimateOpenAiCodexUsd('openai/gpt-6.1-sol', { ...usage, cachedInputTokens: 1_000_001 }))
      .toBeUndefined();
  });
});
