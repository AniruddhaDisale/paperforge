import React from 'react';
import {
  Undo2,
  Redo2,
  Download,
  PanelLeft,
  Keyboard,
  Info,
  FileImage,
  Layers,
  Search,
  Bot,
  GitCompare,
  CheckSquare,
  History,
  Sun,
  Moon,
} from 'lucide-react';

interface TopBarProps {
  documentTitle: string | null;
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onExportPageImage?: () => void;
  onToggleSidebar: () => void;
  onOpenShortcuts: () => void;
  onOpenDocInfo?: () => void;
  onOpenToolbox?: () => void;
  onOpenSearch?: () => void;
  onOpenAi?: () => void;
  onOpenCompare?: () => void;
  onOpenForms?: () => void;
  onOpenRecovery?: () => void;
  onToggleTheme?: () => void;
  theme?: 'light' | 'dark';
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
  onExportPageImage,
  onToggleSidebar,
  onOpenShortcuts,
  onOpenDocInfo,
  onOpenToolbox,
  onOpenSearch,
  onOpenAi,
  onOpenCompare,
  onOpenForms,
  onOpenRecovery,
  onToggleTheme,
  theme = 'light',
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

        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="brand-icon">
            <img src="/favicon.svg" alt="PaperForge" width="24" height="24" />
          </div>
          <span className="brand-text">PaperForge</span>
        </div>

        {documentTitle && (
          <div className="document-title-badge" title={documentTitle}>
            {isModified && <span className="unsaved-dot" title="Unsaved changes" />}
            <span>{documentTitle}</span>
          </div>
        )}
      </div>

      <div className="topbar-center">
        {/* Undo / Redo */}
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

        <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-color)', margin: '0 4px' }} />

        {/* Feature Hub Buttons */}
        {onOpenToolbox && (
          <button
            className="icon-btn"
            onClick={onOpenToolbox}
            title="PDF Toolbox (Merge, Split, Compress, Convert)"
            aria-label="PDF Toolbox"
          >
            <Layers size={17} />
          </button>
        )}

        {onOpenSearch && (
          <button
            className="icon-btn"
            onClick={onOpenSearch}
            disabled={!hasDocument}
            title="Search & OCR"
            aria-label="Search & OCR"
          >
            <Search size={17} />
          </button>
        )}

        {onOpenAi && (
          <button
            className="icon-btn"
            onClick={onOpenAi}
            disabled={!hasDocument}
            title="PaperForge AI Document Assistant"
            aria-label="AI Document Assistant"
            style={{ color: '#6366f1' }}
          >
            <Bot size={17} />
          </button>
        )}

        {onOpenCompare && (
          <button
            className="icon-btn"
            onClick={onOpenCompare}
            disabled={!hasDocument}
            title="Compare Two PDFs"
            aria-label="Compare Two PDFs"
          >
            <GitCompare size={17} />
          </button>
        )}

        {onOpenForms && (
          <button
            className="icon-btn"
            onClick={onOpenForms}
            disabled={!hasDocument}
            title="Fill AcroForm Fields"
            aria-label="PDF Forms"
          >
            <CheckSquare size={17} />
          </button>
        )}

        {onOpenRecovery && (
          <button
            className="icon-btn"
            onClick={onOpenRecovery}
            title="Recent Sessions & Recovery"
            aria-label="Recent Sessions"
          >
            <History size={17} />
          </button>
        )}
      </div>

      <div className="topbar-right">
        {onToggleTheme && (
          <button
            className="icon-btn"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        )}

        {onOpenDocInfo && (
          <button
            className="icon-btn"
            onClick={onOpenDocInfo}
            disabled={!hasDocument}
            title="Document Properties (Info)"
            aria-label="Document Properties"
          >
            <Info size={17} />
          </button>
        )}

        <button
          className="icon-btn"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={17} />
        </button>

        {onExportPageImage && (
          <button
            className="btn-secondary"
            onClick={onExportPageImage}
            disabled={!hasDocument}
            title="Export current page as high-res PNG image"
            style={{ height: 34, padding: '0 12px', fontSize: 13, gap: 6 }}
          >
            <FileImage size={15} />
            <span>Export Page</span>
          </button>
        )}

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
