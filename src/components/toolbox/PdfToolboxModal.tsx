import React, { useState } from 'react';
import {
  X,
  Layers,
  Scissors,
  Minimize2,
  FileImage,
  Tag,
  Download,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  mergePdfs,
  splitPdf,
  compressPdf,
  imagesToPdf,
  pdfPagesToImages,
  updatePdfMetadata,
  type PdfMetadata,
} from '../../services/pdfToolbox';
import { triggerFileDownload } from '../../utils/fileUtils';

interface PdfToolboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPdfBytes: Uint8Array | null;
  currentPdfDocument: PDFDocumentProxy | null;
  documentTitle: string | null;
  onLoadNewPdf?: (file: File) => void;
}

type ToolboxTab = 'merge' | 'split' | 'compress' | 'convert' | 'metadata';

export const PdfToolboxModal: React.FC<PdfToolboxModalProps> = ({
  isOpen,
  onClose,
  currentPdfBytes,
  currentPdfDocument,
  documentTitle,
}) => {
  const [activeTab, setActiveTab] = useState<ToolboxTab>('merge');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Merge State
  const [mergeFiles, setMergeFiles] = useState<{ id: string; file: File }[]>([]);

  // Split State
  const [splitMode, setSplitMode] = useState<'all' | 'ranges'>('ranges');
  const [splitRanges, setSplitRanges] = useState<string>('1-2, 3');

  // Compress State
  const [compressQuality, setCompressQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [compressResult, setCompressResult] = useState<{
    originalSize: number;
    compressedSize: number;
    ratio: number;
    bytes: Uint8Array;
  } | null>(null);

  // Convert State
  const [convertType, setConvertType] = useState<'imgToPdf' | 'pdfToImg'>('imgToPdf');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [imgExportFormat, setImgExportFormat] = useState<'png' | 'jpeg'>('png');

  // Metadata State
  const [metadata, setMetadata] = useState<PdfMetadata>({
    title: documentTitle || '',
    author: '',
    subject: '',
    keywords: [],
    creator: 'PaperForge',
  });

  if (!isOpen) return null;

  const handleMergeFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
    }));
    setMergeFiles((prev) => [...prev, ...newFiles]);
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      setFeedback({ type: 'error', message: 'Please select at least 2 PDF files to merge.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const buffers: Uint8Array[] = [];
      for (const item of mergeFiles) {
        const buf = await item.file.arrayBuffer();
        buffers.push(new Uint8Array(buf));
      }
      const mergedBytes = await mergePdfs(buffers);
      triggerFileDownload(mergedBytes, 'merged_document.pdf');
      setFeedback({ type: 'success', message: 'PDFs merged and downloaded successfully!' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to merge PDFs.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteSplit = async () => {
    if (!currentPdfBytes) {
      setFeedback({ type: 'error', message: 'Please load a PDF in the editor first.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const parts = await splitPdf(currentPdfBytes, splitMode, splitRanges);
      if (parts.length === 0) {
        throw new Error('No pages matched the specified range.');
      }
      for (const part of parts) {
        triggerFileDownload(part.bytes, part.name);
      }
      setFeedback({
        type: 'success',
        message: `Split successfully into ${parts.length} file(s)!`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to split PDF.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteCompress = async () => {
    if (!currentPdfBytes) {
      setFeedback({ type: 'error', message: 'Please load a PDF in the editor first.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const result = await compressPdf(currentPdfBytes, compressQuality);
      setCompressResult(result);
      setFeedback({
        type: 'success',
        message: `Compressed by ${result.ratio}%! (${(result.originalSize / 1024).toFixed(1)} KB → ${(result.compressedSize / 1024).toFixed(1)} KB)`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to compress PDF.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteImagesToPdf = async () => {
    if (imageFiles.length === 0) {
      setFeedback({ type: 'error', message: 'Please select one or more images.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const pdfBytes = await imagesToPdf(imageFiles, {
        pageSize,
        orientation: imageOrientation,
      });
      triggerFileDownload(pdfBytes, 'converted_images.pdf');
      setFeedback({ type: 'success', message: 'Images converted to PDF successfully!' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to convert images.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecutePdfToImages = async () => {
    if (!currentPdfDocument) {
      setFeedback({ type: 'error', message: 'Please load a PDF in the editor first.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const pagesToExport = Array.from({ length: currentPdfDocument.numPages }, (_, i) => i);
      const images = await pdfPagesToImages(currentPdfDocument, pagesToExport, imgExportFormat);
      images.forEach((img) => {
        triggerFileDownload(img.blob, `page_${img.pageNumber}.${imgExportFormat}`);
      });
      setFeedback({
        type: 'success',
        message: `Exported ${images.length} page image(s) successfully!`,
      });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to export PDF pages.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveMetadata = async () => {
    if (!currentPdfBytes) {
      setFeedback({ type: 'error', message: 'Please load a PDF in the editor first.' });
      return;
    }
    setIsProcessing(true);
    setFeedback(null);
    try {
      const updated = await updatePdfMetadata(currentPdfBytes, metadata);
      triggerFileDownload(updated, `updated_${documentTitle || 'document.pdf'}`);
      setFeedback({ type: 'success', message: 'Metadata updated and downloaded!' });
    } catch (err: unknown) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update metadata.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog-box"
        style={{ width: 680, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#6366f1" />
            <h3 style={{ margin: 0, fontSize: 18 }}>PDF Toolbox</h3>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close Toolbox">
            <X size={18} />
          </button>
        </div>

        {/* Toolbox Navigation Tabs */}
        <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border-color)', padding: '8px 16px', overflowX: 'auto' }}>
          <button
            className={`btn-secondary ${activeTab === 'merge' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveTab('merge'); setFeedback(null); }}
            style={{ fontSize: 13, height: 32, gap: 6 }}
          >
            <Layers size={14} /> Merge
          </button>
          <button
            className={`btn-secondary ${activeTab === 'split' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveTab('split'); setFeedback(null); }}
            style={{ fontSize: 13, height: 32, gap: 6 }}
          >
            <Scissors size={14} /> Split
          </button>
          <button
            className={`btn-secondary ${activeTab === 'compress' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveTab('compress'); setFeedback(null); }}
            style={{ fontSize: 13, height: 32, gap: 6 }}
          >
            <Minimize2 size={14} /> Compress
          </button>
          <button
            className={`btn-secondary ${activeTab === 'convert' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveTab('convert'); setFeedback(null); }}
            style={{ fontSize: 13, height: 32, gap: 6 }}
          >
            <FileImage size={14} /> Convert
          </button>
          <button
            className={`btn-secondary ${activeTab === 'metadata' ? 'btn-primary' : ''}`}
            onClick={() => { setActiveTab('metadata'); setFeedback(null); }}
            style={{ fontSize: 13, height: 32, gap: 6 }}
          >
            <Tag size={14} /> Metadata
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '10px 14px',
              borderRadius: 6,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: feedback.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: feedback.type === 'success' ? '#16a34a' : '#ef4444',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="dialog-body" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {/* TAB: MERGE */}
          {activeTab === 'merge' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Combine multiple PDF documents into a single document in your chosen order.
              </div>

              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 8,
                  padding: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('merge-file-input')?.click()}
              >
                <Plus size={24} style={{ margin: '0 auto 8px', color: '#6366f1' }} />
                <div style={{ fontWeight: 500, fontSize: 14 }}>Click to add PDF files to merge</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Select multiple files to join together
                </div>
                <input
                  id="merge-file-input"
                  type="file"
                  multiple
                  accept="application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleMergeFilesAdded}
                />
              </div>

              {mergeFiles.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Files to Merge ({mergeFiles.length})
                  </div>
                  {mergeFiles.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-secondary)',
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      <span>
                        {idx + 1}. {item.file.name} ({(item.file.size / 1024).toFixed(1)} KB)
                      </span>
                      <button
                        className="icon-btn"
                        style={{ color: '#ef4444' }}
                        onClick={() => setMergeFiles((prev) => prev.filter((f) => f.id !== item.id))}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleExecuteMerge}
                disabled={mergeFiles.length < 2 || isProcessing}
                style={{ marginTop: 8 }}
              >
                {isProcessing ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                <span>Merge and Download PDF</span>
              </button>
            </div>
          )}

          {/* TAB: SPLIT */}
          {activeTab === 'split' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Split the current document into individual single-page PDFs or extract custom page ranges.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="splitMode"
                    checked={splitMode === 'ranges'}
                    onChange={() => setSplitMode('ranges')}
                  />
                  Custom Page Ranges
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="splitMode"
                    checked={splitMode === 'all'}
                    onChange={() => setSplitMode('all')}
                  />
                  Extract Every Page (Split All)
                </label>
              </div>

              {splitMode === 'ranges' && (
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    Page Ranges (e.g. 1-3, 5 or 1-2; 3-5)
                  </label>
                  <input
                    type="text"
                    value={splitRanges}
                    onChange={(e) => setSplitRanges(e.target.value)}
                    placeholder="1-2, 4-5"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                    }}
                  />
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleExecuteSplit}
                disabled={!currentPdfBytes || isProcessing}
                style={{ marginTop: 8 }}
              >
                {isProcessing ? <Loader2 size={16} className="spin" /> : <Scissors size={16} />}
                <span>Split Document</span>
              </button>
            </div>
          )}

          {/* TAB: COMPRESS */}
          {activeTab === 'compress' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Reduce PDF file size client-side using object stream compaction and stream optimization.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Compression Level
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {(['low', 'medium', 'high'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      className={`btn-secondary ${compressQuality === lvl ? 'btn-primary' : ''}`}
                      onClick={() => setCompressQuality(lvl)}
                      style={{ textTransform: 'capitalize', height: 38 }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {compressResult && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 6,
                    padding: 12,
                    fontSize: 13,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div>Original Size: <strong>{(compressResult.originalSize / 1024).toFixed(1)} KB</strong></div>
                  <div>Compressed Size: <strong>{(compressResult.compressedSize / 1024).toFixed(1)} KB</strong></div>
                  <div style={{ color: '#16a34a' }}>Reduction: <strong>{compressResult.ratio}%</strong></div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn-primary"
                  onClick={handleExecuteCompress}
                  disabled={!currentPdfBytes || isProcessing}
                  style={{ flex: 1 }}
                >
                  {isProcessing ? <Loader2 size={16} className="spin" /> : <Minimize2 size={16} />}
                  <span>Compress PDF</span>
                </button>
                {compressResult && (
                  <button
                    className="btn-secondary"
                    onClick={() => triggerFileDownload(compressResult.bytes, 'compressed_document.pdf')}
                  >
                    <Download size={16} /> Download
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: CONVERT */}
          {activeTab === 'convert' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="convertType"
                    checked={convertType === 'imgToPdf'}
                    onChange={() => setConvertType('imgToPdf')}
                  />
                  Images to PDF
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="convertType"
                    checked={convertType === 'pdfToImg'}
                    onChange={() => setConvertType('pdfToImg')}
                  />
                  PDF Pages to Images
                </label>
              </div>

              {convertType === 'imgToPdf' ? (
                <>
                  <input
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp"
                    onChange={(e) => {
                      if (e.target.files) setImageFiles(Array.from(e.target.files));
                    }}
                    style={{ fontSize: 13 }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Page Size</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'fit')}
                        style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 4 }}
                      >
                        <option value="a4">A4 Standard</option>
                        <option value="letter">US Letter</option>
                        <option value="fit">Fit to Image</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600 }}>Orientation</label>
                      <select
                        value={imageOrientation}
                        onChange={(e) => setImageOrientation(e.target.value as 'portrait' | 'landscape')}
                        style={{ width: '100%', padding: 6, marginTop: 4, borderRadius: 4 }}
                      >
                        <option value="portrait">Portrait</option>
                        <option value="landscape">Landscape</option>
                      </select>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleExecuteImagesToPdf}
                    disabled={imageFiles.length === 0 || isProcessing}
                  >
                    {isProcessing ? <Loader2 size={16} className="spin" /> : <FileImage size={16} />}
                    <span>Convert {imageFiles.length} Image(s) to PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Image Format</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button
                        className={`btn-secondary ${imgExportFormat === 'png' ? 'btn-primary' : ''}`}
                        onClick={() => setImgExportFormat('png')}
                        style={{ flex: 1 }}
                      >
                        PNG (Lossless)
                      </button>
                      <button
                        className={`btn-secondary ${imgExportFormat === 'jpeg' ? 'btn-primary' : ''}`}
                        onClick={() => setImgExportFormat('jpeg')}
                        style={{ flex: 1 }}
                      >
                        JPEG (Compact)
                      </button>
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleExecutePdfToImages}
                    disabled={!currentPdfDocument || isProcessing}
                  >
                    {isProcessing ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
                    <span>Export All Pages as {imgExportFormat.toUpperCase()}</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* TAB: METADATA */}
          {activeTab === 'metadata' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                View and edit document metadata fields (Title, Author, Subject, Keywords).
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Document Title</label>
                <input
                  type="text"
                  value={metadata.title || ''}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', marginTop: 4, borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Author</label>
                <input
                  type="text"
                  value={metadata.author || ''}
                  onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', marginTop: 4, borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Subject</label>
                <input
                  type="text"
                  value={metadata.subject || ''}
                  onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', marginTop: 4, borderRadius: 4 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Keywords (comma separated)</label>
                <input
                  type="text"
                  value={metadata.keywords?.join(', ') || ''}
                  onChange={(e) =>
                    setMetadata({
                      ...metadata,
                      keywords: e.target.value.split(',').map((k) => k.trim()),
                    })
                  }
                  style={{ width: '100%', padding: '6px 10px', marginTop: 4, borderRadius: 4 }}
                />
              </div>

              <button
                className="btn-primary"
                onClick={handleSaveMetadata}
                disabled={!currentPdfBytes || isProcessing}
                style={{ marginTop: 8 }}
              >
                {isProcessing ? <Loader2 size={16} className="spin" /> : <Tag size={16} />}
                <span>Save Metadata & Download</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
