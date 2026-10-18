import React, { useState, useRef, useEffect } from 'react';
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
  MoreVertical,
} from 'lucide-react';
import { PaperForgeLogo } from '../common/PaperForgeLogo';

interface TopBarProps {
  documentTitle: string | null;
  documentType?: 'pdf' | 'docx' | null;
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
  onCloseDocument?: () => void;
  theme?: 'light' | 'dark';
  hasDocument: boolean;
  isExporting?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  documentTitle,
  documentType = 'pdf',
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
  onCloseDocument,
  theme = 'light',
  hasDocument,
  isExporting = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const isDocx = documentType === 'docx';

  return (
    <header className="topbar">
      {/* Left branding & Document Title */}
      <div className="topbar-left">
        {hasDocument && !isDocx && (
          <button
            className="icon-btn sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title="Toggle Page Sidebar"
            aria-label="Toggle Page Sidebar"
          >
            <PanelLeft size={18} />
          </button>
        )}

        <div className="brand" onClick={onCloseDocument} style={{ cursor: hasDocument ? 'pointer' : 'default' }}>
          <PaperForgeLogo size="sm" />
        </div>

        {documentTitle && (
          <div className="document-title-badge" title={documentTitle}>
            {isModified && <span className="unsaved-dot" title="Unsaved changes" />}
            <span className="doc-format-tag" style={{ backgroundColor: isDocx ? '#2563eb' : '#dc2626' }}>
              {isDocx ? 'DOCX' : 'PDF'}
            </span>
            <span className="doc-name-text">{documentTitle}</span>
          </div>
        )}
      </div>

      {/* Center Tools (Desktop view) */}
      <div className="topbar-center desktop-tools">
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

        <div style={{ width: 1, height: 18, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

        {/* Feature Hub Buttons for PDF */}
        {!isDocx && (
          <>
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
                title="PaperForge AI Assistant"
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
                title="Fill Form Fields"
                aria-label="PDF Forms"
              >
                <CheckSquare size={17} />
              </button>
            )}
          </>
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

      {/* Right Controls & Export */}
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

        {/* Mobile menu trigger */}
        {hasDocument && (
          <div className="mobile-menu-anchor" ref={menuRef}>
            <button
              className={`icon-btn mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              title="More Features"
              aria-label="More Features"
              aria-expanded={isMobileMenuOpen}
            >
              <MoreVertical size={17} />
            </button>

            {/* Mobile Dropdown Popover */}
            {isMobileMenuOpen && (
              <div className="topbar-dropdown-popover" role="menu">
                {!isDocx && onOpenToolbox && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenToolbox();
                    }}
                    role="menuitem"
                  >
                    <Layers size={16} color="var(--primary)" />
                    <span>PDF Toolbox (Merge, Split)</span>
                  </button>
                )}

                {!isDocx && onOpenSearch && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSearch();
                    }}
                    role="menuitem"
                  >
                    <Search size={16} />
                    <span>Search & OCR</span>
                  </button>
                )}

                {!isDocx && onOpenAi && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAi();
                    }}
                    role="menuitem"
                  >
                    <Bot size={16} color="#6366f1" />
                    <span>AI Assistant</span>
                  </button>
                )}

                {!isDocx && onOpenCompare && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCompare();
                    }}
                    role="menuitem"
                  >
                    <GitCompare size={16} />
                    <span>Compare Documents</span>
                  </button>
                )}

                {!isDocx && onOpenForms && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenForms();
                    }}
                    role="menuitem"
                  >
                    <CheckSquare size={16} />
                    <span>Form Fields</span>
                  </button>
                )}

                {onOpenRecovery && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenRecovery();
                    }}
                    role="menuitem"
                  >
                    <History size={16} />
                    <span>Session Recovery</span>
                  </button>
                )}

                {onOpenDocInfo && (
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDocInfo();
                    }}
                    role="menuitem"
                  >
                    <Info size={16} />
                    <span>Document Properties</span>
                  </button>
                )}

                <button
                  className="dropdown-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenShortcuts();
                  }}
                  role="menuitem"
                >
                  <Keyboard size={16} />
                  <span>Keyboard Shortcuts</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Desktop Doc Info */}
        {onOpenDocInfo && (
          <button
            className="icon-btn desktop-only"
            onClick={onOpenDocInfo}
            disabled={!hasDocument}
            title="Document Properties (Info)"
            aria-label="Document Properties"
          >
            <Info size={17} />
          </button>
        )}

        {/* Desktop Shortcuts */}
        <button
          className="icon-btn desktop-only"
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts (?)"
          aria-label="Keyboard Shortcuts"
        >
          <Keyboard size={17} />
        </button>

        {/* Export Page Image (PDF only) */}
        {!isDocx && onExportPageImage && (
          <button
            className="btn-secondary desktop-only"
            onClick={onExportPageImage}
            disabled={!hasDocument}
            title="Export current page as high-res PNG image"
            style={{ height: 34, padding: '0 12px', fontSize: 13, gap: 6 }}
          >
            <FileImage size={15} />
            <span>Export Page</span>
          </button>
        )}

        {/* Primary Export Button */}
        <button
          className="btn-primary"
          onClick={onExport}
          disabled={!hasDocument || isExporting}
          title={isDocx ? 'Download Word document (.docx)' : 'Export edited PDF (Ctrl+S / ⌘S)'}
          style={{ height: 34, padding: '0 14px', fontSize: 13, gap: 6 }}
        >
          <Download size={15} />
          <span>
            {isExporting
              ? 'Saving...'
              : isDocx
              ? 'Export DOCX'
              : 'Export PDF'}
          </span>
        </button>
      </div>
    </header>
  );
};
