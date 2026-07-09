import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  IconLayoutGrid,
  IconCamera,
  IconVideo,
  IconPlayerPlay,
  IconPlayerPause,
  IconScreenshot,
  IconVolume,
  IconVolumeOff,
  IconMaximize,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import axiosServices from 'src/utils/axios';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';

interface LiveCameraProps {
  selectedDevice?: DeviceMappingType | null;
}

const LiveCamera: React.FC<LiveCameraProps> = ({ selectedDevice }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  const isCCTV = selectedDevice?.deviceType === 'CctvCamera';
  const deviceId = selectedDevice?.deviceId;

  // Fetch full device details to get the RTSP URL
  const { data: deviceDetail, isLoading } = useQuery({
    queryKey: ['device-detail-camera', deviceId],
    queryFn: async () => {
      if (!deviceId) return null;
      try {
        const response = await axiosServices.get(`/api/devices/${deviceId}`);
        return response.data?.collection?.data || response.data?.collection || response.data?.data || response.data || null;
      } catch (err) {
        console.error('Error fetching device detail for camera:', err);
        return null;
      }
    },
    enabled: isCCTV && !!deviceId,
  });

  const rtspUrl = deviceDetail?.rtspUrl || '';
  const cameraName = selectedDevice ? (selectedDevice.label || selectedDevice.deviceName) : 'CAM 05 - Ruang Teller';

  // Update live clock overlay
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

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.log(e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Loopable security camera feed simulation
  const simulatedFeedUrl = "https://assets.mixkit.co/videos/preview/mixkit-security-camera-view-of-a-street-at-night-42289-large.mp4";

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
        <Typography noWrap sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>
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

      {/* Camera Feed Container */}
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
        {isLoading ? (
          <CircularProgress size={24} sx={{ color: '#60A5FA', zIndex: 3 }} />
        ) : (
          <>
            <video
              ref={videoRef}
              src={simulatedFeedUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: isPlaying ? 0.75 : 0.25,
                transition: 'opacity 0.3s ease',
              }}
            />

            {/* Scan lines & digital noise effect */}
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

            {/* REC Indicator */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                bgcolor: 'rgba(15, 23, 42, 0.75)',
                px: 1,
                py: 0.5,
                borderRadius: 0.5,
                border: '1px solid rgba(239, 68, 68, 0.2)',
                zIndex: 3,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  bgcolor: '#EF4444',
                  boxShadow: '0 0 6px #EF4444',
                  animation: isPlaying ? 'blink-rec 1.5s infinite alternate' : 'none',
                  '@keyframes blink-rec': {
                    '0%': { opacity: 0.3 },
                    '100%': { opacity: 1 },
                  },
                }}
              />
              <Typography sx={{ color: '#EF4444', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
                REC
              </Typography>
            </Box>

            {/* RTSP stream metadata overlay */}
            {rtspUrl && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(15, 23, 42, 0.85)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 0.5,
                  border: '1px solid rgba(255,255,255,0.08)',
                  zIndex: 3,
                  maxWidth: '60%',
                }}
              >
                <Typography
                  noWrap
                  sx={{
                    color: '#60A5FA',
                    fontSize: 8.5,
                    fontFamily: 'monospace',
                    letterSpacing: '0.2px',
                  }}
                  title={rtspUrl}
                >
                  RTSP: {rtspUrl}
                </Typography>
              </Box>
            )}

            {/* Timestamp Overlay */}
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
                zIndex: 3,
              }}
            >
              {currentTime}
            </Typography>
          </>
        )}
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
        <IconButton
          size="small"
          onClick={handleTogglePlay}
          sx={{
            color: isPlaying ? '#EF4444' : '#64748B',
            width: 28,
            height: 28,
            '&:hover': {
              color: isPlaying ? '#F87171' : '#E2E8F0',
              bgcolor: 'rgba(255,255,255,0.06)',
            },
          }}
        >
          {isPlaying ? <IconPlayerPause size={15} /> : <IconPlayerPlay size={15} />}
        </IconButton>

        <IconButton
          size="small"
          onClick={handleToggleMute}
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
          {isMuted ? <IconVolumeOff size={15} /> : <IconVolume size={15} />}
        </IconButton>

        {[
          <IconLayoutGrid size={15} />,
          <IconCamera size={15} />,
          <IconVideo size={15} />,
          <IconScreenshot size={15} />,
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
