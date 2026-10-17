import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
  parsePageRangeString,
  mergePdfs,
  splitPdf,
  extractPdfPages,
  compressPdf,
  updatePdfMetadata,
  getPdfMetadata,
} from '../pdfToolbox';

describe('PDF Toolbox Service', () => {
  it('parses page range strings correctly', () => {
    expect(parsePageRangeString('1-3, 5, 8-10', 10)).toEqual([0, 1, 2, 4, 7, 8, 9]);
    expect(parsePageRangeString('2, 2, 4', 5)).toEqual([1, 3]);
    expect(parsePageRangeString('10-1', 5)).toEqual([0, 1, 2, 3, 4]);
  });

  async function createTestPdf(pageCount: number): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) {
      doc.addPage([500, 700]);
    }
    return await doc.save();
  }

  it('merges multiple PDFs into one', async () => {
    const pdf1 = await createTestPdf(2);
    const pdf2 = await createTestPdf(3);

    const merged = await mergePdfs([pdf1, pdf2]);
    const reloaded = await PDFDocument.load(merged);
    expect(reloaded.getPageCount()).toBe(5);
  });

  it('splits PDF into individual pages', async () => {
    const pdf = await createTestPdf(3);
    const splitResults = await splitPdf(pdf, 'all');

    expect(splitResults).toHaveLength(3);
    expect(splitResults[0].pageCount).toBe(1);
    expect(splitResults[0].name).toBe('page_1.pdf');

    const loadedPage1 = await PDFDocument.load(splitResults[0].bytes);
    expect(loadedPage1.getPageCount()).toBe(1);
  });

  it('splits PDF by page ranges', async () => {
    const pdf = await createTestPdf(5);
    const splitResults = await splitPdf(pdf, 'ranges', '1-2; 3-5');

    expect(splitResults).toHaveLength(2);
    expect(splitResults[0].pageCount).toBe(2);
    expect(splitResults[1].pageCount).toBe(3);
  });

  it('extracts specific pages from PDF', async () => {
    const pdf = await createTestPdf(4);
    const extracted = await extractPdfPages(pdf, [1, 3]);

    const reloaded = await PDFDocument.load(extracted);
    expect(reloaded.getPageCount()).toBe(2);
  });

  it('compresses PDF bytes', async () => {
    const pdf = await createTestPdf(2);
    const result = await compressPdf(pdf, 'medium');

    expect(result.bytes).toBeInstanceOf(Uint8Array);
    expect(result.originalSize).toBeGreaterThan(0);
    expect(result.compressedSize).toBeGreaterThan(0);
  });

  it('updates and reads PDF metadata', async () => {
    const pdf = await createTestPdf(1);
    const updated = await updatePdfMetadata(pdf, {
      title: 'PaperForge Master Title',
      author: 'PaperForge Architect',
      subject: 'PDF Architecture',
    });

    const meta = await getPdfMetadata(updated);
    expect(meta.title).toBe('PaperForge Master Title');
    expect(meta.author).toBe('PaperForge Architect');
    expect(meta.subject).toBe('PDF Architecture');
  });
});
