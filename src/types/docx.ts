export type DocumentFormat = 'pdf' | 'docx';

export interface DocxStats {
  words: number;
  characters: number;
  paragraphs: number;
  readingTimeMinutes: number;
}

export interface DocxDocumentState {
  file: File | null;
  fileName: string;
  rawBytes: ArrayBuffer | null;
  htmlContent: string;
  isModified: boolean;
  warnings: string[];
  stats: DocxStats;
  lastSavedAt: number | null;
}

export interface DocxToolbarState {
  heading: 'p' | 'h1' | 'h2' | 'h3';
  fontFamily: string;
  fontSize: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrike: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textColor: string;
  highlightColor: string;
  isBulletList: boolean;
  isOrderedList: boolean;
  canUndo: boolean;
  canRedo: boolean;
}
