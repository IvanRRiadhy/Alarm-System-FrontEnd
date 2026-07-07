import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

type SystemHealthProps = {};

const SystemHealth: React.FC<SystemHealthProps> = () => {
  const metrics = [
    { label: 'CPU', value: '45%' },
    { label: 'Memory', value: '68%' },
    { label: 'Disk', value: '73%' },
  ];

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #0d1117, #1e293b)',
        color: '#fff',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        System Health
      </Typography>
      <Grid container spacing={2}>
        {metrics.map((m) => (
          <Grid key={m.label} item xs={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                {m.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {m.value}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default SystemHealth;
