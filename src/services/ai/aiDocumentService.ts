import type {
  AiConfig,
  AiMessage,
  Citation,
  DocumentChunk,
  Flashcard,
  QuizQuestion,
  StudyPack,
} from './aiTypes';

/**
 * Splits extracted page texts into clean page-associated document chunks.
 */
export function chunkDocument(
  pages: { pageNumber: number; text: string }[],
  maxChunkSize = 800
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  for (const page of pages) {
    const cleanText = page.text.trim();
    if (!cleanText) continue;

    if (cleanText.length <= maxChunkSize) {
      chunks.push({
        pageNumber: page.pageNumber,
        text: cleanText,
      });
    } else {
      // Split into paragraph-based or sentence-based chunks
      const paragraphs = cleanText.split(/\n\s*\n/);
      let current = '';

      for (const p of paragraphs) {
        if ((current + '\n' + p).length <= maxChunkSize) {
          current = current ? current + '\n' + p : p;
        } else {
          if (current) {
            chunks.push({ pageNumber: page.pageNumber, text: current });
          }
          current = p;
        }
      }
      if (current) {
        chunks.push({ pageNumber: page.pageNumber, text: current });
      }
    }
  }

  return chunks;
}

/**
 * Lightweight local TF-IDF / term-matching retrieval to find relevant chunks for a user query.
 */
