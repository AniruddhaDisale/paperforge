import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'error';
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-message ${toast.type === 'error' ? 'error' : ''}`}
        >
          {toast.type === 'error' ? (
            <AlertCircle size={16} />
          ) : (
            <CheckCircle size={16} />
          )}
          <span>{toast.message}</span>
          <button
            className="icon-btn"
            style={{ width: 20, height: 20, color: 'inherit' }}
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
