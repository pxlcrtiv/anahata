/**
 * The one delivery seam: hand a Blob to the browser as a file download.
 * Every export path (WAV recording, session WAV, session JSON) goes
 * through here instead of repeating the object-URL/anchor dance.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
