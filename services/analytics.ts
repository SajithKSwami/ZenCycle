// Lightweight client-side analytics — logs to console in dev, no-ops in prod unless extended.

const isDev = import.meta.env.DEV;

function log(event: string, data?: Record<string, unknown>) {
  if (isDev) console.debug(`[Analytics] ${event}`, data ?? '');
}

export function trackPageView(tab: string) {
  log('page_view', { tab });
}

export function logDailySummaryViewed() {
  log('daily_summary_viewed');
}

export function logStreakViewed() {
  log('streak_viewed');
}

export function logBreakStarted(reason: string) {
  log('break_started', { reason });
}

export function logBreakCompleted(durationSeconds: number) {
  log('break_completed', { durationSeconds });
}

export function logJournalEntry(achievement: string) {
  log('journal_entry_created', { achievementLength: achievement.length });
}
