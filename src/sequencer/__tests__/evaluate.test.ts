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
});
