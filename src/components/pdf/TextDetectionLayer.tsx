import React, { useState, useEffect } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { extractTextFromPage } from '../../services/pdfTextExtractor';
import type { ExtractedTextItem } from '../../types/editor';

interface TextDetectionLayerProps {
  pdfDocument: PDFDocumentProxy | null;
  originalPageIndex: number;
  zoom: number;
  isActive: boolean;
  onSelectTextItem: (item: ExtractedTextItem) => void;
}

export const TextDetectionLayer: React.FC<TextDetectionLayerProps> = ({
  pdfDocument,
  originalPageIndex,
  zoom,
  isActive,
  onSelectTextItem,
}) => {
  const [textItems, setTextItems] = useState<ExtractedTextItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive || !pdfDocument) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    extractTextFromPage(pdfDocument, originalPageIndex)
      .then((items) => {
        if (isMounted) {
          setTextItems(items);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to extract page text:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isActive, pdfDocument, originalPageIndex]);

  if (!isActive) return null;

  return (
    <div
      className="text-detection-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'auto',
        zIndex: 5,
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#6366f1',
              display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }}
          />
          Scanning PDF Text...
        </div>
      )}

      {!isLoading && textItems.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(30, 41, 59, 0.92)',
            color: '#f8fafc',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          💡 Scanned PDF or no selectable text found. Use the Text or Whiteout tool directly.
        </div>
      )}

      {textItems.map((item) => {
        const isHovered = hoveredId === item.id;
        const left = item.x * zoom;
        const top = item.y * zoom;
        const width = item.width * zoom;
        const height = item.height * zoom;

        return (
          <div
            key={item.id}
            className={`extracted-text-box ${isHovered ? 'hovered' : ''}`}
            style={{
              position: 'absolute',
              left,
              top,
              width,
              height,
              cursor: 'text',
              border: isHovered
                ? '1.5px solid var(--accent-primary, #6366f1)'
                : '1px dashed rgba(99, 102, 241, 0.45)',
              backgroundColor: isHovered
                ? 'rgba(99, 102, 241, 0.18)'
                : 'rgba(99, 102, 241, 0.05)',
              borderRadius: '2px',
              transition: 'all 0.15s ease-in-out',
              boxSizing: 'border-box',
            }}
            title={`Click to edit: "${item.text}"`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation();
              onSelectTextItem(item);
            }}
          >
            {isHovered && (
              <div
                style={{
                  position: 'absolute',
                  top: -24,
                  left: 0,
                  backgroundColor: 'var(--accent-primary, #6366f1)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  zIndex: 10,
                }}
              >
                ✎ Click to edit text
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
