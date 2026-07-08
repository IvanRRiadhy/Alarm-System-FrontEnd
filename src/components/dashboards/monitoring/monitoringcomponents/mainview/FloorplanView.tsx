import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';
import {
  IconPlus,
  IconMinus,
  IconMaximize,
  IconArrowsMinimize,
  IconCamera,
  IconDoor,
  IconWalk,
  IconGlassFull,
  IconAlertTriangle,
  IconHandStop,
  IconFlame,
  IconFingerprint,
  IconCircleDot,
  IconMapPin,
} from '@tabler/icons-react';
import SiteSelector from './SiteSelector';

// Device marker types
interface DeviceMarker {
  id: string;
  label?: string;
  top: string;
  left: string;
  type: 'camera' | 'door' | 'motion' | 'glass_break' | 'panic' | 'fire' | 'touch' | 'zone';
  color: string;
  hasAlert?: boolean;
}

const deviceMarkers: DeviceMarker[] = [
  { id: 'cam03', label: 'CAM 03', top: '22%', left: '32%', type: 'camera', color: '#22C55E' },
  { id: 'cam05', label: 'CAM 05', top: '62%', left: '48%', type: 'camera', color: '#22C55E' },
  { id: 'cam08', label: 'CAM 08', top: '25%', left: '78%', type: 'camera', color: '#22C55E' },
  { id: 'cam09', label: 'CAM 09', top: '18%', left: '85%', type: 'camera', color: '#22C55E' },
  { id: 'cam11', label: 'CAM 11', top: '42%', left: '22%', type: 'camera', color: '#22C55E' },
  { id: 'cam_atm', top: '48%', left: '15%', type: 'camera', color: '#22C55E' },
  { id: 'door1', top: '12%', left: '52%', type: 'door', color: '#EF4444', hasAlert: true },
  { id: 'door2', top: '88%', left: '45%', type: 'door', color: '#22C55E' },
  { id: 'motion1', top: '35%', left: '42%', type: 'motion', color: '#F59E0B' },
  { id: 'motion2', top: '55%', left: '25%', type: 'motion', color: '#22C55E' },
  { id: 'glass1', top: '18%', left: '40%', type: 'glass_break', color: '#22C55E' },
  { id: 'panic1', top: '50%', left: '60%', type: 'panic', color: '#22C55E' },
  { id: 'fire1', top: '30%', left: '65%', type: 'fire', color: '#22C55E' },
  { id: 'touch1', top: '70%', left: '70%', type: 'touch', color: '#22C55E' },
];

// Room labels
const roomLabels = [
  { label: 'Ruang Teller', top: '50%', left: '55%' },
  { label: 'Ruang Server', top: '30%', left: '80%' },
  { label: 'Area ATM', top: '50%', left: '12%' },
  { label: 'Pintu Utama', top: '8%', left: '52%' },
  { label: 'Pintu Belakang', top: '92%', left: '45%' },
];

const deviceTypeIcon: Record<string, React.ReactNode> = {
  camera: <IconCamera size={13} />,
  door: <IconDoor size={13} />,
  motion: <IconWalk size={13} />,
  glass_break: <IconGlassFull size={13} />,
  panic: <IconHandStop size={13} />,
  fire: <IconFlame size={13} />,
  touch: <IconFingerprint size={13} />,
  zone: <IconCircleDot size={13} />,
};

const legendItems = [
  { label: 'Camera', icon: <IconCamera size={14} />, color: '#22C55E' },
  { label: 'Access Door', icon: <IconDoor size={14} />, color: '#EF4444' },
  { label: 'Motion Detector', icon: <IconWalk size={14} />, color: '#F59E0B' },
  { label: 'Glass Break', icon: <IconGlassFull size={14} />, color: '#8B5CF6' },
  { label: 'Pintu / Door', icon: <IconDoor size={14} />, color: '#06B6D4' },
  { label: 'Panic Button', icon: <IconHandStop size={14} />, color: '#EC4899' },
  { label: 'Fire Alarm', icon: <IconFlame size={14} />, color: '#EF4444' },
  { label: 'Kick Alarm', icon: <IconAlertTriangle size={14} />, color: '#F59E0B' },
  { label: 'Touch Sensor', icon: <IconFingerprint size={14} />, color: '#3B82F6' },
  { label: 'Zone', icon: <IconCircleDot size={14} />, color: '#94A3B8' },
];

