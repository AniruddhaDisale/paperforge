import React from 'react';
import type { StampObject } from '../../types/editor';

interface StampAnnotationProps {
  object: StampObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const StampAnnotation: React.FC<StampAnnotationProps> = ({
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
        cursor: isSelected ? 'move' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        opacity: object.opacity ?? 1,
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="stamp-badge-preview"
        style={{
          width: '100%',
          height: '100%',
          color: object.color,
          borderColor: object.color,
          borderWidth: Math.max(2, 2 * zoom),
          backgroundColor: `${object.color}15`,
          borderRadius: Math.max(3, 4 * zoom),
          padding: `${4 * zoom}px ${8 * zoom}px`,
          fontSize: Math.max(10, 13 * zoom),
          transform: 'rotate(-3deg)',
        }}
      >
        <span style={{ fontWeight: 800 }}>{object.label}</span>
        {object.timestamp && (
          <span
            className="stamp-badge-timestamp"
            style={{ fontSize: Math.max(8, 9 * zoom) }}
          >
            {object.timestamp}
          </span>
        )}
      </div>
    </div>
  );
};
