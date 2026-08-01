import { describe, it, expect } from 'vitest';
import { evaluateSession } from '../evaluate';
import type { Session } from '../types';

describe('evaluateSession', () => {
  describe('discrete events', () => {
    it('returns baseline defaults when no events exist', () => {
      const session: Session = {
        id: '1',
        name: 'empty',
        durationMs: 5000,
        loop: false,
        events: [],
      };

      const state = evaluateSession(session, 0);
      expect(state.left.frequency).toBe(528);
      expect(state.left.waveform).toBe('sine');
      expect(state.left.amplitude).toBe(0.5);
      expect(state.right.frequency).toBe(528);
      expect(state.right.waveform).toBe('sine');
      expect(state.right.amplitude).toBe(0.5);
      expect(state.masterVolume).toBe(0.7);
    });

    it('applies a single event at 0ms setting left.frequency=200', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          {
            id: 'e1',
            timeMs: 0,
            left: { frequency: 200 },
          },
        ],
      };

      const state = evaluateSession(session, 0);
      expect(state.left.frequency).toBe(200);
      expect(state.left.waveform).toBe('sine');
      expect(state.left.amplitude).toBe(0.5);
    });

    it('event at 0ms setting left.frequency=200 yields 200 everywhere', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          {
            id: 'e1',
            timeMs: 0,
            left: { frequency: 200 },
          },
        ],
      };

      expect(evaluateSession(session, 0).left.frequency).toBe(200);
      expect(evaluateSession(session, 500).left.frequency).toBe(200);
      expect(evaluateSession(session, 2500).left.frequency).toBe(200);
      expect(evaluateSession(session, 4999).left.frequency).toBe(200);
    });

    it('event at 1000ms changing right.amplitude affects right after 1000ms', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          {
            id: 'e1',
            timeMs: 1000,
            right: { amplitude: 0.9 },
          },
        ],
      };

      expect(evaluateSession(session, 500).right.amplitude).toBe(0.5);
      expect(evaluateSession(session, 999).right.amplitude).toBe(0.5);
      expect(evaluateSession(session, 1000).right.amplitude).toBe(0.9);
      expect(evaluateSession(session, 2000).right.amplitude).toBe(0.9);
    });

    it('multiple events accumulate correctly', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          { id: 'e1', timeMs: 0, left: { frequency: 200 }, masterVolume: 0.3 },
          { id: 'e2', timeMs: 500, right: { frequency: 300 } },
          { id: 'e3', timeMs: 1000, left: { amplitude: 0.8 }, masterVolume: 1.0 },
        ],
      };

      const at0 = evaluateSession(session, 0);
      expect(at0.left.frequency).toBe(200);
      expect(at0.left.amplitude).toBe(0.5);
      expect(at0.right.frequency).toBe(528);
      expect(at0.masterVolume).toBe(0.3);

      const at600 = evaluateSession(session, 600);
      expect(at600.left.frequency).toBe(200);
      expect(at600.right.frequency).toBe(300);
      expect(at600.masterVolume).toBe(0.3);

      const at1000 = evaluateSession(session, 1000);
      expect(at1000.left.frequency).toBe(200);
      expect(at1000.left.amplitude).toBe(0.8);
      expect(at1000.right.frequency).toBe(300);
      expect(at1000.masterVolume).toBe(1.0);
    });
  });

  describe('ramps', () => {
    it('interpolates frequency linearly during a ramp', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          { id: 'e1', timeMs: 0, left: { frequency: 100 }, rampMs: 1000 },
        ],
      };

      // At t=0, the ramp starts — frequency should be the baseline (528) since the
      // event is at time 0 and we ramp FROM the previous value TO the target.
      // The baseline is 528, target is 100, rampMs=1000.
      // At t=500: progress = 500/1000 = 0.5, freq = 528 + (100-528)*0.5 = 528 - 214 = 314
      const at0 = evaluateSession(session, 0);
      expect(at0.left.frequency).toBe(528); // ramp hasn't progressed yet

      const at500 = evaluateSession(session, 500);
      expect(at500.left.frequency).toBeCloseTo(314, 0);

      // At t=1000: ramp complete, frequency should snap to target
      const at1000 = evaluateSession(session, 1000);
      expect(at1000.left.frequency).toBe(100);
    });

    it('snaps waveform at ramp start (no waveform morphing)', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          { id: 'e1', timeMs: 500, left: { waveform: 'square' }, rampMs: 1000 },
        ],
      };

      // Before event: sine
      expect(evaluateSession(session, 499).left.waveform).toBe('sine');
      // At event time: waveform snaps to square immediately
      expect(evaluateSession(session, 500).left.waveform).toBe('square');
      // During ramp: still square (no morphing)
      expect(evaluateSession(session, 750).left.waveform).toBe('square');
      // After ramp: square
      expect(evaluateSession(session, 2000).left.waveform).toBe('square');
    });

    it('interpolates amplitude linearly during a ramp', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          { id: 'e1', timeMs: 0, right: { amplitude: 1.0 }, rampMs: 1000 },
        ],
      };

      // Baseline amplitude = 0.5, target = 1.0, rampMs=1000
      const at0 = evaluateSession(session, 0);
      expect(at0.right.amplitude).toBe(0.5);

      const at500 = evaluateSession(session, 500);
      expect(at500.right.amplitude).toBeCloseTo(0.75, 2);

      const at1000 = evaluateSession(session, 1000);
      expect(at1000.right.amplitude).toBe(1.0);
    });

    it('clamps ramp progress to [0, 1]', () => {
      const session: Session = {
        id: '1',
        name: 'test',
        durationMs: 5000,
        loop: false,
        events: [
          { id: 'e1', timeMs: 1000, left: { frequency: 100 }, rampMs: 500 },
        ],
      };

      // After ramp is done, should be at target
      const at2000 = evaluateSession(session, 2000);
      expect(at2000.left.frequency).toBe(100);
    });
  });
});