const FloorplanView: React.FC = () => {
  const [showSiteSelector, setShowSiteSelector] = useState(true);
  const [modeEdit, setModeEdit] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedSite, setSelectedSite] = useState('KCP Surabaya Diponegoro');
  const [selectedFloor, setSelectedFloor] = useState('Lantai 1');

  return (
    <Box
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0B1120',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          bgcolor: '#111827',
          zIndex: 5,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.5px',
            }}
          >
            MAIN VIEW - FLOORPLAN
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: 12 }}>
              {selectedSite} - {selectedFloor}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 0 }}>
              <Select
                value="current"
                variant="standard"
                disableUnderline
                sx={{
                  color: '#94A3B8',
                  fontSize: 12,
                  '& .MuiSelect-icon': { color: '#64748B', fontSize: 18 },
                  '& .MuiSelect-select': { py: 0, pr: '20px !important' },
                }}
              >
                <MenuItem value="current" sx={{ display: 'none' }}></MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        <IconButton
          size="small"
          onClick={() => setShowSiteSelector(!showSiteSelector)}
          sx={{
            color: '#94A3B8',
            bgcolor: 'rgba(255,255,255,0.04)',
            borderRadius: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
          }}
        >
          <IconMapPin size={16} />
        </IconButton>
      </Box>

      {/* Floorplan Area */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease',
          }}
        >
          {/* Floor plan image */}
          <img
            src="/images/floorplan.png"
            alt="Floor Plan"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              opacity: 0.85,
            }}
          />

          {/* Room Labels */}
          {roomLabels.map((room) => (
            <Typography
              key={room.label}
              sx={{
                position: 'absolute',
                top: room.top,
                left: room.left,
                transform: 'translate(-50%, -50%)',
                color: '#94A3B8',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.3px',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              {room.label}
            </Typography>
          ))}

          {/* Device Markers */}
          {deviceMarkers.map((marker) => (
            <Box
              key={marker.id}
              sx={{
                position: 'absolute',
                top: marker.top,
                left: marker.left,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.25,
              }}
            >
              {/* Marker dot */}
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: `${marker.color}`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 10px ${marker.color}60`,
                  border: marker.hasAlert
                    ? '2px solid #fff'
                    : '1px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'scale(1.2)',
                    boxShadow: `0 0 16px ${marker.color}`,
                  },
                  ...(marker.hasAlert && {
                    animation: 'pulse-alert 2s infinite',
                    '@keyframes pulse-alert': {
                      '0%': { boxShadow: `0 0 0 0 ${marker.color}80` },
                      '70%': { boxShadow: `0 0 0 8px ${marker.color}00` },
                      '100%': { boxShadow: `0 0 0 0 ${marker.color}00` },
                    },
                  }),
                }}
              >
                {deviceTypeIcon[marker.type]}
              </Box>

              {/* Camera label */}
              {marker.label && (
                <Typography
                  sx={{
                    color: '#E2E8F0',
                    fontSize: 9,
                    fontWeight: 600,
                    bgcolor: 'rgba(0,0,0,0.6)',
                    px: 0.75,
                    py: 0.15,
                    borderRadius: 0.5,
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3,
                  }}
                >
                  {marker.label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Zoom Controls */}
        <Box
          sx={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            zIndex: 5,
          }}
        >
          <IconButton
            size="small"
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
            sx={{
              bgcolor: 'rgba(17,24,39,0.85)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
            }}
          >
            <IconPlus size={14} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
            sx={{
              bgcolor: 'rgba(17,24,39,0.85)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
            }}
          >
            <IconMinus size={14} />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setZoom(1)}
            sx={{
              bgcolor: 'rgba(17,24,39,0.85)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
            }}
          >
            <IconArrowsMinimize size={14} />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              bgcolor: 'rgba(17,24,39,0.85)',
              color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)',
              width: 30,
              height: 30,
              '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
            }}
          >
            <IconMaximize size={14} />
          </IconButton>
        </Box>

        {/* Site Selector overlay */}
        <SiteSelector
          open={showSiteSelector}
          onClose={() => setShowSiteSelector(false)}
          onSelectFloor={(site, floor) => {
            setSelectedSite(site);
            setSelectedFloor(floor);
          }}
        />
      </Box>

      {/* Legend Bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          bgcolor: '#111827',
          flexShrink: 0,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {legendItems.map((item) => (
          <Box
            key={item.label}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              flexShrink: 0,
            }}
          >
            <Box sx={{ color: item.color, display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </Box>
            <Typography
              sx={{
                color: '#94A3B8',
                fontSize: 11,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </Typography>
          </Box>
        ))}

        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={modeEdit}
                onChange={(e) => setModeEdit(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#2563EB',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#94A3B8', fontSize: 11 }}>
                Mode Edit
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default FloorplanView;
