import {
  PDFDocument,
  rgb,
  degrees,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';
import type { DocumentState } from '../types/pdf';
import type {
  EditorObject,
  TextObject,
  WhiteoutObject,
  DrawObject,
  HighlightObject,
  ShapeObject,
  ImageObject,
  SignatureObject,
  StampObject,
  FormMarkObject,
} from '../types/editor';

/**
 * Converts a hex color string (#RRGGBB) to pdf-lib rgb(r, g, b).
 */
function hexToRgbColor(hex: string) {
  if (!hex || hex === 'transparent') {
    return rgb(0, 0, 0);
  }
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return rgb(isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b);
}

/**
 * Maps visual page coordinates (top-left origin, inverted Y) to PDF Page coordinates (bottom-left origin).
 */
function visualToPdfPoint(
  vx: number,
  vy: number,
  pageWidth: number,
  pageHeight: number,
  rotation: number
): { x: number; y: number } {
  const normRot = ((rotation % 360) + 360) % 360;

  switch (normRot) {
    case 90:
      return { x: vy, y: vx };
    case 180:
      return { x: pageWidth - vx, y: vy };
    case 270:
      return { x: pageWidth - vy, y: pageHeight - vx };
    case 0:
    default:
      return { x: vx, y: pageHeight - vy };
  }
}

/**
 * Exports the modified document with all annotations, rotations, and page order as a Uint8Array.
 */
export async function exportPdfDocument(
  documentState: DocumentState,
  objectsByPage: Record<string, EditorObject[]>
): Promise<Uint8Array> {
  const destPdf = await PDFDocument.create();

  let srcPdf: PDFDocument | null = null;
  if (documentState.originalBytes && documentState.originalBytes.byteLength > 0) {
    srcPdf = await PDFDocument.load(documentState.originalBytes.slice(0), {
      ignoreEncryption: true,
    });
  }

  // Pre-embed standard fonts
  const fonts: Record<string, PDFFont> = {
    Helvetica: await destPdf.embedFont(StandardFonts.Helvetica),
    HelveticaBold: await destPdf.embedFont(StandardFonts.HelveticaBold),
    HelveticaOblique: await destPdf.embedFont(StandardFonts.HelveticaOblique),
    HelveticaBoldOblique: await destPdf.embedFont(StandardFonts.HelveticaBoldOblique),
    TimesRoman: await destPdf.embedFont(StandardFonts.TimesRoman),
    Courier: await destPdf.embedFont(StandardFonts.Courier),
  };

  for (const pageModel of documentState.pages) {
    let destPage: PDFPage;

    if (pageModel.originalPageIndex !== null && srcPdf) {
      const [copiedPage] = await destPdf.copyPages(srcPdf, [pageModel.originalPageIndex]);
      const initialAngle = copiedPage.getRotation().angle || 0;
      copiedPage.setRotation(degrees((initialAngle + pageModel.rotation) % 360));
      destPage = destPdf.addPage(copiedPage);
    } else {
      destPage = destPdf.addPage([pageModel.width, pageModel.height]);
      if (pageModel.rotation !== 0) {
        destPage.setRotation(degrees(pageModel.rotation));
      }
    }

    const pageWidth = destPage.getWidth();
    const pageHeight = destPage.getHeight();
    const rotation = destPage.getRotation().angle || 0;

    const pageObjects = objectsByPage[pageModel.id] || [];

    for (const obj of pageObjects) {
      try {
        switch (obj.type) {
          case 'text':
            drawTextOnPage(destPage, obj, fonts, pageWidth, pageHeight, rotation);
            break;
          case 'draw':
            drawFreehandOnPage(destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'highlight':
            drawHighlightOnPage(destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'shape':
            drawShapeOnPage(destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'image':
            await drawImageOnPage(destPdf, destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'signature':
            await drawSignatureOnPage(destPdf, destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'stamp':
            drawStampOnPage(destPage, obj, fonts, pageWidth, pageHeight, rotation);
            break;
          case 'mark':
            drawFormMarkOnPage(destPage, obj, pageWidth, pageHeight, rotation);
            break;
          case 'whiteout':
            drawWhiteoutOnPage(destPage, obj, pageWidth, pageHeight, rotation);
            break;
        }
      } catch (err) {
        console.error(`Failed to draw object ${obj.id} on page:`, err);
      }
    }
  }

  return await destPdf.save();
}

function drawTextOnPage(
  page: PDFPage,
  obj: TextObject,
  fonts: Record<string, PDFFont>,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  let font = fonts.Helvetica;
  if (obj.fontFamily === 'TimesRoman') {
    font = fonts.TimesRoman;
  } else if (obj.fontFamily === 'Courier') {
    font = fonts.Courier;
  } else {
    if (obj.isBold && obj.isItalic) font = fonts.HelveticaBoldOblique;
    else if (obj.isBold) font = fonts.HelveticaBold;
    else if (obj.isItalic) font = fonts.HelveticaOblique;
  }

  const lines = obj.text.split('\n');
  const lineHeight = obj.fontSize * 1.2;
  const color = hexToRgbColor(obj.color);

  lines.forEach((line, index) => {
    const lineY = obj.y + obj.fontSize + index * lineHeight;
    const pt = visualToPdfPoint(obj.x, lineY, pageWidth, pageHeight, rotation);

    page.drawText(line, {
      x: pt.x,
      y: pt.y,
      size: obj.fontSize,
      font,
      color,
    });
  });
}

function drawFreehandOnPage(
  page: PDFPage,
  obj: DrawObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  if (!obj.points || obj.points.length < 2) return;

  const color = hexToRgbColor(obj.strokeColor);
  const thickness = obj.strokeWidth || 2;
  const opacity = obj.opacity ?? 1;

  for (let i = 0; i < obj.points.length - 1; i++) {
    const p1 = visualToPdfPoint(obj.points[i].x, obj.points[i].y, pageWidth, pageHeight, rotation);
    const p2 = visualToPdfPoint(obj.points[i + 1].x, obj.points[i + 1].y, pageWidth, pageHeight, rotation);

    page.drawLine({
      start: { x: p1.x, y: p1.y },
      end: { x: p2.x, y: p2.y },
      thickness,
      color,
      opacity,
    });
  }
}

function drawHighlightOnPage(
  page: PDFPage,
  obj: HighlightObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);
  const color = hexToRgbColor(obj.color);

  page.drawRectangle({
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    color,
    opacity: obj.opacity || 0.4,
  });
}

function drawWhiteoutOnPage(
  page: PDFPage,
  obj: WhiteoutObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);
  const color = hexToRgbColor(obj.color || '#ffffff');

  page.drawRectangle({
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    color,
    opacity: obj.opacity ?? 1,
  });
}

function drawShapeOnPage(
  page: PDFPage,
  obj: ShapeObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  const strokeColor = hexToRgbColor(obj.strokeColor);
  const hasFill = obj.fillColor && obj.fillColor !== 'transparent';
  const fillColor = hasFill ? hexToRgbColor(obj.fillColor) : undefined;
  const borderWidth = obj.strokeWidth || 2;
  const opacity = obj.opacity ?? 1;

  if (obj.shapeType === 'rectangle') {
    const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);
    page.drawRectangle({
      x: pt.x,
      y: pt.y,
      width: obj.width,
      height: obj.height,
      borderColor: strokeColor,
      borderWidth,
      color: fillColor,
      opacity,
    });
  } else if (obj.shapeType === 'circle') {
    const centerX = obj.x + obj.width / 2;
    const centerY = obj.y + obj.height / 2;
    const pt = visualToPdfPoint(centerX, centerY, pageWidth, pageHeight, rotation);

    page.drawEllipse({
      x: pt.x,
      y: pt.y,
      xScale: obj.width / 2,
      yScale: obj.height / 2,
      borderColor: strokeColor,
      borderWidth,
      color: fillColor,
      opacity,
    });
  } else if (obj.shapeType === 'line' || obj.shapeType === 'arrow') {
    const startPt = visualToPdfPoint(obj.x, obj.y, pageWidth, pageHeight, rotation);
    const endPt = visualToPdfPoint(obj.x + obj.width, obj.y + obj.height, pageWidth, pageHeight, rotation);

    page.drawLine({
      start: startPt,
      end: endPt,
      thickness: borderWidth,
      color: strokeColor,
      opacity,
    });

    if (obj.shapeType === 'arrow') {
      const angle = Math.atan2(endPt.y - startPt.y, endPt.x - startPt.x);
      const arrowLength = 12;
      const arrowAngle = Math.PI / 6;

      const pLeft = {
        x: endPt.x - arrowLength * Math.cos(angle - arrowAngle),
        y: endPt.y - arrowLength * Math.sin(angle - arrowAngle),
      };
      const pRight = {
        x: endPt.x - arrowLength * Math.cos(angle + arrowAngle),
        y: endPt.y - arrowLength * Math.sin(angle + arrowAngle),
      };

      page.drawLine({
        start: endPt,
        end: pLeft,
        thickness: borderWidth,
        color: strokeColor,
        opacity,
      });
      page.drawLine({
        start: endPt,
        end: pRight,
        thickness: borderWidth,
        color: strokeColor,
        opacity,
      });
    }
  }
}

async function drawImageOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  obj: ImageObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  let embeddedImage;

  if (obj.src.startsWith('data:image/png;base64,')) {
    const base64Data = obj.src.replace('data:image/png;base64,', '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    embeddedImage = await pdfDoc.embedPng(bytes);
  } else if (obj.src.startsWith('data:image/jpeg;base64,') || obj.src.startsWith('data:image/jpg;base64,')) {
    const base64Data = obj.src.replace(/^data:image\/(jpeg|jpg);base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    embeddedImage = await pdfDoc.embedJpg(bytes);
  } else {
    // If it's a blob URL or generic data URL, fetch arrayBuffer and embed as PNG
    const response = await fetch(obj.src);
    const arrayBuffer = await response.arrayBuffer();
    embeddedImage = await pdfDoc.embedPng(new Uint8Array(arrayBuffer));
  }

  const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);

  page.drawImage(embeddedImage, {
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    opacity: obj.opacity ?? 1,
  });
}

async function drawSignatureOnPage(
  pdfDoc: PDFDocument,
  page: PDFPage,
  obj: SignatureObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  let embeddedImage;

  if (obj.src.startsWith('data:image/png;base64,')) {
    const base64Data = obj.src.replace('data:image/png;base64,', '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    embeddedImage = await pdfDoc.embedPng(bytes);
  } else {
    const response = await fetch(obj.src);
    const arrayBuffer = await response.arrayBuffer();
    embeddedImage = await pdfDoc.embedPng(new Uint8Array(arrayBuffer));
  }

  const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);

  page.drawImage(embeddedImage, {
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    opacity: obj.opacity ?? 1,
  });
}

function drawStampOnPage(
  page: PDFPage,
  obj: StampObject,
  fonts: Record<string, PDFFont>,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  const color = hexToRgbColor(obj.color);
  const opacity = obj.opacity ?? 1;
  const pt = visualToPdfPoint(obj.x, obj.y + obj.height, pageWidth, pageHeight, rotation);

  // Background tint
  page.drawRectangle({
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    color,
    opacity: opacity * 0.1,
  });

  // Border rectangle
  page.drawRectangle({
    x: pt.x,
    y: pt.y,
    width: obj.width,
    height: obj.height,
    borderColor: color,
    borderWidth: 2,
    opacity,
  });

  const fontBold = fonts.HelveticaBold;
  const fontRegular = fonts.Helvetica;
  const labelFontSize = obj.timestamp ? Math.max(9, obj.height * 0.36) : Math.max(10, obj.height * 0.48);
  const labelWidth = fontBold.widthOfTextAtSize(obj.label, labelFontSize);
  const labelX = pt.x + (obj.width - labelWidth) / 2;
  const labelY = obj.timestamp ? pt.y + obj.height * 0.45 : pt.y + (obj.height - labelFontSize) / 2;

  page.drawText(obj.label, {
    x: Math.max(pt.x + 2, labelX),
    y: labelY,
    size: labelFontSize,
    font: fontBold,
    color,
    opacity,
  });

  if (obj.timestamp) {
    const tsFontSize = Math.max(7, obj.height * 0.22);
    const tsWidth = fontRegular.widthOfTextAtSize(obj.timestamp, tsFontSize);
    const tsX = pt.x + (obj.width - tsWidth) / 2;
    const tsY = pt.y + obj.height * 0.16;

    page.drawText(obj.timestamp, {
      x: Math.max(pt.x + 2, tsX),
      y: tsY,
      size: tsFontSize,
      font: fontRegular,
      color,
      opacity: opacity * 0.85,
    });
  }
}

function drawFormMarkOnPage(
  page: PDFPage,
  obj: FormMarkObject,
  pageWidth: number,
  pageHeight: number,
  rotation: number
) {
  const color = hexToRgbColor(obj.color);
  const opacity = obj.opacity ?? 1;
  const thickness = obj.strokeWidth || 2.5;

  if (obj.markType === 'check') {
    const p1 = visualToPdfPoint(obj.x + obj.width * 0.15, obj.y + obj.height * 0.55, pageWidth, pageHeight, rotation);
    const p2 = visualToPdfPoint(obj.x + obj.width * 0.40, obj.y + obj.height * 0.85, pageWidth, pageHeight, rotation);
    const p3 = visualToPdfPoint(obj.x + obj.width * 0.85, obj.y + obj.height * 0.18, pageWidth, pageHeight, rotation);

    page.drawLine({ start: p1, end: p2, thickness, color, opacity });
    page.drawLine({ start: p2, end: p3, thickness, color, opacity });
  } else if (obj.markType === 'cross') {
    const p1a = visualToPdfPoint(obj.x + obj.width * 0.2, obj.y + obj.height * 0.2, pageWidth, pageHeight, rotation);
    const p1b = visualToPdfPoint(obj.x + obj.width * 0.8, obj.y + obj.height * 0.8, pageWidth, pageHeight, rotation);
    const p2a = visualToPdfPoint(obj.x + obj.width * 0.8, obj.y + obj.height * 0.2, pageWidth, pageHeight, rotation);
    const p2b = visualToPdfPoint(obj.x + obj.width * 0.2, obj.y + obj.height * 0.8, pageWidth, pageHeight, rotation);

    page.drawLine({ start: p1a, end: p1b, thickness, color, opacity });
    page.drawLine({ start: p2a, end: p2b, thickness, color, opacity });
  } else if (obj.markType === 'dot') {
    const centerPt = visualToPdfPoint(obj.x + obj.width / 2, obj.y + obj.height / 2, pageWidth, pageHeight, rotation);
    page.drawCircle({
      x: centerPt.x,
      y: centerPt.y,
      size: obj.width * 0.35,
      color,
      opacity,
    });
  }
}

