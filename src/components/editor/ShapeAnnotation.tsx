import React from 'react';
import type { ShapeObject } from '../../types/editor';

interface ShapeAnnotationProps {
  object: ShapeObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const ShapeAnnotation: React.FC<ShapeAnnotationProps> = ({
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

  const strokeWidth = (object.strokeWidth || 2) * zoom;
  const strokeColor = object.strokeColor;
  const fillColor = object.fillColor === 'transparent' ? 'none' : object.fillColor;
  const opacity = object.opacity ?? 1;

  const handlePointerDown = (e: React.PointerEvent) => {
    onSelect(e);
    onStartMove(e);
  };

  return (
    <g
      onPointerDown={handlePointerDown}
      style={{ cursor: isSelected ? 'move' : 'pointer' }}
    >
      {object.shapeType === 'rectangle' && (
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )}

      {object.shapeType === 'circle' && (
        <ellipse
          cx={left + width / 2}
          cy={top + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={opacity}
        />
      )}

      {object.shapeType === 'line' && (
        <>
          {/* Hit area */}
          <line
            x1={left}
            y1={top}
            x2={left + width}
            y2={top + height}
            stroke="transparent"
            strokeWidth={Math.max(14, strokeWidth + 8)}
          />
          <line
            x1={left}
            y1={top}
            x2={left + width}
            y2={top + height}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeLinecap="round"
          />
        </>
      )}

      {object.shapeType === 'arrow' && (
        <>
          <defs>
            <marker
              id={`arrowhead-${object.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={strokeColor} />
            </marker>
          </defs>
          <line
            x1={left}
            y1={top}
            x2={left + width}
            y2={top + height}
            stroke="transparent"
            strokeWidth={Math.max(14, strokeWidth + 8)}
          />
          <line
            x1={left}
            y1={top}
            x2={left + width}
            y2={top + height}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={opacity}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${object.id})`}
          />
        </>
      )}
    </g>
  );
};
