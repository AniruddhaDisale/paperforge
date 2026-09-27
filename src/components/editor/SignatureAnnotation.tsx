import React from 'react';
import type { SignatureObject } from '../../types/editor';

interface SignatureAnnotationProps {
  object: SignatureObject;
  zoom: number;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  onStartMove: (e: React.PointerEvent) => void;
}

export const SignatureAnnotation: React.FC<SignatureAnnotationProps> = ({
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
      }}
      onPointerDown={handlePointerDown}
    >
      <img
        src={object.src}
        alt="Digital Signature"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: object.opacity ?? 1,
        }}
        draggable={false}
      />
    </div>
  );
};
