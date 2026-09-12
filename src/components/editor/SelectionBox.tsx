import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ResizeHandle, BaseEditorObject } from '../../types/editor';

interface SelectionBoxProps {
  object: BaseEditorObject;
  zoom: number;
  onStartResize: (handle: ResizeHandle, e: React.PointerEvent) => void;
  onDelete: () => void;
  allowResize?: boolean;
}

const HANDLES: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const SelectionBox: React.FC<SelectionBoxProps> = ({
  object,
  zoom,
  onStartResize,
  onDelete,
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
      <div className="selection-actions-bar" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="selection-action-btn delete"
          onClick={onDelete}
          title="Delete (Backspace)"
          aria-label="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

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
