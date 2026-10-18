import * as mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  UnderlineType,
} from 'docx';
import type { DocxStats } from '../types/docx';

export class UnsupportedDocFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedDocFormatError';
  }
}

/**
 * Checks if a file or filename is a modern DOCX document
 */
export function isDocxFile(file: File | string): boolean {
  const name = typeof file === 'string' ? file : file.name;
  return name.toLowerCase().endsWith('.docx');
}

/**
 * Checks if a file or filename is a legacy .doc file
 */
export function isLegacyDocFile(file: File | string): boolean {
  const name = typeof file === 'string' ? file : file.name;
  return name.toLowerCase().endsWith('.doc') && !name.toLowerCase().endsWith('.docx');
}

/**
 * Calculates document statistics (word count, characters, paragraphs, reading time)
 */
export function calculateDocxStats(html: string): DocxStats {
  if (typeof document === 'undefined') {
    // Fallback for tests/SSR
    const plainText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = plainText ? plainText.split(/\s+/).length : 0;
    const characters = plainText.length;
    const paragraphs = (html.match(/<p[\s>]/gi) || []).length || 1;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { words, characters, paragraphs, readingTimeMinutes };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';
  const cleanWords = text.trim().split(/\s+/).filter(Boolean);
  const words = cleanWords.length;
  const characters = text.length;
  const paragraphs = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, tr').length || 1;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return { words, characters, paragraphs, readingTimeMinutes };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDOMParser(): { parseFromString: (html: string, mime: any) => any } {
  if (typeof DOMParser !== 'undefined') {
    return new DOMParser();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DOMParser: XMLDOMParser } = require('@xmldom/xmldom');
  return new XMLDOMParser();
}

/**
 * Loads and parses a DOCX file into HTML and extracts conversion warnings
 */
export async function loadDocxDocument(data: ArrayBuffer, fileName = 'document.docx'): Promise<{
  html: string;
  warnings: string[];
  stats: DocxStats;
}> {
  if (isLegacyDocFile(fileName)) {
    throw new UnsupportedDocFormatError(
      'Legacy .doc files (Word 97-2003) are in a binary format. Please open the file in Microsoft Word, LibreOffice, or Google Docs and save it as modern ".docx" to edit it in PaperForge.'
    );
  }

  if (data.byteLength === 0) {
    throw new Error('The uploaded document file is empty.');
  }

  // Check for reasonable size (max 50 MB)
  const MAX_SIZE = 50 * 1024 * 1024;
  if (data.byteLength > MAX_SIZE) {
    throw new Error('Document exceeds the 50MB file size limit.');
  }

  try {
    // Clone buffer to avoid any detached buffer issues
    const clonedBuffer = data.slice(0);

    // Support both Node.js (Vitest) and Browser environments
    const input =
      typeof Buffer !== 'undefined'
        ? { buffer: Buffer.from(clonedBuffer) }
        : { arrayBuffer: clonedBuffer };

    const options: mammoth.MammothOptions = {
      convertImage: mammoth.images.dataUri,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await mammoth.convertToHtml(input as any, options);

    const warnings: string[] = [];
    if (result.messages && result.messages.length > 0) {
      for (const msg of result.messages) {
        if (msg.type === 'warning') {
          warnings.push(msg.message);
        }
      }
    }

    let html = result.value || '';
    if (!html.trim()) {
      html = '<p>Start typing your document here...</p>';
    }

    const stats = calculateDocxStats(html);

    return { html, warnings, stats };
  } catch (err: unknown) {
    if (err instanceof UnsupportedDocFormatError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Failed to parse DOCX document.';
    throw new Error(`Could not open Word document: ${message}`, { cause: err });
  }
}

/**
 * Creates an in-memory sample DOCX document for instant testing
 */
export async function createSampleDocx(): Promise<ArrayBuffer> {
  const doc = new Document({
    title: 'PaperForge Sample Document',
    description: 'Sample DOCX created with PaperForge',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch = 1440 twips
          },
        },
        children: [
          new Paragraph({
            text: 'Welcome to PaperForge Word Studio',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'PaperForge now features genuine Microsoft Word (.docx) editing. ',
                size: 24, // 12pt
              }),
              new TextRun({
                text: 'You can format bold, italic, and underline text, ',
                bold: true,
                size: 24,
              }),
              new TextRun({
                text: 'create numbered and bullet lists, insert tables, and export back to DOCX or PDF with 100% browser-side privacy.',
                size: 24,
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            text: 'Feature Comparison Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 160 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Capability', bold: true })] })],
                    shading: { fill: 'E0E7FF' },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'PaperForge Client-Side', bold: true })] })],
                    shading: { fill: 'E0E7FF' },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Cloud Word Processors', bold: true })] })],
                    shading: { fill: 'E0E7FF' },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Document Privacy')] }),
                  new TableCell({ children: [new Paragraph('100% Local (Zero Server Uploads)')] }),
                  new TableCell({ children: [new Paragraph('Stored on Remote Servers')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('DOCX & PDF Support')] }),
                  new TableCell({ children: [new Paragraph('Unified Studio Workspace')] }),
                  new TableCell({ children: [new Paragraph('Separate Apps Required')] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph('Subscription Cost')] }),
                  new TableCell({ children: [new Paragraph('Free & Open-Source')] }),
                  new TableCell({ children: [new Paragraph('$10 - $20 / month')] }),
                ],
              }),
            ],
          }),
          new Paragraph({
            text: 'Key Workflow Highlights',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 280, after: 140 },
          }),
          new Paragraph({
            text: 'Full rich-text formatting with paragraph styles, headings, fonts, and colors.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: 'Dynamic table insertion, row editing, and cell formatting.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: 'Direct export to standard binary .docx and print-quality PDF.',
            bullet: { level: 0 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Edit this text directly, test keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+U), or click "Export DOCX" in the top bar to save your changes!',
                italics: true,
                color: '4338CA',
                size: 22,
              }),
            ],
            spacing: { before: 240 },
          }),
        ],
      },
    ],
  });

  return await Packer.toArrayBuffer(doc);
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/**
 * Converts rich-text HTML back into a genuine, standard Microsoft Word (.docx) file
 */
