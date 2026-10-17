import { describe, it, expect } from 'vitest';
import { getBoundingBox, applyResize, pointsToSvgPath } from '../geometry';
import type { BaseEditorObject } from '../../types/editor';

describe('Geometry utilities', () => {
  it('computes correct bounding box with padding', () => {
    const points = [
      { x: 10, y: 20 },
      { x: 30, y: 40 },
    ];
    const bbox = getBoundingBox(points, 4);
    expect(bbox.x).toBe(6);
    expect(bbox.y).toBe(16);
    expect(bbox.width).toBe(28); // 30 - 10 + 8
    expect(bbox.height).toBe(28); // 40 - 20 + 8
  });

  it('resizes rectangle from se handle', () => {
    const obj: BaseEditorObject = {
      id: '1',
      pageId: 'p1',
      x: 10,
      y: 10,
      width: 100,
      height: 50,
    };
    const resized = applyResize(obj, 'se', 20, 30);
    expect(resized.x).toBe(10);
    expect(resized.y).toBe(10);
    expect(resized.width).toBe(120);
    expect(resized.height).toBe(80);
  });

  it('resizes rectangle from nw handle without moving past minimum size', () => {
    const obj: BaseEditorObject = {
      id: '1',
      pageId: 'p1',
      x: 10,
      y: 10,
      width: 100,
      height: 50,
    };
    const resized = applyResize(obj, 'nw', 10, 10);
    expect(resized.x).toBe(20);
    expect(resized.y).toBe(20);
    expect(resized.width).toBe(90);
    expect(resized.height).toBe(40);
  });

  it('generates valid SVG path for points', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 20, y: 0 },
    ];
    const path = pointsToSvgPath(points);
    expect(path).toBe('M 0 0 L 10 10 L 20 0');
  });
});
