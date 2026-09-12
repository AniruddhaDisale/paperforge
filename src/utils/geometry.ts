import type { Point, ResizeHandle, BaseEditorObject } from '../types/editor';

/**
 * Computes bounding box for an array of points.
 */
export function getBoundingBox(points: Point[], padding = 4): { x: number; y: number; width: number; height: number } {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const x = Math.max(0, minX - padding);
  const y = Math.max(0, minY - padding);
  const width = Math.max(12, maxX - minX + padding * 2);
  const height = Math.max(12, maxY - minY + padding * 2);

  return { x, y, width, height };
}

/**
 * Resizes a bounding box given an active handle and delta (dx, dy) in PDF points.
 */
export function applyResize(
  initialObj: BaseEditorObject,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  minWidth = 15,
  minHeight = 15
): { x: number; y: number; width: number; height: number } {
  let { x, y, width, height } = initialObj;

  switch (handle) {
    case 'nw': {
      const newWidth = Math.max(minWidth, width - dx);
      const newHeight = Math.max(minHeight, height - dy);
      x += width - newWidth;
      y += height - newHeight;
      width = newWidth;
      height = newHeight;
      break;
    }
    case 'n': {
      const newHeight = Math.max(minHeight, height - dy);
      y += height - newHeight;
      height = newHeight;
      break;
    }
    case 'ne': {
      width = Math.max(minWidth, width + dx);
      const newHeight = Math.max(minHeight, height - dy);
      y += height - newHeight;
      height = newHeight;
      break;
    }
    case 'e': {
      width = Math.max(minWidth, width + dx);
      break;
    }
    case 'se': {
      width = Math.max(minWidth, width + dx);
      height = Math.max(minHeight, height + dy);
      break;
    }
    case 's': {
      height = Math.max(minHeight, height + dy);
      break;
    }
    case 'sw': {
      const newWidth = Math.max(minWidth, width - dx);
      x += width - newWidth;
      width = newWidth;
      height = Math.max(minHeight, height + dy);
      break;
    }
    case 'w': {
      const newWidth = Math.max(minWidth, width - dx);
      x += width - newWidth;
      width = newWidth;
      break;
    }
  }

  return { x, y, width, height };
}

/**
 * Converts an array of points to an SVG path d-string.
 */
export function pointsToSvgPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}
