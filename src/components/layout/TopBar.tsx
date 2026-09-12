import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  PanelLeft,
  Keyboard,
} from 'lucide-react';

interface TopBarProps {
  documentTitle: string | null;
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
  hasDocument: boolean;
  isExporting?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  documentTitle,
  isModified,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExport,
  onToggleSidebar,
  onOpenShortcuts,
  hasDocument,
  isExporting = false,
}) => {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-btn"
          onClick={onToggleSidebar}
          title="Toggle Page Sidebar"
          aria-label="Toggle Page Sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <div className="brand">
          <div className="brand-icon">P</div>
          <span>PaperForge</span>
        </div>

        {documentTitle && (
          <div className="document-title-badge" title={documentTitle}>
            {isModified && <span className="unsaved-dot" title="Unsaved changes" />}
            <span>{documentTitle}</span>
          </div>
        )}
      </div>

      <div className="topbar-center">
        <button
          className="icon-btn"
          onClick={onUndo}
          disabled={!canUndo || !hasDocument}
          title="Undo (Ctrl+Z / ⌘Z)"
          aria-label="Undo"
        >
          <Undo2 size={17} />
        </button>

        <button
          className="icon-btn"
          onClick={onRedo}
          disabled={!canRedo || !hasDocument}
          title="Redo (Ctrl+Y / ⌘⇧Z)"
          aria-label="Redo"
        >
          <Redo2 size={17} />
        </button>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={17} />
        </button>

        <button
          className="btn-primary"
          onClick={onExport}
          disabled={!hasDocument || isExporting}
          title="Export edited PDF (Ctrl+S / ⌘S)"
        >
          <Download size={16} />
          <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
        </button>
      </div>
    </header>
  );
};
