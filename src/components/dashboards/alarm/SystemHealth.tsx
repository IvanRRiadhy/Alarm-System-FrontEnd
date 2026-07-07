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

const systems = [
  {
    title: 'Server',
    status: 'Online',
    color: '#22C55E',
    icon: <DnsRoundedIcon />,
  },
  {
    title: 'Database',
    status: 'Online',
    color: '#22C55E',
    icon: <StorageRoundedIcon />,
  },
  {
    title: 'Storage',
    status: '78%',
    color: '#F59E0B',
    icon: <CloudDoneRoundedIcon />,
  },
  {
    title: 'Network',
    status: 'Normal',
    color: '#22C55E',
    icon: <WifiRoundedIcon />,
  },
  {
    title: 'NTP',
    status: 'Sync',
    color: '#22C55E',
    icon: <AccessTimeRoundedIcon />,
  },
];

const SystemHealth = () => {
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