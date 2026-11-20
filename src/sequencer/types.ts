export type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth';

/** The complete waveform set — the single whitelist, derived from the type.
 *  Validation and every waveform picker consume this, not re-listed copies. */
export const WAVEFORMS: readonly Waveform[] = ['sine', 'square', 'triangle', 'sawtooth'];

export interface ChannelState {
  frequency: number;
  waveform: Waveform;
  amplitude: number;
}

export interface SessionEvent {
  id: string;
  timeMs: number;
  left?: Partial<ChannelState>;
  right?: Partial<ChannelState>;
  masterVolume?: number;
  rampMs?: number;
}

export interface Session {
  id: string;
  name: string;
  durationMs: number;
  loop: boolean;
  events: SessionEvent[];
}

export interface EvaluatedState {
  left: ChannelState;
  right: ChannelState;
  masterVolume: number;
}
