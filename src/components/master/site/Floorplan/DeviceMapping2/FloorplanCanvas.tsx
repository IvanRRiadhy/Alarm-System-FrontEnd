import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Line, Circle } from 'react-konva';
import { Box, Typography, lighten, darken } from '@mui/material';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { areaType } from 'src/store/apps/crud/area';
import Konva from 'konva';
import toast from 'react-hot-toast';

type Point = { x: number; y: number };

// Point in polygon helper
const isPointInPolygon = (p: Point, vs: { x_px: number; y_px: number }[]) => {
  let x = p.x, y = p.y;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i].x_px, yi = vs[i].y_px;
    const xj = vs[j].x_px, yj = vs[j].y_px;
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Line segment intersection checker matching EditAreaRenderer
const doLineSegmentsIntersect = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): boolean => {
  const orientation = (
    px1: number,
    py1: number,
    px2: number,
    py2: number,
    px3: number,
    py3: number,
  ) => {
    const val = (py2 - py1) * (px3 - px2) - (px2 - px1) * (py3 - py2);
    if (val === 0) return 0;
    return val > 0 ? 1 : 2;
  };

  const onSegment = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => {
    return (
      qx <= Math.max(px, rx) &&
      qx >= Math.min(px, rx) &&
      qy <= Math.max(py, ry) &&
      qy >= Math.min(py, ry)
    );
  };

  const o1 = orientation(x1, y1, x2, y2, x3, y3);
  const o2 = orientation(x1, y1, x2, y2, x4, y4);
  const o3 = orientation(x3, y3, x4, y4, x1, y1);
  const o4 = orientation(x3, y3, x4, y4, x2, y2);

  if (o1 !== o2 && o3 !== o4) return true;

  if (o1 === 0 && onSegment(x1, y1, x3, y3, x2, y2)) return true;
  if (o2 === 0 && onSegment(x1, y1, x4, y4, x2, y2)) return true;
  if (o3 === 0 && onSegment(x3, y3, x1, y1, x4, y4)) return true;
  if (o4 === 0 && onSegment(x3, y3, x2, y2, x4, y4)) return true;

  return false;
};

// Self-intersection check for open lines while drawing
const checkSelfIntersectionsOpen = (nodes: { x_px: number; y_px: number }[]): boolean => {
  const n = nodes.length;
  if (n < 4) return false;
  const lastX1 = nodes[n - 2].x_px;
  const lastY1 = nodes[n - 2].y_px;
  const lastX2 = nodes[n - 1].x_px;
  const lastY2 = nodes[n - 1].y_px;

  for (let i = 0; i < n - 3; i++) {
    const x1 = nodes[i].x_px;
    const y1 = nodes[i].y_px;
    const x2 = nodes[i + 1].x_px;
    const y2 = nodes[i + 1].y_px;

    if (doLineSegmentsIntersect(lastX1, lastY1, lastX2, lastY2, x1, y1, x2, y2)) {
      return true;
    }
  }
  return false;
};

// Self-intersection check for closed polygons matching EditAreaRenderer
const checkSelfIntersectionsClosed = (nodes: { x_px: number; y_px: number }[]): boolean => {
  const n = nodes.length;
  for (let i = 0; i < n; i++) {
    const x1 = nodes[i].x_px;
    const y1 = nodes[i].y_px;
    const x2 = nodes[(i + 1) % n].x_px;
    const y2 = nodes[(i + 1) % n].y_px;

    for (let j = i + 2; j < n; j++) {
      if (j === i || (j + 1) % n === i) continue;

      const x3 = nodes[j].x_px;
      const y3 = nodes[j].y_px;
      const x4 = nodes[(j + 1) % n].x_px;
      const y4 = nodes[(j + 1) % n].y_px;

      if (doLineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) {
        return true;
      }
    }
  }
  return false;
};

// Check if a segment intersects any boundary of existing areas
const checkIntersectionWithExistingAreas = (
  p1: Point,
  p2: Point,
  existingAreas: areaType[],
): boolean => {
  for (const area of existingAreas) {
    if (!area.areaNodes || area.areaNodes.length < 2) continue;
    const n = area.areaNodes.length;
    for (let i = 0; i < n; i++) {
      const nextIdx = (i + 1) % n;
      const a1 = area.areaNodes[i];
      const a2 = area.areaNodes[nextIdx];
      if (doLineSegmentsIntersect(p1.x, p1.y, p2.x, p2.y, a1.x_px, a1.y_px, a2.x_px, a2.y_px)) {
        return true;
      }
    }
  }
  return false;
};

