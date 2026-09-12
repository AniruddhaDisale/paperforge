import React from 'react';
import { Download } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  status: 'exporting' | 'success' | 'error';
  errorMessage?: string;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  status,
  errorMessage,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" style={{ maxWidth: 380 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={18} />
            <h3 className="modal-title">Export PDF</h3>
          </div>
        </div>
        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center', padding: '28px 20px' }}>
          {status === 'exporting' && (
            <>
              <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ marginTop: 16, fontWeight: 500, color: 'var(--text-primary)' }}>
                Generating your PDF document...
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Compiling annotations, shapes, and page structure.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'var(--bg-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                }}
              >
                <Download size={22} />
              </div>
              <p style={{ marginTop: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                Export Complete
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Your edited PDF has been downloaded to your computer.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <p style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                Export Failed
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {errorMessage || 'Something went wrong while exporting the document.'}
              </p>
            </>
          )}
        </div>
        {status !== 'exporting' && (
          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <button className="btn-primary" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
