import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  Trash2,
  FolderOpen,
  Calendar,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  listRecoverySessions,
  restoreRecoverySession,
  deleteRecoverySession,
  clearAllRecoverySessions,
  type RecoverySessionMeta,
  type RecoverySession,
} from '../../services/sessionRecoveryService';

interface RecoveryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSession: (session: RecoverySession) => void;
}

export const RecoveryDialog: React.FC<RecoveryDialogProps> = ({
  isOpen,
  onClose,
  onRestoreSession,
}) => {
  const [sessions, setSessions] = useState<RecoverySessionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadList = async () => {
    setIsLoading(true);
    try {
      const list = await listRecoverySessions();
      setSessions(list);
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to list recovery sessions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        loadList();
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRestore = async (id: string) => {
    setIsRestoring(true);
    try {
      const session = await restoreRecoverySession(id);
      if (session) {
        onRestoreSession(session);
        onClose();
      } else {
        setStatusMsg('Could not find requested session in storage.');
      }
    } catch (err: unknown) {
      setStatusMsg(err instanceof Error ? err.message : 'Failed to restore session.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecoverySession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAll = async () => {
    await clearAllRecoverySessions();
    setSessions([]);
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-box"
        style={{
          width: 580,
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 18 }}>Recent Sessions & Recovery</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Recovery">
            <X size={18} />
          </button>
        </div>

        {statusMsg && (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={16} />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="dialog-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Saved editing sessions stored locally in your browser's private IndexedDB.
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              <Loader2 size={20} className="spin" style={{ margin: '0 auto 8px' }} />
              Loading saved sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              No previous sessions found. As you edit documents, session backups will appear here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'flex', gap: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} /> {new Date(s.timestamp).toLocaleString()}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Layers size={12} /> {s.pageCount} pages ({s.objectCount} annotations)
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleRestore(s.id)}
                      disabled={isRestoring}
                      style={{ fontSize: 12, height: 28, padding: '0 10px' }}
                    >
                      <FolderOpen size={13} /> Restore
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleDelete(s.id)}
                      style={{ color: '#ef4444' }}
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="dialog-footer"
          style={{
            padding: 12,
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          {sessions.length > 0 ? (
            <button
              className="btn-secondary"
              onClick={handleClearAll}
              style={{ color: '#ef4444', fontSize: 12 }}
            >
              Clear All Sessions
            </button>
          ) : (
            <div />
          )}
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
