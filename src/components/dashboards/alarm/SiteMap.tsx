import React from 'react';
import { Box, Card, Typography, Tooltip, IconButton } from '@mui/material';
import { IconPlus, IconMinus, IconFocusCentered } from '@tabler/icons-react';

interface MapPin {
  id: number;
  label: string;
  name: string;
  region: string;
  x: number;
  y: number;
  status: 'normal' | 'alarm' | 'trouble' | 'offline';
  count: number;
  details: string;
}

const pinsData: MapPin[] = [
  { id: 1, label: '23', name: 'Medan Hub', region: 'Sumatera Utara', x: 100, y: 110, status: 'normal', count: 23, details: 'KCP Medan Iskandar Muda: 23 devices normal' },
  { id: 2, label: '8', name: 'Jakarta SOC', region: 'Jawa Barat', x: 180, y: 250, status: 'alarm', count: 8, details: 'KCP Bandung Asia Afrika & Jabodetabek: 8 active alarms' },
  { id: 3, label: '15', name: 'Semarang Hub', region: 'Jawa Tengah', x: 250, y: 265, status: 'trouble', count: 15, details: 'KCP Semarang Pandanaran: 15 sites, 1 trouble' },
  { id: 4, label: '31', name: 'Surabaya Hub', region: 'Jawa Timur', x: 330, y: 270, status: 'normal', count: 31, details: 'KCP Surabaya Diponegoro: 31 devices active' },
  { id: 5, label: '9', name: 'Balikpapan Hub', region: 'Semua Region', x: 310, y: 150, status: 'normal', count: 9, details: 'Kalimantan East: 9 devices operational' },
  { id: 6, label: '12', name: 'Makassar Hub', region: 'Sulawesi Selatan', x: 410, y: 210, status: 'trouble', count: 12, details: 'KCP Makassar Ratulangi: 12 sites, 1 trouble' },
  { id: 7, label: '30', name: 'Jayapura Hub', region: 'Semua Region', x: 620, y: 220, status: 'normal', count: 30, details: 'Papua Region: 30 devices operational' }
];

interface SiteMapProps {
  region: string;
}

const SiteMap: React.FC<SiteMapProps> = ({ region }) => {

  const getStatusColor = (status: 'normal' | 'alarm' | 'trouble' | 'offline') => {
    switch (status) {
      case 'alarm':
        return '#ef4444'; // Red
      case 'trouble':
        return '#f59e0b'; // Orange
      case 'offline':
        return '#64748b'; // Gray
      default:
        return '#10b981'; // Green
    }
  };

  return (
    <Card
      sx={{
        backgroundColor: '#122033',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        p: 2.5,
        height: '430px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
          PETA SEBARAN SITE
        </Typography>
      </Box>

      {/* Map Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 70,
          left: 20,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          backgroundColor: 'rgba(13, 23, 38, 0.8)',
          border: '1px solid #1e293b',
          borderRadius: '6px',
          p: 0.5,
        }}
      >
        <IconButton size="small" sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#fff' } }}>
          <IconPlus size={16} />
        </IconButton>
        <IconButton size="small" sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#fff' } }}>
          <IconMinus size={16} />
        </IconButton>
        <IconButton size="small" sx={{ color: '#94a3b8', p: 0.5, '&:hover': { color: '#fff' } }}>
          <IconFocusCentered size={16} />
        </IconButton>
      </Box>

      {/* SVG Map Container */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: '#0d1726',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 700 350"
          width="100%"
          height="100%"
          style={{ width: '100%', height: '100%', maxHeight: '310px' }}
        >
          {/* Graticule Grid Lines (High-tech style) */}
          <line x1="100" y1="0" x2="100" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="200" y1="0" x2="200" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="300" y1="0" x2="300" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="400" y1="0" x2="400" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="500" y1="0" x2="500" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="600" y1="0" x2="600" y2="350" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          
          <line x1="0" y1="100" x2="700" y2="100" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="0" y1="200" x2="700" y2="200" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />
          <line x1="0" y1="300" x2="700" y2="300" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="5,5" />

          {/* High-tech Stylized Indonesia Islands */}
          {/* Sumatra */}
          <path
            d="M 50,60 L 160,195 L 140,215 L 30,95 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Java */}
          <path
            d="M 170,255 L 360,265 L 360,273 L 170,265 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Kalimantan */}
          <path
            d="M 230,90 L 310,95 L 325,145 L 290,190 L 225,175 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Sulawesi */}
          <path
            d="M 370,110 L 415,115 L 390,150 L 425,165 L 420,185 L 365,195 L 375,150 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.8"
          />
          {/* Lesser Sunda (Nusa Tenggara) */}
          <path
            d="M 370,267 L 390,269 L 410,271 L 430,273 L 450,273 L 470,274 L 490,276"
            fill="none"
            stroke="#1e293b"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />
          {/* Halmahera / Maluku */}
          <path
            d="M 445,100 L 465,102 L 450,130 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1"
            opacity="0.8"
          />
          <circle cx="480" cy="160" r="4" fill="#122033" stroke="#1e293b" />
          <circle cx="490" cy="180" r="5" fill="#122033" stroke="#1e293b" />
          <circle cx="475" cy="200" r="3" fill="#122033" stroke="#1e293b" />

          {/* Papua */}
          <path
            d="M 545,160 L 675,170 L 670,225 L 590,225 L 540,195 Z"
            fill="#122033"
            stroke="#1e293b"
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Pins with pulsing highlights */}
          {pinsData.map((pin) => {
            const isHighlighted = region === 'Semua Region' || pin.region === region;
            const color = getStatusColor(pin.status);

            return (
              <g
                key={pin.id}
                style={{
                  transition: 'opacity 0.3s',
                  opacity: isHighlighted ? 1 : 0.25,
                  cursor: 'pointer',
                }}
              >
                {/* Glowing Pulsing Ring (Animations done inside inline style or globally) */}
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r="14"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  style={{
                    animation: isHighlighted ? 'map-pulse 2s infinite' : 'none',
                    transformOrigin: `${pin.x}px ${pin.y}px`,
                  }}
                />

                {/* Solid core pin circle */}
                <circle cx={pin.x} cy={pin.y} r="10" fill={color} />

                {/* Pin Text Label */}
                <Tooltip title={pin.details} placement="top" arrow>
                  <text
                    x={pin.x}
                    y={pin.y + 4}
                    textAnchor="middle"
                    fill="#fff"
                    style={{ fontSize: '9px', fontWeight: 'bold', fontFamily: 'inherit' }}
                  >
                    {pin.label}
                  </text>
                </Tooltip>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 2,
            backgroundColor: 'rgba(13, 23, 38, 0.85)',
            border: '1px solid #1e293b',
            borderRadius: '20px',
            px: 2,
            py: 0.5,
            zIndex: 10,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600 }}>Normal</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600 }}>Alarm</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600 }}>Trouble</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748b' }} />
            <Typography sx={{ color: '#94a3b8', fontSize: '0.65rem', fontWeight: 600 }}>Offline</Typography>
          </Box>
        </Box>
      </Box>

      {/* Global CSS for Map pulse animations */}
      <style>{`
        @keyframes map-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </Card>
  );
};

export default SiteMap;
