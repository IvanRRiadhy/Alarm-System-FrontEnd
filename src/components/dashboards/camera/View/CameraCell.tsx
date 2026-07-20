import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import UniversalVideoPlayer from 'src/utils/UniversalPlayer';
import { deviceType } from 'src/store/apps/crud/devices';
import { BASE_URL } from 'src/utils/axios';
import { getConfig } from 'src/config';

interface CameraCellProps {
  camera: deviceType;
  isActive: boolean;
  isSelected: boolean;
  onClick: (camera: deviceType) => void;
}

const getEngineWsUrl = (baseUrl: string) => {
  try {
    return getConfig().CCTV_WS_URL || 'ws://192.168.1.175:8282';
  } catch (e) {
    console.error("Error getting CCTV_WS_URL:", e);
    return 'ws://192.168.1.175:8282';
  }
};

const CameraCell: React.FC<CameraCellProps> = ({ camera, isActive, isSelected, onClick }) => {
  return (
    <Box
      onClick={() => onClick(camera)}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        bgcolor: '#0a0e1a',
        border: isSelected
          ? '2px solid #3B82F6'
          : isActive
          ? '2px solid #EF4444'
          : '1px solid rgba(255,255,255,0.05)',
        margin: 0,
        boxSizing: 'border-box',
        cursor: 'pointer',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'border-color 0.2s ease',
        animation: isActive ? 'pulse-border 1.5s infinite alternate' : 'none',
        '@keyframes pulse-border': {
          '0%': { borderColor: 'rgba(239, 68, 68, 0.4)' },
          '100%': { borderColor: 'rgba(239, 68, 68, 1)' }
        },
        '&:hover': {
          borderColor: isSelected ? '#3B82F6' : isActive ? '#EF4444' : 'rgba(255,255,255,0.25)',
        },
      }}
    >
      {camera.rtspUrl ? (
        <>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UniversalVideoPlayer
              streamUrl={camera.rtspUrl}
              engineWsUrl={getEngineWsUrl(BASE_URL)}
              style={{
                width: '100%',
                height: '100%',
                aspectRatio: 'unset',
                borderRadius: '0px',
                boxShadow: 'none',
              }}
            />
          </Box>
          {/* Live/Alarm badge */}
          <Chip
            label={isActive ? '● ALARM' : '● LIVE'}
            size="small"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              height: 18,
              fontSize: 9,
              fontWeight: 700,
              bgcolor: isActive ? '#EF444420' : '#22C55E20',
              color: isActive ? '#EF4444' : '#22C55E',
              border: isActive ? '1px solid #EF444440' : '1px solid #22C55E40',
              zIndex: 3,
            }}
          />
          {/* Camera name overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
              px: 1,
              py: 0.5,
              zIndex: 3,
            }}
          >
            <Typography
              noWrap
              sx={{
                color: '#E2E8F0',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}
            >
              {camera.name}
            </Typography>
          </Box>
          {/* Scan lines effect */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 2px)',
              pointerEvents: 'none',
              zIndex: 2,
            }}
          />
        </>
      ) : (
        /* Inactive / black cell */
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#334155',
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            sx={{ width: 28, height: 28, mb: 0.5, opacity: 0.5 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
            />
          </Box>
          <Typography
            noWrap
            sx={{
              color: '#475569',
              fontSize: 10,
              fontWeight: 500,
              maxWidth: '90%',
              textAlign: 'center',
            }}
          >
            {camera.name}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(CameraCell);
