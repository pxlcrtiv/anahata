import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SessionPanel from '../SessionPanel';
import { deserializeSession } from '../../sequencer/session';
import type { Session } from '../../sequencer/types';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

const baseSession: Session = {
  id: 's1',
  name: 'Working',
  durationMs: 5000,
  loop: false,
  events: [],
};

function renderPanel(onChangeSession = vi.fn()) {
  return render(
    <SessionPanel
      session={baseSession}
      onChangeSession={onChangeSession}
      crossfadeMs={250}
      onCrossfadeMsChange={() => {}}
    />
  );
}

function importFile(container: HTMLElement, content: string) {
  const file = new File([content], 'session.json', { type: 'application/json' });
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

describe('SessionPanel — import validation', () => {
  beforeEach(() => localStorage.clear());

  it('imports a valid session file', async () => {
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    const valid = { id: 's2', name: 'Imported', durationMs: 9000, loop: true, events: [] };
    importFile(container, JSON.stringify(valid));

    await vi.waitFor(() => expect(onChangeSession).toHaveBeenCalledTimes(1));
    expect((onChangeSession.mock.calls[0][0] as Session).name).toBe('Imported');
  });

  it('rejects a structurally invalid session with a visible error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    // Parses as JSON, but is not a valid session: wrong types, missing fields.
    importFile(container, JSON.stringify({ id: 'x', name: 3 }));

    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(onChangeSession).not.toHaveBeenCalled();
  });

  it('rejects unparseable JSON with a visible error', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    importFile(container, 'not json at all');

    await vi.waitFor(() => expect(alertSpy).toHaveBeenCalled());
    expect(onChangeSession).not.toHaveBeenCalled();
  });
});

describe('SessionPanel — saved-list storage', () => {
  beforeEach(() => localStorage.clear());

  it('saves through the serializer and lists the session on a fresh render', () => {
    renderPanel();
    fireEvent.click(screen.getByText('Save'));
    cleanup();
    localStorage.removeItem('anahata.autosave');

    // The stored payload is an array of serialized session strings that
    // deserializes cleanly.
    const raw = JSON.parse(localStorage.getItem('anahata.sessions')!);
    expect(Array.isArray(raw)).toBe(true);
    expect(deserializeSession(raw[0]).name).toBe('Working');

    renderPanel();
    expect(screen.getByText('Working')).toBeTruthy();
  });
});
