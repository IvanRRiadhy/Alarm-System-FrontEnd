import {
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { IconPlus, IconPencil, IconPencilOff, IconTrash, IconMapPin } from '@tabler/icons-react';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';

interface DeviceMappingSidebarProps {
  mappings: DeviceMappingType[];
  isLoading: boolean;
  editingId: string | null;
  selectedId: string | null;
  isPlacingMode: boolean;
  onEditToggle: (id: string) => void;
  onSelectToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddClick: () => void;
  isDeletingId: string | null;
}

const DeviceMappingSidebar = ({
  mappings,
  isLoading,
  editingId,
  selectedId,
  isPlacingMode,
  onEditToggle,
  onSelectToggle,
  onDelete,
  onAddClick,
  isDeletingId,
}: DeviceMappingSidebarProps) => {
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
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight={700}>
          Device Mappings
        </Typography>
        <Tooltip title={isPlacingMode ? 'Click on the map to place' : 'Add Device Mapping'} arrow>
          <Button
            variant={isPlacingMode ? 'contained' : 'outlined'}
            color={isPlacingMode ? 'warning' : 'primary'}
            size="small"
            startIcon={isPlacingMode ? <IconMapPin size={16} /> : <IconPlus size={16} />}
            onClick={onAddClick}
            sx={{ minWidth: 'auto', textTransform: 'none' }}
          >
            {isPlacingMode ? 'Placing...' : 'Add'}
          </Button>
        </Tooltip>
      </Box>
      <Divider />

      {/* List */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Scrollbar sx={{ height: '100%' }}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : mappings.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No device mappings yet.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Click "Add" to place a device on the map.
              </Typography>
            </Box>
          ) : (
            mappings.map((mapping) => {
              const isEditing = editingId === mapping.id;
              const isSelected = selectedId === mapping.id;
              const isActive = isEditing || isSelected;

              return (
                <Box
                  key={mapping.id}
                  onClick={() => onSelectToggle(mapping.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1,
                    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
                    bgcolor: isActive ? 'primary.light' : 'transparent',
                    transition: 'background-color 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: isActive ? 'primary.light' : 'action.hover',
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
                    <Tooltip title={isEditing ? 'Stop Editing' : 'Edit / Move'} arrow>
                      <IconButton
                        size="small"
                        color={isEditing ? 'primary' : 'default'}
                        onClick={(e) => { e.stopPropagation(); onEditToggle(mapping.id); }}
                      >
                        {isEditing ? <IconPencilOff size={16} /> : <IconPencil size={16} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete" arrow>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); onDelete(mapping.id); }}
                        disabled={isDeletingId === mapping.id}
                      >
                        {isDeletingId === mapping.id ? (
                          <CircularProgress size={14} color="error" />
                        ) : (
                          <IconTrash size={16} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              );
            })
          )}
        </Scrollbar>
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
