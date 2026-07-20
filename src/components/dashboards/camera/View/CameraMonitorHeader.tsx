import React from 'react';
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Chip,
} from '@mui/material';
import { IconVideo, IconFilter } from '@tabler/icons-react';

interface CameraMonitorHeaderProps {
  gridColumns: number;
  onGridColumnsChange: (cols: number) => void;
  showActiveOnly: boolean;
  onToggleActiveOnly: () => void;
  totalCameras: number;
  activeCameras: number;
}

const CameraMonitorHeader: React.FC<CameraMonitorHeaderProps> = ({
  gridColumns,
  onGridColumnsChange,
  showActiveOnly,
  onToggleActiveOnly,
  totalCameras,
  activeCameras,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 2,
        py: 1,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        bgcolor: '#111827',
        flexShrink: 0,
      }}
    >
      {/* Left: Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: 'rgba(59,130,246,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconVideo size={18} color="#3B82F6" />
        </Box>
        <Box>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.3px',
            }}
          >
            CCTV Monitoring
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: 10, fontWeight: 500 }}>
            {activeCameras} active · {totalCameras} total cameras
          </Typography>
        </Box>
      </Box>

      {/* Right: Controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {/* Active only filter */}
        <Chip
          icon={<IconFilter size={13} />}
          label={showActiveOnly ? 'Active Only' : 'All Cameras'}
          onClick={onToggleActiveOnly}
          size="small"
          sx={{
            height: 28,
            fontSize: 11,
            fontWeight: 600,
            bgcolor: showActiveOnly ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
            color: showActiveOnly ? '#22C55E' : '#94A3B8',
            border: showActiveOnly
              ? '1px solid rgba(34,197,94,0.3)'
              : '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer',
            '& .MuiChip-icon': {
              color: showActiveOnly ? '#22C55E' : '#64748B',
            },
            '&:hover': {
              bgcolor: showActiveOnly ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
            },
          }}
        />

        {/* Grid size selector */}
        <FormControl size="small">
          <Select
            value={gridColumns}
            onChange={(e) => onGridColumnsChange(Number(e.target.value))}
            sx={{
              height: 28,
              fontSize: 11,
              fontWeight: 600,
              color: '#E2E8F0',
              bgcolor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 1,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSvgIcon-root': { color: '#64748B', fontSize: 16 },
              '& .MuiSelect-select': { py: 0.5, px: 1.5 },
            }}
          >
            <MenuItem value={2}>2 columns</MenuItem>
            <MenuItem value={3}>3 columns</MenuItem>
            <MenuItem value={4}>4 columns</MenuItem>
            <MenuItem value={6}>6 columns</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default CameraMonitorHeader;