interface FloorplanCanvasProps {
  imageUrl: string;
  mappings: DeviceMappingType[];
  areas?: areaType[];
  editingId: string | null;
  selectedId: string | null;
  isPlacingMode: boolean;
  isPlacingAreaMode: boolean;
  onMarkerDragEnd: (id: string, posPxX: number, posPxY: number) => void;
  onCanvasClick: (posPxX: number, posPxY: number, areaId: string) => void;
  onAddAreaComplete: (nodes: any[]) => void;
}

const MARKER_SIZE = 28;

const FloorplanCanvas = ({
  imageUrl,
  mappings,
  areas = [],
  editingId,
  selectedId,
  isPlacingMode,
  isPlacingAreaMode,
  onMarkerDragEnd,
  onCanvasClick,
  onAddAreaComplete,
}: FloorplanCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [drawingNodes, setDrawingNodes] = useState<any[]>([]);
  const [polygonClosed, setPolygonClosed] = useState(false);
  const [mouseWorldPos, setMouseWorldPos] = useState<{ x_px: number; y_px: number } | null>(null);
  const [isHoveringInsideArea, setIsHoveringInsideArea] = useState(false);

  // Stage size is the physical size of the DOM container
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  // Base image dimension scaled to initially fit container
  const [baseSize, setBaseSize] = useState({ width: 800, height: 600 });

  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Load the floorplan image and calculate initial fit
  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      if (containerRef.current) {
        const cWidth = containerRef.current.offsetWidth;
        const cHeight = containerRef.current.offsetHeight || 500;
        setContainerSize({ width: cWidth, height: cHeight });

        // Calculate a scale to fit the image into the container
        const fitScale = Math.min(cWidth / img.width, cHeight / img.height);
        const sWidth = img.width * fitScale;
        const sHeight = img.height * fitScale;

        setBaseSize({ width: sWidth, height: sHeight });
        setStageScale(1); // 1 means exactly fitted

        // Center it in the container
        setStagePos({
          x: (cWidth - sWidth) / 2,
          y: (cHeight - sHeight) / 2,
        });
      }
    };
  }, [imageUrl]);

  // Handle Resize of the container
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && image) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [image]);

  // Handle Zoom with mouse wheel
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault(); // prevent page scroll
      const stage = e.target.getStage();
      if (!stage) return;

      const scaleBy = 1.1;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      // Mouse position relative to the stage
      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      // Zoom in or out
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      
      // Limit zoom bounds
      if (newScale < 0.3 || newScale > 8) return; 

      setStageScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [stageScale, stagePos],
  );

  useEffect(() => {
    if (!isPlacingAreaMode) {
      setDrawingNodes([]);
      setPolygonClosed(false);
      setMouseWorldPos(null);
    }
  }, [isPlacingAreaMode]);

  useEffect(() => {
    if (!isPlacingMode) {
      setIsHoveringInsideArea(false);
    }
  }, [isPlacingMode]);

  // Handle stage mouse move (for drawing preview or hovering check)
  const handleStageMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);

      const fitScale = image ? baseSize.width / image.width : 1;
      const x_px = pos.x / fitScale;
      const y_px = pos.y / fitScale;

      if (isPlacingAreaMode && image) {
        setMouseWorldPos({ x_px, y_px });
      }

      if (isPlacingMode) {
        // Check if cursor is inside any registered area
        let inside = false;
        for (const area of areas) {
          if (area.areaNodes && isPointInPolygon({ x: x_px, y: y_px }, area.areaNodes)) {
            inside = true;
            break;
          }
        }
        setIsHoveringInsideArea(inside);
      }
    },
    [isPlacingAreaMode, isPlacingMode, image, baseSize, areas],
  );

  // Handle stage click (for placing mode or drawing mode)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert global pointer position to position inside the transformed image
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointerPosition);

      if (isPlacingMode && image) {
        const fitScale = baseSize.width / image.width;
        const x_px = pos.x / fitScale;
        const y_px = pos.y / fitScale;

        // Check if clicked position is inside any area
        let matchingAreaId = '';
        for (const area of areas) {
          if (area.areaNodes && isPointInPolygon({ x: x_px, y: y_px }, area.areaNodes)) {
            matchingAreaId = area.id;
            break;
          }
        }

        if (!matchingAreaId) {
          toast.error("Device can only be mapped inside a registered area!");
          return;
        }

        const clickedOnEmpty = e.target === stage || e.target.getClassName() === 'Image';
        if (!clickedOnEmpty) return;

        // Convert local pixel position to percentage of base size
        const posPxX = parseFloat(((pos.x / baseSize.width) * 100).toFixed(2));
        const posPxY = parseFloat(((pos.y / baseSize.height) * 100).toFixed(2));

        // Limit click strictly within image bounds
        if (posPxX < 0 || posPxX > 100 || posPxY < 0 || posPxY > 100) return;

        onCanvasClick(posPxX, posPxY, matchingAreaId);
      } else if (isPlacingAreaMode && image) {
        // Do nothing if polygon already closed (waiting for backend submit)
        if (polygonClosed) return;

        const fitScale = baseSize.width / image.width;
        const x_px = pos.x / fitScale;
        const y_px = pos.y / fitScale;

        // Limit click strictly within image bounds
        if (x_px < 0 || x_px > image.width || y_px < 0 || y_px > image.height) return;

        // 1. Check if inside any existing areas
        for (const area of areas) {
          if (area.areaNodes && isPointInPolygon({ x: x_px, y: y_px }, area.areaNodes)) {
            toast.error("Point cannot be inside an existing area!");
            return;
          }
        }

        // 2. Check if we click near the first node to close the polygon
        if (drawingNodes.length >= 3) {
          const firstNode = drawingNodes[0];
          const dist = Math.hypot(firstNode.x_px - x_px, firstNode.y_px - y_px);
          if (dist < 15) {
            // Check if closing segment intersects existing areas
            const pLast = { x: drawingNodes[drawingNodes.length - 1].x_px, y: drawingNodes[drawingNodes.length - 1].y_px };
            const pFirst = { x: firstNode.x_px, y: firstNode.y_px };

            if (checkIntersectionWithExistingAreas(pLast, pFirst, areas)) {
              toast.error("Closing line segment crosses an existing area!");
              return;
            }

            // Check if closing the polygon creates self-intersection (excluding adjacent segments)
            // checkSelfIntersectionsClosed closes the shape internally, so we pass drawingNodes directly
            if (checkSelfIntersectionsClosed(drawingNodes)) {
              toast.error("Closing line segment crosses another segment of the shape you are drawing!");
              return;
            }

            // Complete! Keep drawingNodes so polygon stays visible until backend submit clears isPlacingAreaMode
            onAddAreaComplete(drawingNodes);
            setPolygonClosed(true);
            setMouseWorldPos(null);
            return;
          }
        }

        // 3. Check segment intersection if drawingNodes.length > 0
        if (drawingNodes.length > 0) {
          const lastNode = drawingNodes[drawingNodes.length - 1];
          const pLast = { x: lastNode.x_px, y: lastNode.y_px };
          const pNew = { x: x_px, y: y_px };

          // Check if segment crosses existing areas
          if (checkIntersectionWithExistingAreas(pLast, pNew, areas)) {
            toast.error("Line segment crosses an existing area!");
            return;
          }

          // Check if adding this point creates self-intersection (including the proposed new segment)
          const proposedNodes = [...drawingNodes, { id: 'temp', x: x_px, y: y_px, x_px, y_px }];
          if (checkSelfIntersectionsOpen(proposedNodes)) {
            toast.error("Line segment crosses another segment of the shape you are drawing!");
            return;
          }
        }

        // Add node
        const newNode = {
          id: Math.random().toString(36).substring(7),
          x: x_px,
          y: y_px,
          x_px,
          y_px,
        };
        setDrawingNodes([...drawingNodes, newNode]);
      }
    },
    [isPlacingMode, isPlacingAreaMode, polygonClosed, baseSize, image, drawingNodes, areas, onCanvasClick, onAddAreaComplete],
  );

  const handleRightClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault();
      if (isPlacingAreaMode) {
        setDrawingNodes([]);
        setPolygonClosed(false);
        setMouseWorldPos(null);
        toast.success("Drawing cancelled");
      }
    },
    [isPlacingAreaMode],
  );

  // Handle marker drag end
  const handleDragEnd = useCallback(
    (mappingId: string, e: Konva.KonvaEventObject<DragEvent>) => {
      // Ignore if panning the stage
      if (e.target.getClassName() === 'Stage') return;

      const node = e.target;
      // node.x() and node.y() are relative to the Stage's unscaled coordinate system (which is our baseSize)
      const posPxX = parseFloat(((node.x() / baseSize.width) * 100).toFixed(2));
      const posPxY = parseFloat(((node.y() / baseSize.height) * 100).toFixed(2));

      // Clamp to bounds
      const clampedX = Math.max(0, Math.min(100, posPxX));
      const clampedY = Math.max(0, Math.min(100, posPxY));

      onMarkerDragEnd(mappingId, clampedX, clampedY);
    },
    [baseSize, onMarkerDragEnd],
  );

  if (!imageUrl) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f7fa', borderRadius: 2 }}>
        <Typography color="text.secondary">No floorplan image available</Typography>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        flex: 1,
        position: 'relative',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#f5f7fa',
        cursor: isPlacingMode ? (isHoveringInsideArea ? 'crosshair' : 'grab') : 'default',
        '& .konvajs-content': { outline: 'none' }, // Remove focus outline
      }}
    >
      {image && (
        <Stage
          width={containerSize.width}
          height={containerSize.height}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={!isPlacingAreaMode} // Allow pan when not drawing areas
          onDragEnd={(e) => {
            if (e.target.getClassName() === 'Stage') {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onMouseMove={handleStageMouseMove}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onContextMenu={handleRightClick}
          style={{
            display: 'block',
            cursor: isPlacingAreaMode
              ? 'crosshair'
              : isPlacingMode
              ? (isHoveringInsideArea ? 'crosshair' : 'grab')
              : stageScale > 1
              ? 'grab'
              : 'default',
          }}
          onMouseDown={(e) => {
             // visually show grabbing for stage panning
             if (!isPlacingAreaMode && (!isPlacingMode || !isHoveringInsideArea) && (e.target.getClassName() === 'Stage' || e.target.getClassName() === 'Image')) {
               const container = e.target.getStage()?.container();
               if (container) container.style.cursor = 'grabbing';
             }
          }}
          onMouseUp={(e) => {
             if (!isPlacingAreaMode && (!isPlacingMode || !isHoveringInsideArea)) {
               const container = e.target.getStage()?.container();
               if (container) container.style.cursor = isPlacingMode ? 'grab' : (stageScale > 1 ? 'grab' : 'default');
             }
          }}
        >
          {/* Background image layer */}
          <Layer>
            <KonvaImage
              image={image}
              width={baseSize.width}
              height={baseSize.height}
            />
          </Layer>

          {/* Areas Layer */}
          {areas.length > 0 && image && (
            <Layer>
              {areas.map((area) => {
                const fitScale = baseSize.width / image.width;
                const points =
                  area.areaNodes?.flatMap((node) => [
                    node.x_px * fitScale,
                    node.y_px * fitScale,
                  ]) || [];
                const color = area.colorArea || '#FF4D4F';

                return (
                  <Group key={area.id} listening={false}>
                    <Line
                      points={points}
                      stroke={darken(color, 0.4)}
                      strokeWidth={2}
                      lineJoin="round"
                      lineCap="round"
                      closed
                      fill={lighten(color, 0.75)}
                      opacity={0.55}
                    />
                    {/* Optional: Add name label inside the area if we have nodes */}
                    {area.areaNodes && area.areaNodes.length > 0 && (
                      <Text
                        text={area.name}
                        x={
                          (area.areaNodes.reduce((acc, curr) => acc + curr.x_px, 0) /
                            area.areaNodes.length) *
                            fitScale -
                          50
                        }
                        y={
                          (area.areaNodes.reduce((acc, curr) => acc + curr.y_px, 0) /
                            area.areaNodes.length) *
                            fitScale -
                          6
                        }
                        width={100}
                        align="center"
                        fontSize={10}
                        fontStyle="bold"
                        fill={darken(color, 0.5)}
                      />
                    )}
                  </Group>
                );
              })}
            </Layer>
          )}

          {/* Placing mode overlay */}
          {isPlacingMode && (
            <Layer>
              <Rect
                width={baseSize.width}
                height={baseSize.height}
                fill="rgba(40, 199, 111, 0.08)"
                listening={false}
              />
            </Layer>
          )}

          {/* Device markers layer */}
          <Layer>
            {mappings.map((mapping) => {
              const isEditing = editingId === mapping.id;
              const isSelected = selectedId === mapping.id;
              const x = (mapping.posPxX / 100) * baseSize.width;
              const y = (mapping.posPxY / 100) * baseSize.height;
              const halfSize = MARKER_SIZE / 2;

              return (
                <Group
                  key={mapping.id}
                  x={x}
                  y={y}
                  draggable={isEditing}
                  onMouseEnter={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      container.style.cursor = isEditing ? 'grab' : 'pointer';
                    }
                  }}
                  onMouseLeave={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      container.style.cursor = isPlacingMode ? 'crosshair' : (stageScale > 1 ? 'grab' : 'default');
                    }
                  }}
                  onDragStart={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      container.style.cursor = 'grabbing';
                    }
                  }}
                  onDragEnd={(e) => {
                    const container = e.target.getStage()?.container();
                    if (container) {
                      container.style.cursor = isEditing ? 'grab' : 'pointer';
                    }
                    handleDragEnd(mapping.id, e);
                  }}
                  dragBoundFunc={(pos) => ({
                    x: Math.max(0, Math.min(baseSize.width, pos.x)),
                    y: Math.max(0, Math.min(baseSize.height, pos.y)),
                  })}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <Rect
                      x={-(halfSize + 6)}
                      y={-(halfSize + 6)}
                      width={MARKER_SIZE + 12}
                      height={MARKER_SIZE + 12}
                      stroke="#28c76f"
                      strokeWidth={2}
                      cornerRadius={8}
                      dash={[4, 4]}
                    />
                  )}
                  {/* White box with green outline */}
                  <Rect
                    x={-halfSize}
                    y={-halfSize}
                    width={MARKER_SIZE}
                    height={MARKER_SIZE}
                    fill={isEditing ? 'rgba(40, 199, 111, 0.25)' : 'rgba(255, 255, 255, 0.92)'}
                    stroke={isEditing ? '#1fa855' : '#28c76f'}
                    strokeWidth={isEditing ? 3 : 2}
                    cornerRadius={6}
                    shadowColor="rgba(0,0,0,0.2)"
                    shadowBlur={isEditing ? 8 : 4}
                    shadowOffset={{ x: 0, y: 2 }}
                    shadowOpacity={0.3}
                  />
                  {/* Green dot indicator */}
                  <Rect
                    x={-4}
                    y={-4}
                    width={8}
                    height={8}
                    fill="#28c76f"
                    cornerRadius={4}
                  />
                  {/* Label text below marker */}
                  {(mapping.label || mapping.deviceName) && (
                    <Text
                      text={mapping.label || mapping.deviceName || ''}
                      x={-40}
                      y={halfSize + 4}
                      width={80}
                      fontSize={10}
                      fontStyle="bold"
                      fill={isEditing ? '#1fa855' : '#333'}
                      align="center"
                      // Keep scale of text consistent even if zoomed out/in
                      scaleX={1 / stageScale}
                      scaleY={1 / stageScale}
                    />
                  )}
                </Group>
              );
            })}
          </Layer>

          {/* Drawing nodes layer */}
          {isPlacingAreaMode && drawingNodes.length > 0 && image && (
            <Layer>
              {/* Closed polygon fill preview */}
              {polygonClosed && drawingNodes.length >= 3 && (
                <Line
                  points={drawingNodes.flatMap((n) => [
                    n.x_px * (baseSize.width / image.width),
                    n.y_px * (baseSize.width / image.width),
                  ])}
                  closed
                  fill="rgba(59,130,246,0.15)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              )}

              {/* Close path hover point — only visible while still drawing */}
              {!polygonClosed && (
                <Circle
                  x={drawingNodes[0].x_px * (baseSize.width / image.width)}
                  y={drawingNodes[0].y_px * (baseSize.width / image.width)}
                  radius={8}
                  fill="blue"
                  stroke="black"
                  strokeWidth={2}
                  onMouseEnter={(e) => {
                    const shape = e.target as any;
                    shape.radius(11);
                    shape.fill('green');
                    shape.getLayer()?.batchDraw();
                  }}
                  onMouseLeave={(e) => {
                    const shape = e.target as any;
                    shape.radius(8);
                    shape.fill('blue');
                    shape.getLayer()?.batchDraw();
                  }}
                />
              )}

              {/* Individual node dots */}
              {drawingNodes.slice(polygonClosed ? 0 : 1).map((node) => (
                <Circle
                  key={node.id}
                  x={node.x_px * (baseSize.width / image.width)}
                  y={node.y_px * (baseSize.width / image.width)}
                  radius={5}
                  fill={polygonClosed ? '#3b82f6' : 'black'}
                  opacity={0.8}
                />
              ))}

              {/* Drawn segments — only shown while still drawing (closed polygon uses Line closed above) */}
              {!polygonClosed && drawingNodes.length > 1 &&
                drawingNodes.map((node, index) => {
                  if (index === drawingNodes.length - 1) return null;
                  const nextNode = drawingNodes[index + 1];
                  const fitScale = baseSize.width / image.width;
                  return (
                    <Line
                      key={`line-${node.id}`}
                      points={[
                        node.x_px * fitScale,
                        node.y_px * fitScale,
                        nextNode.x_px * fitScale,
                        nextNode.y_px * fitScale,
                      ]}
                      stroke="blue"
                      strokeWidth={2}
                      dash={[5, 5]}
                    />
                  );
                })}

              {/* Line to mouse pointer — only while still drawing */}
              {!polygonClosed && mouseWorldPos && (
                <Line
                  points={[
                    drawingNodes[drawingNodes.length - 1].x_px * (baseSize.width / image.width),
                    drawingNodes[drawingNodes.length - 1].y_px * (baseSize.width / image.width),
                    mouseWorldPos.x_px * (baseSize.width / image.width),
                    mouseWorldPos.y_px * (baseSize.width / image.width),
                  ]}
                  stroke="blue"
                  strokeWidth={2}
                  dash={[5, 5]}
                />
              )}

              {/* Dotted line from first node to mouse to show polygon closing shape */}
              {!polygonClosed && drawingNodes.length > 2 && mouseWorldPos && (
                <Line
                  points={[
                    drawingNodes[0].x_px * (baseSize.width / image.width),
                    drawingNodes[0].y_px * (baseSize.width / image.width),
                    mouseWorldPos.x_px * (baseSize.width / image.width),
                    mouseWorldPos.y_px * (baseSize.width / image.width),
                  ]}
                  stroke="blue"
                  strokeWidth={1.5}
                  dash={[2, 4]}
                  opacity={0.5}
                />
              )}
            </Layer>
          )}
        </Stage>
      )}

      {/* Loading state */}
      {!image && imageUrl && (
        <Box
          sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Typography color="text.secondary">Loading floorplan image...</Typography>
        </Box>
      )}

      {/* Placing mode banner */}
      {isPlacingMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(40, 199, 111, 0.9)',
            color: '#fff',
            px: 3,
            py: 1,
            borderRadius: 2,
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(40, 199, 111, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" fontWeight={700}>
            Click anywhere on the map to place a device
          </Typography>
        </Box>
      )}

      {/* Drawing Area Mode banner */}
      {isPlacingAreaMode && (
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(2, 132, 199, 0.9)',
            color: '#fff',
            px: 3,
            py: 1,
            borderRadius: 2,
            zIndex: 10,
            boxShadow: '0 4px 16px rgba(2, 132, 199, 0.3)',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="body2" fontWeight={700}>
            Click on map to place nodes. Click first node (blue circle) to close path.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FloorplanCanvas;
