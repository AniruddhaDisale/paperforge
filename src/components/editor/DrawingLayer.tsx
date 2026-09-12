import React from 'react';
import type { DrawObject } from '../../types/editor';
import { pointsToSvgPath } from '../../utils/geometry';

interface DrawingLayerProps {
  object: DrawObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const DrawingLayer: React.FC<DrawingLayerProps> = ({
  object,
  zoom,
  isSelected,
  onSelect,
  onStartMove,
}) => {
  // Scale points by zoom
  const scaledPoints = object.points.map((p) => ({
    x: p.x * zoom,
    y: p.y * zoom,
  }));
  const pathData = pointsToSvgPath(scaledPoints);

  const handlePointerDown = (e: React.PointerEvent) => {
    onSelect(e);
    onStartMove(e);
  };

  return (
    <g
      onPointerDown={handlePointerDown}
      style={{ cursor: isSelected ? 'move' : 'pointer' }}
    >
      {/* Invisible thick path for easier hit testing */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(14, (object.strokeWidth || 2) * zoom + 8)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Actual visible stroke */}
      <path
        d={pathData}
        fill="none"
        stroke={object.strokeColor}
        strokeWidth={(object.strokeWidth || 2) * zoom}
        strokeOpacity={object.opacity ?? 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};
