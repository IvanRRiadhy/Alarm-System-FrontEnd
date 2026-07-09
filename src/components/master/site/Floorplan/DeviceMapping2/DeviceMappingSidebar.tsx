import { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Tooltip,
  Collapse,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import {
  IconPlus,
  IconPencil,
  IconPencilOff,
  IconTrash,
  IconMapPin,
  IconChevronDown,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { useAreaList } from 'src/hooks/useArea';
import { useDeviceLookup } from 'src/hooks/useDevice';

interface DeviceMappingSidebarProps {
  floorplanId: string;
  mappings: DeviceMappingType[];
  isLoading: boolean;
  editingId: string | null;
  selectedId: string | null;
  isPlacingMode: boolean;
  isPlacingAreaMode: boolean;
  onEditToggle: (id: string) => void;
  onSelectToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  onAddAreaClick: () => void;
  onSaveSidebarEdit: (id: string, label: string, deviceId: string | null) => void;
  isDeletingId: string | null;
  onDeleteArea: (id: string) => void;
  isDeletingAreaId: string | null;
}

const DeviceMappingSidebar = ({
  floorplanId,
  mappings,
  isLoading,
  editingId,
  selectedId,
  isPlacingMode,
  isPlacingAreaMode,
  onEditToggle,
  onSelectToggle,
  onDelete,
  onAddClick,
  onAddAreaClick,
  onSaveSidebarEdit,
  isDeletingId,
  onDeleteArea,
  isDeletingAreaId,
}: DeviceMappingSidebarProps) => {
  const [areasExpanded, setAreasExpanded] = useState(true);
  const [mappingsExpanded, setMappingsExpanded] = useState(true);

  // Local editing states
  const [editLabel, setEditLabel] = useState('');
  const [editDeviceId, setEditDeviceId] = useState('');

  // Fetch Area List for this floorplan
  const { data: areaResponse, isLoading: isLoadingAreas } = useAreaList({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
    floorplanId,
  });
  const areas = areaResponse?.data || [];

  // Fetch unassigned devices for dropdown lookup
  const { data: lookupResponse } = useDeviceLookup({
    unassignedOnly: true,
  } as any);
  const lookupDevices = lookupResponse?.data || [];

  // Helper to compile dropdown options containing unassigned devices + current assigned device
  const getDropdownDevices = (mapping: DeviceMappingType) => {
    const list = [...lookupDevices];
    if (mapping.deviceId && !list.some((d) => d.id === mapping.deviceId)) {
      list.unshift({
        id: mapping.deviceId,
        name: mapping.deviceName || 'Current Device',
        hardwareId: mapping.hardwareId || '',
      } as any);
    }
    return list;
  };

  const handleEditStart = (mapping: DeviceMappingType) => {
    setEditLabel(mapping.label || '');
    setEditDeviceId(mapping.deviceId || '');
    onEditToggle(mapping.id);
  };

  const handleEditSave = (mapping: DeviceMappingType) => {
    onSaveSidebarEdit(mapping.id, editLabel, editDeviceId || null);
    onEditToggle(mapping.id); // Toggle off edit mode
  };

  const handleEditCancel = (mapping: DeviceMappingType) => {
    onEditToggle(mapping.id); // Toggle off edit mode
  };

  return (
    <Box
      sx={{
        width: 300,
        minWidth: 300,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        {/* Section 1: Areas */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box
            onClick={() => setAreasExpanded(!areasExpanded)}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ cursor: 'pointer', flexGrow: 1, py: 0.5 }}
          >
            <IconChevronDown
              size={18}
              style={{
                transform: areasExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
                color: '#64748B',
              }}
            />
            <Typography variant="subtitle1" fontWeight={700}>
              Registered Areas ({areas.length})
            </Typography>
          </Box>
          <Tooltip title={isPlacingAreaMode ? 'Click on the map to draw. Click first point to close path.' : 'Add Area Shape'} arrow>
            <Button
              variant={isPlacingAreaMode ? 'contained' : 'outlined'}
              color={isPlacingAreaMode ? 'warning' : 'primary'}
              size="small"
              startIcon={isPlacingAreaMode ? <IconMapPin size={14} /> : <IconPlus size={14} />}
              onClick={onAddAreaClick}
              disabled={!!editingId}
              sx={{ minWidth: 'auto', textTransform: 'none', py: 0.25, px: 1, height: 28 }}
            >
              {isPlacingAreaMode ? 'Drawing...' : 'Add'}
            </Button>
          </Tooltip>
        </Box>

        <Collapse in={areasExpanded}>
          <Box sx={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}>
            {isLoadingAreas ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={20} />
              </Box>
            ) : areas.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No registered areas yet.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {areas.map((area) => (
                  <Box
                    key={area.id}
                    sx={{
                      px: 2,
                      py: 1.2,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: area.colorArea || '#ccc',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {area.name}
                      </Typography>
                    </Box>
                    <Tooltip title="Delete Area" arrow>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onDeleteArea(area.id)}
                          disabled={isDeletingAreaId === area.id}
                          sx={{ p: 0.5 }}
                        >
                          {isDeletingAreaId === area.id
                            ? <CircularProgress size={14} color="error" />
                            : <IconTrash size={15} />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Section 2: Device Mappings */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Box
            onClick={() => setMappingsExpanded(!mappingsExpanded)}
            display="flex"
            alignItems="center"
            gap={1}
            sx={{ cursor: 'pointer', flexGrow: 1, py: 0.5 }}
          >
            <IconChevronDown
              size={18}
              style={{
                transform: mappingsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s',
                color: '#64748B',
              }}
            />
            <Typography variant="subtitle1" fontWeight={700}>
              Device Mappings ({mappings.length})
            </Typography>
          </Box>
          <Tooltip title={isPlacingMode ? 'Click on the map to place' : 'Add Device Mapping'} arrow>
            <Button
              variant={isPlacingMode ? 'contained' : 'outlined'}
              color={isPlacingMode ? 'warning' : 'primary'}
              size="small"
              startIcon={isPlacingMode ? <IconMapPin size={14} /> : <IconPlus size={14} />}
              onClick={onAddClick}
              disabled={!!editingId}
              sx={{ minWidth: 'auto', textTransform: 'none', py: 0.25, px: 1, height: 28 }}
            >
              {isPlacingMode ? 'Placing...' : 'Add'}
            </Button>
          </Tooltip>
        </Box>

        <Collapse in={mappingsExpanded}>
          <Box>
            {isLoading ? (
              <Box display="flex" justifyContent="center" py={2}>
                <CircularProgress size={20} />
              </Box>
            ) : mappings.length === 0 ? (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No device mappings yet.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Click "Add" to place a device on the map.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {mappings.map((mapping) => {
                  const isEditing = editingId === mapping.id;
                  const isSelected = selectedId === mapping.id;
                  const isActive = isEditing || isSelected;

                  if (isEditing) {
                    return (
                      <Box
                        key={mapping.id}
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1.5,
                          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                          bgcolor: 'rgba(40, 199, 111, 0.06)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <TextField
                          size="small"
                          label="Label"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          fullWidth
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel id={`edit-device-select-label-${mapping.id}`}>Select Device (Optional)</InputLabel>
                          <Select
                            labelId={`edit-device-select-label-${mapping.id}`}
                            value={editDeviceId}
                            label="Select Device (Optional)"
                            onChange={(e) => setEditDeviceId(e.target.value as string)}
                          >
                            <MenuItem value="">
                              <em>None</em>
                            </MenuItem>
                            {getDropdownDevices(mapping).map((dev) => (
                              <MenuItem key={dev.id} value={dev.id}>
                                {dev.name} {dev.hardwareId ? `(${dev.hardwareId})` : ''}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleEditCancel(mapping)}
                            sx={{ border: '1px solid rgba(0,0,0,0.1)' }}
                          >
                            <IconX size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleEditSave(mapping)}
                            sx={{ border: '1px solid rgba(40, 199, 111, 0.2)', bgcolor: 'rgba(40, 199, 111, 0.08)' }}
                          >
                            <IconCheck size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    );
                  }

                  return (
                    <Box
                      key={mapping.id}
                      onClick={() => {
                        if (editingId) return;
                        onSelectToggle(mapping.id);
                      }}
                      sx={{
                        px: 2,
                        py: 1.2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 1,
                        borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                        bgcolor: isActive ? 'primary.light' : 'transparent',
                        transition: 'background-color 0.2s',
                        cursor: editingId ? 'default' : 'pointer',
                        '&:hover': {
                          bgcolor: isActive ? 'primary.light' : (editingId ? 'transparent' : 'action.hover'),
                        },
                      }}
                    >
                      {/* Info */}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight={isActive ? 700 : 600}
                          noWrap
                          color={isActive ? 'primary.main' : 'text.primary'}
                        >
                          {mapping.label || mapping.deviceName || 'Unnamed'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          ({mapping.posPxX.toFixed(1)}%, {mapping.posPxY.toFixed(1)}%)
                          {mapping.deviceType ? ` • ${mapping.deviceType}` : ''}
                        </Typography>
                      </Box>

                      {/* Actions */}
                      <Box display="flex" gap={0.5} flexShrink={0}>
                        <Tooltip title="Edit / Move" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="default"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStart(mapping);
                              }}
                              disabled={!!editingId}
                            >
                              <IconPencil size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete" arrow>
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(mapping.id);
                              }}
                              disabled={!!editingId || isDeletingId === mapping.id}
                            >
                              {isDeletingId === mapping.id ? (
                                <CircularProgress size={14} color="error" />
                              ) : (
                                <IconTrash size={16} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Footer count */}
      <Divider />
      <Box sx={{ p: 1.5, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {mappings.length} mapping{mappings.length !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Box>
  );
};

export default DeviceMappingSidebar;
