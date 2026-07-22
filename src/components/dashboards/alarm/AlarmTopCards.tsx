import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, color }) => {
  return (
    <Card 
      sx={{ 
        backgroundColor: '#122033', 
        border: '1px solid rgba(255,255,255,0.08)', 
        p: 2, 
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ color: '#fff', fontWeight: 700 }}>
        {value}
      </Typography>
    </Card>
  );
};

interface AlarmTopCardsProps {
  data?: {
    totalSite?: number;
    deviceOnline?: number;
    totalDevice?: number;
    totalAlarmActive?: number;
    totalAlarmCaseOpen?: number;
    totalTrouble?: number;
    eventsToday?: number;
  };
}

const AlarmTopCards: React.FC<AlarmTopCardsProps> = ({ data }) => {
  const openCasesCount = data?.totalAlarmCaseOpen ?? data?.totalTrouble ?? 0;

  const cards = [
    { title: 'TOTAL SITE', value: (data?.totalSite ?? 0).toLocaleString(), color: '#3b82f6' },
    { title: 'DEVICE ONLINE', value: (data?.deviceOnline ?? 0).toLocaleString(), color: '#22c55e' },
    { title: 'ALARM AKTIF', value: (data?.totalAlarmActive ?? 0).toLocaleString(), color: '#ef4444' },
    { title: 'OPEN CASE', value: openCasesCount.toLocaleString(), color: '#f59e0b' },
  ];

  return (
    <Grid container spacing={2} sx={{ height: '100%' }}>
      {cards.map((c, i) => (
        <Grid item xs={6} key={i} sx={{ height: 'calc(50%)' }}>
          <MetricCard title={c.title} value={c.value} color={c.color} />
        </Grid>
      ))}
    </Grid>
  );
};

export default AlarmTopCards;