export async function exportHtmlToDocx(html: string, title = 'Document'): Promise<Blob> {
  const parser = getDOMParser();
  const safeHtml = html.includes('<body')
    ? html
    : `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body>${html}</body></html>`;
  const doc = parser.parseFromString(safeHtml, 'text/html');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDoc = doc as any;
  const body = anyDoc.body || (anyDoc.getElementsByTagName && anyDoc.getElementsByTagName('body')[0]) || anyDoc.documentElement;

  const docxElements: (Paragraph | Table)[] = [];

  // Helper to extract runs from any container node
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function extractRuns(node: any): TextRun[] {
    const runs: TextRun[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function walk(curr: any, formatting: {
      bold?: boolean;
      italics?: boolean;
      underline?: boolean;
      strike?: boolean;
      color?: string;
      size?: number;
      font?: string;
    }) {
      if (curr.nodeType === TEXT_NODE) {
        const text = curr.textContent || curr.nodeValue || '';
        if (text) {
          runs.push(
            new TextRun({
              text,
              bold: formatting.bold,
              italics: formatting.italics,
              underline: formatting.underline ? { type: UnderlineType.SINGLE } : undefined,
              strike: formatting.strike,
              color: formatting.color,
              size: formatting.size || 24, // 12pt default
              font: formatting.font,
            })
          );
        }
        return;
      }

      if (curr.nodeType === ELEMENT_NODE) {
        const el = curr;
        const tag = (el.tagName || el.nodeName || '').toLowerCase();

        const nextFmt = { ...formatting };
        if (tag === 'strong' || tag === 'b') nextFmt.bold = true;
        if (tag === 'em' || tag === 'i') nextFmt.italics = true;
        if (tag === 'u') nextFmt.underline = true;
        if (tag === 's' || tag === 'strike' || tag === 'del') nextFmt.strike = true;

        // Color & Font styles
        if (el.style && el.style.color) {
          const hex = colorToHex(el.style.color);
          if (hex) nextFmt.color = hex;
        }
        if (el.style && el.style.fontFamily) {
          nextFmt.font = el.style.fontFamily.replace(/['"]/g, '');
        }

        if (el.childNodes) {
          for (let i = 0; i < el.childNodes.length; i++) {
            walk(el.childNodes[i], nextFmt);
          }
        }
      }
    }

    walk(node, {});
    return runs;
  }

  // Helper to resolve CSS alignment
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getAlignment(el: any): (typeof AlignmentType)[keyof typeof AlignmentType] {
    let align = 'left';
    if (el && el.style && typeof el.style === 'object' && el.style.textAlign) {
      align = el.style.textAlign;
    } else if (el && typeof el.getAttribute === 'function') {
      const alignAttr = el.getAttribute('align');
      const styleAttr = el.getAttribute('style') || '';
      if (alignAttr) {
        align = alignAttr;
      } else if (styleAttr.includes('text-align: center')) {
        align = 'center';
      } else if (styleAttr.includes('text-align: right')) {
        align = 'right';
      } else if (styleAttr.includes('text-align: justify')) {
        align = 'justify';
      }
    }
    if (align === 'center') return AlignmentType.CENTER;
    if (align === 'right') return AlignmentType.RIGHT;
    if (align === 'justify') return AlignmentType.JUSTIFIED;
    return AlignmentType.LEFT;
  }

  // Iterate over top-level body nodes
  const childNodes = body.childNodes || [];
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    if (node.nodeType === TEXT_NODE) {
      const text = (node.textContent || node.nodeValue || '').trim();
      if (text) {
        docxElements.push(new Paragraph({ text, spacing: { after: 120 } }));
      }
      continue;
    }

    if (node.nodeType === ELEMENT_NODE) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = node as any;
      const tag = (el.tagName || el.nodeName || '').toLowerCase();

      if (tag === 'h1') {
        docxElements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: extractRuns(el),
            alignment: getAlignment(el),
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tag === 'h2') {
        docxElements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: extractRuns(el),
            alignment: getAlignment(el),
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (tag === 'h3') {
        docxElements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: extractRuns(el),
            alignment: getAlignment(el),
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (tag === 'ul' || tag === 'ol') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const listItems = Array.from(el.getElementsByTagName ? el.getElementsByTagName('li') : []) as any[];
        listItems.forEach((li) => {
          docxElements.push(
            new Paragraph({
              children: extractRuns(li),
              bullet: { level: 0 },
              spacing: { after: 60 },
            })
          );
        });
      } else if (tag === 'table') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = Array.from(el.getElementsByTagName ? el.getElementsByTagName('tr') : []) as any[];
        const docxRows: TableRow[] = [];

        rows.forEach((tr, rIdx) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const thCells = Array.from(tr.getElementsByTagName ? tr.getElementsByTagName('th') : []) as any[];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tdCells = Array.from(tr.getElementsByTagName ? tr.getElementsByTagName('td') : []) as any[];
          const cells = thCells.length > 0 ? thCells : tdCells;
          const docxCells: TableCell[] = [];

          cells.forEach((cell) => {
            const isHeader = (cell.tagName || cell.nodeName || '').toLowerCase() === 'th' || rIdx === 0;
            const runs = extractRuns(cell);

            docxCells.push(
              new TableCell({
                children: [new Paragraph({ children: runs })],
                shading: isHeader ? { fill: 'F3F4F6' } : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                  left: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                  right: { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' },
                },
              })
            );
          });

          if (docxCells.length > 0) {
            docxRows.push(
              new TableRow({
                tableHeader: rIdx === 0,
                children: docxCells,
              })
            );
          }
        });

        if (docxRows.length > 0) {
          docxElements.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: docxRows,
            })
          );
        }
      } else if (tag === 'blockquote') {
        docxElements.push(
          new Paragraph({
            children: extractRuns(el),
            indent: { left: 720 },
            spacing: { before: 120, after: 120 },
          })
        );
      } else {
        // Default paragraph
        const runs = extractRuns(el);
        if (runs.length > 0) {
          docxElements.push(
            new Paragraph({
              children: runs,
              alignment: getAlignment(el),
              spacing: { after: 120 },
            })
          );
        }
      }
    }
  }

  // Ensure document has at least one paragraph
  if (docxElements.length === 0) {
    docxElements.push(new Paragraph({ text: '' }));
  }

  const docxDoc = new Document({
    title,
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: docxElements,
      },
    ],
  });

  return await Packer.toBlob(docxDoc);
}

/**
 * Converts CSS color to 6-digit hex for DOCX
 */
function colorToHex(color: string): string | undefined {
  if (color.startsWith('#')) {
    return color.slice(1, 7);
  }
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `${r}${g}${b}`;
  }
  return undefined;
}
