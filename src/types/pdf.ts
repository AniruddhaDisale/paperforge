export interface PageModel {
  id: string;
  originalPageIndex: number | null; // null if newly added blank page
  rotation: number; // 0, 90, 180, 270
  width: number; // in PDF points
  height: number; // in PDF points
}

export type PageSize = 'A4' | 'Letter';

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; name: string }> = {
  A4: { width: 595.28, height: 841.89, name: 'A4 (210 x 297 mm)' },
  Letter: { width: 612, height: 792, name: 'Letter (8.5 x 11 in)' },
};

export interface DocumentState {
  originalFile: File | null;
  originalFileName: string;
  originalBytes: ArrayBuffer | null;
  pages: PageModel[];
  currentPageId: string;
  zoom: number;
  isModified: boolean;
}
