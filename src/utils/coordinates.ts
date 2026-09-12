import type { Point } from '../types/editor';

/**
 * Converts screen/pointer coordinates (relative to the page overlay) to PDF points.
 */
export function screenToPdf(
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
  zoom: number
): Point {
  const relX = clientX - containerRect.left;
  const relY = clientY - containerRect.top;

  return {
    x: Math.max(0, relX / zoom),
    y: Math.max(0, relY / zoom),
  };
}

/**
 * Converts PDF points to screen pixels.
 */
export function pdfToScreen(
  x: number,
  y: number,
  zoom: number
): Point {
  return {
    x: x * zoom,
    y: y * zoom,
  };
}

/**
 * Normalizes a rectangle defined by two points so that width and height are positive.
 */
export function normalizeRect(
  p1: Point,
  p2: Point
): { x: number; y: number; width: number; height: number } {
  const x = Math.min(p1.x, p2.x);
  const y = Math.min(p1.y, p2.y);
  const width = Math.abs(p2.x - p1.x);
  const height = Math.abs(p2.y - p1.y);

  return { x, y, width, height };
}
