import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  onUnlock: (password: string) => void;
  onCancel: () => void;
  errorMessage?: string | null;
  isLoading?: boolean;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onUnlock,
  onCancel,
  errorMessage,
  isLoading,
}) => {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onUnlock(password);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} />
            <h3 className="modal-title">Password Protected PDF</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Cancel">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>This document requires a password to view and edit.</p>
            <div className="form-group">
              <label className="form-label" htmlFor="pdf-password-input">
                Password
              </label>
              <input
                id="pdf-password-input"
                type="password"
                className="form-input"
                placeholder="Enter document password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {errorMessage && (
              <p style={{ color: 'var(--accent-red)', fontSize: 12 }}>
                {errorMessage}
              </p>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? 'Unlocking...' : 'Unlock Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
