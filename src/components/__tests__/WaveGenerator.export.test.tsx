import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/react';
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
    const { container } = render(<WaveGenerator />);

    // The Download control is icon-only (an a11y gap tracked for the
    // elegance pass) — locate it via its lucide icon.
    const downloadIcon = container.querySelector('svg.lucide-download');
    expect(downloadIcon).toBeTruthy();
    fireEvent.click(downloadIcon!.closest('button')!);

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
