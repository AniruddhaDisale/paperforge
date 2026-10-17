import { createWorker } from 'tesseract.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 1
  pageNumber: number;
  totalPages: number;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  lines: OcrLine[];
  confidence: number;
}

export interface OcrOptions {
  language?: string; // 'eng', 'spa', 'fra', 'deu', etc.
  pageRange?: number[]; // 1-based page numbers
  onProgress?: (progress: OcrProgress) => void;
}

/**
 * Runs client-side OCR on a PDF page using PDF.js rendering + Tesseract.js.
 */
export async function runOcrOnPage(
  pdfDocument: PDFDocumentProxy,
  pageNumber: number,
  language = 'eng',
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrPageResult> {
  const page = await pdfDocument.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2.0 }); // 2x for sharp OCR recognition

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not create 2D canvas context for OCR.');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    canvas,
    viewport,
  }).promise;

  const dataUrl = canvas.toDataURL('image/png');

  onProgress?.({
    status: 'Initializing OCR engine...',
    progress: 0.1,
    pageNumber,
    totalPages: 1,
  });

  const worker = await createWorker(language);

  try {
    const ret = await worker.recognize(dataUrl);

    onProgress?.({
      status: 'Extracting text and bounding boxes...',
      progress: 0.9,
      pageNumber,
      totalPages: 1,
    });

    const rawLines = (ret.data as { lines?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> }).lines || [];

    const lines: OcrLine[] = rawLines
      .map((line: { text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }) => ({
        text: line.text.trim(),
        confidence: line.confidence,
        bbox: {
          x0: line.bbox.x0 / 2.0, // Scale back down to 1x PDF coordinates
          y0: line.bbox.y0 / 2.0,
          x1: line.bbox.x1 / 2.0,
          y1: line.bbox.y1 / 2.0,
        },
      }))
      .filter((l: OcrLine) => l.text.length > 0);

    return {
      pageNumber,
      text: ret.data.text,
      lines,
      confidence: ret.data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}
