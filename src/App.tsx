import React, { useState, useRef, useCallback, useEffect } from 'react';
import type {
  ToolType,
  ShapeType,
  ToolProperties,
  EditorObject,
  ImageObject,
  SignatureObject,
  StampObject,
  TextObject,
  WatermarkConfig,
  PageNumberConfig,
} from './types/editor';
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
import { SignatureDialog } from './components/dialogs/SignatureDialog';
import { StampDialog } from './components/dialogs/StampDialog';
import { OrganizePagesDialog } from './components/dialogs/OrganizePagesDialog';
import { DocumentInfoDialog } from './components/dialogs/DocumentInfoDialog';
import { WatermarkDialog } from './components/dialogs/WatermarkDialog';
import { PageNumberDialog } from './components/dialogs/PageNumberDialog';
import { FormFillDialog } from './components/dialogs/FormFillDialog';
import { RecoveryDialog } from './components/dialogs/RecoveryDialog';
import { PdfToolboxModal } from './components/toolbox/PdfToolboxModal';
import { SearchPanel } from './components/search/SearchPanel';
import { AiAssistantPanel } from './components/ai/AiAssistantPanel';
import { PdfCompareModal } from './components/compare/PdfCompareModal';
import { saveRecoverySession, type RecoverySession } from './services/sessionRecoveryService';
import { Toast, type ToastItem } from './components/common/Toast';
import {
  normalizeImageToPng,
  triggerFileDownload,
  getExportFileName,
  exportCurrentPageAsImage,
} from './utils/fileUtils';
import { exportPdfDocument } from './services/pdfExporter';

