import React from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';

interface DeviceInfoProps {
  selectedDevice?: DeviceMappingType | null;
}

interface DeviceInfoRow {
  label: string;
  value: string | React.ReactNode;
}

// Helper to determine status markup
const getStatusValue = (status: string) => {
  const s = (status || '').toLowerCase();
  let color = '#22C55E';
  let label = 'Online';
  let isAlert = false;

  if (s.includes('alarm') || s.includes('active')) {
    color = '#EF4444';
    label = 'Alert / Active';
    isAlert = true;
  } else if (s.includes('offline') || s.includes('inactive')) {
    color = '#94A3B8';
    label = 'Offline';
  } else {
    color = '#22C55E';
    label = status || 'Online';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: color,
          boxShadow: `0 0 6px ${color}`,
          ...(isAlert && {
            animation: 'status-pulse 1s infinite alternate',
            '@keyframes status-pulse': {
              '0%': { opacity: 0.4, transform: 'scale(0.8)' },
              '100%': { opacity: 1, transform: 'scale(1.2)' },
            },
          }),
        }}
      />
      <Typography sx={{ color, fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>
        {label}
      </Typography>
    </Box>
  );
};

// Helper to get brand/manufacture based on device type
const getDeviceBrand = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('motionsensor')) return 'Bosch';
  if (t.includes('doorsensor') || t.includes('doorlock')) return 'ZKTeco';
  if (t.includes('glassbreaksensor')) return 'Honeywell';
  if (t.includes('cctvcamera')) return 'Hikvision';
  if (t.includes('panicbutton')) return 'Securico';
  if (t.includes('siren') || t.includes('strobelight')) return 'System Sensor';
  return 'Standard';
};

// Helper to get model based on device type
const getDeviceModel = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('motionsensor')) return 'ISC-BPR2-WP12';
  if (t.includes('doorsensor')) return 'MC-38';
  if (t.includes('doorlock')) return 'ProCapture-T';
  if (t.includes('glassbreaksensor')) return 'FG-1625';
  if (t.includes('cctvcamera')) return 'DS-2CD2143G0-I';
  if (t.includes('panicbutton')) return 'PB-100';
  if (t.includes('siren')) return 'SRN-200';
  if (t.includes('strobelight')) return 'STB-300';
  return 'GENERIC-DEV-01';
};

// Helper to format device type label
const getDeviceTypeLabel = (type: string) => {
  const t = (type || '');
  // Insert space before capital letters
  return t.replace(/([A-Z])/g, ' $1').trim();
};

const DeviceInfo: React.FC<DeviceInfoProps> = ({ selectedDevice }) => {
  if (!selectedDevice) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: '#111827',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          p: 3,
          color: '#64748B',
          textAlign: 'center',
        }}
      >
        <IconInfoCircle size={32} />
        <Typography sx={{ mt: 1, fontSize: 12 }}>
          Pilih device pada floorplan untuk melihat informasi detail.
        </Typography>
      </Box>
    );
  }

  const deviceData: DeviceInfoRow[] = [
    { label: 'Nama Device', value: selectedDevice.label || selectedDevice.deviceName || 'N/A' },
    { label: 'Tipe Device', value: getDeviceTypeLabel(selectedDevice.deviceType) },
    { label: 'Lokasi', value: `${selectedDevice.floorplanName || 'N/A'} - ${selectedDevice.areaName || 'N/A'}` },
    {
      label: 'Status',
      value: getStatusValue(selectedDevice.deviceStatus),
    },
    { label: 'IP Address / HW ID', value: selectedDevice.hardwareId || 'N/A' },
    { label: 'Manufacture', value: getDeviceBrand(selectedDevice.deviceType) },
    { label: 'Model', value: getDeviceModel(selectedDevice.deviceType) },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#111827',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          sx={{
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.5px',
          }}
        >
          INFORMASI DEVICE
        </Typography>
      </Box>

      {/* Info Rows */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.25,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {deviceData.map((row) => (
          <Box
            key={row.label}
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Typography
              sx={{
                color: '#64748B',
                fontSize: 11,
                minWidth: 85,
                flexShrink: 0,
                lineHeight: 1.6,
              }}
            >
              {row.label}
            </Typography>
            {typeof row.value === 'string' ? (
              <Typography
                sx={{
                  color: '#E2E8F0',
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.5,
                }}
              >
                {row.value}
              </Typography>
            ) : (
              row.value
            )}
          </Box>
        ))}
      </Box>

      {/* Footer */}
      {/* <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="text"
          sx={{
            color: '#60A5FA',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'none',
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.15)',
            '&:hover': {
              bgcolor: 'rgba(37,99,235,0.12)',
            },
          }}
        >
          Lihat Detail Device
        </Button>
      </Box> */}
    </Box>
  );
};

export default DeviceInfo;
