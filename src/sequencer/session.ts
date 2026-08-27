import type { Session } from './types';

export function serializeSession(session: Session): string {
  return JSON.stringify(session);
}

export function deserializeSession(json: string): Session {
  const parsed = JSON.parse(json);

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.id !== 'string' ||
    typeof parsed.name !== 'string' ||
    typeof parsed.durationMs !== 'number' ||
    typeof parsed.loop !== 'boolean' ||
    !Array.isArray(parsed.events)
  ) {
    throw new Error('Invalid session JSON: missing required fields');
  }

  return parsed as Session;
}
