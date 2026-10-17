import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { applySecureRedactions } from '../pdfRedactionService';
import { computeTextDiff } from '../pdfCompareService';

describe('PDF Redaction and Compare Services', () => {
  it('applies secure redactions and cleans metadata', async () => {
    const doc = await PDFDocument.create();
    doc.setTitle('Sensitive Secret Document');
    doc.setAuthor('Secret Agent');
    doc.addPage([500, 700]);
    const originalBytes = await doc.save();

    const redactedBytes = await applySecureRedactions(
      originalBytes,
      [
        {
          pageIndex: 0,
          x: 50,
          y: 50,
          width: 200,
          height: 30,
          label: 'CONFIDENTIAL',
        },
      ],
      {
        clearMetadata: true,
        overlayText: 'REDACTED',
      }
    );

    const reloaded = await PDFDocument.load(redactedBytes);
    expect(reloaded.getPageCount()).toBe(1);
    expect(reloaded.getTitle()).toBe('');
    expect(reloaded.getAuthor()).toBe('');
  });

  it('computes line-by-line text diff accurately', () => {
    const textA = 'Line 1\nLine 2\nLine 3';
    const textB = 'Line 1\nLine 2 Modified\nLine 3\nLine 4';

    const diff = computeTextDiff(textA, textB);
    expect(diff.find((d) => d.type === 'unchanged' && d.text === 'Line 1')).toBeDefined();
    expect(diff.find((d) => d.type === 'removed' && d.text === 'Line 2')).toBeDefined();
    expect(diff.find((d) => d.type === 'added' && d.text === 'Line 2 Modified')).toBeDefined();
    expect(diff.find((d) => d.type === 'added' && d.text === 'Line 4')).toBeDefined();
  });
});
