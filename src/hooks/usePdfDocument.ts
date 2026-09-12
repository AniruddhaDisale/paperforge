import { useState, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentState, PageModel, PageSize } from '../types/pdf';
import { PAGE_SIZES } from '../types/pdf';
import { loadPdfDocument, PasswordRequiredError } from '../services/pdfLoader';

interface UsePdfDocumentReturn {
  pdfDocument: PDFDocumentProxy | null;
  documentState: DocumentState;
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
  isPasswordRequired: boolean;
  loadPdf: (file: File, password?: string) => Promise<boolean>;
  retryWithPassword: (password: string) => Promise<boolean>;
  setCurrentPageId: (pageId: string) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotatePage: (pageId: string, delta: 90 | -90) => void;
  deletePage: (pageId: string) => boolean;
  reorderPages: (sourceIndex: number, destIndex: number) => void;
  addBlankPage: (size: PageSize, orientation: 'portrait' | 'landscape') => void;
  duplicatePage: (pageId: string) => void;
  setDocumentPages: (pages: PageModel[], currentPageId?: string) => void;
  markModified: () => void;
  resetDocument: () => void;
}

const INITIAL_STATE: DocumentState = {
  originalFile: null,
  originalFileName: '',
  originalBytes: null,
  pages: [],
  currentPageId: '',
  zoom: 1.0,
  isModified: false,
};

