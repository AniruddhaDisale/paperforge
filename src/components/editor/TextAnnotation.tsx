import React, { useState, useRef, useEffect } from 'react';
import type { TextObject } from '../../types/editor';

interface TextAnnotationProps {
  object: TextObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onUpdateText: (newText: string) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const TextAnnotation: React.FC<TextAnnotationProps> = ({
  object,
  zoom,
  isSelected,
  onSelect,
  onUpdateText,
  onStartMove,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [prevObjectText, setPrevObjectText] = useState(object.text);
  const [text, setText] = useState(object.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (object.text !== prevObjectText) {
    setPrevObjectText(object.text);
    setText(object.text);
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    onSelect(e);
    onStartMove(e);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    onUpdateText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
      onUpdateText(text);
    }
  };

  const fontFamilyCss =
    object.fontFamily === 'TimesRoman'
      ? '"Times New Roman", Times, serif'
      : object.fontFamily === 'Courier'
      ? '"Courier New", Courier, monospace'
      : 'Helvetica, Arial, sans-serif';

  const left = object.x * zoom;
  const top = object.y * zoom;
  const width = object.width * zoom;
  const height = object.height * zoom;
  const scaledFontSize = object.fontSize * zoom;

  if (isEditing) {
    return (
      <textarea
        ref={textareaRef}
        className="inline-text-editor"
        style={{
          left,
          top,
          width: Math.max(100, width),
          minHeight: height,
          fontSize: `${scaledFontSize}px`,
          fontFamily: fontFamilyCss,
          fontWeight: object.isBold ? 'bold' : 'normal',
          fontStyle: object.isItalic ? 'italic' : 'normal',
          textAlign: object.align,
          color: object.color,
          lineHeight: 1.2,
        }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        fontSize: `${scaledFontSize}px`,
        fontFamily: fontFamilyCss,
        fontWeight: object.isBold ? 'bold' : 'normal',
        fontStyle: object.isItalic ? 'italic' : 'normal',
        textAlign: object.align,
        color: object.color,
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        userSelect: 'none',
        cursor: isSelected ? 'move' : 'pointer',
      }}
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      {object.text || 'Type text...'}
    </div>
  );
};
