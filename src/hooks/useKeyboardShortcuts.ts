import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onUndo: () => void;
  onRedo: () => void;
  onDeleteSelected: () => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onEscape: () => void;
  onExport: () => void;
  onToggleShortcutsHelp: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelectedObject: boolean;
  hasDocument: boolean;
}

export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDeleteSelected,
  onNextPage,
  onPreviousPage,
  onEscape,
  onExport,
  onToggleShortcutsHelp,
  canUndo,
  canRedo,
  hasSelectedObject,
  hasDocument,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement instanceof HTMLElement && activeElement.isContentEditable);

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z or Cmd+Z (without shift)
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) onUndo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Shift+Z or Ctrl+Shift+Z
      if ((modifier && e.key.toLowerCase() === 'y') || (modifier && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        if (canRedo) onRedo();
        return;
      }

      // Save/Export: Ctrl+S or Cmd+S
      if (modifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (hasDocument) onExport();
        return;
      }

      // Help: ? (Shift+/)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        onToggleShortcutsHelp();
        return;
      }

      // Escape: deselect / switch tool
      if (e.key === 'Escape') {
        onEscape();
        return;
      }

      // Do not process text/navigation shortcuts if typing inside an input/textarea
      if (isTyping) {
        return;
      }

      // Delete/Backspace: Delete selected annotation
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelectedObject) {
          e.preventDefault();
          onDeleteSelected();
        }
        return;
      }

      // Arrow navigation
      if (hasDocument) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onPreviousPage();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          onNextPage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onUndo,
    onRedo,
    onDeleteSelected,
    onNextPage,
    onPreviousPage,
    onEscape,
    onExport,
    onToggleShortcutsHelp,
    canUndo,
    canRedo,
    hasSelectedObject,
    hasDocument,
  ]);
}
