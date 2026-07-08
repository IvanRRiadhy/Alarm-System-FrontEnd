import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';

interface DeviceInfoRow {
  label: string;
  value: string | React.ReactNode;
}

const deviceData: DeviceInfoRow[] = [
  { label: 'Nama Device', value: 'CAM 05 - Ruang Teller' },
  { label: 'Tipe Device', value: 'IP Camera' },
  { label: 'Lokasi', value: 'Lantai 1 - Ruang Teller' },
  {
    label: 'Status',
    value: (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: '#22C55E',
            boxShadow: '0 0 6px #22C55E',
          }}
        />
        <Typography sx={{ color: '#22C55E', fontSize: 12, fontWeight: 600 }}>
          Online
        </Typography>
      </Box>
    ),
  },
  { label: 'IP Address', value: '192.168.1.105' },
  { label: 'Manufacture', value: 'Hikvision' },
  { label: 'Model', value: 'DS-2CD2143G0-I' },
];

const DeviceInfo: React.FC = () => {
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
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
      </Box>
    </Box>
  );
};

export default DeviceInfo;
