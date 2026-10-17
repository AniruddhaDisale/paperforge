import React, { useState } from 'react';
import {
  X,
  GitCompare,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  comparePdfDocuments,
  type DocumentCompareSummary,
} from '../../services/pdfCompareService';

interface PdfCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPdfDocument: PDFDocumentProxy | null;
  currentDocumentTitle: string | null;
}

export const PdfCompareModal: React.FC<PdfCompareModalProps> = ({
  isOpen,
  onClose,
  currentPdfDocument,
  currentDocumentTitle,
}) => {
  const [docBFile, setDocBFile] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [summary, setSummary] = useState<DocumentCompareSummary | null>(null);
  const [selectedPageIndex, setSelectedPageIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunComparison = async () => {
    if (!currentPdfDocument) {
      setErrorMsg('Please open a base PDF in PaperForge first.');
      return;
    }
    if (!docBFile) {
      setErrorMsg('Please select a second PDF to compare against.');
      return;
    }

    setIsComparing(true);
    setErrorMsg(null);

    try {
      const bufferB = await docBFile.arrayBuffer();
      const docB = await pdfjsLib.getDocument({ data: new Uint8Array(bufferB.slice(0)) }).promise;

      const report = await comparePdfDocuments(
        currentPdfDocument,
        docB,
        currentDocumentTitle || 'Current PDF',
        docBFile.name
      );

      setSummary(report);
      setSelectedPageIndex(0);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to compare documents.');
    } finally {
      setIsComparing(false);
    }
  };

  const currentPage = summary?.pages[selectedPageIndex];

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-box"
        style={{
          width: 800,
          maxWidth: '95vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <GitCompare size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 18 }}>Compare Two PDFs</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Comparison">
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
            }}
          >
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="dialog-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!summary ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Compare the currently open document against another revision or version to detect added, removed, or changed text.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                {/* Doc A */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    BASE DOCUMENT (A)
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>
                    {currentDocumentTitle || 'No document loaded'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {currentPdfDocument ? `${currentPdfDocument.numPages} page(s)` : 'Please open a document'}
                  </div>
                </div>

                {/* Doc B */}
                <div
                  style={{
                    padding: 16,
                    borderRadius: 8,
                    border: '2px dashed var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    textAlign: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('compare-file-b-input')?.click()}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    REVISION DOCUMENT (B)
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>
                    {docBFile ? docBFile.name : 'Select PDF to compare...'}
                  </div>
                  <input
                    id="compare-file-b-input"
                    type="file"
                    accept="application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setDocBFile(e.target.files[0]);
                    }}
                  />
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={handleRunComparison}
                disabled={!currentPdfDocument || !docBFile || isComparing}
                style={{ marginTop: 8 }}
              >
                {isComparing ? <Loader2 size={16} className="spin" /> : <GitCompare size={16} />}
                <span>Compare Documents</span>
              </button>
            </div>
          ) : (
            /* Comparison Results View */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Summary Metrics */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  textAlign: 'center',
                }}
              >
                <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'var(--bg-secondary)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Pages</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{summary.pages.length}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                  <div style={{ fontSize: 11 }}>Differing Pages</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{summary.differingPagesCount}</div>
                </div>
                <div style={{ padding: 10, borderRadius: 6, backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                  <div style={{ fontSize: 11 }}>Identical Pages</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{summary.identicalPagesCount}</div>
                </div>
              </div>

              {/* Page Navigator */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 12px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 6,
                }}
              >
                <button
                  className="icon-btn"
                  disabled={selectedPageIndex === 0}
                  onClick={() => setSelectedPageIndex((p) => p - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Page {selectedPageIndex + 1} of {summary.pages.length}{' '}
                  {currentPage?.hasDifferences ? (
                    <span style={{ color: '#ef4444', marginLeft: 6 }}>(Changes Detected)</span>
                  ) : (
                    <span style={{ color: '#16a34a', marginLeft: 6 }}>(Identical)</span>
                  )}
                </span>
                <button
                  className="icon-btn"
                  disabled={selectedPageIndex === summary.pages.length - 1}
                  onClick={() => setSelectedPageIndex((p) => p + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Line-by-line Diff Box */}
              <div
                style={{
                  maxHeight: 320,
                  overflowY: 'auto',
                  border: '1px solid var(--border-color)',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                {currentPage?.diffSegments.map((seg, i) => {
                  let bg = 'transparent';
                  let prefix = '  ';
                  let color = 'var(--text-primary)';

                  if (seg.type === 'added') {
                    bg = 'rgba(34, 197, 94, 0.15)';
                    color = '#16a34a';
                    prefix = '+ ';
                  } else if (seg.type === 'removed') {
                    bg = 'rgba(239, 68, 68, 0.15)';
                    color = '#ef4444';
                    prefix = '- ';
                  }

                  return (
                    <div
                      key={i}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 3,
                        backgroundColor: bg,
                        color,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {prefix}
                      {seg.text}
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-secondary"
                onClick={() => setSummary(null)}
                style={{ alignSelf: 'flex-start' }}
              >
                Compare Different File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
