import React, { useState, useRef, useCallback } from 'react';
import type { ToolType, ShapeType, ToolProperties, EditorObject, ImageObject } from './types/editor';
import type { PageSize } from './types/pdf';
import { usePdfDocument } from './hooks/usePdfDocument';
import { useEditorHistory } from './hooks/useEditorHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFileDrop } from './hooks/useFileDrop';
import { TopBar } from './components/layout/TopBar';
import { PageSidebar } from './components/sidebar/PageSidebar';
import { Workspace } from './components/layout/Workspace';
import { ConfirmDialog } from './components/dialogs/ConfirmDialog';
import { PasswordDialog } from './components/dialogs/PasswordDialog';
import { AddPageDialog } from './components/dialogs/AddPageDialog';
import { ShortcutsDialog } from './components/dialogs/ShortcutsDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { Toast, type ToastItem } from './components/common/Toast';
import { normalizeImageToPng, triggerFileDownload, getExportFileName } from './utils/fileUtils';
import { exportPdfDocument } from './services/pdfExporter';

const INITIAL_PROPERTIES: ToolProperties = {
  textColor: '#09090b',
  fontSize: 16,
  fontFamily: 'Helvetica',
  isBold: false,
  isItalic: false,
  textAlign: 'left',
  drawColor: '#09090b',
  drawWidth: 2,
  drawOpacity: 1,
  highlightColor: '#ca8a04',
  highlightOpacity: 0.4,
  shapeType: 'rectangle',
  shapeStrokeColor: '#09090b',
  shapeFillColor: 'transparent',
  shapeStrokeWidth: 2,
  shapeOpacity: 1,
};

