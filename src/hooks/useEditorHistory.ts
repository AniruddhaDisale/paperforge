import { useState, useCallback, useRef } from 'react';
import type { HistorySnapshot, EditorObject } from '../types/editor';
import type { PageModel } from '../types/pdf';

interface UseEditorHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  pushState: (pages: PageModel[], currentPageId: string, objects: Record<string, EditorObject[]>) => void;
  undo: () => HistorySnapshot | null;
  redo: () => HistorySnapshot | null;
  resetHistory: (initialState: HistorySnapshot) => void;
}

const MAX_HISTORY = 40;

export function useEditorHistory(initialSnapshot?: HistorySnapshot): UseEditorHistoryReturn {
  const [history, setHistory] = useState<HistorySnapshot[]>(initialSnapshot ? [initialSnapshot] : []);
  const [currentIndex, setCurrentIndex] = useState(initialSnapshot ? 0 : -1);

  // Debounce ref for continuous operations (like drag-moving)
  const isDraggingRef = useRef(false);

  const resetHistory = useCallback((initialState: HistorySnapshot) => {
    setHistory([initialState]);
    setCurrentIndex(0);
    isDraggingRef.current = false;
  }, []);

  const pushState = useCallback(
    (pages: PageModel[], currentPageId: string, objects: Record<string, EditorObject[]>) => {
      // Deep clone objects mapping to prevent mutations
      const clonedObjects: Record<string, EditorObject[]> = {};
      for (const [key, val] of Object.entries(objects)) {
        clonedObjects[key] = val.map((o) => ({ ...o }));
      }

      const newSnapshot: HistorySnapshot = {
        pages: pages.map((p) => ({ ...p })),
        currentPageId,
        objects: clonedObjects,
      };

      setHistory((prev) => {
        const truncated = prev.slice(0, currentIndex + 1);
        const next = [...truncated, newSnapshot];
        if (next.length > MAX_HISTORY) {
          next.shift();
        }
        return next;
      });

      setCurrentIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
    },
    [currentIndex]
  );

  const undo = useCallback((): HistorySnapshot | null => {
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      setCurrentIndex(nextIndex);
      return history[nextIndex];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback((): HistorySnapshot | null => {
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      return history[nextIndex];
    }
    return null;
  }, [currentIndex, history]);

  return {
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    pushState,
    undo,
    redo,
    resetHistory,
  };
}
