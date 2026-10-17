import React, { useState, useCallback } from 'react';
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  FileSearch,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { searchPdfDocument, type SearchMatch } from '../../services/pdfSearchService';
import { runOcrOnPage, type OcrPageResult } from '../../services/ocrService';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  currentPageNumber: number;
  onNavigateToPage: (pageNumber: number) => void;
  onHighlightMatch?: (match: SearchMatch | null) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({
  isOpen,
  onClose,
  pdfDocument,
  currentPageNumber,
  onNavigateToPage,
  onHighlightMatch,
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  // OCR state
  const [activeTab, setActiveTab] = useState<'search' | 'ocr'>('search');
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrResult, setOcrResult] = useState<OcrPageResult | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!pdfDocument || !searchQuery.trim()) {
        setMatches([]);
        setCurrentMatchIndex(0);
        onHighlightMatch?.(null);
        return;
      }

      setIsSearching(true);
      try {
        const found = await searchPdfDocument(pdfDocument, searchQuery, {
          caseSensitive,
          wholeWord,
        });
        setMatches(found);
        setCurrentMatchIndex(0);
        if (found.length > 0) {
          onNavigateToPage(found[0].pageNumber);
          onHighlightMatch?.(found[0]);
        } else {
          onHighlightMatch?.(null);
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    },
    [pdfDocument, caseSensitive, wholeWord, onNavigateToPage, onHighlightMatch]
  );

  const handleNextMatch = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIdx);
    onNavigateToPage(matches[nextIdx].pageNumber);
    onHighlightMatch?.(matches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(prevIdx);
    onNavigateToPage(matches[prevIdx].pageNumber);
    onHighlightMatch?.(matches[prevIdx]);
  };

  const handleRunOcr = async () => {
    if (!pdfDocument) return;
    setIsOcrRunning(true);
    setOcrResult(null);
    setOcrStatus('Starting OCR...');
    try {
      const res = await runOcrOnPage(
        pdfDocument,
        currentPageNumber,
        'eng',
        (p) => setOcrStatus(p.status)
      );
      setOcrResult(res);
    } catch (err: unknown) {
      setOcrStatus(`OCR error: ${err instanceof Error ? err.message : 'Failed to process page.'}`);
    } finally {
      setIsOcrRunning(false);
    }
  };

  const handleCopyOcrText = () => {
    if (!ocrResult?.text) return;
    navigator.clipboard.writeText(ocrResult.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-panel-drawer"
      style={{
        position: 'absolute',
        top: 48,
        right: 0,
        width: 340,
        height: 'calc(100% - 48px)',
        backgroundColor: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.1)',
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn-secondary ${activeTab === 'search' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('search')}
            style={{ fontSize: 12, height: 28, padding: '0 10px' }}
          >
            <Search size={13} /> Search
          </button>
          <button
            className={`btn-secondary ${activeTab === 'ocr' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('ocr')}
            style={{ fontSize: 12, height: 28, padding: '0 10px' }}
          >
            <Sparkles size={13} /> OCR
          </button>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close Search">
          <X size={16} />
        </button>
      </div>

      {activeTab === 'search' ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 12, gap: 10 }}>
          {/* Search Input Box */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search in document..."
              style={{
                width: '100%',
                padding: '8px 32px 8px 32px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
            {query && (
              <button
                className="icon-btn"
                onClick={() => {
                  setQuery('');
                  handleSearch('');
                }}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: 2,
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Search Options & Match Counter */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => {
                    setCaseSensitive(e.target.checked);
                    handleSearch(query);
                  }}
                />
                Aa
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => {
                    setWholeWord(e.target.checked);
                    handleSearch(query);
                  }}
                />
                Whole word
              </label>
            </div>

            {matches.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>
                  {currentMatchIndex + 1} of {matches.length}
                </span>
                <button className="icon-btn" onClick={handlePrevMatch} title="Previous match">
                  <ChevronUp size={14} />
                </button>
                <button className="icon-btn" onClick={handleNextMatch} title="Next match">
                  <ChevronDown size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Results List */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isSearching ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                <Loader2 size={18} className="spin" style={{ margin: '0 auto 8px' }} />
                Searching document...
              </div>
            ) : matches.length === 0 ? (
              query.trim() ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                  No matches found for "{query}".
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)', fontSize: 13 }}>
                  <FileSearch size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  Type a keyword to search across all pages.
                </div>
              )
            ) : (
              matches.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => {
                    setCurrentMatchIndex(idx);
                    onNavigateToPage(m.pageNumber);
                    onHighlightMatch?.(m);
                  }}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: idx === currentMatchIndex ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-secondary)',
                    border: idx === currentMatchIndex ? '1px solid #6366f1' : '1px solid transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ fontWeight: 600, color: '#6366f1' }}>Page {m.pageNumber}</span>
                  </div>
                  <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{m.snippet}</div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* OCR TAB */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 14, gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Recognize text in scanned pages using client-side Optical Character Recognition (OCR).
          </div>

          <button
            className="btn-primary"
            onClick={handleRunOcr}
            disabled={!pdfDocument || isOcrRunning}
          >
            {isOcrRunning ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            <span>Run OCR on Page {currentPageNumber}</span>
          </button>

          {isOcrRunning && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {ocrStatus}
            </div>
          )}

          {ocrResult && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  Extracted Text (Confidence: {ocrResult.confidence.toFixed(0)}%)
                </span>
                <button className="icon-btn" onClick={handleCopyOcrText} title="Copy extracted text">
                  {copiedText ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                </button>
              </div>
              <textarea
                value={ocrResult.text}
                readOnly
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  resize: 'none',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
