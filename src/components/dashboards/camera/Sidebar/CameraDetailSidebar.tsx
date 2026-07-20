import React from 'react';
import { Box, Typography, IconButton, Divider, Chip } from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconVideo,
  IconMapPin,
  IconBuilding,
  IconBuildingSkyscraper,
  IconMap,
  IconWorld,
} from '@tabler/icons-react';
import { deviceType } from 'src/store/apps/crud/devices';

interface CameraDetailSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedCamera: deviceType | null;
  /** Extra location info resolved from device mappings or other sources */
  locationInfo?: {
    areaName?: string;
    floorplanName?: string;
    floorName?: string;
    buildingName?: string;
    siteName?: string;
  };
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: 0.75,
        bgcolor: 'rgba(255,255,255,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        mt: 0.25,
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: '#64748B', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography noWrap sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 500, mt: 0.25 }}>
        {value || '—'}
      </Typography>
    </Box>
  </Box>
);

const CameraDetailSidebar: React.FC<CameraDetailSidebarProps> = ({
  isOpen,
  onToggle,
  selectedCamera,
  locationInfo,
}) => {
  return (
    <Box
      sx={{
        width: isOpen ? 260 : 0,
        minWidth: isOpen ? 260 : 0,
        flexShrink: 0,
        borderRight: isOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible',
        bgcolor: '#0b0f19',
        zIndex: 2,
      }}
    >
      {/* Toggle button */}
      <IconButton
        onClick={onToggle}
        size="small"
        sx={{
          position: 'absolute',
          right: isOpen ? 0 : -24,
          top: 55,
          zIndex: 10,
          width: 28,
          height: 28,
          bgcolor: '#0b0f19',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '50%',
          color: '#94A3B8',
          '&:hover': { bgcolor: '#111827', color: '#fff' },
        }}
      >
        {isOpen ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
      </IconButton>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.2s',
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'rgba(255,255,255,0.1)',
            borderRadius: 2,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Camera Details
          </Typography>
        </Box>

        {!selectedCamera ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60%',
              color: '#475569',
              textAlign: 'center',
              px: 3,
            }}
          >
            <IconVideo size={32} stroke={1.2} />
            <Typography sx={{ mt: 1.5, fontSize: 12, fontWeight: 500, color: '#64748B' }}>
              Select a camera to view details
            </Typography>
          </Box>
        ) : (
          <Box sx={{ px: 2, py: 1.5 }}>
            {/* Device name */}
            <Box sx={{ mb: 1.5 }}>
              <Typography sx={{ color: '#F8FAFC', fontSize: 14, fontWeight: 600 }}>
                {selectedCamera.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                <Chip
                  label={selectedCamera.deviceType}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 9,
                    fontWeight: 700,
                    bgcolor: 'rgba(59,130,246,0.12)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59,130,246,0.2)',
                  }}
                />
                <Chip
                  label={selectedCamera.isOnline === 'true' ? 'Online' : 'Offline'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 9,
                    fontWeight: 700,
                    bgcolor: selectedCamera.isOnline === 'true' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: selectedCamera.isOnline === 'true' ? '#22C55E' : '#EF4444',
                    border: `1px solid ${selectedCamera.isOnline === 'true' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />

            {/* Device info */}
            <InfoRow icon={<IconVideo size={14} color="#60A5FA" />} label="Device" value={selectedCamera.name} />
            <InfoRow icon={<IconVideo size={14} color="#60A5FA" />} label="Hardware ID" value={selectedCamera.hardwareId} />
            <InfoRow icon={<IconVideo size={14} color="#60A5FA" />} label="IP Address" value={selectedCamera.ipAddress} />

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1 }} />

            {/* Location info */}
            <Typography sx={{ color: '#64748B', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', mb: 0.5 }}>
              Location
            </Typography>
            <InfoRow icon={<IconMapPin size={14} color="#F59E0B" />} label="Area" value={locationInfo?.areaName} />
            <InfoRow icon={<IconMap size={14} color="#8B5CF6" />} label="Floorplan" value={locationInfo?.floorplanName} />
            <InfoRow icon={<IconBuildingSkyscraper size={14} color="#EC4899" />} label="Floor" value={locationInfo?.floorName} />
            <InfoRow icon={<IconBuilding size={14} color="#14B8A6" />} label="Building" value={locationInfo?.buildingName} />
            <InfoRow icon={<IconWorld size={14} color="#F97316" />} label="Site" value={locationInfo?.siteName || selectedCamera.siteName} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CameraDetailSidebar;