function safeToUint8Array(buffer: ArrayBuffer | null | undefined): Uint8Array | null {
  if (!buffer) return null;
  try {
    if (buffer.byteLength === 0) return null;
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}

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
  markType: 'check',
  markColor: '#2563eb',
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
  const [isSignatureOpen, setIsSignatureOpen] = useState(false);
  const [isStampOpen, setIsStampOpen] = useState(false);
  const [isOrganizePagesOpen, setIsOrganizePagesOpen] = useState(false);
  const [isDocumentInfoOpen, setIsDocumentInfoOpen] = useState(false);
  const [isWatermarkOpen, setIsWatermarkOpen] = useState(false);
  const [isPageNumberOpen, setIsPageNumberOpen] = useState(false);
  const [isToolboxOpen, setIsToolboxOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isFormFillOpen, setIsFormFillOpen] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);

  // Auto-save session snapshot to IndexedDB
  useEffect(() => {
    if (!documentState.isModified || documentState.pages.length === 0) return;
    const timer = setTimeout(() => {
      saveRecoverySession({
        id: documentState.originalFileName || `session-${Date.now()}`,
        title: documentState.originalFileName || 'Untitled Document',
        timestamp: Date.now(),
        pages: documentState.pages,
        objectsByPage,
        pdfBytes: safeToUint8Array(documentState.originalBytes) ?? undefined,
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [documentState.isModified, documentState.pages, documentState.originalFileName, objectsByPage, documentState.originalBytes]);

  // Dark Mode Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (localStorage.getItem('paperforge_theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('paperforge_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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
    onConfirm: () => { },
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
            const loadedPages = await loadPdf(file);
            if (loadedPages && loadedPages.length > 0) {
              resetHistory({
                pages: loadedPages,
                currentPageId: loadedPages[0]?.id || '',
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
      const loadedPages = await loadPdf(file);
      if (loadedPages && loadedPages.length > 0) {
        resetHistory({
          pages: loadedPages,
          currentPageId: loadedPages[0]?.id || '',
          objects: {},
        });
        addToast('success', `Opened "${file.name}"`);
      }
    },
    [documentState.isModified, loadPdf, resetDocument, resetHistory, addToast]
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

  // Insert Signature handler
  const handleInsertSignature = useCallback((dataUrl: string) => {
    if (!currentPage) return;
    const sigW = 180;
    const sigH = 64;
    const x = Math.max(20, Math.round((currentPage.width - sigW) / 2));
    const y = Math.max(20, Math.round((currentPage.height - sigH) / 2));

    const newSig: SignatureObject = {
      id: `sig-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageId: currentPage.id,
      type: 'signature',
      src: dataUrl,
      x,
      y,
      width: sigW,
      height: sigH,
      opacity: 1,
    };
    handleAddObject(newSig);
    setSelectedObjectId(newSig.id);
    setActiveTool('select');
    addToast('success', 'Digital signature placed on document');
  }, [currentPage, handleAddObject, addToast]);

  // Insert Stamp handler
  const handleInsertStamp = useCallback((stamp: { label: string; color: string; timestamp?: string }) => {
    if (!currentPage) return;
    const stW = 150;
    const stH = 50;
    const x = Math.max(20, Math.round((currentPage.width - stW) / 2));
    const y = Math.max(20, Math.round((currentPage.height - stH) / 2));

    const newStamp: StampObject = {
      id: `stamp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      pageId: currentPage.id,
      type: 'stamp',
      label: stamp.label,
      color: stamp.color,
      timestamp: stamp.timestamp,
      x,
      y,
      width: stW,
      height: stH,
      opacity: 1,
    };
    handleAddObject(newStamp);
    setSelectedObjectId(newStamp.id);
    setActiveTool('select');
    addToast('success', `Stamp "${stamp.label}" placed on document`);
  }, [currentPage, handleAddObject, addToast]);

  // Apply Watermark (across pages or current page only)
  const handleApplyWatermark = useCallback((config: WatermarkConfig) => {
    setIsWatermarkOpen(false);
    const pages = config.allPages ? documentState.pages : currentPage ? [currentPage] : [];
    if (pages.length === 0) return;

    const nextObjects = { ...objectsByPage };
    for (const page of pages) {
      const wmW = Math.min(page.width * 0.9, config.fontSize * config.text.length * 0.65);
      const wmH = config.fontSize * 1.4;
      const x = Math.round((page.width - wmW) / 2);
      const y = Math.round((page.height - wmH) / 2);
      const wmObj: TextObject = {
        id: `watermark-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageId: page.id,
        type: 'text',
        text: config.text,
        fontSize: config.fontSize,
        fontFamily: 'Helvetica',
        color: config.color,
        isBold: true,
        isItalic: false,
        align: 'center',
        x,
        y,
        width: wmW,
        height: wmH,
        opacity: config.opacity,
      };
      nextObjects[page.id] = [...(nextObjects[page.id] || []), wmObj];
    }
    setObjectsByPage(nextObjects);
    commitSnapshot(documentState.pages, nextObjects);
    addToast('success', `Watermark "${config.text}" applied to ${pages.length} page(s)`);
  }, [documentState.pages, currentPage, objectsByPage, commitSnapshot, addToast]);

  // Apply Page Numbers (text annotations on all pages)
  const handleApplyPageNumbers = useCallback((config: PageNumberConfig) => {
    setIsPageNumberOpen(false);
    if (documentState.pages.length === 0) return;

    const nextObjects = { ...objectsByPage };
    const totalPages = documentState.pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = documentState.pages[i];
      const pageNum = config.startNumber + i;
      let displayText: string;
      switch (config.format) {
        case 'n': displayText = `${pageNum}`; break;
        case 'n-of-total': displayText = `${pageNum} of ${config.startNumber + totalPages - 1}`; break;
        case 'page-n': default: displayText = `Page ${pageNum}`; break;
      }
      const textW = displayText.length * config.fontSize * 0.6;
      const textH = config.fontSize * 1.5;
      const margin = 30;
      let x: number;
      let y: number;
      switch (config.position) {
        case 'top-right':
          x = page.width - textW - margin;
          y = margin;
          break;
        case 'bottom-right':
          x = page.width - textW - margin;
          y = page.height - textH - margin;
          break;
        case 'bottom-center':
        default:
          x = Math.round((page.width - textW) / 2);
          y = page.height - textH - margin;
          break;
      }
      const pnObj: TextObject = {
        id: `pagenumber-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
        pageId: page.id,
        type: 'text',
        text: displayText,
        fontSize: config.fontSize,
        fontFamily: 'Helvetica',
        color: config.color,
        isBold: false,
        isItalic: false,
        align: 'center',
        x,
        y,
        width: textW,
        height: textH,
        opacity: 1,
      };
      nextObjects[page.id] = [...(nextObjects[page.id] || []), pnObj];
    }
    setObjectsByPage(nextObjects);
    commitSnapshot(documentState.pages, nextObjects);
    addToast('success', `Page numbers added to ${totalPages} page(s)`);
  }, [documentState.pages, objectsByPage, commitSnapshot, addToast]);

  // Duplicate Object handler
  const handleDuplicateObject = useCallback((id: string) => {
    if (!currentPage) return;
    const currentObjs = objectsByPage[currentPage.id] || [];
    const target = currentObjs.find((o) => o.id === id);
    if (!target) return;

    const cloned: EditorObject = {
      ...target,
      id: `${target.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      x: target.x + 20,
      y: target.y + 20,
    };
    const updated = [...currentObjs, cloned];
    const nextObjects = { ...objectsByPage, [currentPage.id]: updated };
    setObjectsByPage(nextObjects);
    setSelectedObjectId(cloned.id);
    commitSnapshot(documentState.pages, nextObjects);
    addToast('info', 'Element duplicated');
  }, [currentPage, objectsByPage, documentState.pages, commitSnapshot, addToast]);

  // Reorder layer position handler
  const handleReorderObject = useCallback((id: string, action: 'front' | 'back' | 'forward' | 'backward') => {
    if (!currentPage) return;
    const currentObjs = objectsByPage[currentPage.id] || [];
    const index = currentObjs.findIndex((o) => o.id === id);
    if (index === -1) return;

    const newObjs = [...currentObjs];
    const [item] = newObjs.splice(index, 1);

    if (action === 'front') {
      newObjs.push(item);
    } else if (action === 'back') {
      newObjs.unshift(item);
    } else if (action === 'forward') {
      const newIndex = Math.min(newObjs.length, index + 1);
      newObjs.splice(newIndex, 0, item);
    } else if (action === 'backward') {
      const newIndex = Math.max(0, index - 1);
      newObjs.splice(newIndex, 0, item);
    }

    const nextObjects = { ...objectsByPage, [currentPage.id]: newObjs };
    setObjectsByPage(nextObjects);
    commitSnapshot(documentState.pages, nextObjects);
  }, [currentPage, objectsByPage, documentState.pages, commitSnapshot]);

  // Rotate all pages handler
  const handleRotateAllPages = useCallback((delta: 90 | -90) => {
    const updatedPages = documentState.pages.map((page) => {
      const newRotation = (((page.rotation + delta) % 360) + 360) % 360;
      return { ...page, rotation: newRotation as 0 | 90 | 180 | 270, width: page.height, height: page.width };
    });
    setDocumentPages(updatedPages);
    markModified();
    commitSnapshot(updatedPages, objectsByPage);
    addToast('info', `Rotated all pages ${delta > 0 ? '90°' : '-90°'}`);
  }, [documentState.pages, objectsByPage, setDocumentPages, markModified, commitSnapshot, addToast]);

  // Duplicate page handler
  const handleDuplicatePage = useCallback((pageId: string) => {
    const index = documentState.pages.findIndex((p) => p.id === pageId);
    if (index === -1) return;
    const target = documentState.pages[index];
    const newPageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newPage = {
      ...target,
      id: newPageId,
    };
    const updated = [...documentState.pages];
    updated.splice(index + 1, 0, newPage);
    setDocumentPages(updated);
    setCurrentPageId(newPageId);

    // Clone annotations if existing
    const nextObjects = { ...objectsByPage };
    if (objectsByPage[pageId]) {
      nextObjects[newPageId] = objectsByPage[pageId].map((o) => ({
        ...o,
        id: `${o.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pageId: newPageId,
      }));
      setObjectsByPage(nextObjects);
    }

    markModified();
    commitSnapshot(updated, nextObjects);
    addToast('success', `Page ${index + 1} duplicated`);
  }, [documentState.pages, objectsByPage, setDocumentPages, setCurrentPageId, markModified, commitSnapshot, addToast]);

  // Export current page as PNG image
  const handleExportPageAsImage = useCallback(async () => {
    if (!currentPage) return;
    const success = await exportCurrentPageAsImage(
      currentPageNumber,
      documentState.originalFileName || 'document'
    );
    if (success) {
      addToast('success', `Page ${currentPageNumber} exported as PNG`);
    } else {
      addToast('error', 'Failed to export page as image');
    }
  }, [currentPage, currentPageNumber, documentState.originalFileName, addToast]);

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
    onDuplicate: () => selectedObjectId && handleDuplicateObject(selectedObjectId),
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
        onExportPageImage={handleExportPageAsImage}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenDocInfo={() => setIsDocumentInfoOpen(true)}
        onOpenToolbox={() => setIsToolboxOpen(true)}
        onOpenSearch={() => setIsSearchOpen((prev) => !prev)}
        onOpenAi={() => setIsAiAssistantOpen((prev) => !prev)}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenForms={() => setIsFormFillOpen(true)}
        onOpenRecovery={() => setIsRecoveryOpen(true)}
        onToggleTheme={toggleTheme}
        theme={theme}
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
          onSelectPage={(pageId) => {
            setCurrentPageId(pageId);
            if (window.innerWidth <= 1024) {
              setIsSidebarCollapsed(true);
            }
          }}
          onRotatePage={handleRotatePage}
          onDeletePage={handleDeletePagePrompt}
          onReorderPages={handleReorderPages}
          onOpenAddPageDialog={() => setIsAddPageOpen(true)}
          isCollapsed={isSidebarCollapsed || !currentPage}
        />

        {/* Mobile/Tablet Sidebar Backdrop */}
        {!isSidebarCollapsed && currentPage && (
          <div
            className="sidebar-backdrop"
            onClick={() => setIsSidebarCollapsed(true)}
            aria-label="Close page sidebar backdrop"
          />
        )}

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
          onDuplicateObject={handleDuplicateObject}
          onReorderObject={handleReorderObject}
          onCommitOperation={() => commitSnapshot()}
          onUploadClick={handleUploadClick}
          onLoadSample={handleLoadSample}
          onImageUploadClick={handleImageUploadClick}
          onOpenSignatureDialog={() => setIsSignatureOpen(true)}
          onOpenStampDialog={() => setIsStampOpen(true)}
          onOpenWatermarkDialog={() => setIsWatermarkOpen(true)}
          onOpenPageNumberDialog={() => setIsPageNumberOpen(true)}
          onOpenOrganizePages={() => setIsOrganizePagesOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
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

      <SignatureDialog
        isOpen={isSignatureOpen}
        onClose={() => setIsSignatureOpen(false)}
        onInsertSignature={handleInsertSignature}
      />

      <StampDialog
        isOpen={isStampOpen}
        onClose={() => setIsStampOpen(false)}
        onInsertStamp={handleInsertStamp}
      />

      <OrganizePagesDialog
        isOpen={isOrganizePagesOpen}
        pages={documentState.pages}
        currentPageId={documentState.currentPageId}
        pdfDocument={pdfDocument}
        onClose={() => setIsOrganizePagesOpen(false)}
        onSelectPage={setCurrentPageId}
        onRotatePage={handleRotatePage}
        onRotateAllPages={handleRotateAllPages}
        onDeletePage={handleDeletePagePrompt}
        onDuplicatePage={handleDuplicatePage}
        onReorderPages={handleReorderPages}
        onAddBlankPage={() => {
          addBlankPage('A4', 'portrait');
          addToast('success', 'Blank page added');
        }}
      />

      <DocumentInfoDialog
        isOpen={isDocumentInfoOpen}
        onClose={() => setIsDocumentInfoOpen(false)}
        fileName={documentState.originalFileName}
        fileBytes={safeToUint8Array(documentState.originalBytes)}
        pages={documentState.pages}
        currentPageIndex={Math.max(0, currentPageNumber - 1)}
      />

      <ExportDialog
        isOpen={exportState.isOpen}
        status={exportState.status}
        errorMessage={exportState.errorMessage}
        onClose={() => setExportState((prev) => ({ ...prev, isOpen: false }))}
      />

      <WatermarkDialog
        isOpen={isWatermarkOpen}
        onCancel={() => setIsWatermarkOpen(false)}
        onApply={handleApplyWatermark}
      />

      <PageNumberDialog
        isOpen={isPageNumberOpen}
        totalPages={documentState.pages.length || 1}
        onCancel={() => setIsPageNumberOpen(false)}
        onApply={handleApplyPageNumbers}
      />

      {/* PDF Toolbox Modal (Merge, Split, Compress, Convert, Metadata) */}
      <PdfToolboxModal
        isOpen={isToolboxOpen}
        onClose={() => setIsToolboxOpen(false)}
        currentPdfBytes={safeToUint8Array(documentState.originalBytes)}
        currentPdfDocument={pdfDocument}
        documentTitle={documentState.originalFileName || 'document.pdf'}
        onLoadNewPdf={(file) => handlePdfSelected(file)}
      />

      {/* Full-document Search & OCR Drawer */}
      <SearchPanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        pdfDocument={pdfDocument}
        currentPageNumber={currentPageNumber}
        onNavigateToPage={(pageNum) => {
          const page = documentState.pages[pageNum - 1];
          if (page) setCurrentPageId(page.id);
        }}
      />

      {/* AI Document Assistant Drawer */}
      <AiAssistantPanel
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        pdfDocument={pdfDocument}
        onNavigateToPage={(pageNum) => {
          const page = documentState.pages[pageNum - 1];
          if (page) setCurrentPageId(page.id);
        }}
      />

      {/* Compare Two PDFs Modal */}
      <PdfCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        currentPdfDocument={pdfDocument}
        currentDocumentTitle={documentState.originalFileName || 'Current PDF'}
      />

      {/* Interactive Form Filler Dialog */}
      <FormFillDialog
        isOpen={isFormFillOpen}
        onClose={() => setIsFormFillOpen(false)}
        pdfBytes={safeToUint8Array(documentState.originalBytes)}
        onFormSaved={async (updatedBytes) => {
          const file = new File([new Uint8Array(updatedBytes)], documentState.originalFileName || 'form_filled.pdf', {
            type: 'application/pdf',
          });
          await loadPdf(file);
          addToast('success', 'Form fields saved directly into PDF!');
        }}
      />

      {/* Local Session Recovery Dialog */}
      <RecoveryDialog
        isOpen={isRecoveryOpen}
        onClose={() => setIsRecoveryOpen(false)}
        onRestoreSession={(session: RecoverySession) => {
          setDocumentPages(session.pages);
          setObjectsByPage(session.objectsByPage);
          if (session.pages[0]) {
            setCurrentPageId(session.pages[0].id);
          }
          addToast('success', `Restored session "${session.title}"`);
        }}
      />

      {/* Non-intrusive Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;