import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { RotateCw, RotateCcw, Trash2 } from 'lucide-react';
import type { PageModel } from '../../types/pdf';

interface PageThumbnailProps {
  page: PageModel;
  pageNumber: number;
  isActive: boolean;
  pdfDocument: PDFDocumentProxy | null;
  onSelect: () => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  onDelete: () => void;
  canDelete: boolean;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  isDragOver: boolean;
  index: number;
}

export const PageThumbnail: React.FC<PageThumbnailProps> = ({
  page,
  pageNumber,
  isActive,
  pdfDocument,
  onSelect,
  onRotateCw,
  onRotateCcw,
  onDelete,
  canDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
  index,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (page.originalPageIndex === null || !pdfDocument) {
      // It's a blank page or no doc
      const canvas = canvasRef.current;
      canvas.width = 140;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 140, 180);
      }
      return;
    }

    let isCancelled = false;

    const renderThumbnail = async () => {
      try {
        const pageProxy = await pdfDocument.getPage(page.originalPageIndex! + 1);
        if (isCancelled || !canvasRef.current) return;

        const totalRotation = ((pageProxy.rotate || 0) + page.rotation) % 360;
        // Target a preview width of ~140px
        const unscaledViewport = pageProxy.getViewport({ scale: 1, rotation: totalRotation });
        const scale = 140 / unscaledViewport.width;
        const viewport = pageProxy.getViewport({ scale, rotation: totalRotation });

        const canvas = canvasRef.current;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await pageProxy.render({
          canvasContext: ctx,
          canvas,
          viewport,
        }).promise;
      } catch {
        // Thumbnail rendering errors ignored
      }
    };

    renderThumbnail();

    return () => {
      isCancelled = true;
    };
  }, [pdfDocument, page.originalPageIndex, page.rotation]);

  return (
    <div
      className="thumbnail-item-wrapper"
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
    >
      {isDragOver && <div className="thumbnail-drop-indicator" />}

      <div
        className={`thumbnail-card ${isActive ? 'active' : ''}`}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-label={`Page ${pageNumber}`}
      >
        <div className="thumbnail-preview-box">
          <canvas ref={canvasRef} />
        </div>

        <div className="thumbnail-info">
          <span>Page {pageNumber}</span>
          {page.rotation !== 0 && <span>{page.rotation}°</span>}
        </div>

        <div className="thumbnail-quick-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="quick-action-btn"
            title="Rotate Counter-Clockwise"
            onClick={onRotateCcw}
            aria-label="Rotate Counter-Clockwise"
          >
            <RotateCcw size={13} />
          </button>
          <button
            className="quick-action-btn"
            title="Rotate Clockwise"
            onClick={onRotateCw}
            aria-label="Rotate Clockwise"
          >
            <RotateCw size={13} />
          </button>
          {canDelete && (
            <button
              className="quick-action-btn delete-btn"
              title="Delete Page"
              onClick={onDelete}
              aria-label="Delete Page"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
