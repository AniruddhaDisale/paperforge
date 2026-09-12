import React from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PageModel } from '../../types/pdf';
import type { ToolType, ToolProperties, EditorObject } from '../../types/editor';
import { PDFCanvas } from './PDFCanvas';
import { SelectionOverlay } from './SelectionOverlay';

interface PDFViewerProps {
  page: PageModel;
  pdfDocument: PDFDocumentProxy | null;
  zoom: number;
  activeTool: ToolType;
  properties: ToolProperties;
  objects: EditorObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onAddObject: (obj: EditorObject) => void;
  onUpdateObject: (id: string, updates: Partial<EditorObject>) => void;
  onDeleteObject: (id: string) => void;
  onCommitOperation?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  page,
  pdfDocument,
  zoom,
  activeTool,
  properties,
  objects,
  selectedObjectId,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onDeleteObject,
  onCommitOperation,
}) => {
  const displayWidth = page.width * zoom;
  const displayHeight = page.height * zoom;

  return (
    <div
      className="document-page-wrapper"
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
    >
      <PDFCanvas
        pdfDocument={pdfDocument}
        originalPageIndex={page.originalPageIndex}
        rotation={page.rotation}
        zoom={zoom}
        width={page.width}
        height={page.height}
      />

      <SelectionOverlay
        pageId={page.id}
        width={page.width}
        height={page.height}
        zoom={zoom}
        activeTool={activeTool}
        properties={properties}
        objects={objects}
        selectedObjectId={selectedObjectId}
        onSelectObject={onSelectObject}
        onAddObject={onAddObject}
        onUpdateObject={onUpdateObject}
        onDeleteObject={onDeleteObject}
        onCommitOperation={onCommitOperation}
      />
    </div>
  );
};

export default PDFViewer;
