import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { IconCamera } from '@tabler/icons-react';

const EventDetail: React.FC = () => {
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
          DETAIL EVENT
        </Typography>
        <Typography
          sx={{
            color: '#64748B',
            fontSize: 11,
          }}
        >
          Selasa, 6 Mei 2025
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {/* Event Title + Severity */}
        <Box>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontSize: 14,
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Pintu Utama Terbuka
          </Typography>
          <Chip
            label="Critical"
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: '#EF444420',
              color: '#EF4444',
              border: '1px solid #EF444440',
            }}
          />
        </Box>

        {/* Detail Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {[
            { label: 'Lokasi', value: 'KCP Surabaya Diponegoro' },
            { label: 'Lantai', value: 'Lantai 1' },
            { label: 'Zona', value: 'Zona 1 - Pintu Utama' },
            { label: 'Device', value: 'Door Sensor - Main Entrance' },
            { label: 'Deskripsi', value: 'Pintu Utama terbuka lebih dari 30 detik' },
          ].map((field) => (
            <Box
              key={field.label}
              sx={{
                display: 'flex',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: 11,
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                {field.label}
              </Typography>
              <Typography
                sx={{
                  color: '#E2E8F0',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {field.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Event Thumbnail */}
        <Box
          sx={{
            bgcolor: '#0a0e1a',
            borderRadius: 1.5,
            overflow: 'hidden',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.04)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
              opacity: 0.7,
            }}
          />
          <IconCamera size={24} color="#334155" style={{ position: 'relative', zIndex: 1 }} />
        </Box>
      </Box>

      {/* Acknowledge Button */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="contained"
          sx={{
            bgcolor: '#2563EB',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'none',
            py: 1.25,
            borderRadius: 2,
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            '&:hover': {
              bgcolor: '#1d4ed8',
              boxShadow: '0 6px 20px rgba(37,99,235,0.45)',
            },
          }}
        >
          Acknowledge
        </Button>
      </Box>
    </Box>
  );
};

export default EventDetail;
