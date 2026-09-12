import { useState, useEffect, useCallback } from 'react';

interface UseFileDropOptions {
  onFileDrop: (file: File) => void;
  acceptTypes?: string[];
}

export function useFileDrop({ onFileDrop, acceptTypes = ['application/pdf'] }: UseFileDropOptions) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only reset if left the window
    if (e.relatedTarget === null || e.clientX <= 0 || e.clientY <= 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf') ||
        acceptTypes.includes(file.type);

      if (isPdf) {
        onFileDrop(file);
      }
    },
    [onFileDrop, acceptTypes]
  );

  useEffect(() => {
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return { isDraggingOver };
}
