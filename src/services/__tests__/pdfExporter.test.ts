import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { exportPdfDocument } from '../pdfExporter';
import type { DocumentState } from '../../types/pdf';
import type { TextObject } from '../../types/editor';

describe('PDF Exporter Service', () => {
  it('exports a blank document with custom annotations', async () => {
    const docState: DocumentState = {
      pages: [
        {
          id: 'page-1',
          originalPageIndex: null,
          width: 595,
          height: 842,
          rotation: 0,
        },
      ],
      currentPageId: 'page-1',
      zoom: 1.0,
      isModified: true,
      originalBytes: null,
      originalFile: null,
      originalFileName: 'test.pdf',
    };

    const textObj: TextObject = {
      id: 'text-1',
      pageId: 'page-1',
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 30,
      text: 'PaperForge Test Text',
      fontSize: 16,
      fontFamily: 'Helvetica',
      color: '#ff0000',
      isBold: false,
      isItalic: false,
      align: 'left',
    };

    const objectsByPage = {
      'page-1': [textObj],
    };

    const exportedBytes = await exportPdfDocument(docState, objectsByPage);
    expect(exportedBytes).toBeInstanceOf(Uint8Array);
    expect(exportedBytes.length).toBeGreaterThan(0);

    // Verify it loads back in pdf-lib cleanly
    const reloadedDoc = await PDFDocument.load(exportedBytes);
    expect(reloadedDoc.getPageCount()).toBe(1);
    const firstPage = reloadedDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    expect(width).toBeCloseTo(595, 0);
    expect(height).toBeCloseTo(842, 0);
  });
});
