import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

export interface RenderPageOptions {
  pdfDocument: PDFDocumentProxy;
  originalPageIndex: number;
  rotation: number;
  zoom: number;
  canvas: HTMLCanvasElement;
}

/**
 * Renders a PDF page to a canvas with High-DPI support and cancellation tracking.
 */
export function renderPdfPage({
  pdfDocument,
  originalPageIndex,
  rotation,
  zoom,
  canvas,
}: RenderPageOptions): { promise: Promise<void>; cancel: () => void } {
  let isCancelled = false;
  let activeRenderTask: RenderTask | null = null;

  const promise = (async () => {
    const page = await pdfDocument.getPage(originalPageIndex + 1);
    if (isCancelled) return;

    // Combine intrinsic page rotation with user rotation
    const totalRotation = ((page.rotate || 0) + rotation) % 360;
    const viewport = page.getViewport({
      scale: zoom,
      rotation: totalRotation,
    });

    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to obtain 2D context from canvas');
    }

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

    activeRenderTask = page.render({
      canvasContext: context,
      canvas,
      viewport,
      transform,
    });

    try {
      await activeRenderTask.promise;
    } catch (error: unknown) {
      // PDF.js throws RenderingCancelledException when cancelled intentionally
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        (error as { name: string }).name === 'RenderingCancelledException'
      ) {
        return;
      }
      throw error;
    }
  })();

  return {
    promise,
    cancel: () => {
      isCancelled = true;
      if (activeRenderTask) {
        try {
          activeRenderTask.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }
    },
  };
}
