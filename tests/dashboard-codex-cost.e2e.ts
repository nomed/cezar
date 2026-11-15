import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('shows Codex token-rate estimate separately from reported USD', async ({ app, screen, browser }) => {
  await browser.route('**/api/v1/workspace/dashboard/insights*', (route) =>
    route.fulfill({
      json: {
        asOf: '2026-11-15T18:00:00.000Z',
        windowStart: '2026-11-09T00:00:00.000Z',
        period: '7d',
        visibility: { cost: true, tokens: true },
        costEstimateBasis: {
          kind: 'token-rate-estimate',
          rateCardAsOf: '2026-11-15',
          sourceUrl:
            'https://help.openai.com/en/articles/20001415-chatgpt-rate-card-enterprise-token-based-pricing',
          currency: 'USD',
        },
        coverage: { projects: [{ projectId: 'local', state: 'complete', omittedRuns: 0 }] },
        delivered: {
          completedTasks: 4,
          prsOpened: 0,
          prsTouched: 0,
          issues: 0,
          additions: 0,
          deletions: 0,
          files: 0,
          measuredTasks: 0,
        },
        failures: { total: 0, reasons: [] },
        backends: [
          {
            backend: 'codex',
            model: 'openai/gpt-6.1-sol',
            finished: 4,
            done: 4,
            failed: 0,
            timedTasks: 4,
            medianCycleHours: 0.1,
            costUsd: { value: null, reportedTasks: 0 },
            estimatedCostUsd: { value: 3.24, reportedTasks: 4 },
          },
        ],
        automations: [],
      },
    }),
  );

  await app.open('/dashboard?view=costs');
  const table = screen.getByRole('region', 'Backend comparison');
  await expect(table.getByRole('columnheader', 'Reported USD')).toBeVisible();
  await expect(table.getByRole('columnheader', 'Estimated USD')).toBeVisible();
  const estimate = table.getByRole('cell', /\$3\.24 4\/4 estimated/);
  await estimate.scrollIntoView();
  await expect(estimate).toContainText('$3.24');
  await expect(estimate).toContainText('4/4 estimated');
  await expect(table.getByRole('cell', /0\/4 reported/)).toContainText('0/4 reported');
  await expect(
    screen.getByRole('link', { name: /OpenAI standard rates dated 2026-11-15/ }),
  ).toBeVisible();
  await app.screenshot('codex-token-rate-estimate');
});
