import { describe, it, expect } from 'vitest';
import {
  chunkDocument,
  findRelevantChunks,
  generateLocalSummary,
  generateStudyPack,
  extractTablesToCsv,
  queryAiAssistant,
} from '../aiDocumentService';

describe('AI Document Service', () => {
  const samplePages = [
    {
      pageNumber: 1,
      text: 'PaperForge is a client-side PDF editor and platform. It allows users to edit text, sign documents, and merge files.',
    },
    {
      pageNumber: 2,
      text: 'Security is paramount. Documents never leave the local browser. All processing is private and confidential.',
    },
  ];

  it('chunks documents by page and length', () => {
    const chunks = chunkDocument(samplePages, 500);
    expect(chunks).toHaveLength(2);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[1].pageNumber).toBe(2);
  });

  it('retrieves relevant chunks by keyword match', () => {
    const chunks = chunkDocument(samplePages);
    const relevant = findRelevantChunks('security private', chunks);
    expect(relevant).toHaveLength(1);
    expect(relevant[0].pageNumber).toBe(2);
  });

  it('generates local short and takeaway summaries', () => {
    const chunks = chunkDocument(samplePages);
    const summary = generateLocalSummary(chunks, 'short');
    expect(summary).toContain('PaperForge');
    expect(summary).toContain('[Page 1]');

    const takeaways = generateLocalSummary(chunks, 'takeaways');
    expect(takeaways).toContain('Key Takeaways');
  });

  it('generates study flashcards and quizzes', () => {
    const chunks = chunkDocument(samplePages);
    const pack = generateStudyPack(chunks);
    expect(pack.flashcards.length).toBeGreaterThan(0);
    expect(pack.quiz.length).toBeGreaterThan(0);
    expect(pack.quiz[0].options).toHaveLength(4);
  });

  it('queries AI assistant in offline mode without network calls', async () => {
    const chunks = chunkDocument(samplePages);
    const res = await queryAiAssistant('What is PaperForge?', chunks, {
      provider: 'offline-heuristic',
      hasUserConsented: true,
    });

    expect(res.role).toBe('assistant');
    expect(res.content).toContain('PaperForge');
    expect(res.citations?.length).toBeGreaterThan(0);
  });

  it('extracts table rows into CSV format', () => {
    const tableChunks = [
      {
        pageNumber: 1,
        text: 'Item\tPrice\tQty\nWidget A\t$10\t5\nWidget B\t$20\t2',
      },
    ];
    const csv = extractTablesToCsv(tableChunks);
    expect(csv).toContain('Widget A');
    expect(csv).toContain('$10');
  });
});
