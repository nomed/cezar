export const OPENAI_CODEX_RATE_CARD = {
  kind: 'token-rate-estimate' as const,
  rateCardAsOf: '2026-11-15',
  sourceUrl: 'https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing',
  currency: 'USD' as const,
};

type TokenRates = {
  input: number;
  cachedInput: number;
  output: number;
};

/** OpenAI standard Work/Codex rates in USD per one million tokens, captured on
 * OPENAI_CODEX_RATE_CARD.rateCardAsOf. Keep this allowlist deliberately small:
 * aliases and unknown models must remain unavailable instead of inheriting a
 * plausible but unverified price. */
const RATES_PER_MILLION: Readonly<Record<string, TokenRates>> = {
  'gpt-6.1-sol': { input: 2, cachedInput: 0.1, output: 10 },
  'gpt-6-sol': { input: 2, cachedInput: 0.2, output: 10 },
  'gpt-5.6-sol': { input: 4, cachedInput: 0.4, output: 20 },
};

const measured = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** Token-rate estimate only — never an invoice or a subscription charge.
 * Codex reports cached input as a subset of input, so price the uncached remainder
 * at the normal input rate and the subset at the cached rate. */
export function estimateOpenAiCodexUsd(
  model: string | undefined,
  usage: { inputTokens?: number; outputTokens?: number; cachedInputTokens?: number },
): number | undefined {
  if (!model) return undefined;
  const normalized = model.startsWith('openai/') ? model.slice('openai/'.length) : model;
  const rates = RATES_PER_MILLION[normalized];
  if (!rates) return undefined;
  const { inputTokens, outputTokens, cachedInputTokens } = usage;
  if (!measured(inputTokens) || !measured(outputTokens) || !measured(cachedInputTokens))
    return undefined;
  if (cachedInputTokens > inputTokens) return undefined;
  const uncachedInput = inputTokens - cachedInputTokens;
  return (
    uncachedInput * rates.input +
    cachedInputTokens * rates.cachedInput +
    outputTokens * rates.output
  ) / 1_000_000;
}
