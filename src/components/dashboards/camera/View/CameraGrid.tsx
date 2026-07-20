import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import CameraCell from './CameraCell';
import { deviceType } from 'src/store/apps/crud/devices';

interface CameraGridProps {
  cameras: deviceType[];
  activeCameraIds: Set<string>;
  gridColumns: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  selectedCameraId: string | null;
  onSelectCamera: (camera: deviceType) => void;
  showActiveOnly: boolean;
}

const GRID_ROWS = 4;

const CameraGrid: React.FC<CameraGridProps> = ({
  cameras,
  activeCameraIds,
  gridColumns,
  selectedCameraId,
  onSelectCamera,
  showActiveOnly,
}) => {
  // Sort cameras: active ones first, then the rest
  const sortedCameras = useMemo(() => {
    let filtered = showActiveOnly
      ? cameras.filter((c) => activeCameraIds.has(c.id))
      : cameras;

    const active = filtered.filter((c) => activeCameraIds.has(c.id));
    const inactive = filtered.filter((c) => !activeCameraIds.has(c.id));
    return [...active, ...inactive];
  }, [cameras, activeCameraIds, showActiveOnly]);

  // Ensure minimum of 24 cells are rendered
  const minCells = 24;
  const totalCellsToRender = Math.max(minCells, sortedCameras.length);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        minWidth: 0,
      }}
    >
      {/* Grid container with scrolling enabled */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
          gridAutoRows: 'min-content',
          minHeight: 0,
          minWidth: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 3,
          },
        }}
      >
        {sortedCameras.map((camera) => (
          <CameraCell
            key={camera.id}
            camera={camera}
            isActive={activeCameraIds.has(camera.id)}
            isSelected={selectedCameraId === camera.id}
            onClick={onSelectCamera}
          />
        ))}
        {/* Fill empty cells to maintain grid structure up to a minimum of 24 cells */}
        {sortedCameras.length < totalCellsToRender &&
          Array.from({ length: totalCellsToRender - sortedCameras.length }).map((_, i) => (
            <Box
              key={`empty-${i}`}
              sx={{
                bgcolor: '#0a0e1a',
                border: '1px solid rgba(255,255,255,0.06)',
                aspectRatio: '16/9', // Maintain cell shape even when empty
              }}
            />
          ))}
      </Box>
    </Box>
  );
};

export default CameraGrid;
