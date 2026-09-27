import React, { useState } from 'react';
import { Hash, X } from 'lucide-react';
import type { PageNumberConfig, PageNumberPosition, PageNumberFormat } from '../../types/editor';

interface PageNumberDialogProps {
  isOpen: boolean;
  totalPages: number;
  onApply: (config: PageNumberConfig) => void;
  onCancel: () => void;
}

const POSITION_OPTIONS: { value: PageNumberPosition; label: string }[] = [
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-right', label: 'Top Right' },
];

const FORMAT_OPTIONS: { value: PageNumberFormat; label: string; example: (n: number, t: number) => string }[] = [
  { value: 'n', label: 'Number only', example: (n) => `${n}` },
  { value: 'page-n', label: 'Page N', example: (n) => `Page ${n}` },
  { value: 'n-of-total', label: 'N of Total', example: (n, t) => `${n} of ${t}` },
];

export const PageNumberDialog: React.FC<PageNumberDialogProps> = ({
  isOpen,
  totalPages,
  onApply,
  onCancel,
}) => {
  const [position, setPosition] = useState<PageNumberPosition>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('page-n');
  const [fontSize, setFontSize] = useState(12);
  const [color, setColor] = useState('#374151');
  const [startNumber, setStartNumber] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({ position, format, fontSize, color, startNumber });
  };

  const previewText = FORMAT_OPTIONS.find((f) => f.value === format)?.example(startNumber, totalPages) ?? '';

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 480, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Hash size={18} />
            <h3 className="modal-title">Add Page Numbers</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Preview */}
            <div
              style={{
                background: 'var(--bg-tertiary, #f8fafc)',
                border: '1px solid var(--border-color)',
                borderRadius: 8,
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: position === 'bottom-center' ? 'center' : 'flex-end',
                minHeight: 80,
              }}
            >
              <span style={{ fontSize, color, fontWeight: 500, fontFamily: 'sans-serif' }}>
                {previewText}
              </span>
            </div>

            {/* Position */}
            <div className="form-group">
              <label className="form-label">Position</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {POSITION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`btn btn-secondary ${position === opt.value ? 'active' : ''}`}
                    style={{ flex: 1, fontSize: 12, padding: '6px 4px' }}
                    onClick={() => setPosition(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="form-group">
              <label className="form-label" htmlFor="page-number-format">
                Format
              </label>
              <select
                id="page-number-format"
                className="form-input"
                value={format}
                onChange={(e) => setFormat(e.target.value as PageNumberFormat)}
              >
                {FORMAT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} (e.g., "{opt.example(1, totalPages)}")
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {/* Start Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="page-start-number">
                  Start Number
                </label>
                <input
                  id="page-start-number"
                  className="form-input"
                  type="number"
                  min={1}
                  max={999}
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>

              {/* Font Size */}
              <div className="form-group">
                <label className="form-label" htmlFor="page-number-size">
                  Font Size
                </label>
                <select
                  id="page-number-size"
                  className="form-input"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                >
                  {[9, 10, 11, 12, 14, 16].map((s) => (
                    <option key={s} value={s}>{s}px</option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: 36,
                    padding: 2,
                    borderRadius: 6,
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)',
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              📄 Page numbers will be added to all {totalPages} pages in the document.
            </p>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Page Numbers
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
