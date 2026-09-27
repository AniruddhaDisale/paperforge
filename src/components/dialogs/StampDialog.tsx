import React, { useState } from 'react';
import { X, Stamp, Sparkles } from 'lucide-react';

interface StampDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertStamp: (stamp: { label: string; color: string; timestamp?: string }) => void;
}

interface StampPreset {
  label: string;
  color: string;
}

const PRESET_STAMPS: StampPreset[] = [
  { label: 'APPROVED', color: '#10b981' },
  { label: 'REJECTED', color: '#ef4444' },
  { label: 'CONFIDENTIAL', color: '#f59e0b' },
  { label: 'DRAFT', color: '#71717a' },
  { label: 'FINAL', color: '#3b82f6' },
  { label: 'COMPLETED', color: '#06b6d4' },
  { label: 'PAID', color: '#22c55e' },
  { label: 'VOID', color: '#a855f7' },
];

const STAMP_COLORS = [
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#a855f7',
  '#71717a',
  '#09090b',
];

export const StampDialog: React.FC<StampDialogProps> = ({
  isOpen,
  onClose,
  onInsertStamp,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [customLabel, setCustomLabel] = useState('VERIFIED');
  const [customColor, setCustomColor] = useState('#10b981');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);

  if (!isOpen) return null;

  const getFormattedTimestamp = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleSelectPreset = (preset: StampPreset) => {
    onInsertStamp({
      label: preset.label,
      color: preset.color,
      timestamp: includeTimestamp ? getFormattedTimestamp() : undefined,
    });
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customLabel.trim()) return;
    onInsertStamp({
      label: customLabel.trim().toUpperCase(),
      color: customColor,
      timestamp: includeTimestamp ? getFormattedTimestamp() : undefined,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog"
        style={{ maxWidth: 480 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Insert Stamp</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="sig-tabs">
          <button
            className={`sig-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            <Stamp size={14} style={{ marginRight: 6 }} />
            Standard Presets
          </button>
          <button
            className={`sig-tab-btn ${activeTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveTab('custom')}
          >
            <Sparkles size={14} style={{ marginRight: 6 }} />
            Custom Stamp
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Timestamp checkbox toggle */}
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
              />
              Include Date & Timestamp
            </label>
            {includeTimestamp && (
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {getFormattedTimestamp()}
              </span>
            )}
          </div>

          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="stamp-grid">
              {PRESET_STAMPS.map((preset) => (
                <div
                  key={preset.label}
                  className="stamp-preset-card"
                  onClick={() => handleSelectPreset(preset)}
                >
                  <div
                    className="stamp-badge-preview"
                    style={{
                      color: preset.color,
                      borderColor: preset.color,
                    }}
                  >
                    <span>{preset.label}</span>
                    {includeTimestamp && (
                      <span className="stamp-badge-timestamp">
                        {getFormattedTimestamp()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: CUSTOM */}
          {activeTab === 'custom' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Stamp Text
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', height: 38, marginBottom: 14, textTransform: 'uppercase' }}
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="e.g. RECEIVED, VERIFIED"
                maxLength={24}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Stamp Color
              </label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {STAMP_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`sig-color-dot ${customColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setCustomColor(c)}
                    title={c}
                  />
                ))}
              </div>

              {/* Live Preview */}
              <div
                style={{
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--bg-muted)',
                }}
              >
                <div
                  className="stamp-badge-preview"
                  style={{
                    color: customColor,
                    borderColor: customColor,
                    transform: 'rotate(-4deg)',
                  }}
                >
                  <span>{customLabel || 'STAMP'}</span>
                  {includeTimestamp && (
                    <span className="stamp-badge-timestamp">
                      {getFormattedTimestamp()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {activeTab === 'custom' && (
            <button
              className="btn-primary"
              onClick={handleApplyCustom}
              disabled={!customLabel.trim()}
            >
              Insert Stamp
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
