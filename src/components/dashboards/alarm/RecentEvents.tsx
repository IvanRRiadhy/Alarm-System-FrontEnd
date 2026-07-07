import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';

type RecentEventsProps = {
  region: string;
};

const RecentEvents: React.FC<RecentEventsProps> = ({ region }) => {
  const events = [
    { time: '10:15', description: 'Door opened at Site A' },
    { time: '09:42', description: 'Motion detected at Site B' },
    { time: '08:30', description: 'Camera offline at Site C' },
  ];

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #0d1117, #1e293b)', color: '#fff' }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Recent Events – {region}
      </Typography>
      <List>
        {events.map((e, idx) => (
          <ListItem key={idx} sx={{ color: '#fff' }}>
            <ListItemText primary={e.time} secondary={e.description} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default RecentEvents;
