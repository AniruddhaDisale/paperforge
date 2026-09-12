import React, { useState } from 'react';
import { FilePlus, X } from 'lucide-react';
import type { PageSize } from '../../types/pdf';

interface AddPageDialogProps {
  isOpen: boolean;
  onAdd: (size: PageSize, orientation: 'portrait' | 'landscape') => void;
  onCancel: () => void;
}

export const AddPageDialog: React.FC<AddPageDialogProps> = ({
  isOpen,
  onAdd,
  onCancel,
}) => {
  const [size, setSize] = useState<PageSize>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(size, orientation);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FilePlus size={18} />
            <h3 className="modal-title">Add Blank Page</h3>
          </div>
          <button className="icon-btn" onClick={onCancel} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="page-size-select">
                Page Size
              </label>
              <select
                id="page-size-select"
                className="form-input"
                value={size}
                onChange={(e) => setSize(e.target.value as PageSize)}
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">US Letter (8.5 × 11 in)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="page-orientation-select">
                Orientation
              </label>
              <select
                id="page-orientation-select"
                className="form-input"
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Insert Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
