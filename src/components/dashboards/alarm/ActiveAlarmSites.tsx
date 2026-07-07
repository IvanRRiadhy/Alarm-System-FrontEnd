import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';

type ActiveAlarmSitesProps = {
  region: string;
};

const ActiveAlarmSites: React.FC<ActiveAlarmSitesProps> = ({ region }) => {
  const sites = [
    { name: 'Site A', alarms: 12 },
    { name: 'Site B', alarms: 5 },
    { name: 'Site C', alarms: 8 },
  ];

  return (
    <Paper
      elevation={3}
      sx={{ p: 2, borderRadius: '12px', background: 'linear-gradient(135deg, #0d1117, #1e293b)', color: '#fff' }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Active Alarm Sites – {region}
      </Typography>
      <Grid container spacing={2}>
        {sites.map((s) => (
          <Grid key={s.name} item xs={12} sm={6} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                {s.name}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {s.alarms}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default ActiveAlarmSites;
