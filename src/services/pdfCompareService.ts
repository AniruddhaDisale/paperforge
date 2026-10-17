import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface DiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface PageCompareResult {
  pageNumber: number;
  hasDifferences: boolean;
  docAExists: boolean;
  docBExists: boolean;
  docAText: string;
  docBText: string;
  diffSegments: DiffSegment[];
}

export interface DocumentCompareSummary {
  docAName: string;
  docBName: string;
  docAPageCount: number;
  docBPageCount: number;
  differingPagesCount: number;
  identicalPagesCount: number;
  pages: PageCompareResult[];
}

/**
 * Computes a line-by-line diff between two text strings.
 */
export function computeTextDiff(textA: string, textB: string): DiffSegment[] {
  const linesA = textA.split('\n').map((l) => l.trim()).filter(Boolean);
  const linesB = textB.split('\n').map((l) => l.trim()).filter(Boolean);

  const segments: DiffSegment[] = [];
  const maxLen = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < maxLen; i++) {
    const lineA = linesA[i];
    const lineB = linesB[i];

    if (lineA === lineB) {
      if (lineA !== undefined) {
        segments.push({ type: 'unchanged', text: lineA });
      }
    } else {
      if (lineA !== undefined) {
        segments.push({ type: 'removed', text: lineA });
      }
      if (lineB !== undefined) {
        segments.push({ type: 'added', text: lineB });
      }
    }
  }

  return segments;
}

/**
 * Compares two loaded PDF documents page by page.
 */
export async function comparePdfDocuments(
  docA: PDFDocumentProxy,
  docB: PDFDocumentProxy,
  docAName = 'Original Document',
  docBName = 'Modified Document'
): Promise<DocumentCompareSummary> {
  const countA = docA.numPages;
  const countB = docB.numPages;
  const maxPages = Math.max(countA, countB);

  const pages: PageCompareResult[] = [];
  let differingCount = 0;
  let identicalCount = 0;

  for (let i = 0; i < maxPages; i++) {
    const pageNum = i + 1;
    let textA = '';
    let textB = '';

    if (i < countA) {
      try {
        const pageA = await docA.getPage(pageNum);
        const contentA = await pageA.getTextContent();
        textA = contentA.items
          .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
          .filter(Boolean)
          .join('\n');
      } catch {
        textA = '';
      }
    }

    if (i < countB) {
      try {
        const pageB = await docB.getPage(pageNum);
        const contentB = await pageB.getTextContent();
        textB = contentB.items
          .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
          .filter(Boolean)
          .join('\n');
      } catch {
        textB = '';
      }
    }

    const diffSegments = computeTextDiff(textA, textB);
    const hasDiff = diffSegments.some((s) => s.type !== 'unchanged') || (i >= countA !== (i >= countB));

    if (hasDiff) {
      differingCount++;
    } else {
      identicalCount++;
    }

    pages.push({
      pageNumber: pageNum,
      hasDifferences: hasDiff,
      docAExists: i < countA,
      docBExists: i < countB,
      docAText: textA,
      docBText: textB,
      diffSegments,
    });
  }

  return {
    docAName,
    docBName,
    docAPageCount: countA,
    docBPageCount: countB,
    differingPagesCount: differingCount,
    identicalPagesCount: identicalCount,
    pages,
  };
}
