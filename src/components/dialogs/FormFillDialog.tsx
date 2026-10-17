import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Save, AlertCircle, Loader2 } from 'lucide-react';
import {
  extractFormFields,
  fillFormFields,
  type FormFieldInfo,
} from '../../services/pdfFormService';

interface FormFillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pdfBytes: Uint8Array | null;
  onFormSaved: (updatedBytes: Uint8Array) => void;
}

export const FormFillDialog: React.FC<FormFillDialogProps> = ({
  isOpen,
  onClose,
  pdfBytes,
  onFormSaved,
}) => {
  const [fields, setFields] = useState<FormFieldInfo[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !pdfBytes) return;

    let isMounted = true;
    queueMicrotask(() => {
      if (isMounted) {
        setIsLoading(true);
        setErrorMsg(null);
      }
    });

    extractFormFields(pdfBytes)
      .then((extracted) => {
        if (!isMounted) return;
        setFields(extracted);
        const initialMap: Record<string, string | boolean> = {};
        extracted.forEach((f) => {
          if (typeof f.value === 'string' || typeof f.value === 'boolean') {
            initialMap[f.name] = f.value;
          }
        });
        setFieldValues(initialMap);
      })
      .catch((err: unknown) => {
        if (isMounted) setErrorMsg(err instanceof Error ? err.message : 'Failed to extract form fields.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfBytes]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!pdfBytes) return;
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const updated = await fillFormFields(pdfBytes, fieldValues);
      onFormSaved(updated);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save form fields.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-box"
        style={{
          width: 600,
          maxWidth: '95vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckSquare size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 18 }}>PDF Form Fields</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Form Filler">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
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
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="dialog-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              <Loader2 size={20} className="spin" style={{ margin: '0 auto 8px' }} />
              Scanning for interactive form fields...
            </div>
          ) : fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
              No interactive form fields detected in this PDF. You can still use the Text Annotation and Checkmark tools from the toolbar to fill in blanks!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Fill or update interactive AcroForm fields below. Values are saved directly into the PDF.
              </div>

              {fields.map((field) => (
                <div
                  key={field.name}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <label style={{ fontSize: 12, fontWeight: 600 }}>
                    {field.name}
                    {field.isRequired && <span style={{ color: '#ef4444' }}> *</span>}
                  </label>

                  {field.type === 'checkbox' ? (
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={!!fieldValues[field.name]}
                        disabled={field.isReadOnly}
                        onChange={(e) =>
                          setFieldValues((prev) => ({ ...prev, [field.name]: e.target.checked }))
                        }
                      />
                      <span>Checked</span>
                    </label>
                  ) : field.type === 'dropdown' ? (
                    <select
                      value={String(fieldValues[field.name] ?? '')}
                      disabled={field.isReadOnly}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                      }}
                    >
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={String(fieldValues[field.name] ?? '')}
                      disabled={field.isReadOnly}
                      onChange={(e) =>
                        setFieldValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                      }
                      style={{
                        padding: '6px 10px',
                        borderRadius: 4,
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        fontSize: 13,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dialog-footer" style={{ padding: 12, borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={fields.length === 0 || isSaving}
          >
            {isSaving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            <span>Save Form Values</span>
          </button>
        </div>
      </div>
    </div>
  );
};