export function usePdfDocument(): UsePdfDocumentReturn {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [documentState, setDocumentState] = useState<DocumentState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);

  // Cache pending file for password retry
  const pendingFileRef = useRef<{ file: File; bytes: ArrayBuffer } | null>(null);

  const resetDocument = useCallback(() => {
    if (pdfDocument) {
      try {
        pdfDocument.cleanup();
      } catch {
        // Ignore destruction errors
      }
    }
    setPdfDocument(null);
    setDocumentState(INITIAL_STATE);
    setError(null);
    setIsPasswordRequired(false);
    pendingFileRef.current = null;
  }, [pdfDocument]);

  const loadPdf = useCallback(
    async (file: File, password?: string): Promise<boolean> => {
      setIsLoading(true);
      setLoadingMessage('Opening PDF document...');
      setError(null);
      setIsPasswordRequired(false);

      try {
        const bytes = await file.arrayBuffer();
        pendingFileRef.current = { file, bytes };

        const { pdfDocument: loadedDoc, pages } = await loadPdfDocument(bytes, password);

        setPdfDocument(loadedDoc);
        setDocumentState({
          originalFile: file,
          originalFileName: file.name,
          originalBytes: bytes,
          pages,
          currentPageId: pages[0]?.id || '',
          zoom: 1.0,
          isModified: false,
        });

        setIsLoading(false);
        return true;
      } catch (err: unknown) {
        setIsLoading(false);
        const errObj = typeof err === 'object' && err !== null ? (err as { name?: string; message?: string }) : null;
        if (err instanceof PasswordRequiredError || errObj?.name === 'PasswordException') {
          setIsPasswordRequired(true);
          return false;
        }

        const msg =
          errObj?.message || 'Could not open PDF file. The file may be damaged or in an unsupported format.';
        setError(msg);
        return false;
      }
    },
    []
  );

  const retryWithPassword = useCallback(
    async (password: string): Promise<boolean> => {
      if (!pendingFileRef.current) {
        setError('No pending file to unlock.');
        return false;
      }

      setIsLoading(true);
      setLoadingMessage('Unlocking PDF document...');
      setError(null);

      try {
        const { file, bytes } = pendingFileRef.current;
        const { pdfDocument: loadedDoc, pages } = await loadPdfDocument(bytes, password);

        setPdfDocument(loadedDoc);
        setDocumentState({
          originalFile: file,
          originalFileName: file.name,
          originalBytes: bytes,
          pages,
          currentPageId: pages[0]?.id || '',
          zoom: 1.0,
          isModified: false,
        });

        setIsPasswordRequired(false);
        setIsLoading(false);
        return true;
      } catch (err: unknown) {
        setIsLoading(false);
        const errObj = typeof err === 'object' && err !== null ? (err as { name?: string }) : null;
        if (err instanceof PasswordRequiredError || errObj?.name === 'PasswordException') {
          setError('Incorrect password. Please try again.');
          return false;
        }
        setError('Failed to unlock PDF with supplied password.');
        return false;
      }
    },
    []
  );

  const setCurrentPageId = useCallback((pageId: string) => {
    setDocumentState((prev) => {
      const pageExists = prev.pages.some((p) => p.id === pageId);
      if (!pageExists) return prev;
      return { ...prev, currentPageId: pageId };
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setDocumentState((prev) => {
      const index = prev.pages.findIndex((p) => p.id === prev.currentPageId);
      if (index >= 0 && index < prev.pages.length - 1) {
        return { ...prev, currentPageId: prev.pages[index + 1].id };
      }
      return prev;
    });
  }, []);

  const goToPreviousPage = useCallback(() => {
    setDocumentState((prev) => {
      const index = prev.pages.findIndex((p) => p.id === prev.currentPageId);
      if (index > 0) {
        return { ...prev, currentPageId: prev.pages[index - 1].id };
      }
      return prev;
    });
  }, []);

  const setZoom = useCallback((zoomOrFn: number | ((prev: number) => number)) => {
    setDocumentState((prev) => {
      const newZoom = typeof zoomOrFn === 'function' ? zoomOrFn(prev.zoom) : zoomOrFn;
      const clamped = Math.max(0.5, Math.min(3.0, Math.round(newZoom * 100) / 100));
      return { ...prev, zoom: clamped };
    });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(3.0, z + 0.15));
  }, [setZoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.5, z - 0.15));
  }, [setZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
  }, [setZoom]);

  const rotatePage = useCallback((pageId: string, delta: 90 | -90) => {
    setDocumentState((prev) => {
      const newPages = prev.pages.map((page) => {
        if (page.id !== pageId) return page;
        const newRotation = (((page.rotation + delta) % 360) + 360) % 360;
        return {
          ...page,
          rotation: newRotation,
          // Swap width and height for visual representation
          width: page.height,
          height: page.width,
        };
      });
      return { ...prev, pages: newPages, isModified: true };
    });
  }, []);

  const deletePage = useCallback((pageId: string): boolean => {
    let deleted = false;
    setDocumentState((prev) => {
      if (prev.pages.length <= 1) {
        return prev; // Cannot delete last remaining page
      }

      const index = prev.pages.findIndex((p) => p.id === pageId);
      if (index === -1) return prev;

      const newPages = prev.pages.filter((p) => p.id !== pageId);
      deleted = true;

      let nextCurrentPageId = prev.currentPageId;
      if (prev.currentPageId === pageId) {
        const nextIndex = Math.min(index, newPages.length - 1);
        nextCurrentPageId = newPages[nextIndex].id;
      }

      return {
        ...prev,
        pages: newPages,
        currentPageId: nextCurrentPageId,
        isModified: true,
      };
    });
    return deleted;
  }, []);

  const reorderPages = useCallback((sourceIndex: number, destIndex: number) => {
    setDocumentState((prev) => {
      if (
        sourceIndex < 0 ||
        sourceIndex >= prev.pages.length ||
        destIndex < 0 ||
        destIndex >= prev.pages.length ||
        sourceIndex === destIndex
      ) {
        return prev;
      }

      const nextPages = [...prev.pages];
      const [movedPage] = nextPages.splice(sourceIndex, 1);
      nextPages.splice(destIndex, 0, movedPage);

      return {
        ...prev,
        pages: nextPages,
        isModified: true,
      };
    });
  }, []);

  const addBlankPage = useCallback((size: PageSize, orientation: 'portrait' | 'landscape') => {
    setDocumentState((prev) => {
      const dimensions = PAGE_SIZES[size];
      let width = dimensions.width;
      let height = dimensions.height;
      if (orientation === 'landscape') {
        width = dimensions.height;
        height = dimensions.width;
      }

      const newPage: PageModel = {
        id: `blank-page-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        originalPageIndex: null,
        rotation: 0,
        width,
        height,
      };

      const curIndex = prev.pages.findIndex((p) => p.id === prev.currentPageId);
      const insertAt = curIndex >= 0 ? curIndex + 1 : prev.pages.length;

      const newPages = [...prev.pages];
      newPages.splice(insertAt, 0, newPage);

      return {
        ...prev,
        pages: newPages,
        currentPageId: newPage.id,
        isModified: true,
      };
    });
  }, []);

  const duplicatePage = useCallback((pageId: string) => {
    setDocumentState((prev) => {
      const pageIndex = prev.pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return prev;

      const sourcePage = prev.pages[pageIndex];
      const duplicatedPage: PageModel = {
        ...sourcePage,
        id: `dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };

      const newPages = [...prev.pages];
      newPages.splice(pageIndex + 1, 0, duplicatedPage);

      return {
        ...prev,
        pages: newPages,
        currentPageId: duplicatedPage.id,
        isModified: true,
      };
    });
  }, []);

  const setDocumentPages = useCallback((pages: PageModel[], currentPageId?: string) => {
    setDocumentState((prev) => ({
      ...prev,
      pages,
      currentPageId: currentPageId || prev.currentPageId,
      isModified: true,
    }));
  }, []);

  const markModified = useCallback(() => {
    setDocumentState((prev) => ({ ...prev, isModified: true }));
  }, []);

  return {
    pdfDocument,
    documentState,
    isLoading,
    loadingMessage,
    error,
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
    duplicatePage,
    setDocumentPages,
    markModified,
    resetDocument,
  };
}
