export type ToolType = 'select' | 'text' | 'draw' | 'highlight' | 'shape' | 'image';

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface BaseEditorObject {
  id: string;
  pageId: string;
  x: number; // PDF points (unscaled), top-left
  y: number; // PDF points (unscaled), top-left
  width: number; // PDF points
  height: number; // PDF points
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

export type EditorObject =
  | TextObject
  | DrawObject
  | HighlightObject
  | ShapeObject
  | ImageObject;

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
}

export interface HistorySnapshot {
  pages: import('./pdf').PageModel[];
  currentPageId: string;
  objects: Record<string, EditorObject[]>; // key: pageId
}
