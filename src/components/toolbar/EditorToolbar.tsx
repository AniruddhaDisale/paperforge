import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  MousePointer,
  Type,
  Droplet,
  Hash,
  Pen,
  Highlighter,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  MoveRight,
  Trash2,
  ChevronDown,
  PenLine,
  Stamp as StampIcon,
  Check,
  X as CrossIcon,
  CircleDot,
  FileEdit,
  Eraser,
} from 'lucide-react';
import type { ToolType, ShapeType, FormMarkType } from '../../types/editor';

interface EditorToolbarProps {
  activeTool: ToolType;
  selectedShapeType: ShapeType;
  selectedMarkType: FormMarkType;
  hasSelectedObject: boolean;
  onSelectTool: (tool: ToolType) => void;
  onSelectShapeType: (shape: ShapeType) => void;
  onSelectMarkType: (mark: FormMarkType) => void;
  onOpenSignatureDialog: () => void;
  onOpenStampDialog: () => void;
  onOpenWatermarkDialog: () => void;
  onOpenPageNumberDialog: () => void;
  onUploadClick: () => void;
  onImageUploadClick: () => void;
  onDeleteSelected: () => void;
  disabled?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  selectedShapeType,
  selectedMarkType,
  hasSelectedObject,
  onSelectTool,
  onSelectShapeType,
  onSelectMarkType,
  onOpenSignatureDialog,
  onOpenStampDialog,
  onOpenWatermarkDialog,
  onOpenPageNumberDialog,
  onUploadClick,
  onImageUploadClick,
  onDeleteSelected,
  disabled = false,
}) => {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [markMenuOpen, setMarkMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);
  const markMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShapeMenuOpen(false);
      }
      if (markMenuRef.current && !markMenuRef.current.contains(e.target as Node)) {
        setMarkMenuOpen(false);
      }
    };
    if (shapeMenuOpen || markMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shapeMenuOpen, markMenuOpen]);

  const renderShapeIcon = (type: ShapeType) => {
    switch (type) {
      case 'circle': return <Circle size={16} />;
      case 'line': return <Minus size={16} />;
      case 'arrow': return <MoveRight size={16} />;
      case 'rectangle':
      default:
        return <Square size={16} />;
    }
  };

  return (
    <div className="editor-toolbar" role="toolbar" aria-label="PDF Editor Toolbar">
      <button
        className="tool-item"
        onClick={onUploadClick}
        title="Open another PDF"
      >
        <Upload size={16} />
        <span>Open PDF</span>
      </button>

      <div className="v-divider" />

      <button
        className={`tool-item ${activeTool === 'select' ? 'active' : ''}`}
        onClick={() => onSelectTool('select')}
        disabled={disabled}
        title="Select & Move Objects (V)"
      >
        <MousePointer size={16} />
        <span>Select</span>
      </button>

      <button
        className={`tool-item tool-highlight-glow ${activeTool === 'editText' ? 'active' : ''}`}
        onClick={() => onSelectTool('editText')}
        disabled={disabled}
        title="Edit PDF Text - Click existing text on the document to edit"
      >
        <FileEdit size={16} />
        <span>Edit PDF Text</span>
      </button>

      <button
        className={`tool-item ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => onSelectTool('text')}
        disabled={disabled}
        title="Add New Text (T)"
      >
        <Type size={16} />
        <span>Add Text</span>
      </button>

      <button
        className={`tool-item ${activeTool === 'eraser' ? 'active' : ''}`}
        onClick={() => onSelectTool('eraser')}
        disabled={disabled}
        title="Whiteout & Redact (Eraser) - Drag over text or areas to erase or redact"
      >
        <Eraser size={16} />
        <span>Eraser</span>
      </button>

      <button
        className={`tool-item ${activeTool === 'draw' ? 'active' : ''}`}
        onClick={() => onSelectTool('draw')}
        disabled={disabled}
        title="Freehand Draw (D)"
      >
        <Pen size={16} />
        <span>Draw</span>
      </button>

      <button
        className={`tool-item ${activeTool === 'highlight' ? 'active' : ''}`}
        onClick={() => onSelectTool('highlight')}
        disabled={disabled}
        title="Highlight Box (H)"
      >
        <Highlighter size={16} />
        <span>Highlight</span>
      </button>

      <button
        className={`tool-item ${activeTool === 'image' ? 'active' : ''}`}
        onClick={() => {
          onSelectTool('image');
          onImageUploadClick();
        }}
        disabled={disabled}
        title="Insert Image (I)"
      >
        <ImageIcon size={16} />
        <span>Image</span>
      </button>

      {/* Shape Tool with Dropdown */}
      <div ref={shapeMenuRef} style={{ position: 'relative' }}>
        <button
          className={`tool-item ${activeTool === 'shape' ? 'active' : ''}`}
          onClick={() => {
            onSelectTool('shape');
            setShapeMenuOpen(!shapeMenuOpen);
          }}
          disabled={disabled}
          title="Shapes"
        >
          {renderShapeIcon(selectedShapeType)}
          <span>Shape</span>
          <ChevronDown size={13} style={{ marginLeft: -2 }} />
        </button>

        {shapeMenuOpen && (
          <div className="shape-menu-popover">
            <button
              className={`shape-menu-item ${selectedShapeType === 'rectangle' ? 'active' : ''}`}
              onClick={() => {
                onSelectShapeType('rectangle');
                onSelectTool('shape');
                setShapeMenuOpen(false);
              }}
            >
              <Square size={15} />
              <span>Rectangle</span>
            </button>
            <button
              className={`shape-menu-item ${selectedShapeType === 'circle' ? 'active' : ''}`}
              onClick={() => {
                onSelectShapeType('circle');
                onSelectTool('shape');
                setShapeMenuOpen(false);
              }}
            >
              <Circle size={15} />
              <span>Circle</span>
            </button>
            <button
              className={`shape-menu-item ${selectedShapeType === 'line' ? 'active' : ''}`}
              onClick={() => {
                onSelectShapeType('line');
                onSelectTool('shape');
                setShapeMenuOpen(false);
              }}
            >
              <Minus size={15} />
              <span>Line</span>
            </button>
            <button
              className={`shape-menu-item ${selectedShapeType === 'arrow' ? 'active' : ''}`}
              onClick={() => {
                onSelectShapeType('arrow');
                onSelectTool('shape');
                setShapeMenuOpen(false);
              }}
            >
              <MoveRight size={15} />
              <span>Arrow</span>
            </button>
          </div>
        )}
      </div>

      <div className="v-divider" />

      {/* Digital Signature */}
      <button
        className="tool-item"
        onClick={onOpenSignatureDialog}
        disabled={disabled}
        title="Add Digital Signature"
      >
        <PenLine size={16} />
        <span>Sign</span>
      </button>

      {/* Business Stamp */}
      <button
        className="tool-item"
        onClick={onOpenStampDialog}
        disabled={disabled}
        title="Add Business Stamp"
      >
        <StampIcon size={16} />
        <span>Stamp</span>
      </button>

      {/* Watermark */}
      <button
        className="tool-item"
        onClick={onOpenWatermarkDialog}
        disabled={disabled}
        title="Add Watermark (e.g. CONFIDENTIAL, DRAFT)"
      >
        <Droplet size={16} />
        <span>Watermark</span>
      </button>

      {/* Page Numbers */}
      <button
        className="tool-item"
        onClick={onOpenPageNumberDialog}
        disabled={disabled}
        title="Add Page Numbers to Document"
      >
        <Hash size={16} />
        <span>Page #</span>
      </button>

      {/* Quick Form Marks */}
      <div ref={markMenuRef} style={{ position: 'relative' }}>
        <button
          className={`tool-item ${activeTool === 'mark' ? 'active' : ''}`}
          onClick={() => {
            onSelectTool('mark');
            setMarkMenuOpen(!markMenuOpen);
          }}
          disabled={disabled}
          title="Form Filler Marks (Check, Cross, Dot)"
        >
          {selectedMarkType === 'cross' ? (
            <CrossIcon size={16} />
          ) : selectedMarkType === 'dot' ? (
            <CircleDot size={16} />
          ) : (
            <Check size={16} />
          )}
          <span>Mark</span>
          <ChevronDown size={13} style={{ marginLeft: -2 }} />
        </button>

        {markMenuOpen && (
          <div className="shape-menu-popover">
            <button
              className={`shape-menu-item ${selectedMarkType === 'check' ? 'active' : ''}`}
              onClick={() => {
                onSelectMarkType('check');
                onSelectTool('mark');
                setMarkMenuOpen(false);
              }}
            >
              <Check size={15} />
              <span>Checkmark (✓)</span>
            </button>
            <button
              className={`shape-menu-item ${selectedMarkType === 'cross' ? 'active' : ''}`}
              onClick={() => {
                onSelectMarkType('cross');
                onSelectTool('mark');
                setMarkMenuOpen(false);
              }}
            >
              <CrossIcon size={15} />
              <span>Crossmark (✗)</span>
            </button>
            <button
              className={`shape-menu-item ${selectedMarkType === 'dot' ? 'active' : ''}`}
              onClick={() => {
                onSelectMarkType('dot');
                onSelectTool('mark');
                setMarkMenuOpen(false);
              }}
            >
              <CircleDot size={15} />
              <span>Dot Bullet (•)</span>
            </button>
          </div>
        )}
      </div>

      <div className="v-divider" />

      <button
        className="tool-item danger"
        onClick={onDeleteSelected}
        disabled={!hasSelectedObject || disabled}
        title="Delete selected object (Delete / Backspace)"
      >
        <Trash2 size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
};
