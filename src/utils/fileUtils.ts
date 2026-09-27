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

/**
 * Captures the current visible page canvas & overlay into a high-res PNG image download.
 */
export async function exportCurrentPageAsImage(
  pageNumber: number,
  baseFileName: string
): Promise<boolean> {
  const pageWrapper = document.querySelector('.document-page-wrapper') as HTMLElement | null;
  if (!pageWrapper) return false;

  const pdfCanvas = pageWrapper.querySelector('canvas.pdf-canvas') as HTMLCanvasElement | null;
  if (!pdfCanvas) return false;

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = pdfCanvas.width;
  compositeCanvas.height = pdfCanvas.height;
  const ctx = compositeCanvas.getContext('2d');
  if (!ctx) return false;

  // Draw background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

  // 1. Draw base PDF page
  ctx.drawImage(pdfCanvas, 0, 0);

  // 2. Scale factor between visual display and canvas resolution
  const scale = pdfCanvas.width / (pageWrapper.clientWidth || pdfCanvas.width);

  // 3. Draw all img elements (images and signatures)
  const images = pageWrapper.querySelectorAll('img');
  for (const img of Array.from(images)) {
    try {
      const rect = img.getBoundingClientRect();
      const wrapperRect = pageWrapper.getBoundingClientRect();
      const x = (rect.left - wrapperRect.left) * scale;
      const y = (rect.top - wrapperRect.top) * scale;
      const w = rect.width * scale;
      const h = rect.height * scale;
      ctx.drawImage(img, x, y, w, h);
    } catch {
      // ignore
    }
  }

  // 4. Draw SVG layer (drawings, highlights, shapes)
  const svgEl = pageWrapper.querySelector('svg');
  if (svgEl) {
    try {
      const svgXml = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const svgImg = new Image();
      await new Promise<void>((resolve) => {
        svgImg.onload = () => {
          ctx.drawImage(svgImg, 0, 0, compositeCanvas.width, compositeCanvas.height);
          URL.revokeObjectURL(url);
          resolve();
        };
        svgImg.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        svgImg.src = url;
      });
    } catch {
      // ignore
    }
  }

  // 5. Trigger download
  return new Promise((resolve) => {
    compositeCanvas.toBlob((blob) => {
      if (blob) {
        const cleanName = baseFileName.replace(/\.[^/.]+$/, '');
        triggerFileDownload(blob, `${cleanName}-page-${pageNumber}.png`);
        resolve(true);
      } else {
        resolve(false);
      }
    }, 'image/png');
  });
}

