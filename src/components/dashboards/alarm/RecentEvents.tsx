import React from 'react';
import {
  Avatar,
  Box,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';

import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DoorFrontRoundedIcon from '@mui/icons-material/DoorFrontRounded';
import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';

type RecentEventsProps = {
  region: string;
};

const events = [
  {
    time: '10:28',
    title: 'Pintu Utama Terbuka',
    site: 'KCP Surabaya Diponegoro',
    color: '#EF4444',
    icon: <DoorFrontRoundedIcon fontSize="small" />,
  },
  {
    time: '10:12',
    title: 'Motion Terdeteksi',
    site: 'KCP Bandung Asia Afrika',
    color: '#F59E0B',
    icon: <SensorsRoundedIcon fontSize="small" />,
  },
  {
    time: '09:54',
    title: 'Camera Offline',
    site: 'KCP Medan Iskandar Muda',
    color: '#EF4444',
    icon: <CameraAltRoundedIcon fontSize="small" />,
  },
  {
    time: '09:31',
    title: 'Alarm Intrusion',
    site: 'KCP Semarang Pandanaran',
    color: '#EF4444',
    icon: <WarningAmberRoundedIcon fontSize="small" />,
  },
  {
    time: '09:02',
    title: 'Motion Terdeteksi',
    site: 'KCP Makassar Ratulangi',
    color: '#22C55E',
    icon: <SensorsRoundedIcon fontSize="small" />,
  },
];

const RecentEvents: React.FC<RecentEventsProps> = () => {
  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: '100%',
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
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          RECENT EVENTS
        </Typography>
      </Box>

      <List
        sx={{
          p: 0,
          maxHeight: "85%",
          overflowY: 'auto',

          '&::-webkit-scrollbar': {
            width: 6,
          },

          '&::-webkit-scrollbar-thumb': {
            background: '#334155',
            borderRadius: 10,
          },
        }}
      >
        {events.map((event, index) => (
          <React.Fragment key={index}>
            <ListItem
              sx={{
                py: 1.5,
                px: 2,
                transition: '.2s',

                '&:hover': {
                  bgcolor: '#1E293B',
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: `${event.color}22`,
                    color: event.color,
                    width: 38,
                    height: 38,
                  }}
                >
                  {event.icon}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <>
                    <Typography
                      sx={{
                        color: '#94A3B8',
                        fontSize: 11,
                        mb: .2,
                      }}
                    >
                      {event.time}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#F8FAFC',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {event.title}
                    </Typography>
                  </>
                }
                secondary={
                  <Typography
                    sx={{
                      color: '#94A3B8',
                      fontSize: 12,
                    }}
                  >
                    {event.site}
                  </Typography>
                }
              />
            </ListItem>

            {index !== events.length - 1 && (
              <Divider
                sx={{
                  borderColor: 'rgba(255,255,255,.05)',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default RecentEvents;