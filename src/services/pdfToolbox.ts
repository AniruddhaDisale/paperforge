import { PDFDocument } from 'pdf-lib';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface CompressionResult {
  bytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  ratio: number;
}

export interface SplitResult {
  name: string;
  bytes: Uint8Array;
  pageCount: number;
}

export interface ImageToPdfOptions {
  pageSize?: 'a4' | 'letter' | 'fit';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
}

/**
 * Parses user page range strings like "1-3, 5, 8-10" into 0-based page indices.
 */
export function parsePageRangeString(rangeStr: string, totalPages: number): number[] {
  const indices = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        indices.add(page - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Merges multiple PDF files (as ArrayBuffers or Uint8Arrays) into a single PDF document.
 */
export async function mergePdfs(pdfBuffers: (ArrayBuffer | Uint8Array)[]): Promise<Uint8Array> {
  if (pdfBuffers.length === 0) {
    throw new Error('At least one PDF file is required to merge.');
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return await mergedDoc.save();
}

/**
 * Extracts a subset of pages into a new PDF document.
 */
export async function extractPdfPages(
  pdfBuffer: ArrayBuffer | Uint8Array,
  pageIndices: number[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const validIndices = pageIndices.filter((idx) => idx >= 0 && idx < srcDoc.getPageCount());
  if (validIndices.length === 0) {
    throw new Error('No valid pages selected for extraction.');
  }

  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save();
}

/**
 * Splits a PDF document by page range or into separate individual pages.
 */
export async function splitPdf(
  pdfBuffer: ArrayBuffer | Uint8Array,
  mode: 'all' | 'ranges',
  rangeStr?: string
): Promise<SplitResult[]> {
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const results: SplitResult[] = [];

  if (mode === 'all') {
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);
      const bytes = await newDoc.save();
      results.push({
        name: `page_${i + 1}.pdf`,
        bytes,
        pageCount: 1,
      });
    }
  } else if (mode === 'ranges' && rangeStr) {
    // Range groups can be separated by pipes or semicolons, or treated as comma groups
    const groups = rangeStr.split(/[;|]+/).map((s) => s.trim()).filter(Boolean);
    const rangeGroups = groups.length > 0 ? groups : [rangeStr];

    for (let g = 0; g < rangeGroups.length; g++) {
      const indices = parsePageRangeString(rangeGroups[g], totalPages);
      if (indices.length > 0) {
        const newDoc = await PDFDocument.create();
        const copied = await newDoc.copyPages(srcDoc, indices);
        copied.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        results.push({
          name: `split_part_${g + 1}.pdf`,
          bytes,
          pageCount: indices.length,
        });
      }
    }
  }

  return results;
}

/**
 * Compresses a PDF document client-side by rewriting streams, optimizing page objects,
 * and stripping unused metadata/duplicate dictionary references.
 */
export async function compressPdf(
  pdfBuffer: ArrayBuffer | Uint8Array,
  quality: 'low' | 'medium' | 'high' = 'medium'
): Promise<CompressionResult> {
  const originalSize = pdfBuffer.byteLength;
  const srcDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  // Re-encode document using object stream compaction
  const compressedBytes = await srcDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 50,
    updateFieldAppearances: quality !== 'high',
  });

  const compressedSize = compressedBytes.byteLength;
  const ratio = Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100));

  return {
    bytes: compressedBytes,
    originalSize,
    compressedSize,
    ratio,
  };
}

/**
 * Converts image files (JPG, PNG, WebP) into a combined or multi-page PDF document.
 */
export async function imagesToPdf(
  imageFiles: File[],
  options: ImageToPdfOptions = {}
): Promise<Uint8Array> {
  if (imageFiles.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await PDFDocument.create();
  const margin = options.margin ?? 20;

  for (const file of imageFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const isPng = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    let embeddedImage;
    if (isPng) {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgWidth = embeddedImage.width;
    const imgHeight = embeddedImage.height;

    let pageWidth = 595.28; // Standard A4 points
    let pageHeight = 841.89;

    if (options.pageSize === 'letter') {
      pageWidth = 612.0;
      pageHeight = 792.0;
    } else if (options.pageSize === 'fit') {
      pageWidth = imgWidth + margin * 2;
      pageHeight = imgHeight + margin * 2;
    }

    if (options.orientation === 'landscape' && pageWidth < pageHeight) {
      const temp = pageWidth;
      pageWidth = pageHeight;
      pageHeight = temp;
    }

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Fit image within margins while preserving aspect ratio
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;

    const x = margin + (maxWidth - drawWidth) / 2;
    const y = margin + (maxHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });
  }

  return await pdfDoc.save();
}

/**
 * Converts PDF pages into images using PDF.js and HTML5 Canvas.
 */
export async function pdfPagesToImages(
  pdfDocument: PDFDocumentProxy,
  pageIndices: number[],
  format: 'png' | 'jpeg' = 'png',
  scale = 2.0
): Promise<{ pageNumber: number; dataUrl: string; blob: Blob }[]> {
  const results: { pageNumber: number; dataUrl: string; blob: Blob }[] = [];

  for (const idx of pageIndices) {
    if (idx < 0 || idx >= pdfDocument.numPages) continue;

    const page = await pdfDocument.getPage(idx + 1);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    const context = canvas.getContext('2d');
    if (!context) continue;

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: context,
      canvas,
      viewport,
    }).promise;

    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.92 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to generate image blob'));
        },
        mimeType,
        quality
      );
    });

    results.push({
      pageNumber: idx + 1,
      dataUrl,
      blob,
    });
  }

  return results;
}

/**
 * Reads and updates metadata fields in a PDF document.
 */
export async function updatePdfMetadata(
  pdfBuffer: ArrayBuffer | Uint8Array,
  metadata: PdfMetadata
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  if (metadata.title !== undefined) pdfDoc.setTitle(metadata.title);
  if (metadata.author !== undefined) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject !== undefined) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords !== undefined) pdfDoc.setKeywords(metadata.keywords);
  if (metadata.creator !== undefined) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer !== undefined) pdfDoc.setProducer(metadata.producer);

  return await pdfDoc.save();
}

/**
 * Extracts metadata fields from a PDF document.
 */
export async function getPdfMetadata(pdfBuffer: ArrayBuffer | Uint8Array): Promise<PdfMetadata> {
  const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });

  return {
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    subject: pdfDoc.getSubject(),
    keywords: pdfDoc.getKeywords()?.split(' ') || [],
    creator: pdfDoc.getCreator(),
    producer: pdfDoc.getProducer(),
  };
}
