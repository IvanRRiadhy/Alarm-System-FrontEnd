import React, { useEffect, useState } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { IconInfoCircle } from '@tabler/icons-react';
import UniversalVideoPlayer from 'src/utils/UniversalPlayer';

const CameraPopup: React.FC = () => {
  const [currentTime, setCurrentTime] = useState('');

  // Extract query parameters
  const params = new URLSearchParams(window.location.search);
  const streamUrl = params.get('streamUrl') || '';
  const cameraName = params.get('name') || 'CCTV Camera';
  const engineWsUrl = params.get('engineWsUrl') || 'ws://localhost:8282';

  // Update clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const format = (num: number) => String(num).padStart(2, '0');
      const dateStr = `${format(now.getDate())}/${format(now.getMonth() + 1)}/${now.getFullYear()}`;
      const timeStr = `${format(now.getHours())}:${format(now.getMinutes())}:${format(now.getSeconds())}`;
      setCurrentTime(`${dateStr} ${timeStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        bgcolor: '#0a0e1a',
        color: '#E2E8F0',
        p: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
          pb: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
          {cameraName}
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

      {/* Video Player Area */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          bgcolor: '#000000',
          borderRadius: 1.5,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {streamUrl ? (
          <UniversalVideoPlayer
            streamUrl={streamUrl}
            engineWsUrl={engineWsUrl}
            style={{
              width: '100%',
              height: '100%',
              aspectRatio: 'auto',
              borderRadius: '0px',
              boxShadow: 'none',
            }}
          />
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 2,
              color: '#64748B',
              textAlign: 'center',
            }}
          >
            <IconInfoCircle size={32} />
            <Typography sx={{ mt: 1, fontSize: 13, fontWeight: 500 }}>
              Kamera tidak memiliki URL RTSP
            </Typography>
            <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
              Camera does not have RTSP URL
            </Typography>
          </Box>
        )}

        {/* Scan lines overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        />

        {/* Info overlay (RTSP Url) */}
        {streamUrl && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              px: 1,
              py: 0.5,
              borderRadius: 0.5,
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 3,
              maxWidth: '80%',
            }}
          >
            <Typography
              noWrap
              sx={{
                color: '#60A5FA',
                fontSize: 9,
                fontFamily: 'monospace',
                letterSpacing: '0.2px',
              }}
              title={streamUrl}
            >
              RTSP: {streamUrl}
            </Typography>
          </Box>
        )}

        {/* Timestamp Overlay */}
        <Typography
          sx={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            color: '#94A3B8',
            fontSize: 11,
            fontFamily: 'monospace',
            bgcolor: 'rgba(0,0,0,0.5)',
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
            zIndex: 3,
          }}
        >
          {currentTime}
        </Typography>
      </Box>
    </Box>
  );
};

export default CameraPopup;
