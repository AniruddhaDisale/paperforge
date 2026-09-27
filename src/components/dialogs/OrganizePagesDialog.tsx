import React, { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { X, RotateCw, RotateCcw, Copy, Trash2, Plus, LayoutGrid } from 'lucide-react';
import type { PageModel } from '../../types/pdf';
import { PageThumbnail } from '../sidebar/PageThumbnail';

interface OrganizePagesDialogProps {
  isOpen: boolean;
  pages: PageModel[];
  currentPageId: string;
  pdfDocument: PDFDocumentProxy | null;
  onClose: () => void;
  onSelectPage: (pageId: string) => void;
  onRotatePage: (pageId: string, delta: 90 | -90) => void;
  onRotateAllPages: (delta: 90 | -90) => void;
  onDeletePage: (pageId: string) => void;
  onDuplicatePage: (pageId: string) => void;
  onReorderPages: (sourceIndex: number, destIndex: number) => void;
  onAddBlankPage: () => void;
}

export const OrganizePagesDialog: React.FC<OrganizePagesDialogProps> = ({
  isOpen,
  pages,
  currentPageId,
  pdfDocument,
  onClose,
  onSelectPage,
  onRotatePage,
  onRotateAllPages,
  onDeletePage,
  onDuplicatePage,
  onReorderPages,
  onAddBlankPage,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderPages(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog organize-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutGrid size={20} color="var(--primary)" />
            <h3 className="modal-title">Organize Pages</h3>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
              ({pages.length} {pages.length === 1 ? 'page' : 'pages'})
            </span>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="organize-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-secondary"
              style={{ height: 32, fontSize: 13, gap: 6 }}
              onClick={() => onRotateAllPages(90)}
              title="Rotate all pages clockwise by 90°"
            >
              <RotateCw size={14} />
              Rotate All 90°
            </button>
            <button
              className="btn-secondary"
              style={{ height: 32, fontSize: 13, gap: 6 }}
              onClick={() => onRotateAllPages(-90)}
              title="Rotate all pages counter-clockwise by 90°"
            >
              <RotateCcw size={14} />
              Rotate All -90°
            </button>
          </div>

          <button
            className="btn-primary"
            style={{ height: 32, fontSize: 13, gap: 6 }}
            onClick={onAddBlankPage}
            title="Insert a blank page at the end"
          >
            <Plus size={15} />
            Add Blank Page
          </button>
        </div>

        {/* Pages Grid */}
        <div className="organize-grid">
          {pages.map((page, index) => (
            <div
              key={page.id}
              className={`organize-card ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div
                style={{ width: '100%' }}
                onClick={() => onSelectPage(page.id)}
              >
                <PageThumbnail
                  page={page}
                  pageNumber={index + 1}
                  isActive={page.id === currentPageId}
                  pdfDocument={pdfDocument}
                  onSelect={() => onSelectPage(page.id)}
                  onRotateCw={() => onRotatePage(page.id, 90)}
                  onRotateCcw={() => onRotatePage(page.id, -90)}
                  onDelete={() => onDeletePage(page.id)}
                  canDelete={pages.length > 1}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  isDragOver={dragOverIndex === index}
                  index={index}
                />
              </div>

              {/* Extra Organize Actions on the card */}
              <div className="organize-actions">
                <button
                  type="button"
                  className="organize-btn"
                  onClick={() => onDuplicatePage(page.id)}
                  title="Duplicate Page"
                >
                  <Copy size={13} />
                </button>
                <button
                  type="button"
                  className="organize-btn"
                  onClick={() => onRotatePage(page.id, 90)}
                  title="Rotate Clockwise"
                >
                  <RotateCw size={13} />
                </button>
                {pages.length > 1 && (
                  <button
                    type="button"
                    className="organize-btn danger"
                    onClick={() => onDeletePage(page.id)}
                    title="Delete Page"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
