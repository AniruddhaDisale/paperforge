import React from 'react';
import { X, Info, ShieldCheck } from 'lucide-react';
import type { PageModel } from '../../types/pdf';

interface DocumentInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string | null;
  fileBytes?: ArrayBuffer | Uint8Array | null;
  pages: PageModel[];
  currentPageIndex: number;
}

export const DocumentInfoDialog: React.FC<DocumentInfoDialogProps> = ({
  isOpen,
  onClose,
  fileName,
  fileBytes,
  pages,
  currentPageIndex,
}) => {
  if (!isOpen) return null;

  const currentPage = pages[currentPageIndex] || pages[0];
  const widthPt = currentPage ? Math.round(currentPage.width) : 0;
  const heightPt = currentPage ? Math.round(currentPage.height) : 0;

  // Conversions: 1 pt = 1/72 in, 1 pt = 0.352778 mm
  const widthIn = (widthPt / 72).toFixed(2);
  const heightIn = (heightPt / 72).toFixed(2);
  const widthMm = (widthPt * 0.352778).toFixed(1);
  const heightMm = (heightPt * 0.352778).toFixed(1);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog"
        style={{ maxWidth: 460 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Info size={18} color="var(--primary)" />
            <h3 className="modal-title">Document Properties</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          <table className="doc-info-table">
            <tbody>
              <tr>
                <td>File Name</td>
                <td>{fileName || 'Untitled.pdf'}</td>
              </tr>
              <tr>
                <td>File Size</td>
                <td>{formatFileSize(fileBytes?.byteLength)}</td>
              </tr>
              <tr>
                <td>Page Count</td>
                <td>{pages.length} {pages.length === 1 ? 'page' : 'pages'}</td>
              </tr>
              <tr>
                <td>Page Dimensions</td>
                <td>
                  <div>{widthPt} × {heightPt} pt</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    {widthMm} × {heightMm} mm ({widthIn} × {heightIn} in)
                  </div>
                </td>
              </tr>
              <tr>
                <td>Security</td>
                <td style={{ color: 'var(--accent-emerald)', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} />
                    <span>Browser Sandboxed (No Cloud Upload)</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
