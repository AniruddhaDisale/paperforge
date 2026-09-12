import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';

interface BottomBarProps {
  currentPageNumber: number;
  totalPages: number;
  zoom: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth?: () => void;
  disabled?: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  currentPageNumber,
  totalPages,
  zoom,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
  disabled = false,
}) => {
  return (
    <footer className="bottombar">
      <div className="page-controls">
        <button
          className="icon-btn"
          onClick={onPreviousPage}
          disabled={disabled || currentPageNumber <= 1}
          title="Previous Page (←)"
          aria-label="Previous Page"
        >
          <ChevronLeft size={18} />
        </button>

        <span className="page-indicator-text">
          Page {totalPages > 0 ? currentPageNumber : 1} of {totalPages > 0 ? totalPages : 1}
        </span>

        <button
          className="icon-btn"
          onClick={onNextPage}
          disabled={disabled || currentPageNumber >= totalPages}
          title="Next Page (→)"
          aria-label="Next Page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="zoom-controls">
        <button
          className="icon-btn"
          onClick={onZoomOut}
          disabled={disabled || zoom <= 0.5}
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          <ZoomOut size={16} />
        </button>

        <span className="zoom-indicator-text">
          {Math.round(zoom * 100)}%
        </span>

        <button
          className="icon-btn"
          onClick={onZoomIn}
          disabled={disabled || zoom >= 3.0}
          title="Zoom In"
          aria-label="Zoom In"
        >
          <ZoomIn size={16} />
        </button>

        <div className="v-divider" style={{ height: 16 }} />

        <button
          className="icon-btn"
          onClick={onResetZoom}
          disabled={disabled || zoom === 1.0}
          title="Reset Zoom (100%)"
          aria-label="Reset Zoom"
        >
          <RotateCcw size={15} />
        </button>

        {onFitWidth && (
          <button
            className="icon-btn"
            onClick={onFitWidth}
            disabled={disabled}
            title="Fit to Width"
            aria-label="Fit to Width"
          >
            <Maximize2 size={15} />
          </button>
        )}
      </div>
    </footer>
  );
};
