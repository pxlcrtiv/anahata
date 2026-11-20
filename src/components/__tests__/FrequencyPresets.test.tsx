import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import FrequencyPresets from '../FrequencyPresets';

afterEach(cleanup);

describe('FrequencyPresets — selection callback', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('passes the carrier and the beat offset for a brainwave preset', () => {
    const onFrequencySelect = vi.fn();
    render(<FrequencyPresets onFrequencySelect={onFrequencySelect} />);

    fireEvent.click(screen.getByText('Alpha Waves'));
    expect(onFrequencySelect).toHaveBeenCalledWith(200, 10);

    fireEvent.click(screen.getByText('Theta Waves'));
    expect(onFrequencySelect).toHaveBeenLastCalledWith(200, 6);
  });

  it('passes a plain tone preset without a beat offset', () => {
    const onFrequencySelect = vi.fn();
    render(<FrequencyPresets onFrequencySelect={onFrequencySelect} />);

    fireEvent.click(screen.getByText('Solfeggio'));
    expect(onFrequencySelect).toHaveBeenLastCalledWith(528, undefined);
  });
});
