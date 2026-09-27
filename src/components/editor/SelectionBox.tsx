import React from 'react';
import type { ResizeHandle, EditorObject } from '../../types/editor';
import { FloatingToolbar } from './FloatingToolbar';

interface SelectionBoxProps {
  object: EditorObject;
  zoom: number;
  onStartResize: (handle: ResizeHandle, e: React.PointerEvent) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onBringToFront?: () => void;
  onSendToBack?: () => void;
  onBringForward?: () => void;
  onSendBackward?: () => void;
  onChangeOpacity?: (opacity: number) => void;
  allowResize?: boolean;
}

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  object,
  zoom,
  onStartResize,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onChangeOpacity,
  allowResize = true,
}) => {
  const left = object.x * zoom;
  const top = object.y * zoom;
  const width = object.width * zoom;
  const height = object.height * zoom;

  return (
    <div
      className="selection-box"
      style={{
        left,
        top,
        width,
        height,
      }}
    >
      {/* Canva-style floating contextual toolbar */}
      {onDuplicate && onBringToFront && onSendToBack && onBringForward && onSendBackward && onChangeOpacity && (
        <FloatingToolbar
          object={object}
          zoom={zoom}
          onDuplicate={onDuplicate}
          onBringToFront={onBringToFront}
          onSendToBack={onSendToBack}
          onBringForward={onBringForward}
          onSendBackward={onSendBackward}
          onChangeOpacity={onChangeOpacity}
          onDelete={onDelete}
        />
      )}

      {allowResize &&
        HANDLES.map((handle) => (
          <div
            key={handle}
            className={`resize-handle handle-${handle}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              onStartResize(handle, e);
            }}
          />
        ))}
    </div>
  );
};

