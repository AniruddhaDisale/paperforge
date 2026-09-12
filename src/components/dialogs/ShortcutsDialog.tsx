import React from 'react';
import { Keyboard, X } from 'lucide-react';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { key: 'Ctrl / ⌘ + Z', desc: 'Undo' },
  { key: 'Ctrl / ⌘ + Y', desc: 'Redo' },
  { key: 'Ctrl / ⌘ + ⇧ + Z', desc: 'Redo' },
  { key: 'Delete / Backspace', desc: 'Delete selected object' },
  { key: '← / →', desc: 'Previous / Next page' },
  { key: 'Escape', desc: 'Deselect / switch to Select tool' },
  { key: 'Ctrl / ⌘ + S', desc: 'Export PDF' },
  { key: '?', desc: 'Show keyboard shortcuts' },
];

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Keyboard size={18} />
            <h3 className="modal-title">Keyboard Shortcuts</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SHORTCUTS.map((s) => (
              <div
                key={s.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 8,
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>{s.desc}</span>
                <kbd
                  style={{
                    background: 'var(--bg-muted)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
