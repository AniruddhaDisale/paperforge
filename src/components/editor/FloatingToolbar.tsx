import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  ArrowUp,
  ArrowDown,
  Sliders,
  Trash2,
} from 'lucide-react';
import type { EditorObject } from '../../types/editor';

interface FloatingToolbarProps {
  object: EditorObject;
  zoom: number;
  onDuplicate: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onChangeOpacity: (opacity: number) => void;
  onDelete: () => void;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  object,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onChangeOpacity,
  onDelete,
}) => {
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close popovers on click outside
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowLayerMenu(false);
        setShowOpacitySlider(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  const currentOpacity = Math.round((object.opacity ?? 1) * 100);

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Duplicate */}
      <button
        type="button"
        className="floating-btn"
        onClick={onDuplicate}
        title="Duplicate Element (Ctrl+D)"
      >
        <Copy size={13} />
        <span>Duplicate</span>
      </button>

      <div className="v-divider" style={{ height: 16 }} />

      {/* Layer Position Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="floating-btn"
          onClick={() => {
            setShowLayerMenu(!showLayerMenu);
            setShowOpacitySlider(false);
          }}
          title="Layer Position"
        >
          <Layers size={13} />
          <span>Layer</span>
        </button>

        {showLayerMenu && (
          <div className="tool-popover-menu" style={{ bottom: 'calc(100% + 6px)', top: 'auto', left: '50%', transform: 'translateX(-50%)' }}>
            <button
              type="button"
              className="tool-popover-item"
              onClick={() => {
                onBringToFront();
                setShowLayerMenu(false);
              }}
            >
              <ArrowUpToLine size={14} />
              <span>Bring to Front</span>
            </button>
            <button
              type="button"
              className="tool-popover-item"
              onClick={() => {
                onBringForward();
                setShowLayerMenu(false);
              }}
            >
              <ArrowUp size={14} />
              <span>Bring Forward</span>
            </button>
            <button
              type="button"
              className="tool-popover-item"
              onClick={() => {
                onSendBackward();
                setShowLayerMenu(false);
              }}
            >
              <ArrowDown size={14} />
              <span>Send Backward</span>
            </button>
            <button
              type="button"
              className="tool-popover-item"
              onClick={() => {
                onSendToBack();
                setShowLayerMenu(false);
              }}
            >
              <ArrowDownToLine size={14} />
              <span>Send to Back</span>
            </button>
          </div>
        )}
      </div>

      <div className="v-divider" style={{ height: 16 }} />

      {/* Opacity Slider */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          className="floating-btn"
          onClick={() => {
            setShowOpacitySlider(!showOpacitySlider);
            setShowLayerMenu(false);
          }}
          title="Element Opacity"
        >
          <Sliders size={13} />
          <span>{currentOpacity}%</span>
        </button>

        {showOpacitySlider && (
          <div className="floating-popover">
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
              Opacity
            </span>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={currentOpacity}
              onChange={(e) => onChangeOpacity(Number(e.target.value) / 100)}
              style={{ width: 100, cursor: 'pointer' }}
            />
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', minWidth: 32 }}>
              {currentOpacity}%
            </span>
          </div>
        )}
      </div>

      <div className="v-divider" style={{ height: 16 }} />

      {/* Delete */}
      <button
        type="button"
        className="floating-btn danger"
        onClick={onDelete}
        title="Delete Element (Delete / Backspace)"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
