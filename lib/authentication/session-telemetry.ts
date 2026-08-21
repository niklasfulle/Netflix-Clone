const VALIDATION_INTERVAL_MS = 15 * 60_000;
const MAX_TRACKED_SESSIONS = 1024;

const lastValidationBySession = new Map<string, number>();

export function shouldObserveSessionValidation(
  sessionId: string,
  now = Date.now(),
): boolean {
  const lastObserved = lastValidationBySession.get(sessionId);
  if (lastObserved !== undefined && now - lastObserved < VALIDATION_INTERVAL_MS) {
    return false;
  }
  if (lastValidationBySession.size >= MAX_TRACKED_SESSIONS) {
    const oldestSession = lastValidationBySession.keys().next().value;
    if (oldestSession) lastValidationBySession.delete(oldestSession);
  }
  lastValidationBySession.delete(sessionId);
  lastValidationBySession.set(sessionId, now);
  return true;
}

export function resetSessionTelemetrySamplingForTests() {
  if (process.env.NODE_ENV === 'test') lastValidationBySession.clear();
}
