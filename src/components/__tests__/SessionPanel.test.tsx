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

  it('rejects a structurally invalid session with a visible inline error', async () => {
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    // Parses as JSON, but is not a valid session: wrong types, missing fields.
    importFile(container, JSON.stringify({ id: 'x', name: 3 }));

    await vi.waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid session file');
    });
    expect(onChangeSession).not.toHaveBeenCalled();
  });

  it('rejects a session whose event fields are invalid with a visible inline error', async () => {
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    // Right shape, garbage inside an event — must not reach the graph.
    importFile(
      container,
      JSON.stringify({
        id: 'x',
        name: 'N',
        durationMs: 1000,
        loop: false,
        events: [{ id: 'e1', timeMs: 'abc' }],
      }),
    );

    await vi.waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid session file');
    });
    expect(onChangeSession).not.toHaveBeenCalled();
  });

  it('rejects unparseable JSON with a visible inline error', async () => {
    const onChangeSession = vi.fn();
    const { container } = renderPanel(onChangeSession);

    importFile(container, 'not json at all');

    await vi.waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid session file');
    });
    expect(onChangeSession).not.toHaveBeenCalled();
  });
});

describe('SessionPanel — saved-list storage', () => {
  beforeEach(() => localStorage.clear());

  it('surfaces a visible note when corrupt saved entries are skipped', () => {
    const valid = JSON.stringify({ id: 'ok', name: 'Valid', durationMs: 1000, loop: false, events: [] });
    localStorage.setItem('anahata.sessions', JSON.stringify([valid, '{corrupt']));

    renderPanel();

    const note = screen.getByRole('status');
    expect(note.textContent).toContain('1 saved entry was invalid and skipped');
    // The valid entry still loads.
    expect(screen.getByText('Valid')).toBeTruthy();
  });

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
