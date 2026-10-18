import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Table as TableIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Download,
  FileText,
  AlertTriangle,
  X,
  Plus,
  Minus,
  Printer,
} from 'lucide-react';
import type { DocxDocumentState, DocxStats } from '../../types/docx';
import { calculateDocxStats } from '../../services/docxService';

interface DocxEditorProps {
  documentState: DocxDocumentState;
  onUpdateContent: (html: string, stats: DocxStats) => void;
  onExportDocx: () => void;
  onExportPdf: () => void;
  onCloseDocument: () => void;
  isExporting?: boolean;
}

export const DocxEditor: React.FC<DocxEditorProps> = ({
  documentState,
  onUpdateContent,
  onExportDocx,
  onExportPdf,
  onCloseDocument,
  isExporting = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showWarnings, setShowWarnings] = useState(documentState.warnings.length > 0);
  const [zoom, setZoom] = useState(1.0);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  // Active formatting state for toolbar highlights
  const [activeFmt, setActiveFmt] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    align: 'left',
    block: 'p',
    list: false,
  });

  // Hidden image input
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Initialize editor content once
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== documentState.htmlContent) {
      editorRef.current.innerHTML = documentState.htmlContent;
    }
  }, [documentState.htmlContent]);

  // Update active formatting on selection change
  const checkSelectionFormat = useCallback(() => {
    if (!editorRef.current) return;
    try {
      setActiveFmt({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        align: document.queryCommandState('justifyCenter')
          ? 'center'
          : document.queryCommandState('justifyRight')
          ? 'right'
          : document.queryCommandState('justifyFull')
          ? 'justify'
          : 'left',
        block: document.queryCommandValue('formatBlock') || 'p',
        list: document.queryCommandState('insertUnorderedList') || document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // Ignore queryCommand errors
    }
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', checkSelectionFormat);
    return () => document.removeEventListener('selectionchange', checkSelectionFormat);
  }, [checkSelectionFormat]);

  // Handle input event
  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const newHtml = editorRef.current.innerHTML;
    const newStats = calculateDocxStats(newHtml);
    onUpdateContent(newHtml, newStats);
    checkSelectionFormat();
  }, [onUpdateContent, checkSelectionFormat]);

  // Command executor
  const execCmd = (cmd: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    handleInput();
  };

  // Heading format
  const handleHeadingChange = (headingTag: string) => {
    execCmd('formatBlock', headingTag === 'p' ? '<p>' : `<${headingTag}>`);
  };

  // Font family
  const handleFontFamilyChange = (font: string) => {
    execCmd('fontName', font);
  };

  // Font size
  const handleFontSizeChange = (size: string) => {
    // execCmd fontSize accepts 1-7, but we can set inline style via span
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    execCmd('fontSize', '3'); // intermediate
    const fontElements = editorRef.current?.getElementsByTagName('font');
    if (fontElements) {
      for (let i = 0; i < fontElements.length; i++) {
        const el = fontElements[i];
        if (el.getAttribute('size') === '3') {
          el.removeAttribute('size');
          el.style.fontSize = size;
        }
      }
    }
    handleInput();
  };

  // Save current selection range before opening modal dialog
  const saveCurrentSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      setSavedSelection(sel.getRangeAt(0));
    }
  };

  const restoreCurrentSelection = () => {
    if (savedSelection) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection);
    }
  };

  // Insert Link
  const handleOpenLinkDialog = () => {
    saveCurrentSelection();
    setLinkUrl('https://');
    setIsLinkDialogOpen(true);
  };

  const handleApplyLink = () => {
    setIsLinkDialogOpen(false);
    restoreCurrentSelection();
    if (linkUrl && linkUrl !== 'https://') {
      execCmd('createLink', linkUrl);
    }
  };

  // Insert Table
  const handleOpenTableDialog = () => {
    saveCurrentSelection();
    setIsTableDialogOpen(true);
  };

  const handleApplyTable = () => {
    setIsTableDialogOpen(false);
    restoreCurrentSelection();

    let tableHtml = '<table class="docx-table" style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tbody>';
    for (let r = 0; r < tableRows; r++) {
      tableHtml += '<tr>';
      for (let c = 0; c < tableCols; c++) {
        if (r === 0) {
          tableHtml += `<th style="border: 1px solid #d1d5db; padding: 8px 12px; background-color: #f3f4f6; text-align: left;">Header ${c + 1}</th>`;
        } else {
          tableHtml += `<td style="border: 1px solid #d1d5db; padding: 8px 12px;">Cell ${r},${c + 1}</td>`;
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table><p><br></p>';

    execCmd('insertHTML', tableHtml);
  };

  // Insert Image
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const imgHtml = `<img src="${dataUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 12px 0;" /><p><br></p>`;
      execCmd('insertHTML', imgHtml);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Keyboard shortcuts within editor
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        execCmd('bold');
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        execCmd('italic');
      } else if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        execCmd('underline');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        onExportDocx();
      }
    }
  };

  return (
    <div className="docx-editor-container">
      {/* Hidden file input for images */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Ribbon / Document Toolbar */}
      <div className="docx-toolbar-ribbon" role="toolbar" aria-label="Word document formatting ribbon">
        <div className="docx-toolbar-group">
          <button
            className="icon-btn"
            onClick={() => execCmd('undo')}
            title="Undo (Ctrl+Z)"
            aria-label="Undo"
          >
            <Undo2 size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => execCmd('redo')}
            title="Redo (Ctrl+Y)"
            aria-label="Redo"
          >
            <Redo2 size={16} />
          </button>
        </div>

        <div className="v-divider" />

        {/* Styles / Headings */}
        <div className="docx-toolbar-group">
          <select
            className="docx-select heading-select"
            value={activeFmt.block.toLowerCase().replace(/[<>]/g, '')}
            onChange={(e) => handleHeadingChange(e.target.value)}
            aria-label="Paragraph Style"
          >
            <option value="p">Normal Text</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="blockquote">Quote</option>
          </select>

          {/* Font Family */}
          <select
            className="docx-select font-select"
            onChange={(e) => handleFontFamilyChange(e.target.value)}
            defaultValue="Inter, sans-serif"
            aria-label="Font Family"
          >
            <option value="Inter, sans-serif">Inter (Modern)</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="Calibri, sans-serif">Calibri</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier New</option>
          </select>

          {/* Font Size */}
          <select
            className="docx-select size-select"
            onChange={(e) => handleFontSizeChange(e.target.value)}
            defaultValue="14px"
            aria-label="Font Size"
          >
            <option value="11px">11 pt</option>
            <option value="12px">12 pt</option>
            <option value="14px">14 pt</option>
            <option value="16px">16 pt</option>
            <option value="18px">18 pt</option>
            <option value="22px">22 pt</option>
            <option value="28px">28 pt</option>
            <option value="36px">36 pt</option>
          </select>
        </div>

        <div className="v-divider" />

        {/* Inline Formatting */}
        <div className="docx-toolbar-group">
          <button
            className={`icon-btn ${activeFmt.bold ? 'active' : ''}`}
            onClick={() => execCmd('bold')}
            title="Bold (Ctrl+B)"
            aria-label="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.italic ? 'active' : ''}`}
            onClick={() => execCmd('italic')}
            title="Italic (Ctrl+I)"
            aria-label="Italic"
          >
            <Italic size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.underline ? 'active' : ''}`}
            onClick={() => execCmd('underline')}
            title="Underline (Ctrl+U)"
            aria-label="Underline"
          >
            <Underline size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.strike ? 'active' : ''}`}
            onClick={() => execCmd('strikeThrough')}
            title="Strikethrough"
            aria-label="Strikethrough"
          >
            <Strikethrough size={16} />
          </button>

          {/* Text Color Picker */}
          <div className="color-picker-wrapper" title="Text Color">
            <input
              type="color"
              defaultValue="#111827"
              className="color-input"
              onChange={(e) => execCmd('foreColor', e.target.value)}
              aria-label="Text Color"
            />
            <span style={{ fontSize: 13, fontWeight: 700, borderBottom: '2.5px solid #4f46e5' }}>A</span>
          </div>

          {/* Highlight Color Picker */}
          <div className="color-picker-wrapper" title="Highlight Background Color">
            <input
              type="color"
              defaultValue="#fef08a"
              className="color-input"
              onChange={(e) => execCmd('hiliteColor', e.target.value)}
              aria-label="Highlight Color"
            />
            <span style={{ fontSize: 12, backgroundColor: '#fef08a', padding: '0 3px', borderRadius: 2 }}>HL</span>
          </div>
        </div>

        <div className="v-divider" />

        {/* Alignment */}
        <div className="docx-toolbar-group">
          <button
            className={`icon-btn ${activeFmt.align === 'left' ? 'active' : ''}`}
            onClick={() => execCmd('justifyLeft')}
            title="Align Left"
            aria-label="Align Left"
          >
            <AlignLeft size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.align === 'center' ? 'active' : ''}`}
            onClick={() => execCmd('justifyCenter')}
            title="Align Center"
            aria-label="Align Center"
          >
            <AlignCenter size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.align === 'right' ? 'active' : ''}`}
            onClick={() => execCmd('justifyRight')}
            title="Align Right"
            aria-label="Align Right"
          >
            <AlignRight size={16} />
          </button>
          <button
            className={`icon-btn ${activeFmt.align === 'justify' ? 'active' : ''}`}
            onClick={() => execCmd('justifyFull')}
            title="Justify"
            aria-label="Justify"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        <div className="v-divider" />

        {/* Lists & Inserts */}
        <div className="docx-toolbar-group">
          <button
            className="icon-btn"
            onClick={() => execCmd('insertUnorderedList')}
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => execCmd('insertOrderedList')}
            title="Numbered List"
            aria-label="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={handleOpenLinkDialog}
            title="Insert Link"
            aria-label="Insert Link"
          >
            <Link size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={handleOpenTableDialog}
            title="Insert Table"
            aria-label="Insert Table"
          >
            <TableIcon size={16} />
          </button>
          <button
            className="icon-btn"
            onClick={() => imageInputRef.current?.click()}
            title="Insert Image"
            aria-label="Insert Image"
          >
            <ImageIcon size={16} />
          </button>
        </div>

        <div className="docx-toolbar-spacer" />

        {/* Quick Export Actions */}
        <div className="docx-toolbar-group">
          <button
            className="btn-secondary"
            onClick={onExportPdf}
            title="Export document as PDF"
            style={{ height: 32, padding: '0 10px', fontSize: 12, gap: 5 }}
          >
            <Printer size={14} />
            <span>Export PDF</span>
          </button>

          <button
            className="btn-primary"
            onClick={onExportDocx}
            disabled={isExporting}
            title="Save and download as Microsoft Word (.docx)"
            style={{ height: 32, padding: '0 12px', fontSize: 12, gap: 5 }}
          >
            <Download size={14} />
            <span>{isExporting ? 'Saving...' : 'Export DOCX'}</span>
          </button>

          <button
            className="icon-btn"
            onClick={onCloseDocument}
            title="Close Word Document"
            aria-label="Close Word Document"
            style={{ width: 32, height: 32 }}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Warnings Banner if document contains complex unconvertible elements */}
      {showWarnings && documentState.warnings.length > 0 && (
        <div className="docx-warning-banner" role="alert">
          <div className="docx-warning-left">
            <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0 }} />
            <span>
              <strong>Document Notice:</strong> {documentState.warnings.length} complex element(s) (such as macros or legacy shapes) were simplified for browser editing. Your text and tables are preserved.
            </span>
          </div>
          <button
            className="docx-warning-close-btn"
            onClick={() => setShowWarnings(false)}
            aria-label="Dismiss warning"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Document Canvas / Virtual Paper */}
      <div className="docx-viewport">
        <div
          className="docx-paper-sheet"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          <div
            ref={editorRef}
            className="docx-content-surface"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            role="textbox"
            aria-multiline="true"
            aria-label="Word document editable body"
          />
        </div>
      </div>

      {/* Document Status Bar (Footer) */}
      <footer className="docx-status-bar">
        <div className="docx-status-left">
          <span className="docx-stat-badge">
            <FileText size={13} style={{ marginRight: 4 }} />
            {documentState.fileName || 'Document.docx'}
          </span>
          <span className="docx-stat-pill">{documentState.stats.words.toLocaleString()} words</span>
          <span className="docx-stat-pill">{documentState.stats.characters.toLocaleString()} characters</span>
          <span className="docx-stat-pill">~{documentState.stats.readingTimeMinutes} min read</span>

          <span className="docx-save-status">
            {documentState.isModified ? (
              <span className="unsaved-text">• Unsaved changes</span>
            ) : (
              <span className="saved-text">✓ All changes saved</span>
            )}
          </span>
        </div>

        <div className="docx-status-right">
          {/* Zoom controls */}
          <div className="docx-zoom-controls">
            <button
              className="icon-btn docx-zoom-btn"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus size={13} />
            </button>
            <span className="docx-zoom-label">{Math.round(zoom * 100)}%</span>
            <button
              className="icon-btn docx-zoom-btn"
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.1))}
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus size={13} />
            </button>
            <button
              className="btn-secondary docx-reset-zoom-btn"
              onClick={() => setZoom(1.0)}
              title="Reset Zoom to 100%"
            >
              100%
            </button>
          </div>
        </div>
      </footer>

      {/* Link Dialog */}
      {isLinkDialogOpen && (
        <div className="modal-backdrop" onClick={() => setIsLinkDialogOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Insert Hyperlink</h3>
              <button className="icon-btn" onClick={() => setIsLinkDialogOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                URL Destination
              </label>
              <input
                type="url"
                className="text-input"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setIsLinkDialogOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApplyLink}>
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Dialog */}
      {isTableDialogOpen && (
        <div className="modal-backdrop" onClick={() => setIsTableDialogOpen(false)} role="dialog" aria-modal="true">
          <div className="modal-dialog" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Insert Table</h3>
              <button className="icon-btn" onClick={() => setIsTableDialogOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '16px 20px', display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Rows
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  className="text-input"
                  value={tableRows}
                  onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="text-input"
                  value={tableCols}
                  onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn-secondary" onClick={() => setIsTableDialogOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleApplyTable}>
                Insert Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
