import { useState, useCallback, useRef } from 'react';
import type { DocxDocumentState, DocxStats } from '../types/docx';
import {
  loadDocxDocument,
  createSampleDocx,
  exportHtmlToDocx,
} from '../services/docxService';
import { triggerFileDownload } from '../utils/fileUtils';

const INITIAL_STATS: DocxStats = {
  words: 0,
  characters: 0,
  paragraphs: 0,
  readingTimeMinutes: 1,
};

const INITIAL_STATE: DocxDocumentState = {
  file: null,
  fileName: '',
  rawBytes: null,
  htmlContent: '',
  isModified: false,
  warnings: [],
  stats: INITIAL_STATS,
  lastSavedAt: null,
};

export function useDocxDocument() {
  const [documentState, setDocumentState] = useState<DocxDocumentState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Keep latest HTML content in ref to avoid lag in quick triggers
  const contentRef = useRef<string>('');

  const resetDocx = useCallback(() => {
    setDocumentState(INITIAL_STATE);
    contentRef.current = '';
    setError(null);
  }, []);

  const loadDocx = useCallback(async (file: File): Promise<boolean> => {
    setIsLoading(true);
    setLoadingMessage(`Opening "${file.name}"...`);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const { html, warnings, stats } = await loadDocxDocument(buffer, file.name);

      contentRef.current = html;
      setDocumentState({
        file,
        fileName: file.name,
        rawBytes: buffer,
        htmlContent: html,
        isModified: false,
        warnings,
        stats,
        lastSavedAt: Date.now(),
      });

      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Could not open Word document.';
      setError(msg);
      return false;
    }
  }, []);

  const loadSampleDocx = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setLoadingMessage('Creating sample Word document...');
    setError(null);

    try {
      const buffer = await createSampleDocx();
      const { html, warnings, stats } = await loadDocxDocument(buffer, 'Sample-Document.docx');

      const sampleFile = new File([buffer], 'Sample-Document.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      contentRef.current = html;
      setDocumentState({
        file: sampleFile,
        fileName: 'Sample-Document.docx',
        rawBytes: buffer,
        htmlContent: html,
        isModified: false,
        warnings,
        stats,
        lastSavedAt: Date.now(),
      });

      setIsLoading(false);
      return true;
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : 'Failed to create sample document.';
      setError(msg);
      return false;
    }
  }, []);

  const updateContent = useCallback((html: string, stats: DocxStats) => {
    contentRef.current = html;
    setDocumentState((prev) => ({
      ...prev,
      htmlContent: html,
      stats,
      isModified: true,
    }));
  }, []);

  const exportDocx = useCallback(async (): Promise<boolean> => {
    if (!contentRef.current) return false;
    try {
      const blob = await exportHtmlToDocx(
        contentRef.current,
        documentState.fileName.replace(/\.docx$/i, '') || 'Document'
      );
      const outName = documentState.fileName.endsWith('.docx')
        ? documentState.fileName
        : `${documentState.fileName || 'Document'}.docx`;

      triggerFileDownload(blob, outName);

      setDocumentState((prev) => ({
        ...prev,
        isModified: false,
        lastSavedAt: Date.now(),
      }));

      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export Word document.';
      setError(msg);
      return false;
    }
  }, [documentState.fileName]);

  const exportPdf = useCallback(async (): Promise<boolean> => {
    if (!contentRef.current) return false;

    try {
      // Use standard browser print engine with dedicated print iframe
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        window.print();
        return true;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${documentState.fileName || 'Document'}</title>
            <style>
              @page {
                size: letter portrait;
                margin: 1in;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #111827;
                margin: 0;
                padding: 0;
              }
              h1 { font-size: 24pt; margin-bottom: 12pt; color: #1e1b4b; }
              h2 { font-size: 18pt; margin-top: 18pt; margin-bottom: 8pt; color: #312e81; }
              h3 { font-size: 14pt; margin-top: 14pt; margin-bottom: 6pt; }
              p { margin-bottom: 10pt; }
              table { width: 100%; border-collapse: collapse; margin: 16pt 0; }
              th, td { border: 1px solid #d1d5db; padding: 6pt 10pt; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              img { max-width: 100%; height: auto; }
              blockquote { border-left: 3px solid #6366f1; margin: 12pt 0; padding-left: 12pt; font-style: italic; color: #4b5563; }
              @media print {
                body { padding: 0; }
              }
            </style>
          </head>
          <body>
            ${contentRef.current}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to export document to PDF.';
      setError(msg);
      return false;
    }
  }, [documentState.fileName]);

  return {
    documentState,
    isLoading,
    loadingMessage,
    error,
    loadDocx,
    loadSampleDocx,
    updateContent,
    exportDocx,
    exportPdf,
    resetDocx,
    hasDocx: Boolean(documentState.file || documentState.htmlContent),
  };
}
