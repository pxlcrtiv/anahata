import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import WaveGenerator from '../WaveGenerator';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('WaveGenerator — session export', () => {
  beforeEach(() => {
    localStorage.clear();
    // jsdom has no Blob URL support — stub the object-URL pair.
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:anahata-test');
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
  });

  it('downloads a WAV of the session and reports success', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<WaveGenerator />);

    // The Download control carries an accessible name since the elegance pass.
    fireEvent.click(screen.getByRole('button', { name: 'Download session WAV' }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const createObjectURL = URL.createObjectURL as unknown as ReturnType<typeof vi.fn>;
    const wavBlob = createObjectURL.mock.calls[0][0] as Blob;
    expect(wavBlob.type).toBe('audio/wav');
    // WAV header (44 bytes) plus 10 s of silence-rendered session data.
    expect(wavBlob.size).toBeGreaterThan(44);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
