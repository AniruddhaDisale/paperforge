import React, { useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Plus } from 'lucide-react';
import type { PageModel } from '../../types/pdf';
import { PageThumbnail } from './PageThumbnail';

interface PageSidebarProps {
  pages: PageModel[];
  currentPageId: string;
  pdfDocument: PDFDocumentProxy | null;
  onSelectPage: (pageId: string) => void;
  onRotatePage: (pageId: string, delta: 90 | -90) => void;
  onDeletePage: (pageId: string) => void;
  onReorderPages: (sourceIndex: number, destIndex: number) => void;
  onOpenAddPageDialog: () => void;
  isCollapsed?: boolean;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  pages,
  currentPageId,
  pdfDocument,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onReorderPages,
  onOpenAddPageDialog,
  isCollapsed = false,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    <aside className={`page-sidebar ${isCollapsed ? 'collapsed' : ''}`} aria-label="Page thumbnails">
      <div className="sidebar-header">
        <span>Pages ({pages.length})</span>
      </div>

      <div className="sidebar-content">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
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
        ))}
      </div>

      <div className="sidebar-footer">
        <button
          className="add-page-btn"
          onClick={onOpenAddPageDialog}
          title="Add a blank page to the document"
        >
          <Plus size={15} />
          Add Page
        </button>
      </div>
    </aside>
  );
};
