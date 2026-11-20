import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WaveGenerator from '../WaveGenerator';

afterEach(cleanup);

describe('WaveGenerator — applying a brainwave preset', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clicking Alpha Waves sets a 200/210 Hz pair and unlinks the channels', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByText('Alpha Waves'));

    // The mixer shows the carrier pair, not a sub-audible 10 Hz tone.
    expect(screen.getByDisplayValue('200')).toBeTruthy();
    expect(screen.getByDisplayValue('210')).toBeTruthy();

    // A binaural beat requires independent channels.
    expect(screen.getByText('Independent')).toBeTruthy();
  });

  it('clicking a plain tone preset keeps linked channels in lockstep', () => {
    render(<WaveGenerator />);

    fireEvent.click(screen.getByText('Solfeggio'));

    expect(screen.getAllByDisplayValue('528').length).toBe(2);
    expect(screen.getByText('Linked')).toBeTruthy();
  });
});
