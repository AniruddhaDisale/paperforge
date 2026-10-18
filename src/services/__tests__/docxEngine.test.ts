import { describe, it, expect } from 'vitest';
import {
  isDocxFile,
  isLegacyDocFile,
  calculateDocxStats,
  createSampleDocx,
  loadDocxDocument,
  exportHtmlToDocx,
  UnsupportedDocFormatError,
} from '../docxService';

describe('DOCX Service Engine', () => {
  it('identifies file extensions accurately', () => {
    expect(isDocxFile('report.docx')).toBe(true);
    expect(isDocxFile('report.DOCX')).toBe(true);
    expect(isDocxFile('report.doc')).toBe(false);
    expect(isDocxFile('report.pdf')).toBe(false);

    expect(isLegacyDocFile('old_contract.doc')).toBe(true);
    expect(isLegacyDocFile('old_contract.DOC')).toBe(true);
    expect(isLegacyDocFile('modern_contract.docx')).toBe(false);
  });

  it('calculates document stats correctly', () => {
    const html = '<h1>Title</h1><p>This is a test paragraph containing eight words.</p>';
    const stats = calculateDocxStats(html);
    expect(stats.words).toBe(9);
    expect(stats.characters).toBeGreaterThan(20);
    expect(stats.readingTimeMinutes).toBe(1);
  });

  it('generates a valid in-memory sample DOCX file', async () => {
    const sampleBytes = await createSampleDocx();
    expect(sampleBytes).toBeInstanceOf(ArrayBuffer);
    expect(sampleBytes.byteLength).toBeGreaterThan(2000);

    const loaded = await loadDocxDocument(sampleBytes, 'sample.docx');
    expect(loaded.html).toContain('Welcome to PaperForge Word Studio');
    expect(loaded.html).toContain('Feature Comparison Overview');
    expect(loaded.html).toContain('Capability');
    expect(loaded.stats.words).toBeGreaterThan(50);
  });

  it('rejects legacy .doc files with a helpful explanatory error', async () => {
    const dummyBuffer = new ArrayBuffer(10);
    await expect(loadDocxDocument(dummyBuffer, 'legacy_document.doc')).rejects.toThrow(
      UnsupportedDocFormatError
    );
  });

  it('exports edited HTML back into a valid DOCX Blob', async () => {
    const testHtml = `
      <h1>Project Kickoff Notes</h1>
      <p>Here is an update with <strong>bold text</strong> and <em>italic notes</em>.</p>
      <ul>
        <li>Deliver initial prototype</li>
        <li>Review responsive layout</li>
      </ul>
      <table>
        <tr><th>Milestone</th><th>Status</th></tr>
        <tr><td>Phase 1</td><td>Completed</td></tr>
      </table>
    `;

    const docxBlob = await exportHtmlToDocx(testHtml, 'Project Kickoff');
    expect(docxBlob).toBeDefined();
    expect(docxBlob.size).toBeGreaterThan(1000);

    // Verify the exported blob can be read back by mammoth
    const arrayBuffer = await docxBlob.arrayBuffer();
    const loaded = await loadDocxDocument(arrayBuffer, 'exported.docx');
    expect(loaded.html).toContain('Project Kickoff Notes');
    expect(loaded.html).toContain('Deliver initial prototype');
    expect(loaded.html).toContain('Phase 1');
  });
});
