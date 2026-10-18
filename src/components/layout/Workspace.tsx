import React, { useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { Upload } from 'lucide-react';
import type { PageModel } from '../../types/pdf';
import type { ToolType, ShapeType, ToolProperties, EditorObject } from '../../types/editor';
import type { DocxDocumentState, DocxStats } from '../../types/docx';
import { EditorToolbar } from '../toolbar/EditorToolbar';
import { PropertyBar } from '../toolbar/PropertyBar';
import { PDFViewer } from '../pdf/PDFViewer';
import { BottomBar } from './BottomBar';
import { LandingView } from '../landing/LandingView';
import { DocxEditor } from '../docx/DocxEditor';

interface WorkspaceProps {
  documentType?: 'pdf' | 'docx' | 'none';
  docxState?: DocxDocumentState;
  onUpdateDocxContent?: (html: string, stats: DocxStats) => void;
  onExportDocx?: () => void;
  onExportDocxPdf?: () => void;
  onLoadSampleDocx?: () => void;
  isExportingDocx?: boolean;
  onCloseDocx?: () => void;

  currentPage: PageModel | null;
  currentPageNumber: number;
  totalPages: number;
  pdfDocument: PDFDocumentProxy | null;
  zoom: number;
  activeTool: ToolType;
  selectedShapeType: ShapeType;
  properties: ToolProperties;
  objects: EditorObject[];
  selectedObjectId: string | null;
  isLoading: boolean;
  loadingMessage: string;
  isDraggingOver: boolean;
  onSelectTool: (tool: ToolType) => void;
  onSelectShapeType: (shape: ShapeType) => void;
  onChangeProperties: (props: Partial<ToolProperties>) => void;
  onSelectObject: (id: string | null) => void;
  onAddObject: (obj: EditorObject) => void;
  onUpdateObject: (id: string, updates: Partial<EditorObject>) => void;
  onDeleteSelected: () => void;
  onDuplicateObject?: (id: string) => void;
  onReorderObject?: (id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  onCommitOperation: () => void;
  onUploadClick: () => void;
  onLoadSample?: () => void;
  onImageUploadClick: () => void;
  onOpenSignatureDialog: () => void;
  onOpenStampDialog: () => void;
  onOpenWatermarkDialog: () => void;
  onOpenPageNumberDialog: () => void;
  onOpenOrganizePages?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitWidth?: () => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  documentType = 'none',
  docxState,
  onUpdateDocxContent,
  onExportDocx,
  onExportDocxPdf,
  onLoadSampleDocx,
  isExportingDocx = false,
  onCloseDocx,

  currentPage,
  currentPageNumber,
  totalPages,
  pdfDocument,
  zoom,
  activeTool,
  selectedShapeType,
  properties,
  objects,
  selectedObjectId,
  isLoading,
  loadingMessage,
  isDraggingOver,
  onSelectTool,
  onSelectShapeType,
  onChangeProperties,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onDeleteSelected,
  onDuplicateObject,
  onReorderObject,
  onCommitOperation,
  onUploadClick,
  onLoadSample,
  onImageUploadClick,
  onOpenSignatureDialog,
  onOpenStampDialog,
  onOpenWatermarkDialog,
  onOpenPageNumberDialog,
  onOpenOrganizePages,
  theme,
  onToggleTheme,
  onPreviousPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitWidth,
}) => {
  const documentAreaRef = useRef<HTMLDivElement>(null);
  const selectedObject = objects.find((o) => o.id === selectedObjectId) || null;

  // Render Word document editor mode
  if (documentType === 'docx' && docxState && onUpdateDocxContent && onExportDocx && onExportDocxPdf) {
    return (
      <section className="workspace docx-mode" aria-label="Word document workspace">
        <DocxEditor
          documentState={docxState}
          onUpdateContent={onUpdateDocxContent}
          onExportDocx={onExportDocx}
          onExportPdf={onExportDocxPdf}
          onCloseDocument={onCloseDocx || (() => {})}
          isExporting={isExportingDocx}
        />
      </section>
    );
  }

  const hasPdfDocument = Boolean(currentPage);

  return (
    <section className="workspace" aria-label="PDF workspace">
      {/* Top Toolbar and Contextual Property Bar */}
      <div className="toolbar-container">
        <EditorToolbar
          activeTool={activeTool}
          selectedShapeType={selectedShapeType}
          selectedMarkType={properties.markType || 'check'}
          hasSelectedObject={Boolean(selectedObjectId)}
          onSelectTool={onSelectTool}
          onSelectShapeType={onSelectShapeType}
          onSelectMarkType={(m) => onChangeProperties({ markType: m })}
          onOpenSignatureDialog={onOpenSignatureDialog}
          onOpenStampDialog={onOpenStampDialog}
          onOpenWatermarkDialog={onOpenWatermarkDialog}
          onOpenPageNumberDialog={onOpenPageNumberDialog}
          onUploadClick={onUploadClick}
          onImageUploadClick={onImageUploadClick}
          onDeleteSelected={onDeleteSelected}
          disabled={!hasPdfDocument}
        />

        {hasPdfDocument && (
          <PropertyBar
            activeTool={activeTool}
            selectedObject={selectedObject}
            properties={properties}
            onChangeProperties={onChangeProperties}
            onUpdateSelectedObject={(updates) => {
              if (selectedObjectId) {
                onUpdateObject(selectedObjectId, updates);
              }
            }}
          />
        )}
      </div>

      {/* Main Document Canvas Viewport */}
      <div ref={documentAreaRef} className={`document-area ${!hasPdfDocument ? 'landing-mode' : ''}`}>
        {isLoading ? (
          <div className="empty-state-container">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ marginTop: 18, fontWeight: 500, color: 'var(--text-primary)' }}>
              {loadingMessage || 'Processing document...'}
            </p>
          </div>
        ) : (!hasPdfDocument || !currentPage) ? (
          <LandingView
            onUploadClick={onUploadClick}
            onLoadSample={onLoadSample}
            onLoadSampleDocx={onLoadSampleDocx}
            onSelectToolPreset={onSelectTool}
          />
        ) : (
          <PDFViewer
            page={currentPage}
            pdfDocument={pdfDocument}
            zoom={zoom}
            activeTool={activeTool}
            properties={properties}
            objects={objects}
            selectedObjectId={selectedObjectId}
            onSelectObject={onSelectObject}
            onAddObject={onAddObject}
            onUpdateObject={onUpdateObject}
            onDeleteObject={() => {
              if (selectedObjectId) onDeleteSelected();
            }}
            onDuplicateObject={onDuplicateObject}
            onReorderObject={onReorderObject}
            onCommitOperation={onCommitOperation}
          />
        )}
      </div>

      {/* Drag Over Visual Overlay */}
      {isDraggingOver && (
        <div className="drag-over-overlay">
          <Upload size={40} color="var(--primary)" />
          <span className="drag-over-title">Drop PDF or Word document to open</span>
        </div>
      )}

      {/* Bottom Controls Bar */}
      <BottomBar
        currentPageNumber={currentPageNumber}
        totalPages={totalPages}
        zoom={zoom}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onResetZoom={onResetZoom}
        onFitWidth={onFitWidth}
        onOpenOrganizePages={onOpenOrganizePages}
        theme={theme}
        onToggleTheme={onToggleTheme}
        disabled={!hasPdfDocument}
      />
    </section>
  );
};
