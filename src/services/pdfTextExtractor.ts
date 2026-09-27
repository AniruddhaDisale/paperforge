import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractedTextItem } from '../types/editor';

interface RawTextItem {
  str: string;
  dir: string;
  width: number;
  height: number;
  transform: number[]; // [a, b, c, d, e, f]
  fontName: string;
  hasEOL: boolean;
}

/**
 * Extracts text items from a specific PDF page using PDF.js.
 * Converts PDF coordinates to visual page coordinates (origin at top-left).
 * Groups adjacent text tokens on the same line into coherent editable text blocks.
 */
export async function extractTextFromPage(
  pdfDocument: pdfjsLib.PDFDocumentProxy,
  pageIndex: number
): Promise<ExtractedTextItem[]> {
  try {
    const page = await pdfDocument.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();

    const rawItems: ExtractedTextItem[] = [];

    for (let i = 0; i < textContent.items.length; i++) {
      const item = textContent.items[i] as unknown as RawTextItem;
      if (!item.str || item.str.trim().length === 0) continue;

      const transform = item.transform;
      // transform: [scaleX, skewY, skewX, scaleY, tx, ty]
      const tx = transform[4];
      const ty = transform[5];

      // Approximate font size from transform matrix
      const fontSize = Math.round(
        Math.hypot(transform[2], transform[3]) || Math.abs(transform[3]) || Math.abs(transform[0]) || 12
      );

      // Convert PDF coordinate (origin bottom-left) to viewport coordinate (origin top-left)
      const visualX = tx;
      // ty is baseline. Visual top is page height minus baseline minus font ascender (~0.85 of fontSize)
      const visualY = viewport.height - ty - (item.height > 0 ? item.height : fontSize * 0.9);

      const width = item.width > 0 ? item.width : item.str.length * (fontSize * 0.55);
      const height = item.height > 0 ? Math.max(item.height, fontSize * 1.1) : fontSize * 1.15;

      rawItems.push({
        id: `extracted-${pageIndex}-${i}-${Date.now().toString(36)}`,
        text: item.str,
        x: Math.max(0, visualX),
        y: Math.max(0, visualY),
        width: Math.max(12, width),
        height: Math.max(12, height),
        fontSize: Math.max(8, fontSize),
        fontFamily: item.fontName,
      });
    }

    // Merge adjacent words on the same horizontal line into unified phrases for smoother editing
    const mergedItems: ExtractedTextItem[] = [];
    let current: ExtractedTextItem | null = null;

    for (const item of rawItems) {
      if (!current) {
        current = { ...item };
        continue;
      }

      // Check if item is on the same line (similar y and height) and close horizontally
      const sameLine = Math.abs(current.y - item.y) <= Math.max(4, current.fontSize * 0.35);
      const sameFontSize = Math.abs(current.fontSize - item.fontSize) <= 3;
      const horizontalGap = item.x - (current.x + current.width);
      const reasonableGap = horizontalGap >= -2 && horizontalGap <= current.fontSize * 1.5;

      if (sameLine && sameFontSize && reasonableGap) {
        // Merge into current
        const spacer = horizontalGap > 1 && !current.text.endsWith(' ') && !item.text.startsWith(' ') ? ' ' : '';
        current.text = current.text + spacer + item.text;
        const newRight = item.x + item.width;
        current.width = newRight - current.x;
        current.height = Math.max(current.height, item.height);
      } else {
        mergedItems.push(current);
        current = { ...item };
      }
    }

    if (current) {
      mergedItems.push(current);
    }

    return mergedItems;
  } catch (err) {
    console.error('Failed to extract text from page:', err);
    return [];
  }
}
