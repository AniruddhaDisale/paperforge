import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPdfPage } from '../../services/pdfRenderer';

interface PDFCanvasProps {
  pdfDocument: PDFDocumentProxy | null;
  originalPageIndex: number | null;
  rotation: number;
  zoom: number;
  width: number;
  height: number;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pdfDocument,
  originalPageIndex,
  rotation,
  zoom,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (originalPageIndex === null || !pdfDocument) {
      // Blank page
      const outputScale = window.devicePixelRatio || 1;
      const displayWidth = Math.floor(width * zoom);
      const displayHeight = Math.floor(height * zoom);

      canvas.width = Math.floor(displayWidth * outputScale);
      canvas.height = Math.floor(displayHeight * outputScale);
      canvas.style.width = `${displayWidth}px`;
      canvas.style.height = `${displayHeight}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const { cancel } = renderPdfPage({
      pdfDocument,
      originalPageIndex,
      rotation,
      zoom,
      canvas,
    });

    return () => {
      cancel();
    };
  }, [pdfDocument, originalPageIndex, rotation, zoom, width, height]);

  return <canvas ref={canvasRef} className="pdf-canvas" />;
};
