import React from 'react';
import { Check, X } from 'lucide-react';
import type { FormMarkObject } from '../../types/editor';

interface FormMarkAnnotationProps {
  object: FormMarkObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const FormMarkAnnotation: React.FC<FormMarkAnnotationProps> = ({
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

  const renderMark = () => {
    const iconSize = Math.max(16, Math.min(width, height));
    const strokeWidth = (object.strokeWidth || 3);

    switch (object.markType) {
      case 'cross':
        return (
          <X
            size={iconSize}
            color={object.color}
            strokeWidth={strokeWidth}
            style={{ width: '100%', height: '100%' }}
          />
        );
      case 'dot':
        return (
          <div
            style={{
              width: iconSize * 0.7,
              height: iconSize * 0.7,
              borderRadius: '50%',
              backgroundColor: object.color,
            }}
          />
        );
      case 'check':
      default:
        return (
          <Check
            size={iconSize}
            color={object.color}
            strokeWidth={strokeWidth}
            style={{ width: '100%', height: '100%' }}
          />
        );
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        cursor: isSelected ? 'move' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        opacity: object.opacity ?? 1,
      }}
      onPointerDown={handlePointerDown}
    >
      {renderMark()}
    </div>
  );
};
