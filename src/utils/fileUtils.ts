/**
 * Converts any image File (PNG, JPG, WebP, SVG, etc.) to a clean PNG Data URL and byte array.
 * This ensures compatibility with pdf-lib embedding regardless of input format.
 */
export async function normalizeImageToPng(
  file: File
): Promise<{ dataUrl: string; bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'));
            return;
          }
          const blobReader = new FileReader();
          blobReader.onload = () => {
            const arrayBuffer = blobReader.result as ArrayBuffer;
            resolve({
              dataUrl,
              bytes: new Uint8Array(arrayBuffer),
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };
          blobReader.onerror = () => reject(blobReader.error);
          blobReader.readAsArrayBuffer(blob);
        }, 'image/png');
      };
      img.onerror = () => reject(new Error('Failed to load image into element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Triggers a browser file download from a Uint8Array or Blob.
 */
export function triggerFileDownload(data: Uint8Array | Blob, fileName: string): void {
  const blob = data instanceof Blob ? data : new Blob([data.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Strips extension from filename and appends suffix.
 */
export function getExportFileName(originalName: string, suffix = '-edited.pdf'): string {
  const clean = originalName.replace(/\.[^/.]+$/, '');
  return `${clean || 'document'}${suffix}`;
}
