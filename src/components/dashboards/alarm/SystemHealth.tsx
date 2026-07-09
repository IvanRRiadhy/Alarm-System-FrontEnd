import React from 'react';
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
} from '@mui/material';

import DnsRoundedIcon from '@mui/icons-material/DnsRounded';
import StorageRoundedIcon from '@mui/icons-material/StorageRounded';
import WifiRoundedIcon from '@mui/icons-material/WifiRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';

interface SystemHealthProps {
  systemHealth?: {
    server?: string;
    database?: string;
    storage?: number;
    network?: string;
    ntp?: string;
  };
}

const SystemHealth: React.FC<SystemHealthProps> = ({ systemHealth }) => {
  const serverStatus = systemHealth?.server || 'Offline';
  const dbStatus = systemHealth?.database || 'Offline';
  const storageVal = systemHealth?.storage ?? 0;
  const netStatus = systemHealth?.network || 'Offline';
  const ntpStatus = systemHealth?.ntp || 'Unsync';

  const systems = [
    {
      title: 'Server',
      status: serverStatus,
      color: serverStatus.toLowerCase() === 'online' ? '#22C55E' : '#EF4444',
      icon: <DnsRoundedIcon />,
    },
    {
      title: 'Database',
      status: dbStatus,
      color: dbStatus.toLowerCase() === 'online' ? '#22C55E' : '#EF4444',
      icon: <StorageRoundedIcon />,
    },
    {
      title: 'Storage',
      status: `${storageVal}%`,
      color: storageVal > 85 ? '#EF4444' : storageVal > 70 ? '#F59E0B' : '#22C55E',
      icon: <CloudDoneRoundedIcon />,
    },
    {
      title: 'Network',
      status: netStatus,
      color: netStatus.toLowerCase() === 'normal' ? '#22C55E' : '#EF4444',
      icon: <WifiRoundedIcon />,
    },
    {
      title: 'NTP',
      status: ntpStatus,
      color: ntpStatus.toLowerCase() === 'sync' ? '#22C55E' : '#F59E0B',
      icon: <AccessTimeRoundedIcon />,
    },
  ];

  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          SYSTEM HEALTH
        </Typography>
      </Box>

      <Grid
        container
        spacing={2}
        sx={{
          p: 2,
        }}
      >
        {systems.map((item) => (
          <Grid
            key={item.title}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
              lg: 2.4,
            }}
          >
            <Paper
              sx={{
                bgcolor: '#0F172A',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 3,
                p: 2,
                transition: '.2s',

                '&:hover': {
                  bgcolor: '#172554',
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                gap={2}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    bgcolor: `${item.color}20`,
                    color: item.color,

                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {item.icon}
                </Box>

                <Box>
                  <Typography
                    sx={{
                      color: '#CBD5E1',
                      fontSize: 12,
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Typography
                    sx={{
                      color: item.color,
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {item.status}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default SystemHealth;