export function App() {
  // Document state hook
  const {
    pdfDocument,
    documentState,
    isLoading,
    loadingMessage,
    error: docError,
    isPasswordRequired,
    loadPdf,
    retryWithPassword,
    setCurrentPageId,
    goToNextPage,
    goToPreviousPage,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    rotatePage,
    deletePage,
    reorderPages,
    addBlankPage,
    setDocumentPages,
    markModified,
    resetDocument,
  } = usePdfDocument();

  // Annotations mapping: pageId -> EditorObject[]
  const [objectsByPage, setObjectsByPage] = useState<Record<string, EditorObject[]>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // Active tool and properties
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [selectedShapeType, setSelectedShapeType] = useState<ShapeType>('rectangle');
  const [properties, setProperties] = useState<ToolProperties>(INITIAL_PROPERTIES);

  // UI Dialog states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAddPageOpen, setIsAddPageOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Export progress modal
  const [exportState, setExportState] = useState<{
    isOpen: boolean;
    status: 'exporting' | 'success' | 'error';
    errorMessage?: string;
  }>({
    isOpen: false,
    status: 'exporting',
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const addToast = useCallback((type: 'info' | 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // History system
  const { canUndo, canRedo, pushState, undo, redo, resetHistory } = useEditorHistory();

  // Hidden File pickers
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pendingNewPdfFileRef = useRef<File | null>(null);

  // Current page object
  const currentPage =
    documentState.pages.find((p) => p.id === documentState.currentPageId) ||
    documentState.pages[0] ||
    null;
  const currentPageNumber =
    documentState.pages.findIndex((p) => p.id === documentState.currentPageId) + 1;
  const currentPageObjects = currentPage ? objectsByPage[currentPage.id] || [] : [];

  // Snapshot helper
  const commitSnapshot = useCallback(
    (newPages = documentState.pages, newObjects = objectsByPage, pageId = documentState.currentPageId) => {
      pushState(newPages, pageId, newObjects);
      markModified();
    },
    [documentState.pages, documentState.currentPageId, objectsByPage, pushState, markModified]
  );

  // File drop
  const handlePdfSelected = useCallback(
    async (file: File) => {
      if (documentState.isModified) {
        pendingNewPdfFileRef.current = file;
        setConfirmState({
          isOpen: true,
          title: 'Discard unsaved edits?',
          message:
            'Opening a new document will discard all unsaved edits made to the current PDF. Do you want to proceed?',
          isDestructive: true,
          onConfirm: async () => {
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            resetDocument();
            setObjectsByPage({});
            setSelectedObjectId(null);
            const success = await loadPdf(file);
            if (success) {
              resetHistory({
                pages: documentState.pages,
                currentPageId: documentState.pages[0]?.id || '',
                objects: {},
              });
              addToast('success', `Opened "${file.name}"`);
            }
          },
        });
        return;
      }

      resetDocument();
      setObjectsByPage({});
      setSelectedObjectId(null);
      const success = await loadPdf(file);
      if (success) {
        resetHistory({
          pages: documentState.pages,
          currentPageId: documentState.pages[0]?.id || '',
          objects: {},
        });
        addToast('success', `Opened "${file.name}"`);
      }
    },
    [documentState.isModified, documentState.pages, loadPdf, resetDocument, resetHistory, addToast]
  );

  const { isDraggingOver } = useFileDrop({
    onFileDrop: handlePdfSelected,
  });

  const handleUploadClick = () => {
    pdfInputRef.current?.click();
  };

  const handleLoadSample = useCallback(async () => {
    try {
      const res = await fetch('/sample-test.pdf');
      if (!res.ok) throw new Error('Sample file not found');
      const blob = await res.blob();
      const file = new File([blob], 'sample-document.pdf', { type: 'application/pdf' });
      await handlePdfSelected(file);
    } catch {
      addToast('error', 'Could not load sample PDF.');
    }
  }, [handlePdfSelected, addToast]);

  const handlePdfInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePdfSelected(file);
    }
    e.target.value = '';
  };

  // Image insertion
  const handleImageUploadClick = () => {
    imageInputRef.current?.click();
  };

  const handleImageInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPage) return;

    try {
      const { dataUrl, width: imgW, height: imgH } = await normalizeImageToPng(file);

      // Fit image reasonably on the page (max ~280pt)
      const maxDim = 280;
      let w = imgW;
      let h = imgH;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      // Center on page
      const x = Math.max(20, Math.round((currentPage.width - w) / 2));
      const y = Math.max(20, Math.round((currentPage.height - h) / 2));

      const newImage: ImageObject = {
        id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageId: currentPage.id,
        type: 'image',
        src: dataUrl,
        originalWidth: imgW,
        originalHeight: imgH,
        x,
        y,
        width: w,
        height: h,
        opacity: 1,
      };

      const nextObjects = {
        ...objectsByPage,
        [currentPage.id]: [...(objectsByPage[currentPage.id] || []), newImage],
      };

      setObjectsByPage(nextObjects);
      setSelectedObjectId(newImage.id);
      setActiveTool('select');
      commitSnapshot(documentState.pages, nextObjects);
      addToast('success', 'Image inserted onto document');
    } catch {
      addToast('error', 'Failed to load and convert image');
    }

    e.target.value = '';
  };

  // Object manipulations
  const handleAddObject = useCallback(
    (obj: EditorObject) => {
      setObjectsByPage((prev) => {
        const pageList = prev[obj.pageId] || [];
        const next = { ...prev, [obj.pageId]: [...pageList, obj] };
        commitSnapshot(documentState.pages, next);
        return next;
      });
    },
    [documentState.pages, commitSnapshot]
  );

  const handleUpdateObject = useCallback((id: string, updates: Partial<EditorObject>) => {
    setObjectsByPage((prev) => {
      const next: Record<string, EditorObject[]> = {};
      for (const [pageId, list] of Object.entries(prev)) {
        next[pageId] = list.map((item) => (item.id === id ? ({ ...item, ...updates } as EditorObject) : item));
      }
      return next;
    });
  }, []);

  const handleDeleteObject = useCallback(
    (id: string) => {
      setObjectsByPage((prev) => {
        const next: Record<string, EditorObject[]> = {};
        for (const [pageId, list] of Object.entries(prev)) {
          next[pageId] = list.filter((item) => item.id !== id);
        }
        commitSnapshot(documentState.pages, next);
        return next;
      });
      setSelectedObjectId(null);
    },
    [documentState.pages, commitSnapshot]
  );

  const handleDeleteSelected = useCallback(() => {
    if (selectedObjectId) {
      handleDeleteObject(selectedObjectId);
    }
  }, [selectedObjectId, handleDeleteObject]);

  // Page manipulations with snapshots
  const handleRotatePage = (pageId: string, delta: 90 | -90) => {
    rotatePage(pageId, delta);
    const updatedPages = documentState.pages.map((page) => {
      if (page.id !== pageId) return page;
      const newRotation = (((page.rotation + delta) % 360) + 360) % 360;
      return { ...page, rotation: newRotation, width: page.height, height: page.width };
    });
    commitSnapshot(updatedPages, objectsByPage);
  };

  const handleDeletePagePrompt = (pageId: string) => {
    if (documentState.pages.length <= 1) {
      addToast('error', 'Cannot delete the only remaining page in the document.');
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Delete Page?',
      message: 'Are you sure you want to delete this page and all annotations on it?',
      isDestructive: true,
      onConfirm: () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        deletePage(pageId);
        const updatedPages = documentState.pages.filter((p) => p.id !== pageId);
        const nextObjects = { ...objectsByPage };
        delete nextObjects[pageId];
        setObjectsByPage(nextObjects);
        commitSnapshot(updatedPages, nextObjects);
        addToast('info', 'Page deleted');
      },
    });
  };

  const handleReorderPages = (sourceIndex: number, destIndex: number) => {
    reorderPages(sourceIndex, destIndex);
    const nextPages = [...documentState.pages];
    const [moved] = nextPages.splice(sourceIndex, 1);
    nextPages.splice(destIndex, 0, moved);
    commitSnapshot(nextPages, objectsByPage);
  };

  const handleAddBlankPage = (size: PageSize, orientation: 'portrait' | 'landscape') => {
    setIsAddPageOpen(false);
    addBlankPage(size, orientation);
    addToast('success', 'Blank page added');
  };

  // Undo / Redo
  const handleUndo = () => {
    const prevSnapshot = undo();
    if (prevSnapshot) {
      setDocumentPages(prevSnapshot.pages, prevSnapshot.currentPageId);
      setObjectsByPage(prevSnapshot.objects);
      setSelectedObjectId(null);
    }
  };

  const handleRedo = () => {
    const nextSnapshot = redo();
    if (nextSnapshot) {
      setDocumentPages(nextSnapshot.pages, nextSnapshot.currentPageId);
      setObjectsByPage(nextSnapshot.objects);
      setSelectedObjectId(null);
    }
  };

  // Export PDF
  const handleExport = async () => {
    if (!pdfDocument && documentState.pages.length === 0) return;

    setExportState({ isOpen: true, status: 'exporting' });

    try {
      const exportedBytes = await exportPdfDocument(documentState, objectsByPage);
      const downloadName = getExportFileName(documentState.originalFileName || 'document');
      triggerFileDownload(exportedBytes, downloadName);

      setExportState({ isOpen: true, status: 'success' });
      addToast('success', `Exported "${downloadName}"`);
    } catch (err: unknown) {
      const msg =
        typeof err === 'object' && err !== null && 'message' in err
          ? (err as { message: string }).message
          : 'Failed to generate PDF document.';
      setExportState({
        isOpen: true,
        status: 'error',
        errorMessage: msg,
      });
    }
  };

  // Keyboard Shortcuts Hook
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDeleteSelected: handleDeleteSelected,
    onNextPage: goToNextPage,
    onPreviousPage: goToPreviousPage,
    onEscape: () => {
      setSelectedObjectId(null);
      setActiveTool('select');
    },
    onExport: handleExport,
    onToggleShortcutsHelp: () => setIsShortcutsOpen((prev) => !prev),
    canUndo,
    canRedo,
    hasSelectedObject: Boolean(selectedObjectId),
    hasDocument: Boolean(currentPage),
  });

  const handleFitWidth = () => {
    if (currentPage) {
      const sidebarOffset = isSidebarCollapsed || !currentPage ? 40 : 260;
      const availableWidth = window.innerWidth - sidebarOffset - 80;
      const targetZoom = Math.max(0.5, Math.min(2.5, availableWidth / currentPage.width));
      setZoom(targetZoom);
    }
  };

  return (
    <div className="app-shell">
      {/* Hidden File Inputs */}
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={handlePdfInputChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageInputChange}
      />

      {/* Top Bar */}
      <TopBar
        documentTitle={documentState.originalFileName || (currentPage ? 'Untitled Document' : null)}
        isModified={documentState.isModified}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onExport={handleExport}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        hasDocument={Boolean(currentPage)}
        isExporting={exportState.isOpen && exportState.status === 'exporting'}
      />

      {/* Main Layout Area */}
      <div className="main-container">
        {/* Left Page Sidebar */}
        <PageSidebar
          pages={documentState.pages}
          currentPageId={documentState.currentPageId}
          pdfDocument={pdfDocument}
          onSelectPage={setCurrentPageId}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePagePrompt}
          onReorderPages={handleReorderPages}
          onOpenAddPageDialog={() => setIsAddPageOpen(true)}
          isCollapsed={isSidebarCollapsed || !currentPage}
        />

        {/* Central Workspace */}
        <Workspace
          currentPage={currentPage}
          currentPageNumber={currentPageNumber}
          totalPages={documentState.pages.length}
          pdfDocument={pdfDocument}
          zoom={documentState.zoom}
          activeTool={activeTool}
          selectedShapeType={selectedShapeType}
          properties={properties}
          objects={currentPageObjects}
          selectedObjectId={selectedObjectId}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          isDraggingOver={isDraggingOver}
          onSelectTool={setActiveTool}
          onSelectShapeType={setSelectedShapeType}
          onChangeProperties={(p) => setProperties((prev) => ({ ...prev, ...p }))}
          onSelectObject={setSelectedObjectId}
          onAddObject={handleAddObject}
          onUpdateObject={handleUpdateObject}
          onDeleteSelected={handleDeleteSelected}
          onCommitOperation={() => commitSnapshot()}
          onUploadClick={handleUploadClick}
          onLoadSample={handleLoadSample}
          onImageUploadClick={handleImageUploadClick}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onFitWidth={handleFitWidth}
        />
      </div>

      {/* Dialogs & Modals */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      <PasswordDialog
        isOpen={isPasswordRequired}
        errorMessage={docError}
        isLoading={isLoading}
        onUnlock={retryWithPassword}
        onCancel={resetDocument}
      />

      <AddPageDialog
        isOpen={isAddPageOpen}
        onAdd={handleAddBlankPage}
        onCancel={() => setIsAddPageOpen(false)}
      />

      <ShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <ExportDialog
        isOpen={exportState.isOpen}
        status={exportState.status}
        errorMessage={exportState.errorMessage}
        onClose={() => setExportState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Non-intrusive Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;