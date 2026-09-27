import React from 'react';
import type { WhiteoutObject } from '../../types/editor';

interface WhiteoutAnnotationProps {
  object: WhiteoutObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const WhiteoutAnnotation: React.FC<WhiteoutAnnotationProps> = ({
  object,
  zoom,
  isSelected,
  onSelect,
  onStartMove,
}) => {
  const left = object.x * zoom;
  const top = object.y * zoom;
  const width = object.width * zoom;
  const height = object.height * zoom;

  const handlePointerDown = (e: React.PointerEvent) => {
    onSelect(e);
    onStartMove(e);
  };

  const isRedaction = object.color === '#000000' || object.color === '#111827';

  return (
    <div
      className={`whiteout-annotation ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: object.color || '#ffffff',
        opacity: object.opacity ?? 1,
        cursor: isSelected ? 'move' : 'pointer',
        boxShadow: isSelected
          ? '0 0 0 1.5px var(--accent-primary, #6366f1)'
          : isRedaction
          ? 'none'
          : '0 0 0 1px rgba(0, 0, 0, 0.05)',
        zIndex: 1,
      }}
      title={isRedaction ? 'Redacted Area' : 'Whiteout / Text Eraser Area'}
      onPointerDown={handlePointerDown}
    />
  );
};
