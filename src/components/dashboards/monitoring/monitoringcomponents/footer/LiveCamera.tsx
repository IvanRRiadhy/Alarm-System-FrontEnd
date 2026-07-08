import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  IconLayoutGrid,
  IconCamera,
  IconVideo,
  IconPlayerPlay,
  IconScreenshot,
  IconVolume,
  IconMaximize,
} from '@tabler/icons-react';

const LiveCamera: React.FC = () => {
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
          LIVE CAMERA
        </Typography>
      </Box>

      {/* Camera name + LIVE badge */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>
          CAM 05 - Ruang Teller
        </Typography>
        <Chip
          label="● LIVE"
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: '#22C55E20',
            color: '#22C55E',
            border: '1px solid #22C55E40',
          }}
        />
      </Box>

      {/* Camera Feed Placeholder */}
      <Box
        sx={{
          flex: 1,
          mx: 2,
          mb: 1,
          position: 'relative',
          bgcolor: '#0a0e1a',
          borderRadius: 1.5,
          overflow: 'hidden',
          minHeight: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Simulated camera feed - dark gradient */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, #0F172A 0%, #1E293B 30%, #0F172A 60%, #1E293B 100%)',
            opacity: 0.8,
          }}
        />

        {/* Grid overlay for camera effect */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
          }}
        />

        {/* Camera icon */}
        <IconCamera size={32} color="#334155" />

        {/* Timestamp */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            color: '#94A3B8',
            fontSize: 10,
            fontFamily: 'monospace',
            bgcolor: 'rgba(0,0,0,0.5)',
            px: 0.75,
            py: 0.25,
            borderRadius: 0.5,
          }}
        >
          06/05/2025 10:30:45
        </Typography>
      </Box>

      {/* Controls */}
      <Box
        sx={{
          px: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {[
          <IconLayoutGrid size={15} />,
          <IconCamera size={15} />,
          <IconVideo size={15} />,
          <IconPlayerPlay size={15} />,
          <IconScreenshot size={15} />,
          <IconVolume size={15} />,
          <IconMaximize size={15} />,
        ].map((icon, i) => (
          <IconButton
            key={i}
            size="small"
            sx={{
              color: '#64748B',
              width: 28,
              height: 28,
              '&:hover': {
                color: '#E2E8F0',
                bgcolor: 'rgba(255,255,255,0.06)',
              },
            }}
          >
            {icon}
          </IconButton>
        ))}
      </Box>
    </Box>
  );
};

export default LiveCamera;
