export type AiProviderType = 'offline-heuristic' | 'openai' | 'gemini' | 'anthropic';

export interface DocumentChunk {
  pageNumber: number;
  text: string;
}

export interface Citation {
  pageNumber: number;
  snippet: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  timestamp: number;
}

export interface AiConfig {
  provider: AiProviderType;
  apiKey?: string;
  model?: string;
  hasUserConsented: boolean;
}

export interface Flashcard {
  question: string;
  answer: string;
  pageNumber: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  pageNumber: number;
}

export interface StudyPack {
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  keyTerms: { term: string; definition: string; page: number }[];
}
