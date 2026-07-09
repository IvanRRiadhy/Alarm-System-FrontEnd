import { useState, useCallback } from 'react';
import { Box, IconButton, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import {
  useDeviceMappingList,
  useAddDeviceMapping,
  useEditDeviceMapping,
  useDeleteDeviceMapping,
} from 'src/hooks/useDeviceMapping';
import { GetFilter } from 'src/store/apps/crud/deviceMapping';
import DeviceMappingSidebar from './DeviceMappingSidebar';
import FloorplanCanvas from './FloorplanCanvas';
import toast from 'react-hot-toast';

interface FloorplanDeviceMapViewProps {
  floorplan: FloorplanType;
}

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const FloorplanDeviceMapView = ({ floorplan }: FloorplanDeviceMapViewProps) => {
  const navigate = useNavigate();

  // Shared state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Placement Dialog State
  const [pendingPlacement, setPendingPlacement] = useState<{ posPxX: number, posPxY: number } | null>(null);
  const [placementLabel, setPlacementLabel] = useState('');

  // Data
  const filter: GetFilter = {
    page: 1,
    limit: 100,
    sortBy: '',
    sortOrder: 'asc',
    floorplanId: floorplan.id,
  };
  const { data: mappingResponse, isLoading } = useDeviceMappingList(filter);
  const mappings = mappingResponse?.data || [];

  // Mutations
  const addMutation = useAddDeviceMapping();
  const editMutation = useEditDeviceMapping();
  const deleteMutation = useDeleteDeviceMapping();

  // --- Handlers ---

  // Toggle edit mode for a marker
  const handleEditToggle = useCallback(
    (id: string) => {
      // Exit placing mode when editing
      setIsPlacingMode(false);
      setEditingId((prev) => (prev === id ? null : id));
    },
    [],
  );

  // Delete a mapping
  const handleDelete = useCallback(
    (id: string) => {
      setDeletingId(id);
      deleteMutation.mutate(id, {
        onSuccess: () => {
          toast.success('Device mapping deleted');
          if (editingId === id) setEditingId(null);
        },
        onError: () => {
          toast.error('Failed to delete');
        },
        onSettled: () => {
          setDeletingId(null);
        },
      });
    },
    [deleteMutation, editingId],
  );

  // Enter placing mode
  const handleAddClick = useCallback(() => {
    setEditingId(null); // Exit edit mode
    setIsPlacingMode((prev) => !prev); // Toggle placing mode
  }, []);

  // Trigger placement popup at clicked position
  const handleCanvasClick = useCallback(
    (posPxX: number, posPxY: number) => {
      if (!isPlacingMode) return;
      setPendingPlacement({ posPxX, posPxY });
      setPlacementLabel('');
    },
    [isPlacingMode],
  );

  const handleConfirmPlacement = useCallback(() => {
    if (!pendingPlacement) return;

    addMutation.mutate(
      {
        deviceId: undefined as unknown as string, // null
        floorplanId: floorplan.id,
        posPxX: pendingPlacement.posPxX,
        posPxY: pendingPlacement.posPxY,
        label: placementLabel,
      },
      {
        onSuccess: () => {
          toast.success('Device mapping placed');
          setIsPlacingMode(false); // Exit placing mode after placing
          setPendingPlacement(null);
        },
        onError: () => {
          toast.error('Failed to place device mapping');
        },
      },
    );
  }, [pendingPlacement, placementLabel, addMutation, floorplan.id]);

  const handleCancelPlacement = useCallback(() => {
    setPendingPlacement(null);
  }, []);

  // Save new position after drag
  const handleMarkerDragEnd = useCallback(
    (id: string, posPxX: number, posPxY: number) => {
      editMutation.mutate(
        { id, posPxX, posPxY },
        {
          onSuccess: () => {
            toast.success('Position updated');
          },
          onError: () => {
            toast.error('Failed to update position');
          },
        },
      );
    },
    [editMutation],
  );

  const cdnImageUrl = getCdnUrl(floorplan.imageUrl);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1.5}>
        <IconButton onClick={() => navigate('/master/site/floorplan')} size="small">
          <IconArrowLeft size={22} />
        </IconButton>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {floorplan.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {floorplan.buildingName} — {floorplan.floorName}
          </Typography>
        </Box>
      </Box>

      {/* Main content: Sidebar + Canvas */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar */}
        <DeviceMappingSidebar
          mappings={mappings}
          isLoading={isLoading}
          editingId={editingId}
          selectedId={selectedId}
          isPlacingMode={isPlacingMode}
          onEditToggle={handleEditToggle}
          onSelectToggle={(id) => setSelectedId(prev => prev === id ? null : id)}
          onDelete={handleDelete}
          onAddClick={handleAddClick}
          isDeletingId={deletingId}
        />

        {/* Right Canvas */}
        <FloorplanCanvas
          imageUrl={cdnImageUrl}
          mappings={mappings}
          editingId={editingId}
          selectedId={selectedId}
          isPlacingMode={isPlacingMode}
          onMarkerDragEnd={handleMarkerDragEnd}
          onCanvasClick={handleCanvasClick}
        />
      </Box>

      {/* Label Input Dialog */}
      <Dialog open={!!pendingPlacement} onClose={handleCancelPlacement} maxWidth="xs" fullWidth>
        <DialogTitle>Name this device mapping</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Label"
            type="text"
            fullWidth
            variant="outlined"
            value={placementLabel}
            onChange={(e) => setPlacementLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmPlacement();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelPlacement} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmPlacement} variant="contained" disabled={addMutation.isPending}>
            {addMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FloorplanDeviceMapView;
