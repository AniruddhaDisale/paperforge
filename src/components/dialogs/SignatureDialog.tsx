import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, PenTool, Type, Upload, Trash2, Check, Bookmark } from 'lucide-react';

interface SignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSignature: (dataUrl: string) => void;
}

const INK_COLORS = ['#09090b', '#1d4ed8', '#dc2626'];
const CURSIVE_FONTS = [
  { name: 'Caveat', font: 'Caveat, cursive' },
  { name: 'Dancing Script', font: 'Dancing Script, cursive' },
  { name: 'Great Vibes', font: 'Great Vibes, cursive' },
];

export const SignatureDialog: React.FC<SignatureDialogProps> = ({
  isOpen,
  onClose,
  onInsertSignature,
}) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<string>('#09090b');
  const [saveForFuture, setSaveForFuture] = useState<boolean>(true);
  const [savedSignature] = useState<string | null>(() => {
    try {
      return localStorage.getItem('paperforge_saved_signature');
    } catch {
      return null;
    }
  });

  // Draw Tab State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Type Tab State
  const [typedName, setTypedName] = useState('John Doe');
  const [selectedFontIndex, setSelectedFontIndex] = useState(0);

  // Upload Tab State
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Canvas drawing setup
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
  }, [inkColor]);

  useEffect(() => {
    if (isOpen && activeTab === 'draw') {
      setTimeout(initCanvas, 50);
    }
  }, [isOpen, activeTab, initCanvas]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    setHasDrawn(true);
    const coords = getCanvasCoordinates(e);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
  };

  // Convert typed text to PNG Data URL
  const renderTypedSignature = (): string => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 600;
    offscreen.height = 200;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);
    ctx.fillStyle = inkColor;
    ctx.font = `64px ${CURSIVE_FONTS[selectedFontIndex].font}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(typedName || 'Signature', offscreen.width / 2, offscreen.height / 2);

    return offscreen.toDataURL('image/png');
  };

  // Upload handler with white background removal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth;
        offscreen.height = img.naturalHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        // Process transparency: remove white / near-white background
        const imgData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // If pixel is very bright, make it transparent
          if (r > 220 && g > 220 && b > 220) {
            data[i + 3] = 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setUploadedImage(offscreen.toDataURL('image/png'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    let finalDataUrl = '';

    if (activeTab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      finalDataUrl = canvas.toDataURL('image/png');
    } else if (activeTab === 'type') {
      finalDataUrl = renderTypedSignature();
    } else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      finalDataUrl = uploadedImage;
    }

    if (!finalDataUrl) return;

    if (saveForFuture) {
      try {
        localStorage.setItem('paperforge_saved_signature', finalDataUrl);
      } catch {
        // ignore
      }
    }

    onInsertSignature(finalDataUrl);
    onClose();
  };

  const handleUseSaved = () => {
    if (!savedSignature) return;
    onInsertSignature(savedSignature);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-dialog"
        style={{ maxWidth: 520 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Add Digital Signature</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="sig-tabs">
          <button
            className={`sig-tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
            onClick={() => setActiveTab('draw')}
          >
            <PenTool size={14} style={{ marginRight: 6 }} />
            Draw
          </button>
          <button
            className={`sig-tab-btn ${activeTab === 'type' ? 'active' : ''}`}
            onClick={() => setActiveTab('type')}
          >
            <Type size={14} style={{ marginRight: 6 }} />
            Type
          </button>
          <button
            className={`sig-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} style={{ marginRight: 6 }} />
            Upload Image
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px' }}>
          {/* Ink Color Picker */}
          {activeTab !== 'upload' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Ink Color
              </span>
              <div className="sig-color-palette">
                {INK_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`sig-color-dot ${inkColor === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      setInkColor(c);
                      if (activeTab === 'draw') {
                        setTimeout(initCanvas, 10);
                      }
                    }}
                    title={`Select ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: DRAW */}
          {activeTab === 'draw' && (
            <div>
              <div className="sig-canvas-container">
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
                />
                <div className="sig-baseline" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  className="btn-secondary"
                  style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                  onClick={clearCanvas}
                  disabled={!hasDrawn}
                >
                  <Trash2 size={13} style={{ marginRight: 5 }} />
                  Clear Pad
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {activeTab === 'type' && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Your Name
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', height: 38, marginBottom: 14 }}
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Enter your name"
                maxLength={40}
              />

              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Choose Signature Style
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {CURSIVE_FONTS.map((font, idx) => (
                  <div
                    key={font.name}
                    className={`sig-font-option ${selectedFontIndex === idx ? 'selected' : ''}`}
                    onClick={() => setSelectedFontIndex(idx)}
                  >
                    <span style={{ fontFamily: font.font, fontSize: 26, color: inkColor }}>
                      {typedName || 'Your Signature'}
                    </span>
                    {selectedFontIndex === idx && <Check size={16} color="var(--primary)" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <div
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: 24,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-muted)',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <div>
                    <img
                      src={uploadedImage}
                      alt="Uploaded Signature"
                      style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                    />
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      Click to replace image (white background auto-removed)
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                      Upload signature image
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      PNG, JPG, or WebP. Background transparency applied automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Save to LocalStorage Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveForFuture}
                onChange={(e) => setSaveForFuture(e.target.checked)}
              />
              Save signature for future sessions
            </label>

            {savedSignature && (
              <button
                type="button"
                className="btn-secondary"
                style={{ height: 28, fontSize: 12, padding: '0 8px', gap: 4 }}
                onClick={handleUseSaved}
                title="Use previously saved signature"
              >
                <Bookmark size={12} />
                Use Saved
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '12px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleApply}
            disabled={
              (activeTab === 'draw' && !hasDrawn) ||
              (activeTab === 'type' && !typedName.trim()) ||
              (activeTab === 'upload' && !uploadedImage)
            }
          >
            Insert Signature
          </button>
        </div>
      </div>
    </div>
  );
};
