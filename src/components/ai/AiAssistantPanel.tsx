import React, { useState } from 'react';
import {
  Bot,
  X,
  Send,
  Download,
  Copy,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  chunkDocument,
  generateLocalSummary,
  generateStudyPack,
  extractTablesToCsv,
  queryAiAssistant,
} from '../../services/ai/aiDocumentService';
import type { AiConfig, AiMessage, StudyPack } from '../../services/ai/aiTypes';
import { triggerFileDownload } from '../../utils/fileUtils';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDocument: PDFDocumentProxy | null;
  onNavigateToPage: (pageNumber: number) => void;
}

type AiTab = 'chat' | 'summarize' | 'study' | 'tables' | 'settings';

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  pdfDocument,
  onNavigateToPage,
}) => {
  const [activeTab, setActiveTab] = useState<AiTab>('chat');
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am your PaperForge AI assistant. I can answer questions about your PDF, extract summaries, generate flashcards, or export tables. What would you like to explore?',
      timestamp: Date.now(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Summaries & Study
  const [summaryText, setSummaryText] = useState<string>('');
  const [studyPack, setStudyPack] = useState<StudyPack | null>(null);
  const [flippedCardIdx, setFlippedCardIdx] = useState<number | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Config & Consent
  const [config, setConfig] = useState<AiConfig>({
    provider: 'offline-heuristic',
    apiKey: '',
    hasUserConsented: true,
  });

  const extractAllPagesText = async (): Promise<{ pageNumber: number; text: string }[]> => {
    if (!pdfDocument) return [];
    const pages: { pageNumber: number; text: string }[] = [];
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      try {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const str = textContent.items
          .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
          .filter(Boolean)
          .join(' ');
        pages.push({ pageNumber: i, text: str });
      } catch {
        pages.push({ pageNumber: i, text: '' });
      }
    }
    return pages;
  };

  const handleSendMessage = async () => {
    if (!inputQuery.trim() || isProcessing) return;

    const userMsg: AiMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputQuery,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const pages = await extractAllPagesText();
      const chunks = chunkDocument(pages);
      const answer = await queryAiAssistant(userMsg.content, chunks, config);
      setMessages((prev) => [...prev, answer]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to process question.'}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSummary = async (type: 'short' | 'detailed' | 'takeaways') => {
    setIsProcessing(true);
    try {
      const pages = await extractAllPagesText();
      const chunks = chunkDocument(pages);
      const summary = generateLocalSummary(chunks, type);
      setSummaryText(summary);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateStudyTools = async () => {
    setIsProcessing(true);
    try {
      const pages = await extractAllPagesText();
      const chunks = chunkDocument(pages);
      const pack = generateStudyPack(chunks);
      setStudyPack(pack);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportTables = async () => {
    setIsProcessing(true);
    try {
      const pages = await extractAllPagesText();
      const chunks = chunkDocument(pages);
      const csv = extractTablesToCsv(chunks);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      triggerFileDownload(blob, 'extracted_tables.csv');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="ai-assistant-drawer"
      style={{
        position: 'absolute',
        top: 48,
        right: 0,
        width: 380,
        height: 'calc(100% - 48px)',
        backgroundColor: 'var(--bg-primary)',
        borderLeft: '1px solid var(--border-color)',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 16px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bot size={18} color="#6366f1" />
          <span style={{ fontWeight: 600, fontSize: 14 }}>PaperForge AI</span>
          <span
            style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              backgroundColor: config.provider === 'offline-heuristic' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)',
              color: config.provider === 'offline-heuristic' ? '#16a34a' : '#6366f1',
              fontWeight: 600,
            }}
          >
            {config.provider === 'offline-heuristic' ? '100% Local' : 'Cloud AI'}
          </span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close AI Assistant">
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          padding: '6px 8px',
          gap: 4,
          overflowX: 'auto',
        }}
      >
        <button
          className={`btn-secondary ${activeTab === 'chat' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('chat')}
          style={{ fontSize: 11, height: 28, padding: '0 8px' }}
        >
          Ask PDF
        </button>
        <button
          className={`btn-secondary ${activeTab === 'summarize' ? 'btn-primary' : ''}`}
          onClick={() => {
            setActiveTab('summarize');
            if (!summaryText) handleGenerateSummary('takeaways');
          }}
          style={{ fontSize: 11, height: 28, padding: '0 8px' }}
        >
          Summary
        </button>
        <button
          className={`btn-secondary ${activeTab === 'study' ? 'btn-primary' : ''}`}
          onClick={() => {
            setActiveTab('study');
            if (!studyPack) handleGenerateStudyTools();
          }}
          style={{ fontSize: 11, height: 28, padding: '0 8px' }}
        >
          Study Pack
        </button>
        <button
          className={`btn-secondary ${activeTab === 'tables' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('tables')}
          style={{ fontSize: 11, height: 28, padding: '0 8px' }}
        >
          Tables
        </button>
        <button
          className={`btn-secondary ${activeTab === 'settings' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('settings')}
          style={{ fontSize: 11, height: 28, padding: '0 8px' }}
        >
          Settings
        </button>
      </div>

      {/* TAB 1: ASK PDF CHAT */}
      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: m.role === 'user' ? '#6366f1' : 'var(--bg-secondary)',
                  color: m.role === 'user' ? '#ffffff' : 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  lineHeight: 1.45,
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>

                {/* Citations badges */}
                {m.citations && m.citations.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {m.citations.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigateToPage(c.pageNumber)}
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: 'rgba(99, 102, 241, 0.2)',
                          color: '#6366f1',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                        }}
                        title={c.snippet}
                      >
                        Page {c.pageNumber} <ChevronRight size={10} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isProcessing && (
              <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={14} className="spin" /> Reading document & generating answer...
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div style={{ padding: 10, borderTop: '1px solid var(--border-color)', display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about this PDF..."
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
              }}
            />
            <button className="btn-primary" onClick={handleSendMessage} disabled={isProcessing || !inputQuery.trim()}>
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SUMMARIZE */}
      {activeTab === 'summarize' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 12, gap: 10, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-secondary" onClick={() => handleGenerateSummary('takeaways')} style={{ fontSize: 11, flex: 1 }}>
              Key Takeaways
            </button>
            <button className="btn-secondary" onClick={() => handleGenerateSummary('short')} style={{ fontSize: 11, flex: 1 }}>
              Executive Short
            </button>
            <button className="btn-secondary" onClick={() => handleGenerateSummary('detailed')} style={{ fontSize: 11, flex: 1 }}>
              By Page
            </button>
          </div>

          {summaryText ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="icon-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(summaryText);
                    setCopiedSummary(true);
                    setTimeout(() => setCopiedSummary(false), 2000);
                  }}
                  title="Copy summary"
                >
                  {copiedSummary ? <CheckCircle2 size={14} color="#16a34a" /> : <Copy size={14} />}
                </button>
              </div>
              <div
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 12,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {summaryText}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
              Click a summary button above to synthesize the document.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDY PACK */}
      {activeTab === 'study' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 12, gap: 12, overflowY: 'auto' }}>
          {studyPack ? (
            <>
              {/* Flashcards */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  Study Flashcards ({studyPack.flashcards.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {studyPack.flashcards.map((fc, i) => (
                    <div
                      key={i}
                      onClick={() => setFlippedCardIdx(flippedCardIdx === i ? null : i)}
                      style={{
                        padding: 12,
                        borderRadius: 6,
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: 12,
                      }}
                    >
                      <div style={{ color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>
                        {flippedCardIdx === i ? 'Answer:' : 'Question:'}
                      </div>
                      <div style={{ color: 'var(--text-primary)' }}>
                        {flippedCardIdx === i ? fc.answer : fc.question}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                        (Click to flip • Page {fc.pageNumber})
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz */}
              {studyPack.quiz.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Knowledge Quiz</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {studyPack.quiz.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          backgroundColor: 'var(--bg-secondary)',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>
                          {qIdx + 1}. {q.question}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {q.options.map((opt, optIdx) => {
                            const isSelected = selectedQuizAnswers[qIdx] === optIdx;
                            const isCorrect = optIdx === q.correctIndex;
                            let bg = 'transparent';
                            if (isSelected) {
                              bg = isCorrect ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)';
                            }
                            return (
                              <button
                                key={optIdx}
                                onClick={() => setSelectedQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                style={{
                                  textAlign: 'left',
                                  padding: '4px 8px',
                                  borderRadius: 4,
                                  backgroundColor: bg,
                                  border: '1px solid var(--border-color)',
                                  color: 'var(--text-primary)',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 20 }}>Generating study pack...</div>
          )}
        </div>
      )}

      {/* TAB 4: TABLES EXTRACT */}
      {activeTab === 'tables' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 14, gap: 12 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Detect tabular rows, numerical columns, and structured data across your PDF pages and export to CSV.
          </div>
          <button className="btn-primary" onClick={handleExportTables} disabled={isProcessing}>
            <Download size={14} /> Export Tables to CSV
          </button>
        </div>
      )}

      {/* TAB 5: SETTINGS & PRIVACY */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 14, gap: 14, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a' }}>
            <ShieldCheck size={20} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Privacy & Data Protection</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            By default, PaperForge operates <strong>100% offline and client-side</strong>. No text or PDF contents are sent to external cloud servers.
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Assistant Engine</label>
            <select
              value={config.provider}
              onChange={(e) => setConfig({ ...config, provider: e.target.value as 'offline-heuristic' | 'openai' })}
              style={{ width: '100%', padding: '6px 8px', marginTop: 4, borderRadius: 4, fontSize: 12 }}
            >
              <option value="offline-heuristic">Local Offline Analysis (Zero Server Upload)</option>
              <option value="openai">OpenAI (Bring Your Own Key)</option>
            </select>
          </div>

          {config.provider === 'openai' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600 }}>OpenAI API Key (Session Only)</label>
              <input
                type="password"
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="sk-..."
                style={{ width: '100%', padding: '6px 8px', marginTop: 4, borderRadius: 4, fontSize: 12 }}
              />
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>
                Key is kept in active memory only and never saved to disk or persistent storage.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
