import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadBlob } from '../downloadBlob';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL, clicks a named anchor, and revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = createObjectURL;
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = revokeObjectURL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    const blob = new Blob(['x'], { type: 'audio/wav' });
    downloadBlob(blob, 'session.wav');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test');

    const anchor = click.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('session.wav');
    expect(anchor.href).toBe('blob:test');
  });
});
