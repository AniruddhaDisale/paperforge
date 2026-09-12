import React, { useState, useRef, useCallback } from 'react';
import type {
  ToolType,
  EditorObject,
  ToolProperties,
  Point,
  ResizeHandle,
  TextObject,
  DrawObject,
  HighlightObject,
  ShapeObject,
  ImageObject,
} from '../../types/editor';
import { screenToPdf, normalizeRect } from '../../utils/coordinates';
import { getBoundingBox, applyResize, pointsToSvgPath } from '../../utils/geometry';
import { SelectionBox } from '../editor/SelectionBox';
import { TextAnnotation } from '../editor/TextAnnotation';
import { DrawingLayer } from '../editor/DrawingLayer';
import { HighlightAnnotation } from '../editor/HighlightAnnotation';
import { ShapeAnnotation } from '../editor/ShapeAnnotation';
import { ImageAnnotation } from '../editor/ImageAnnotation';

interface SelectionOverlayProps {
  pageId: string;
  width: number; // PDF points
  height: number; // PDF points
  zoom: number;
  activeTool: ToolType;
  properties: ToolProperties;
  objects: EditorObject[];
  selectedObjectId: string | null;
  onSelectObject: (id: string | null) => void;
  onAddObject: (obj: EditorObject) => void;
  onUpdateObject: (id: string, updates: Partial<EditorObject>) => void;
  onDeleteObject: (id: string) => void;
  onCommitOperation?: () => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  pageId,
  width,
  height,
  zoom,
  activeTool,
  properties,
  objects,
  selectedObjectId,
  onSelectObject,
  onAddObject,
  onUpdateObject,
  onDeleteObject,
  onCommitOperation,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Active drawing stroke state
  const [activeStroke, setActiveStroke] = useState<Point[]>([]);

