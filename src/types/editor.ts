export type ToolType =
  | 'select'
  | 'text'
  | 'editText'
  | 'draw'
  | 'highlight'
  | 'shape'
  | 'eraser'
  | 'image'
  | 'signature'
  | 'stamp'
  | 'mark';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';

export type FormMarkType = 'check' | 'cross' | 'dot';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface BaseEditorObject {
  id: string;
  pageId: string;
  x: number; // PDF points (unscaled), top-left
  y: number; // PDF points (unscaled), top-left
  width: number; // PDF points
  height: number; // PDF points
  opacity?: number;
}

export interface TextObject extends BaseEditorObject {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  color: string;
  isBold: boolean;
  isItalic: boolean;
  align: 'left' | 'center' | 'right';
}

export interface WhiteoutObject extends BaseEditorObject {
  type: 'whiteout';
  color: string; // #ffffff for whiteout or #000000 for redaction
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawObject extends BaseEditorObject {
  type: 'draw';
  points: Point[];
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
}

export interface HighlightObject extends BaseEditorObject {
  type: 'highlight';
  color: string;
  opacity: number;
}

export interface ShapeObject extends BaseEditorObject {
  type: 'shape';
  shapeType: ShapeType;
  strokeColor: string;
  fillColor: string; // hex or 'transparent'
  strokeWidth: number;
  opacity: number;
}

export interface ImageObject extends BaseEditorObject {
  type: 'image';
  src: string; // Data URL or Object URL
  originalWidth: number;
  originalHeight: number;
  opacity: number;
}

export interface SignatureObject extends BaseEditorObject {
  type: 'signature';
  src: string; // Data URL (PNG)
  opacity: number;
}

export interface StampObject extends BaseEditorObject {
  type: 'stamp';
  label: string;
  color: string;
  timestamp?: string;
  opacity: number;
}

export interface FormMarkObject extends BaseEditorObject {
  type: 'mark';
  markType: FormMarkType;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export type EditorObject =
  | TextObject
  | WhiteoutObject
  | DrawObject
  | HighlightObject
  | ShapeObject
  | ImageObject
  | SignatureObject
  | StampObject
  | FormMarkObject;

export interface ExtractedTextItem {
  id: string;
  text: string;
  x: number; // visual PDF pt (top-left)
  y: number; // visual PDF pt (top-left)
  width: number;
  height: number;
  fontSize: number;
  fontFamily?: string;
}

export interface WatermarkConfig {
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  rotation: number;
  allPages: boolean;
}

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'top-right';
export type PageNumberFormat = 'page-n' | 'n-of-total' | 'n';

export interface PageNumberConfig {
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number;
  color: string;
  startNumber: number;
}

export interface ToolProperties {
  textColor: string;
  fontSize: number;
  fontFamily: 'Helvetica' | 'TimesRoman' | 'Courier';
  isBold: boolean;
  isItalic: boolean;
  textAlign: 'left' | 'center' | 'right';
  drawColor: string;
  drawWidth: number;
  drawOpacity: number;
  highlightColor: string;
  highlightOpacity: number;
  shapeType: ShapeType;
  shapeStrokeColor: string;
  shapeFillColor: string;
  shapeStrokeWidth: number;
  shapeOpacity: number;
  markType: FormMarkType;
  markColor: string;
  whiteoutColor?: string;
}

export interface HistorySnapshot {
  pages: import('./pdf').PageModel[];
  currentPageId: string;
  objects: Record<string, EditorObject[]>; // key: pageId
}
