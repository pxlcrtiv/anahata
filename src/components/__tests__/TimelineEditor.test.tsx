import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import TimelineEditor from '../TimelineEditor';
import type { Session } from '../../sequencer/types';

afterEach(cleanup);

const TITLE = '0ms — L:200Hz';

function makeSession(events: Session['events']): Session {
  return { id: 's1', name: 'Test', durationMs: 5000, loop: false, events };
}

describe('TimelineEditor — partial event semantics', () => {
  it('saving an untouched edit preserves unspecified fields (no silent stamping)', () => {
    const onChange = vi.fn();
    const session = makeSession([
      { id: 'e1', timeMs: 0, left: { frequency: 200 }, masterVolume: 0.5 },
    ]);
    render(<TimelineEditor session={session} positionMs={0} onChange={onChange} onSeek={vi.fn()} />);

    fireEvent.click(screen.getByTitle(TITLE));
    fireEvent.click(screen.getByText('Save'));

    const updated = onChange.mock.calls[0][0] as Session;
    const evt = updated.events.find((e) => e.id === 'e1')!;
    expect(evt.left).toEqual({ frequency: 200 });
    expect(evt.right).toBeUndefined();
    expect(evt.masterVolume).toBe(0.5);
  });

  it('saving preserves fields the event did specify', () => {
    const onChange = vi.fn();
    const session = makeSession([
      { id: 'e1', timeMs: 0, left: { frequency: 200, waveform: 'square', amplitude: 0.9 } },
    ]);
    render(<TimelineEditor session={session} positionMs={0} onChange={onChange} onSeek={vi.fn()} />);

    fireEvent.click(screen.getByTitle(TITLE));
    fireEvent.click(screen.getByText('Save'));

    const updated = onChange.mock.calls[0][0] as Session;
    const evt = updated.events.find((e) => e.id === 'e1')!;
    expect(evt.left).toEqual({ frequency: 200, waveform: 'square', amplitude: 0.9 });
  });

  it('editing frequency persists the change and stamps nothing else', () => {
    const onChange = vi.fn();
    const session = makeSession([{ id: 'e1', timeMs: 0, left: { frequency: 200 } }]);
    const { container } = render(
      <TimelineEditor session={session} positionMs={0} onChange={onChange} onSeek={vi.fn()} />
    );

    fireEvent.click(screen.getByTitle(TITLE));
    // Input order in the edit panel: Time, L Freq, L Amp, R Freq, R Amp, Master, Ramp
    const inputs = container.querySelectorAll('input');
    fireEvent.change(inputs[1], { target: { value: '300' } });
    fireEvent.click(screen.getByText('Save'));

    const updated = onChange.mock.calls[0][0] as Session;
    const evt = updated.events.find((e) => e.id === 'e1')!;
    expect(evt.left).toEqual({ frequency: 300 });
  });
});
