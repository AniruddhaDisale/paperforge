import { describe, it, expect } from 'vitest';
import { screenToPdf, pdfToScreen, normalizeRect } from '../coordinates';

describe('Coordinates utilities', () => {
  it('converts screen coordinates to PDF coordinates with zoom', () => {
    const mockRect = { left: 100, top: 50 } as DOMRect;
    const pt = screenToPdf(200, 150, mockRect, 2.0);
    // (200 - 100) / 2 = 50, (150 - 50) / 2 = 50
    expect(pt.x).toBe(50);
    expect(pt.y).toBe(50);
  });

  it('clamps screenToPdf output to non-negative numbers', () => {
    const mockRect = { left: 100, top: 100 } as DOMRect;
    const pt = screenToPdf(50, 50, mockRect, 1.0);
    expect(pt.x).toBe(0);
    expect(pt.y).toBe(0);
  });

  it('converts PDF points to screen pixels', () => {
    const pt = pdfToScreen(50, 80, 1.5);
    expect(pt.x).toBe(75);
    expect(pt.y).toBe(120);
  });

  it('normalizes arbitrary two points into positive width/height rect', () => {
    const rect = normalizeRect({ x: 200, y: 150 }, { x: 50, y: 30 });
    expect(rect.x).toBe(50);
    expect(rect.y).toBe(30);
    expect(rect.width).toBe(150);
    expect(rect.height).toBe(120);
  });
});
