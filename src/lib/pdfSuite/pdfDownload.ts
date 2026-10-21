/**
 * Downloads a Blob, Uint8Array, or Data URL with filename sanitization and safe DOM triggering.
 */
export function downloadFile(
  data: Uint8Array | Blob | string,
  filename: string,
  mimeType = 'application/pdf'
): void {
  // Sanitize filename: replace invalid OS filename characters to prevent download glitches
  const cleanName = filename.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_').trim() || 'document';
  let blob: Blob;

  if (typeof data === 'string') {
    if (data.startsWith('data:')) {
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = data;
      a.download = cleanName;
      document.body.appendChild(a);
      a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      setTimeout(() => {
        if (a.parentNode) a.parentNode.removeChild(a);
      }, 300);
      return;
    }
    blob = new Blob([data], { type: mimeType });
  } else if (data instanceof Blob) {
    blob = data;
  } else {
    blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
  setTimeout(() => {
    if (a.parentNode) a.parentNode.removeChild(a);
    URL.revokeObjectURL(url);
  }, 10000);
}
