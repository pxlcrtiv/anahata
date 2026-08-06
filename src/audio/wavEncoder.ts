/**
 * Encodes interleaved float32 samples into a 16-bit PCM WAV ArrayBuffer.
 *
 * For mono: samples is Float32Array of length N, numChannels=1
 * For stereo: samples is Float32Array of length N*2 (interleaved L,R,L,R…)
 */
export function encodeWAV(
  samples: Float32Array,
  numChannels: number,
  sampleRate: number,
): ArrayBuffer {
  const dataLength = samples.length * 2; // 16-bit = 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  let pos = 0;

  const writeUint32 = (val: number) => {
    view.setUint32(pos, val, true);
    pos += 4;
  };
  const writeUint16 = (val: number) => {
    view.setUint16(pos, val, true);
    pos += 2;
  };

  // RIFF header
  writeUint32(0x46464952); // "RIFF"
  writeUint32(buffer.byteLength - 8);
  writeUint32(0x45564157); // "WAVE"

  // fmt chunk
  writeUint32(0x20746d66); // "fmt "
  writeUint32(16); // chunk size
  writeUint16(1); // PCM
  writeUint16(numChannels);
  writeUint32(sampleRate);
  writeUint32(sampleRate * numChannels * 2); // byte rate
  writeUint16(numChannels * 2); // block align
  writeUint16(16); // bits per sample

  // data chunk
  writeUint32(0x61746164); // "data"
  writeUint32(dataLength);

  // write interleaved 16-bit samples
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = (s < 0 ? s * 0x8000 : s * 0x7fff) | 0;
    view.setInt16(pos, val, true);
    pos += 2;
  }

  return buffer;
}
