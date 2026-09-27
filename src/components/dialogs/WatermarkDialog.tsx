import React, { useState } from 'react';
import { Droplet, X, Sparkles } from 'lucide-react';
import type { WatermarkConfig } from '../../types/editor';

interface WatermarkDialogProps {
  isOpen: boolean;
  onApply: (config: WatermarkConfig) => void;
  onCancel: () => void;
}

const PRESET_TEXTS = ['CONFIDENTIAL', 'DO NOT COPY', 'DRAFT', 'ORIGINAL', 'SAMPLE', 'APPROVED'];
const PRESET_COLORS = ['#ef4444', '#64748b', '#2563eb', '#10b981', '#f59e0b', '#000000'];

export const WatermarkDialog: React.FC<WatermarkDialogProps> = ({
  isOpen,
  onApply,
  onCancel,
}) => {
  const [text, setText] = useState('CONFIDENTIAL');
  const [color, setColor] = useState('#64748b');
  const [opacity, setOpacity] = useState(0.25);
  const [fontSize, setFontSize] = useState(54);
  const [rotation, setRotation] = useState(45);
  const [allPages, setAllPages] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onApply({
      text: text.trim(),
      color,
      opacity,
      fontSize,
      rotation,
      allPages,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 520, width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplet size={18} className="text-accent" />
            <h3 className="modal-title">Add Watermark</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Live Watermark Preview */}
            <div
              style={{
                height: 120,
                backgroundColor: 'var(--bg-tertiary, #f8fafc)',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  color,
                  opacity,
                  fontSize: Math.min(36, fontSize * 0.5),
                  fontWeight: 800,
                  letterSpacing: '0.15em',
                  transform: `rotate(${rotation === 45 ? -30 : 0}deg)`,
                  userSelect: 'none',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {text || 'PREVIEW'}
              </span>
            </div>

            {/* Presets */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} />
                Quick Presets
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PRESET_TEXTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className={`btn btn-secondary ${text === preset ? 'active' : ''}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      borderColor: text === preset ? 'var(--accent-primary, #6366f1)' : undefined,
                    }}
                    onClick={() => setText(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Text */}
            <div className="form-group">
              <label className="form-label" htmlFor="watermark-text-input">
                Watermark Text
              </label>
              <input
                id="watermark-text-input"
                className="form-input"
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter watermark text..."
                maxLength={40}
                required
              />
            </div>

            {/* Sliders: Opacity & Font Size */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">
                  Opacity: {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0.08"
                  max="0.75"
                  step="0.01"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="24"
                  max="90"
                  step="2"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                  style={{ width: '100%', cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Color & Angle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: color === c ? '2px solid var(--accent-primary, #6366f1)' : '1px solid rgba(0,0,0,0.15)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Angle</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-secondary ${rotation === 45 ? 'active' : ''}`}
                    style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                    onClick={() => setRotation(45)}
                  >
                    Diagonal (45°)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-secondary ${rotation === 0 ? 'active' : ''}`}
                    style={{ flex: 1, padding: '4px 8px', fontSize: 12 }}
                    onClick={() => setRotation(0)}
                  >
                    Horizontal (0°)
                  </button>
                </div>
              </div>
            </div>

            {/* Scope: All pages vs Current */}
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                id="apply-all-pages"
                type="checkbox"
                checked={allPages}
                onChange={(e) => setAllPages(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="apply-all-pages" style={{ fontSize: 13, cursor: 'pointer', userSelect: 'none' }}>
                Apply watermark to all pages in this document
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!text.trim()}>
              Apply Watermark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
