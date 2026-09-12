import React from 'react';
import type { HighlightObject } from '../../types/editor';

interface HighlightAnnotationProps {
  object: HighlightObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const HighlightAnnotation: React.FC<HighlightAnnotationProps> = ({
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

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: object.color,
        opacity: object.opacity ?? 0.4,
        mixBlendMode: 'multiply',
        cursor: isSelected ? 'move' : 'pointer',
      }}
      onPointerDown={handlePointerDown}
    />
  );
};
