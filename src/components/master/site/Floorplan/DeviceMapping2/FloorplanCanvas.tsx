import { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import { Box, Typography } from '@mui/material';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import Konva from 'konva';

interface FloorplanCanvasProps {
  imageUrl: string;
  mappings: DeviceMappingType[];
  editingId: string | null;
  selectedId: string | null;
  isPlacingMode: boolean;
  onMarkerDragEnd: (id: string, posPxX: number, posPxY: number) => void;
  onCanvasClick: (posPxX: number, posPxY: number) => void;
}

const MARKER_SIZE = 28;

const FloorplanCanvas = ({
  imageUrl,
  mappings,
  editingId,
  selectedId,
  isPlacingMode,
  onMarkerDragEnd,
  onCanvasClick,
}: FloorplanCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

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

  // Handle stage click (for placing mode)
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (!isPlacingMode) return;

      const clickedOnEmpty = e.target === e.target.getStage() || e.target.getClassName() === 'Image';
      if (!clickedOnEmpty) return;

      const stage = e.target.getStage();
      if (!stage) return;

      const pointerPosition = stage.getPointerPosition();
      if (!pointerPosition) return;

      // Convert global pointer position to position inside the transformed image
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointerPosition);

      // Convert local pixel position to percentage of base size
      const posPxX = parseFloat(((pos.x / baseSize.width) * 100).toFixed(2));
      const posPxY = parseFloat(((pos.y / baseSize.height) * 100).toFixed(2));

      // Limit click strictly within image bounds
      if (posPxX < 0 || posPxX > 100 || posPxY < 0 || posPxY > 100) return;

      onCanvasClick(posPxX, posPxY);
    },
    [isPlacingMode, baseSize, onCanvasClick],
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
        cursor: isPlacingMode ? 'crosshair' : 'default',
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
          draggable={!isPlacingMode} // Allow pan when not placing
          onDragEnd={(e) => {
            if (e.target.getClassName() === 'Stage') {
              setStagePos({ x: e.target.x(), y: e.target.y() });
            }
          }}
          onWheel={handleWheel}
          onClick={handleStageClick}
          style={{ display: 'block', cursor: !isPlacingMode ? (stageScale > 1 ? 'grab' : 'default') : undefined }}
          onMouseDown={(e) => {
             // visually show grabbing for stage panning
             if (!isPlacingMode && (e.target.getClassName() === 'Stage' || e.target.getClassName() === 'Image')) {
               const container = e.target.getStage()?.container();
               if (container) container.style.cursor = 'grabbing';
             }
          }}
          onMouseUp={(e) => {
             if (!isPlacingMode) {
               const container = e.target.getStage()?.container();
               if (container) container.style.cursor = stageScale > 1 ? 'grab' : 'default';
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
    </Box>
  );
};

export default FloorplanCanvas;
