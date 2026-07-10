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
  recentEvents?: any[];
};

const getEventIconAndColor = (message: string, severity: string) => {
  const msgLower = (message || '').toLowerCase();
  const sevLower = (severity || '').toLowerCase();

  let color = '#38BDF8'; // default blue
  if (sevLower === 'critical') {
    color = '#EF4444';
  } else if (sevLower === 'high') {
    color = '#F59E0B';
  } else if (sevLower === 'medium') {
    color = '#F59E0B';
  } else if (sevLower === 'low') {
    color = '#22C55E';
  }

  let icon = <WarningAmberRoundedIcon fontSize="small" />;
  if (msgLower.includes('door') || msgLower.includes('pintu')) {
    icon = <DoorFrontRoundedIcon fontSize="small" />;
  } else if (msgLower.includes('motion') || msgLower.includes('sensor') || msgLower.includes('gerak')) {
    icon = <SensorsRoundedIcon fontSize="small" />;
  } else if (msgLower.includes('camera') || msgLower.includes('kamera') || msgLower.includes('cam')) {
    icon = <CameraAltRoundedIcon fontSize="small" />;
  }

  return { color, icon };
};

const RecentEvents: React.FC<RecentEventsProps> = ({ recentEvents = [] }) => {
  const mappedEvents = recentEvents.map((e) => {
    let timeStr = '';
    try {
      if (e.timestamp) {
        const date = new Date(e.timestamp);
        timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (err) {
      console.error(err);
    }

    const { color, icon } = getEventIconAndColor(e.message, e.severity);

    return {
      id: e.eventId || Math.random().toString(),
      time: timeStr,
      title: e.message || '',
      site: e.siteName || '',
      color,
      icon,
    };
  });

  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: '100%',
        maxHeight: '575px',
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
        {mappedEvents.map((event, index) => (
          <React.Fragment key={event.id}>
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

            {index !== mappedEvents.length - 1 && (
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