import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface SearchMatch {
  id: string;
  pageIndex: number;
  pageNumber: number;
  snippet: string;
  startIndex: number;
  endIndex: number;
  rect?: { x: number; y: number; width: number; height: number };
}

export interface SearchOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

/**
 * Searches across all pages in the PDF for a query string.
 * Extracts text and locates matching snippets and bounding boxes where available.
 */
export async function searchPdfDocument(
  pdfDocument: PDFDocumentProxy,
  query: string,
  options: SearchOptions = {}
): Promise<SearchMatch[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const matches: SearchMatch[] = [];
  const numPages = pdfDocument.numPages;

  const flags = options.caseSensitive ? 'g' : 'gi';
  const escapedQuery = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
  const regex = new RegExp(pattern, flags);

  for (let pageIdx = 0; pageIdx < numPages; pageIdx++) {
    try {
      const page = await pdfDocument.getPage(pageIdx + 1);
      const textContent = await page.getTextContent();

      // Combine text items with space and track cumulative positions
      let fullText = '';
      const itemPositions: { start: number; end: number; item: PdfTextItem }[] = [];

      for (const rawItem of textContent.items) {
        if ('str' in rawItem && typeof rawItem.str === 'string') {
          const item = rawItem as unknown as PdfTextItem;
          const start = fullText.length;
          fullText += item.str + ' ';
          const end = fullText.length;
          itemPositions.push({ start, end, item });
        }
      }

      regex.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(fullText)) !== null) {
        const matchIndex = match.index;
        const matchLength = match[0].length;

        // Extract context snippet (~35 chars before and after)
        const snippetStart = Math.max(0, matchIndex - 35);
        const snippetEnd = Math.min(fullText.length, matchIndex + matchLength + 35);
        let snippet = fullText.substring(snippetStart, snippetEnd).trim();
        if (snippetStart > 0) snippet = '...' + snippet;
        if (snippetEnd < fullText.length) snippet = snippet + '...';

        // Find intersecting text items to approximate bounding box
        const matchingItems = itemPositions.filter(
          (pos) => pos.start <= matchIndex + matchLength && pos.end >= matchIndex
        );

        let rect: { x: number; y: number; width: number; height: number } | undefined;

        if (matchingItems.length > 0) {
          const viewport = page.getViewport({ scale: 1.0 });
          let minX = Infinity;
          let minY = Infinity;
          let maxX = -Infinity;
          let maxY = -Infinity;

          for (const { item } of matchingItems) {
            const tx = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
            const x = tx[4];
            const y = viewport.height - tx[5] - (item.height || 12);
            const w = item.width || 50;
            const h = item.height || 14;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x + w > maxX) maxX = x + w;
            if (y + h > maxY) maxY = y + h;
          }

          if (minX !== Infinity && maxX > minX) {
            rect = {
              x: Math.max(0, minX),
              y: Math.max(0, minY),
              width: maxX - minX,
              height: maxY - minY,
            };
          }
        }

        matches.push({
          id: `p${pageIdx + 1}-m${matchIndex}`,
          pageIndex: pageIdx,
          pageNumber: pageIdx + 1,
          snippet,
          startIndex: matchIndex,
          endIndex: matchIndex + matchLength,
          rect,
        });
      }
    } catch (err) {
      console.warn(`Failed to search page ${pageIdx + 1}:`, err);
    }
  }

  return matches;
}
