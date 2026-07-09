import { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import {
  useDeviceMappingList,
  useAddDeviceMapping,
  useEditDeviceMapping,
  useDeleteDeviceMapping,
} from 'src/hooks/useDeviceMapping';
import { useAreaList, useAddArea, useDeleteArea } from 'src/hooks/useArea';
import { useDeviceLookup } from 'src/hooks/useDevice';
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Placement Dialog State
  const [pendingPlacement, setPendingPlacement] = useState<{ posPxX: number; posPxY: number; areaId: string } | null>(null);
  const [placementLabel, setPlacementLabel] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Area Placement State
  const [isPlacingAreaMode, setIsPlacingAreaMode] = useState(false);
  const [pendingAreaNodes, setPendingAreaNodes] = useState<any[] | null>(null);
  const [areaName, setAreaName] = useState('');
  const [areaColor, setAreaColor] = useState('#EF4444');

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

  const { data: areaResponse } = useAreaList({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
    floorplanId: floorplan.id,
  });
  const areas = areaResponse?.data || [];

  // Fetch unassigned devices for placement dropdown
  const { data: lookupResponse } = useDeviceLookup({
    unassignedOnly: true,
  } as any);
  const lookupDevices = lookupResponse?.data || [];

  // Area delete state
  const [confirmDeleteAreaId, setConfirmDeleteAreaId] = useState<string | null>(null);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);

  // Mutations
  const addMutation = useAddDeviceMapping();
  const editMutation = useEditDeviceMapping();
  const deleteMutation = useDeleteDeviceMapping();
  const addAreaMutation = useAddArea();
  const deleteAreaMutation = useDeleteArea();

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
      setConfirmDeleteId(id);
    },
    [],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
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
  }, [confirmDeleteId, deleteMutation, editingId]);

  // Enter placing mode
  const handleAddClick = useCallback(() => {
    setEditingId(null); // Exit edit mode
    setIsPlacingAreaMode(false); // Exit area placing mode
    setIsPlacingMode((prev) => !prev); // Toggle placing mode
  }, []);

  // Enter area placing mode
  const handleAddAreaClick = useCallback(() => {
    setEditingId(null); // Exit edit mode
    setIsPlacingMode(false); // Exit device placing mode
    setIsPlacingAreaMode((prev) => !prev); // Toggle area placing mode
  }, []);

  // Trigger placement popup at clicked position
  const handleCanvasClick = useCallback(
    (posPxX: number, posPxY: number, areaId: string) => {
      if (!isPlacingMode) return;
      setPendingPlacement({ posPxX, posPxY, areaId });
      setPlacementLabel('');
      setSelectedDeviceId(''); // Reset dropdown
    },
    [isPlacingMode],
  );

  const handleConfirmPlacement = useCallback(() => {
    if (!pendingPlacement) return;

    addMutation.mutate(
      {
        deviceId: selectedDeviceId || null, // pass selectedDeviceId or null if none
        // floorplanId: floorplan.id,
        posPxX: pendingPlacement.posPxX,
        posPxY: pendingPlacement.posPxY,
        label: placementLabel,
        areaId: pendingPlacement.areaId, // areaId payload
      },
      {
        onSuccess: () => {
          toast.success('Device mapping placed');
          setIsPlacingMode(false); // Exit placing mode after placing
          setPendingPlacement(null);
          setSelectedDeviceId('');
        },
        onError: () => {
          toast.error('Failed to place device mapping');
        },
      },
    );
  }, [pendingPlacement, placementLabel, selectedDeviceId, addMutation, floorplan.id]);

  const handleCancelPlacement = useCallback(() => {
    setPendingPlacement(null);
  }, []);

  const handleAreaComplete = useCallback((nodes: any[]) => {
    setPendingAreaNodes(nodes);
    setAreaName('');
    setAreaColor('#EF4444');
  }, []);

  const handleConfirmAreaPlacement = useCallback(() => {
    if (!pendingAreaNodes || !areaName.trim()) {
      toast.error('Please enter a name for the area.');
      return;
    }

    addAreaMutation.mutate(
      {
        name: areaName,
        colorArea: areaColor,
        areaShape: JSON.stringify(pendingAreaNodes),
        floorplanId: floorplan.id,
        // siteId: floorplan.siteId,
      },
      {
        onSuccess: () => {
          toast.success('Area successfully created!');
          setIsPlacingAreaMode(false);
          setPendingAreaNodes(null);
        },
        onError: () => {
          toast.error('Failed to create area.');
        },
      }
    );
  }, [pendingAreaNodes, areaName, areaColor, addAreaMutation, floorplan.id, floorplan.siteId]);

  const handleCancelAreaPlacement = useCallback(() => {
    setPendingAreaNodes(null);
    setIsPlacingAreaMode(false); // Reset drawing mode so canvas clears the shape
  }, []);

  const handleDeleteArea = useCallback((id: string) => {
    setConfirmDeleteAreaId(id);
  }, []);

  const handleConfirmDeleteArea = useCallback(() => {
    if (!confirmDeleteAreaId) return;
    const id = confirmDeleteAreaId;
    setConfirmDeleteAreaId(null);
    setDeletingAreaId(id);
    deleteAreaMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Area deleted');
      },
      onError: () => {
        toast.error('Failed to delete area');
      },
      onSettled: () => {
        setDeletingAreaId(null);
      },
    });
  }, [confirmDeleteAreaId, deleteAreaMutation]);

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

  const handleSaveSidebarEdit = useCallback(
    (id: string, label: string, deviceId: string | null) => {
      editMutation.mutate(
        { id, label, deviceId },
        {
          onSuccess: () => {
            toast.success('Device mapping updated');
          },
          onError: () => {
            toast.error('Failed to update device mapping');
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
          minHeight: '80vh',
          display: 'flex',
          flex: 1,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Left Sidebar */}
        <DeviceMappingSidebar
          floorplanId={floorplan.id}
          mappings={mappings}
          isLoading={isLoading}
          editingId={editingId}
          selectedId={selectedId}
          isPlacingMode={isPlacingMode}
          isPlacingAreaMode={isPlacingAreaMode}
          onEditToggle={handleEditToggle}
          onSelectToggle={(id) => setSelectedId(prev => prev === id ? null : id)}
          onDelete={handleDelete}
          onAddClick={handleAddClick}
          onAddAreaClick={handleAddAreaClick}
          onSaveSidebarEdit={handleSaveSidebarEdit}
          isDeletingId={deletingId}
          onDeleteArea={handleDeleteArea}
          isDeletingAreaId={deletingAreaId}
        />

        {/* Right Canvas */}
        <FloorplanCanvas
          imageUrl={cdnImageUrl}
          mappings={mappings}
          areas={areas}
          editingId={editingId}
          selectedId={selectedId}
          isPlacingMode={isPlacingMode}
          isPlacingAreaMode={isPlacingAreaMode}
          onMarkerDragEnd={handleMarkerDragEnd}
          onCanvasClick={handleCanvasClick}
          onAddAreaComplete={handleAreaComplete}
        />
      </Box>

      {/* Label Input Dialog */}
      <Dialog open={!!pendingPlacement} onClose={handleCancelPlacement} maxWidth="xs" fullWidth>
        <DialogTitle>Name this device mapping</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
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
          <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
            <InputLabel id="select-device-lookup-label">Select Device (Optional)</InputLabel>
            <Select
              labelId="select-device-lookup-label"
              id="select-device-lookup"
              value={selectedDeviceId}
              label="Select Device (Optional)"
              onChange={(e) => setSelectedDeviceId(e.target.value as string)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {lookupDevices.map((dev) => (
                <MenuItem key={dev.id} value={dev.id}>
                  {dev.name} {dev.hardwareId ? `(${dev.hardwareId})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

      {/* Area Details Input Dialog */}
      <Dialog open={!!pendingAreaNodes} onClose={handleCancelAreaPlacement} maxWidth="xs" fullWidth>
        <DialogTitle>Create New Area</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Alert severity="warning" sx={{ fontSize: 12 }}>
            Make sure the details are correct. Created Area can&apos;t be edited! Deleting an Area
            will result in all Device Mappings inside it being deleted as well.
          </Alert>
          <TextField
            autoFocus
            margin="dense"
            label="Area Name"
            type="text"
            fullWidth
            variant="outlined"
            value={areaName}
            onChange={(e) => setAreaName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmAreaPlacement();
              }
            }}
          />
          <Typography variant="subtitle2" fontWeight={600} color="text.primary">
            Select Area Color:
          </Typography>
          <Box display="flex" gap={1.5} flexWrap="wrap">
            {['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((c) => (
              <Box
                key={c}
                onClick={() => setAreaColor(c)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: c,
                  cursor: 'pointer',
                  border: areaColor === c ? '3px solid #111827' : '2px solid transparent',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': { transform: 'scale(1.1)' },
                  transition: 'transform 0.1s',
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCancelAreaPlacement} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmAreaPlacement} variant="contained" disabled={addAreaMutation.isPending}>
            {addAreaMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Area Confirmation Dialog */}
      <Dialog open={!!confirmDeleteAreaId} onClose={() => setConfirmDeleteAreaId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Area</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <Alert severity="error" sx={{ fontSize: 12 }}>
            Deleting this area will also permanently delete all Device Mappings placed inside it.
            This action cannot be undone.
          </Alert>
          <Typography variant="body2">Are you sure you want to delete this area?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDeleteAreaId(null)} color="inherit">Cancel</Button>
          <Button
            onClick={handleConfirmDeleteArea}
            color="error"
            variant="contained"
            disabled={deleteAreaMutation.isPending}
          >
            {deleteAreaMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Device Mapping</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this device mapping?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmDeleteId(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FloorplanDeviceMapView;
