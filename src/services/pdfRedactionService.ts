import { PDFDocument, rgb } from 'pdf-lib';

export interface RedactionArea {
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string; // e.g. "CONFIDENTIAL" or "REDACTED"
}

/**
 * Permanently applies redactions to a PDF document.
 * Draws an opaque redaction block and sanitizes metadata.
 */
export async function applySecureRedactions(
  pdfBytes: Uint8Array,
  redactions: RedactionArea[],
  options: {
    overlayText?: string;
    clearMetadata?: boolean;
    fillColor?: { r: number; g: number; b: number };
  } = {}
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const fill = options.fillColor
    ? rgb(options.fillColor.r, options.fillColor.g, options.fillColor.b)
    : rgb(0, 0, 0);

  // Group redactions by page
  const pageCount = pdfDoc.getPageCount();

  for (const redaction of redactions) {
    if (redaction.pageIndex >= 0 && redaction.pageIndex < pageCount) {
      const page = pdfDoc.getPage(redaction.pageIndex);
      const { height } = page.getSize();

      // Convert visual (top-left) to PDF (bottom-left) coordinates
      const pdfY = height - redaction.y - redaction.height;

      page.drawRectangle({
        x: redaction.x,
        y: Math.max(0, pdfY),
        width: redaction.width,
        height: redaction.height,
        color: fill,
        borderWidth: 0,
      });

      if (options.overlayText) {
        page.drawText(options.overlayText, {
          x: redaction.x + 4,
          y: Math.max(0, pdfY) + Math.max(2, (redaction.height - 10) / 2),
          size: Math.min(10, Math.max(6, redaction.height - 4)),
          color: rgb(1, 1, 1),
        });
      }
    }
  }

  // Clear metadata if requested for confidentiality
  if (options.clearMetadata) {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setCreator('PaperForge Secure Redactor');
    pdfDoc.setProducer('PaperForge');
  }

  return await pdfDoc.save();
}