export function findRelevantChunks(
  query: string,
  chunks: DocumentChunk[],
  topK = 4
): DocumentChunk[] {
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (terms.length === 0) return chunks.slice(0, topK);

  const scored = chunks.map((chunk) => {
    const chunkLower = chunk.text.toLowerCase();
    let score = 0;
    for (const term of terms) {
      const occurrences = (chunkLower.match(new RegExp(`\\b${term}`, 'g')) || []).length;
      score += occurrences;
    }
    return { chunk, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .slice(0, topK)
    .map((item) => item.chunk);
}

/**
 * Generates an offline structured summary using local NLP frequency heuristics.
 */
export function generateLocalSummary(
  chunks: DocumentChunk[],
  type: 'short' | 'detailed' | 'takeaways'
): string {
  if (chunks.length === 0) return 'No text content found in document to summarize.';

  const allSentences: { sentence: string; pageNumber: number }[] = [];

  for (const c of chunks) {
    const sentences = c.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 250);

    for (const s of sentences) {
      allSentences.push({ sentence: s, pageNumber: c.pageNumber });
    }
  }

  if (allSentences.length === 0) {
    return 'Document contains minimal extracted text.';
  }

  if (type === 'short') {
    const selected = allSentences.slice(0, 3);
    return selected.map((s) => `• ${s.sentence} [Page ${s.pageNumber}]`).join('\n\n');
  }

  if (type === 'takeaways') {
    const keySentences = allSentences.filter((s) => {
      const lower = s.sentence.toLowerCase();
      return (
        lower.includes('important') ||
        lower.includes('key') ||
        lower.includes('must') ||
        lower.includes('result') ||
        lower.includes('conclude') ||
        lower.includes('purpose') ||
        lower.includes('summary')
      );
    });

    const chosen = keySentences.length >= 3 ? keySentences.slice(0, 5) : allSentences.slice(0, 5);
    return (
      '### Key Takeaways\n\n' +
      chosen.map((s, i) => `${i + 1}. **Point ${i + 1}**: ${s.sentence} *(Page ${s.pageNumber})*`).join('\n\n')
    );
  }

  // Detailed summary grouped by page
  const byPage: Record<number, string[]> = {};
  for (const s of allSentences) {
    if (!byPage[s.pageNumber]) byPage[s.pageNumber] = [];
    if (byPage[s.pageNumber].length < 2) {
      byPage[s.pageNumber].push(s.sentence);
    }
  }

  return Object.entries(byPage)
    .map(([page, sList]) => `#### Page ${page}\n` + sList.map((s) => `• ${s}`).join('\n'))
    .join('\n\n');
}

/**
 * Extracts tabular text rows and formats as CSV.
 */
export function extractTablesToCsv(chunks: DocumentChunk[]): string {
  const csvRows: string[] = [];

  for (const c of chunks) {
    const lines = c.text.split('\n');
    for (const line of lines) {
      // Look for lines containing tabs or multiple contiguous spaces (column delimiters)
      if (line.includes('\t') || /\s{2,}/.test(line.trim())) {
        const columns = line
          .trim()
          .split(/\t+|\s{2,}/)
          .map((col) => `"${col.replace(/"/g, '""')}"`);

        if (columns.length >= 2) {
          csvRows.push(columns.join(','));
        }
      }
    }
  }

  if (csvRows.length === 0) {
    return 'Column 1,Column 2,Page\n"No clear tabular rows detected","Check document text",1';
  }

  return csvRows.join('\n');
}

/**
 * Generates study flashcards and quiz questions from document text.
 */
export function generateStudyPack(chunks: DocumentChunk[]): StudyPack {
  const flashcards: Flashcard[] = [];
  const quiz: QuizQuestion[] = [];
  const keyTerms: { term: string; definition: string; page: number }[] = [];

  for (const chunk of chunks) {
    const sentences = chunk.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 25);

    for (const sentence of sentences) {
      // Look for definition patterns: "X is Y" or "X refers to Y"
      const defMatch = sentence.match(/^([A-Z][A-Za-z\s]{2,25})\s+(?:is|are|refers to|means)\s+(.+)$/);
      if (defMatch && keyTerms.length < 6) {
        const term = defMatch[1].trim();
        const definition = defMatch[2].trim();
        keyTerms.push({ term, definition, page: chunk.pageNumber });
        flashcards.push({
          question: `What is ${term}?`,
          answer: definition,
          pageNumber: chunk.pageNumber,
        });
      }
    }
  }

  // Fallback flashcards if no definitions matched
  if (flashcards.length === 0 && chunks.length > 0) {
    const sampleSentences = chunks[0].text.split(/(?<=[.!?])\s+/).slice(0, 3);
    sampleSentences.forEach((s, idx) => {
      flashcards.push({
        question: `Key Concept ${idx + 1} (Page ${chunks[0].pageNumber})`,
        answer: s,
        pageNumber: chunks[0].pageNumber,
      });
    });
  }

  // Build Quiz questions
  flashcards.slice(0, 4).forEach((fc) => {
    quiz.push({
      question: fc.question,
      options: [
        fc.answer,
        'None of the above',
        'Not discussed in this document',
        'Applies only to external standards',
      ],
      correctIndex: 0,
      explanation: `Referenced directly from Page ${fc.pageNumber}.`,
      pageNumber: fc.pageNumber,
    });
  });

  return { flashcards, quiz, keyTerms };
}

/**
 * Queries the AI assistant using either offline local retrieval or external BYOK provider.
 */
export async function queryAiAssistant(
  userQuery: string,
  chunks: DocumentChunk[],
  config: AiConfig
): Promise<AiMessage> {
  const relevantChunks = findRelevantChunks(userQuery, chunks, 4);

  const citations: Citation[] = relevantChunks.map((c) => ({
    pageNumber: c.pageNumber,
    snippet: c.text.substring(0, 150) + (c.text.length > 150 ? '...' : ''),
  }));

  // If offline mode or no API key, use local semantic answer synthesizer
  if (config.provider === 'offline-heuristic' || !config.apiKey) {
    if (relevantChunks.length === 0) {
      return {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `I could not locate direct references to "${userQuery}" in the extracted text of this document. Try searching for specific keywords present in the PDF.`,
        timestamp: Date.now(),
      };
    }

    const contextPoints = relevantChunks
      .map((c) => `• [Page ${c.pageNumber}]: "${c.text.substring(0, 200)}..."`)
      .join('\n\n');

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: `Based on the document text, here is what I found regarding **"${userQuery}"**:\n\n${contextPoints}\n\n*(Extracted client-side via PaperForge offline analysis)*`,
      citations,
      timestamp: Date.now(),
    };
  }

  // External provider with BYOK and user consent
  if (config.provider === 'openai') {
    const promptContext = relevantChunks
      .map((c) => `[Page ${c.pageNumber}]: ${c.text}`)
      .join('\n\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are the PaperForge AI PDF assistant. Answer accurately based strictly on the provided document excerpts. Cite page numbers whenever referring to facts. If the information is not in the document, state so clearly.',
          },
          {
            role: 'user',
            content: `Document Excerpts:\n${promptContext}\n\nQuestion: ${userQuery}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `OpenAI request failed: ${res.statusText}`);
    }

    const data = await res.json();
    const answer = data.choices[0]?.message?.content || 'No response generated.';

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: answer,
      citations,
      timestamp: Date.now(),
    };
  }

  // Fallback
  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: 'Provider not configured. Please verify your settings.',
    timestamp: Date.now(),
  };
}