  // Active drag creation for highlight / shape
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragCurrentPoint, setDragCurrentPoint] = useState<Point | null>(null);

  // Interaction mode for moving / resizing existing objects
  const interactionRef = useRef<{
    mode: 'move' | 'resize';
    handle?: ResizeHandle;
    initialObject: EditorObject;
    startPdfPoint: Point;
  } | null>(null);

  const selectedObject = objects.find((o) => o.id === selectedObjectId) || null;

  // Handles pointer down on the overlay background
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const pdfPt = screenToPdf(e.clientX, e.clientY, rect, zoom);

      if (activeTool === 'select') {
        // Clicked background -> deselect
        onSelectObject(null);
        return;
      }

      if (activeTool === 'text') {
        e.preventDefault();
        const newText: TextObject = {
          id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          pageId,
          type: 'text',
          x: pdfPt.x,
          y: pdfPt.y,
          width: 140,
          height: 30,
          text: 'Click to edit text',
          fontSize: properties.fontSize,
          fontFamily: properties.fontFamily,
          color: properties.textColor,
          isBold: properties.isBold,
          isItalic: properties.isItalic,
          align: properties.textAlign,
        };
        onAddObject(newText);
        onSelectObject(newText.id);
        return;
      }

      if (activeTool === 'draw') {
        e.preventDefault();
        overlayRef.current.setPointerCapture(e.pointerId);
        setActiveStroke([pdfPt]);
        return;
      }

      if (activeTool === 'highlight' || activeTool === 'shape') {
        e.preventDefault();
        overlayRef.current.setPointerCapture(e.pointerId);
        setDragStartPoint(pdfPt);
        setDragCurrentPoint(pdfPt);
        return;
      }
    },
    [activeTool, pageId, zoom, properties, onAddObject, onSelectObject]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!overlayRef.current) return;
      const rect = overlayRef.current.getBoundingClientRect();
      const pdfPt = screenToPdf(e.clientX, e.clientY, rect, zoom);

      // Moving / Resizing existing object
      if (interactionRef.current) {
        const { mode, handle, initialObject, startPdfPoint } = interactionRef.current;
        const dx = pdfPt.x - startPdfPoint.x;
        const dy = pdfPt.y - startPdfPoint.y;

        if (mode === 'move') {
          // Clamp to page boundaries
          const clampedX = Math.max(0, Math.min(width - initialObject.width, initialObject.x + dx));
          const clampedY = Math.max(0, Math.min(height - initialObject.height, initialObject.y + dy));

          if (initialObject.type === 'draw') {
            const shiftX = clampedX - initialObject.x;
            const shiftY = clampedY - initialObject.y;
            const shiftedPoints = (initialObject as DrawObject).points.map((p) => ({
              x: p.x + shiftX,
              y: p.y + shiftY,
            }));
            onUpdateObject(initialObject.id, {
              x: clampedX,
              y: clampedY,
              points: shiftedPoints,
            });
          } else {
            onUpdateObject(initialObject.id, {
              x: clampedX,
              y: clampedY,
            });
          }
        } else if (mode === 'resize' && handle) {
          const resized = applyResize(initialObject, handle, dx, dy);
          onUpdateObject(initialObject.id, resized);
        }
        return;
      }

      // Drawing freehand
      if (activeTool === 'draw' && activeStroke.length > 0) {
        setActiveStroke((prev) => [...prev, pdfPt]);
        return;
      }

      // Highlight or Shape dragging
      if ((activeTool === 'highlight' || activeTool === 'shape') && dragStartPoint) {
        setDragCurrentPoint(pdfPt);
        return;
      }
    },
    [activeTool, activeStroke.length, dragStartPoint, width, height, zoom, onUpdateObject]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // Release captured pointer
      if (overlayRef.current && overlayRef.current.hasPointerCapture(e.pointerId)) {
        try {
          overlayRef.current.releasePointerCapture(e.pointerId);
        } catch {
          // Ignore
        }
      }

      // If finished moving/resizing
      if (interactionRef.current) {
        interactionRef.current = null;
        if (onCommitOperation) onCommitOperation();
        return;
      }

      // Commit freehand draw
      if (activeTool === 'draw' && activeStroke.length > 0) {
        if (activeStroke.length > 1) {
          const bbox = getBoundingBox(activeStroke, 2);
          const newDraw: DrawObject = {
            id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            pageId,
            type: 'draw',
            x: bbox.x,
            y: bbox.y,
            width: bbox.width,
            height: bbox.height,
            points: activeStroke,
            strokeColor: properties.drawColor,
            strokeWidth: properties.drawWidth,
            opacity: properties.drawOpacity,
          };
          onAddObject(newDraw);
          onSelectObject(newDraw.id);
        }
        setActiveStroke([]);
        return;
      }

      // Commit highlight
      if (activeTool === 'highlight' && dragStartPoint && dragCurrentPoint) {
        const r = normalizeRect(dragStartPoint, dragCurrentPoint);
        if (r.width > 4 && r.height > 4) {
          const newHighlight: HighlightObject = {
            id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            pageId,
            type: 'highlight',
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            color: properties.highlightColor,
            opacity: properties.highlightOpacity,
          };
          onAddObject(newHighlight);
          onSelectObject(newHighlight.id);
        }
        setDragStartPoint(null);
        setDragCurrentPoint(null);
        return;
      }

      // Commit shape
      if (activeTool === 'shape' && dragStartPoint && dragCurrentPoint) {
        const isLineOrArrow = properties.shapeType === 'line' || properties.shapeType === 'arrow';
        let x = dragStartPoint.x;
        let y = dragStartPoint.y;
        let w = dragCurrentPoint.x - dragStartPoint.x;
        let h = dragCurrentPoint.y - dragStartPoint.y;

        if (!isLineOrArrow) {
          const r = normalizeRect(dragStartPoint, dragCurrentPoint);
          x = r.x;
          y = r.y;
          w = Math.max(10, r.width);
          h = Math.max(10, r.height);
        }

        if (Math.abs(w) > 4 || Math.abs(h) > 4) {
          const newShape: ShapeObject = {
            id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            pageId,
            type: 'shape',
            shapeType: properties.shapeType,
            x,
            y,
            width: w,
            height: h,
            strokeColor: properties.shapeStrokeColor,
            fillColor: properties.shapeFillColor,
            strokeWidth: properties.shapeStrokeWidth,
            opacity: properties.shapeOpacity,
          };
          onAddObject(newShape);
          onSelectObject(newShape.id);
        }
        setDragStartPoint(null);
        setDragCurrentPoint(null);
        return;
      }
    },
    [
      activeTool,
      activeStroke,
      dragStartPoint,
      dragCurrentPoint,
      pageId,
      properties,
      onAddObject,
      onSelectObject,
      onCommitOperation,
    ]
  );

  const startMoveObject = (obj: EditorObject, e: React.PointerEvent) => {
    if (activeTool !== 'select') return;
    if (!overlayRef.current) return;
    overlayRef.current.setPointerCapture(e.pointerId);

    const rect = overlayRef.current.getBoundingClientRect();
    const startPt = screenToPdf(e.clientX, e.clientY, rect, zoom);

    interactionRef.current = {
      mode: 'move',
      initialObject: { ...obj },
      startPdfPoint: startPt,
    };
  };

  const startResizeObject = (handle: ResizeHandle, e: React.PointerEvent) => {
    if (!selectedObject || !overlayRef.current) return;
    overlayRef.current.setPointerCapture(e.pointerId);

    const rect = overlayRef.current.getBoundingClientRect();
    const startPt = screenToPdf(e.clientX, e.clientY, rect, zoom);

    interactionRef.current = {
      mode: 'resize',
      handle,
      initialObject: { ...selectedObject },
      startPdfPoint: startPt,
    };
  };

  // Preview coordinates for in-progress highlight / shape drag
  const dragRect =
    dragStartPoint && dragCurrentPoint
      ? normalizeRect(dragStartPoint, dragCurrentPoint)
      : null;

  return (
    <div
      ref={overlayRef}
      className={`selection-overlay tool-${activeTool}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* SVG Layer for Drawing and Shapes */}
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
        }}
      >
        <g style={{ pointerEvents: 'auto' }}>
          {objects
            .filter((o): o is DrawObject => o.type === 'draw')
            .map((draw) => (
              <DrawingLayer
                key={draw.id}
                object={draw}
                zoom={zoom}
                isSelected={draw.id === selectedObjectId}
                onSelect={() => onSelectObject(draw.id)}
                onStartMove={(e) => startMoveObject(draw, e)}
              />
            ))}

          {objects
            .filter((o): o is ShapeObject => o.type === 'shape')
            .map((shape) => (
              <ShapeAnnotation
                key={shape.id}
                object={shape}
                zoom={zoom}
                isSelected={shape.id === selectedObjectId}
                onSelect={() => onSelectObject(shape.id)}
                onStartMove={(e) => startMoveObject(shape, e)}
              />
            ))}
        </g>

        {/* Active Freehand Draw Preview */}
        {activeStroke.length > 1 && (
          <path
            d={pointsToSvgPath(activeStroke.map((p) => ({ x: p.x * zoom, y: p.y * zoom })))}
            fill="none"
            stroke={properties.drawColor}
            strokeWidth={(properties.drawWidth || 2) * zoom}
            strokeOpacity={properties.drawOpacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Active Shape Drag Preview */}
        {activeTool === 'shape' && dragStartPoint && dragCurrentPoint && (
          <g style={{ pointerEvents: 'none' }}>
            {properties.shapeType === 'rectangle' && dragRect && (
              <rect
                x={dragRect.x * zoom}
                y={dragRect.y * zoom}
                width={dragRect.width * zoom}
                height={dragRect.height * zoom}
                fill={properties.shapeFillColor === 'transparent' ? 'none' : properties.shapeFillColor}
                stroke={properties.shapeStrokeColor}
                strokeWidth={(properties.shapeStrokeWidth || 2) * zoom}
                opacity={properties.shapeOpacity}
              />
            )}
            {properties.shapeType === 'circle' && dragRect && (
              <ellipse
                cx={(dragRect.x + dragRect.width / 2) * zoom}
                cy={(dragRect.y + dragRect.height / 2) * zoom}
                rx={(dragRect.width / 2) * zoom}
                ry={(dragRect.height / 2) * zoom}
                fill={properties.shapeFillColor === 'transparent' ? 'none' : properties.shapeFillColor}
                stroke={properties.shapeStrokeColor}
                strokeWidth={(properties.shapeStrokeWidth || 2) * zoom}
                opacity={properties.shapeOpacity}
              />
            )}
            {(properties.shapeType === 'line' || properties.shapeType === 'arrow') && (
              <line
                x1={dragStartPoint.x * zoom}
                y1={dragStartPoint.y * zoom}
                x2={dragCurrentPoint.x * zoom}
                y2={dragCurrentPoint.y * zoom}
                stroke={properties.shapeStrokeColor}
                strokeWidth={(properties.shapeStrokeWidth || 2) * zoom}
                opacity={properties.shapeOpacity}
                strokeLinecap="round"
              />
            )}
          </g>
        )}
      </svg>

      {/* HTML Layer for Highlights, Images, Text & Selection Box */}
      {objects
        .filter((o): o is HighlightObject => o.type === 'highlight')
        .map((hl) => (
          <HighlightAnnotation
            key={hl.id}
            object={hl}
            zoom={zoom}
            isSelected={hl.id === selectedObjectId}
            onSelect={() => onSelectObject(hl.id)}
            onStartMove={(e) => startMoveObject(hl, e)}
          />
        ))}

      {objects
        .filter((o): o is ImageObject => o.type === 'image')
        .map((img) => (
          <ImageAnnotation
            key={img.id}
            object={img}
            zoom={zoom}
            isSelected={img.id === selectedObjectId}
            onSelect={() => onSelectObject(img.id)}
            onStartMove={(e) => startMoveObject(img, e)}
          />
        ))}

      {objects
        .filter((o): o is TextObject => o.type === 'text')
        .map((txt) => (
          <TextAnnotation
            key={txt.id}
            object={txt}
            zoom={zoom}
            isSelected={txt.id === selectedObjectId}
            onSelect={() => onSelectObject(txt.id)}
            onUpdateText={(newText) => onUpdateObject(txt.id, { text: newText })}
            onStartMove={(e) => startMoveObject(txt, e)}
          />
        ))}

      {/* Active Highlight Drag Preview */}
      {activeTool === 'highlight' && dragRect && (
        <div
          style={{
            position: 'absolute',
            left: dragRect.x * zoom,
            top: dragRect.y * zoom,
            width: dragRect.width * zoom,
            height: dragRect.height * zoom,
            backgroundColor: properties.highlightColor,
            opacity: properties.highlightOpacity,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Selection Box with Resize Handles and Quick Delete */}
      {selectedObject && (
        <SelectionBox
          object={selectedObject}
          zoom={zoom}
          onStartResize={startResizeObject}
          onDelete={() => onDeleteObject(selectedObject.id)}
          allowResize={selectedObject.type !== 'draw'}
        />
      )}
    </div>
  );
};
