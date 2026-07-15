import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  IconMaximize,
  IconInfoCircle,
  IconVolumeOff,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import axiosServices, { BASE_URL } from 'src/utils/axios';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import UniversalVideoPlayer from 'src/utils/UniversalPlayer';

interface LiveCameraProps {
  selectedDevice?: DeviceMappingType | null;
  deviceMappings?: DeviceMappingType[];
}

const LiveCamera: React.FC<LiveCameraProps> = ({ selectedDevice, deviceMappings = [] }) => {
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
        <IconInfoCircle size={28} />
        <Typography sx={{ mt: 1.5, fontSize: 12, fontWeight: 500 }}>
          Pilih Device untuk melihat tayangan kamera.
        </Typography>
      </Box>
    );
  }

  const [currentTime, setCurrentTime] = useState('');
  const openedWindowsRef = useRef<Record<string, Window | null>>({});

  const isCCTV = selectedDevice?.deviceType === 'CctvCamera';

  const getEngineWsUrl = (baseUrl: string) => {
    if (!baseUrl) return 'ws://localhost:8282';
    try {
      const parsedUrl = new URL(baseUrl.includes('//') ? baseUrl : `//${baseUrl}`);
      // return `ws://${parsedUrl.hostname}:8283`;
      return "ws://localhost:8282"
    } catch (e) {
      console.error("Error parsing BASE_URL for engineWsUrl:", e);
      return 'ws://localhost:8282';
    }
  };

  const [openedCameraIds, setOpenedCameraIds] = useState<string[]>([]);

  // Reset opened camera list and close popups when selected device changes
  useEffect(() => {
    Object.values(openedWindowsRef.current).forEach((win) => {
      if (win && !win.closed) {
        win.close();
      }
    });
    openedWindowsRef.current = {};
    setOpenedCameraIds([]);
  }, [selectedDevice?.id]);

  // Periodically check if opened windows were closed to return feed to main display
  useEffect(() => {
    const interval = setInterval(() => {
      const closedIds: string[] = [];
      Object.entries(openedWindowsRef.current).forEach(([deviceId, win]) => {
        if (!win || win.closed) {
          closedIds.push(deviceId);
        }
      });

      if (closedIds.length > 0) {
        setOpenedCameraIds((prev) => prev.filter((id) => !closedIds.includes(id)));
        closedIds.forEach((id) => {
          delete openedWindowsRef.current[id];
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      Object.values(openedWindowsRef.current).forEach((win) => {
        if (win && !win.closed) {
          win.close();
        }
      });
    };
  }, []);

  const cctvLoop = React.useMemo(() => {
    if (!selectedDevice || !deviceMappings) return [];
    if (isCCTV) {
      return [selectedDevice];
    }
    return deviceMappings.filter(
      (dm) => dm.areaId === selectedDevice.areaId && dm.deviceType === 'CctvCamera'
    );
  }, [selectedDevice, deviceMappings, isCCTV]);

  const activeLoop = React.useMemo(() => {
    return cctvLoop.filter(
      (dm): dm is DeviceMappingType & { deviceId: string } =>
        dm.deviceId !== null && !openedCameraIds.includes(dm.deviceId)
    );
  }, [cctvLoop, openedCameraIds]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (currentIndex >= activeLoop.length) {
      setCurrentIndex(0);
    }
  }, [activeLoop.length, currentIndex]);

  useEffect(() => {
    if (activeLoop.length <= 1 || isHovered) {
      return;
    }

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeLoop.length);
    }, 10000);

    return () => clearTimeout(timer);
  }, [activeLoop.length, currentIndex, isHovered]);

  const activeDevice = activeLoop.length > 0 ? activeLoop[currentIndex] : null;

  const activeDeviceId = activeDevice?.deviceId;

  // Fetch full device details to get the RTSP URL
  const { data: deviceDetail, isLoading } = useQuery({
    queryKey: ['device-detail-camera', activeDeviceId],
    queryFn: async () => {
      if (!activeDeviceId) return null;
      try {
        const response = await axiosServices.get(`/api/devices/${activeDeviceId}`);
        return response.data?.collection?.data || response.data?.collection || response.data?.data || response.data || null;
      } catch (err) {
        console.error('Error fetching device detail for camera:', err);
        return null;
      }
    },
    enabled: !!activeDeviceId,
  });

  const rtspUrl = deviceDetail?.rtspUrl || '';
  const cameraName = activeDevice 
    ? (activeDevice.label || activeDevice.deviceName) 
    : activeLoop.length === 0 && cctvLoop.length > 0
      ? 'All Cameras Opened'
      : 'No CCTV Camera';

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

  const handleOpenNewWindow = () => {
    if (!activeDevice) return;
    const feedUrl = `${window.location.origin}/camera-popup?streamUrl=${encodeURIComponent(rtspUrl)}&name=${encodeURIComponent(cameraName)}&engineWsUrl=${encodeURIComponent(getEngineWsUrl(BASE_URL))}`;
    const winName = `CCTV_${activeDevice.deviceId}`;
    const newWin = window.open(feedUrl, winName, 'width=800,height=600,scrollbars=yes,resizable=yes');
    if (newWin) {
      openedWindowsRef.current[activeDevice.deviceId] = newWin;
    }
    setOpenedCameraIds((prev) => [...prev, activeDevice.deviceId]);
  };

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
      {/* <Box
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
      </Box> */}
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
        <Typography noWrap sx={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>
          {cameraName}
        </Typography>
        {activeDevice && (
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
        )}
      </Box>

      {/* Camera name + LIVE badge */}
      {/* <Box
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
        {activeDevice && (
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
        )}
      </Box> */}

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
        ) : cctvLoop.length === 0 ? (
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
            <IconVolumeOff size={28} />
            <Typography sx={{ mt: 1, fontSize: 11, fontWeight: 500 }}>
              Tidak ada CCTV di area ini
            </Typography>
            <Typography sx={{ fontSize: 9, opacity: 0.7 }}>
              No CCTV in this area
            </Typography>
          </Box>
        ) : activeLoop.length === 0 ? (
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
            <IconInfoCircle size={28} color="#60A5FA" />
            <Typography sx={{ mt: 1.5, fontSize: 12, fontWeight: 500, color: '#E2E8F0' }}>
              All Camera is opened in other window
            </Typography>
          </Box>
        ) : activeDevice ? (
          <>
            {rtspUrl ? (
              <UniversalVideoPlayer
                streamUrl={rtspUrl}
                engineWsUrl={getEngineWsUrl(BASE_URL)}
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
                  width: '100%',
                  height: '100%',
                }}
              >
                <IconInfoCircle size={28} />
                <Typography sx={{ mt: 1, fontSize: 11, fontWeight: 500 }}>
                  Kamera tidak memiliki URL RTSP
                </Typography>
                <Typography sx={{ fontSize: 9, opacity: 0.7 }}>
                  Camera does not have RTSP URL
                </Typography>
              </Box>
            )}

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

            {/* Open in New Window Button */}
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenNewWindow}
              startIcon={<IconMaximize size={12} />}
              sx={{
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 3,
                fontSize: 9,
                fontWeight: 700,
                bgcolor: '#2563EB',
                py: 0.5,
                px: 1,
                minWidth: 'auto',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                },
              }}
            >
              Open Window
            </Button>

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
        ) : null}
      </Box>

      {/* Controls */}
      {/* <Box
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
      </Box> */}
    </Box>
  );
};

export default LiveCamera;
