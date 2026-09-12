import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  MousePointer,
  Type,
  Pen,
  Highlighter,
  Image as ImageIcon,
  Square,
  Circle,
  Minus,
  MoveRight,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import type { ToolType, ShapeType } from '../../types/editor';

interface EditorToolbarProps {
  activeTool: ToolType;
  selectedShapeType: ShapeType;
  hasSelectedObject: boolean;
  onSelectTool: (tool: ToolType) => void;
  onSelectShapeType: (shape: ShapeType) => void;
  onUploadClick: () => void;
  onImageUploadClick: () => void;
  onDeleteSelected: () => void;
  disabled?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  selectedShapeType,
  hasSelectedObject,
  onSelectTool,
  onSelectShapeType,
  onUploadClick,
  onImageUploadClick,
  onDeleteSelected,
  disabled = false,
}) => {
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(e.target as Node)) {
        setShapeMenuOpen(false);
      }
    };
    if (shapeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [shapeMenuOpen]);

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
        className={`tool-item ${activeTool === 'text' ? 'active' : ''}`}
        onClick={() => onSelectTool('text')}
        disabled={disabled}
        title="Add Text (T)"
      >
        <Type size={16} />
        <span>Text</span>
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
