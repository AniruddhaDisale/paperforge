import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { PageModel } from '../types/pdf';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export class PasswordRequiredError extends Error {
  constructor(message = 'Password required to open this PDF') {
    super(message);
    this.name = 'PasswordRequiredError';
  }
}

export class InvalidPdfError extends Error {
  constructor(message = 'Invalid or corrupted PDF file') {
    super(message);
    this.name = 'InvalidPdfError';
  }
}

export interface LoadedPdfResult {
  pdfDocument: pdfjsLib.PDFDocumentProxy;
  pages: PageModel[];
}

/**
 * Loads a PDF document from an ArrayBuffer using PDF.js
 */
export async function loadPdfDocument(
  data: ArrayBuffer,
  password?: string
): Promise<LoadedPdfResult> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(data),
      password,
    });

    const pdfDocument = await loadingTask.promise;
    const pages: PageModel[] = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1 });

      pages.push({
        id: `page-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        originalPageIndex: i - 1,
        rotation: 0,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return { pdfDocument, pages };
  } catch (error: unknown) {
    const errName = typeof error === 'object' && error !== null && 'name' in error ? (error as { name: string }).name : '';
    if (errName === 'PasswordException') {
      throw new PasswordRequiredError('This PDF document is password protected.');
    }
    if (errName === 'InvalidPDFException') {
      throw new InvalidPdfError('The file is not a valid PDF document or is corrupted.');
    }
    throw error;
  }
}
