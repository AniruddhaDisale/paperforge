import React from 'react';
import {
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import type { ToolType, ToolProperties, EditorObject } from '../../types/editor';
import { ColorPicker } from '../common/ColorPicker';

interface PropertyBarProps {
  activeTool: ToolType;
  selectedObject: EditorObject | null;
  properties: ToolProperties;
  onChangeProperties: (props: Partial<ToolProperties>) => void;
  onUpdateSelectedObject?: (updates: Partial<EditorObject>) => void;
}

export const PropertyBar: React.FC<PropertyBarProps> = ({
  activeTool,
  selectedObject,
  properties,
  onChangeProperties,
  onUpdateSelectedObject,
}) => {
  // Determine if we should show text, draw, highlight, or shape controls
  const effectiveType = selectedObject?.type || (activeTool !== 'select' ? activeTool : null);

  if (!effectiveType || effectiveType === 'image') {
    return null;
  }

  const handleTextColorChange = (color: string) => {
    onChangeProperties({ textColor: color });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ color });
    }
  };

  const handleFontSizeChange = (size: number) => {
    onChangeProperties({ fontSize: size });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ fontSize: size });
    }
  };

  const handleFontFamilyChange = (fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier') => {
    onChangeProperties({ fontFamily });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ fontFamily });
    }
  };

  const handleBoldToggle = () => {
    const next = !properties.isBold;
    onChangeProperties({ isBold: next });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ isBold: next });
    }
  };

  const handleItalicToggle = () => {
    const next = !properties.isItalic;
    onChangeProperties({ isItalic: next });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ isItalic: next });
    }
  };

  const handleAlignChange = (align: 'left' | 'center' | 'right') => {
    onChangeProperties({ textAlign: align });
    if (selectedObject && selectedObject.type === 'text' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ align });
    }
  };

  const handleDrawColorChange = (color: string) => {
    onChangeProperties({ drawColor: color });
    if (selectedObject && selectedObject.type === 'draw' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ strokeColor: color });
    }
  };

  const handleDrawWidthChange = (width: number) => {
    onChangeProperties({ drawWidth: width });
    if (selectedObject && selectedObject.type === 'draw' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ strokeWidth: width });
    }
  };

  const handleHighlightColorChange = (color: string) => {
    onChangeProperties({ highlightColor: color });
    if (selectedObject && selectedObject.type === 'highlight' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ color });
    }
  };

  const handleShapeStrokeColorChange = (color: string) => {
    onChangeProperties({ shapeStrokeColor: color });
    if (selectedObject && selectedObject.type === 'shape' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ strokeColor: color });
    }
  };

  const handleShapeFillColorChange = (color: string) => {
    onChangeProperties({ shapeFillColor: color });
    if (selectedObject && selectedObject.type === 'shape' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ fillColor: color });
    }
  };

  const handleShapeStrokeWidthChange = (width: number) => {
    onChangeProperties({ shapeStrokeWidth: width });
    if (selectedObject && selectedObject.type === 'shape' && onUpdateSelectedObject) {
      onUpdateSelectedObject({ strokeWidth: width });
    }
  };

  return (
    <div className="property-bar">
      {/* TEXT PROPERTIES */}
      {effectiveType === 'text' && (
        <>
          <div className="prop-group">
            <span className="prop-label">Font:</span>
            <select
              className="prop-select"
              value={selectedObject?.type === 'text' ? selectedObject.fontFamily : properties.fontFamily}
              onChange={(e) => handleFontFamilyChange(e.target.value as 'Helvetica' | 'TimesRoman' | 'Courier')}
            >
              <option value="Helvetica">Helvetica (Sans)</option>
              <option value="TimesRoman">Times Roman (Serif)</option>
              <option value="Courier">Courier (Mono)</option>
            </select>
          </div>

          <div className="prop-group">
            <span className="prop-label">Size:</span>
            <select
              className="prop-select"
              value={selectedObject?.type === 'text' ? selectedObject.fontSize : properties.fontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
            >
              {[10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map((s) => (
                <option key={s} value={s}>
                  {s}px
                </option>
              ))}
            </select>
          </div>

          <div className="prop-group">
            <button
              type="button"
              className={`prop-toggle-btn ${
                (selectedObject?.type === 'text' ? selectedObject.isBold : properties.isBold)
                  ? 'active'
                  : ''
              }`}
              onClick={handleBoldToggle}
              title="Bold"
            >
              <Bold size={13} />
            </button>
            <button
              type="button"
              className={`prop-toggle-btn ${
                (selectedObject?.type === 'text' ? selectedObject.isItalic : properties.isItalic)
                  ? 'active'
                  : ''
              }`}
              onClick={handleItalicToggle}
              title="Italic"
            >
              <Italic size={13} />
            </button>
          </div>

          <div className="prop-group">
            <button
              type="button"
              className={`prop-toggle-btn ${
                (selectedObject?.type === 'text' ? selectedObject.align : properties.textAlign) ===
                'left'
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAlignChange('left')}
              title="Align Left"
            >
              <AlignLeft size={13} />
            </button>
            <button
              type="button"
              className={`prop-toggle-btn ${
                (selectedObject?.type === 'text' ? selectedObject.align : properties.textAlign) ===
                'center'
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAlignChange('center')}
              title="Align Center"
            >
              <AlignCenter size={13} />
            </button>
            <button
              type="button"
              className={`prop-toggle-btn ${
                (selectedObject?.type === 'text' ? selectedObject.align : properties.textAlign) ===
                'right'
                  ? 'active'
                  : ''
              }`}
              onClick={() => handleAlignChange('right')}
              title="Align Right"
            >
              <AlignRight size={13} />
            </button>
          </div>

          <div className="prop-group">
            <span className="prop-label">Color:</span>
            <ColorPicker
              value={selectedObject?.type === 'text' ? selectedObject.color : properties.textColor}
              onChange={handleTextColorChange}
              title="Text Color"
            />
          </div>
        </>
      )}

      {/* DRAW PROPERTIES */}
      {effectiveType === 'draw' && (
        <>
          <div className="prop-group">
            <span className="prop-label">Color:</span>
            <ColorPicker
              value={selectedObject?.type === 'draw' ? selectedObject.strokeColor : properties.drawColor}
              onChange={handleDrawColorChange}
              title="Stroke Color"
            />
          </div>

          <div className="prop-group">
            <span className="prop-label">Thickness:</span>
            <select
              className="prop-select"
              value={selectedObject?.type === 'draw' ? selectedObject.strokeWidth : properties.drawWidth}
              onChange={(e) => handleDrawWidthChange(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 6, 8, 12].map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {/* HIGHLIGHT PROPERTIES */}
      {effectiveType === 'highlight' && (
        <>
          <div className="prop-group">
            <span className="prop-label">Color:</span>
            <ColorPicker
              value={selectedObject?.type === 'highlight' ? selectedObject.color : properties.highlightColor}
              onChange={handleHighlightColorChange}
              title="Highlight Color"
            />
          </div>
        </>
      )}

      {/* SHAPE PROPERTIES */}
      {effectiveType === 'shape' && (
        <>
          <div className="prop-group">
            <span className="prop-label">Stroke:</span>
            <ColorPicker
              value={selectedObject?.type === 'shape' ? selectedObject.strokeColor : properties.shapeStrokeColor}
              onChange={handleShapeStrokeColorChange}
              title="Border Color"
            />
          </div>

          <div className="prop-group">
            <span className="prop-label">Fill:</span>
            <ColorPicker
              value={selectedObject?.type === 'shape' ? selectedObject.fillColor : properties.shapeFillColor}
              onChange={handleShapeFillColorChange}
              title="Fill Color"
              allowTransparent
            />
          </div>

          <div className="prop-group">
            <span className="prop-label">Thickness:</span>
            <select
              className="prop-select"
              value={selectedObject?.type === 'shape' ? selectedObject.strokeWidth : properties.shapeStrokeWidth}
              onChange={(e) => handleShapeStrokeWidthChange(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 6, 8].map((w) => (
                <option key={w} value={w}>
                  {w}px
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
};
