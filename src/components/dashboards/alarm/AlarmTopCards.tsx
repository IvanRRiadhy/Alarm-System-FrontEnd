import React from 'react';
import { Box, Card, Typography, Grid } from '@mui/material';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
interface MetricCardProps {
  title: string;
  value: string;
  chartSeries: number[];
  chartColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, chartSeries, chartColor }) => {
  const chartOptions: ApexOptions = {
    chart: { type: 'area', sparkline: { enabled: true } },
    stroke: { curve: 'smooth', width: 2 },
    fill: { opacity: 0.3 },
    colors: [chartColor],
    tooltip: { enabled: false },
    grid: { padding: { left: 0, right: 0, top: 0, bottom: 0 } },
    yaxis: { min: 0 },
    xaxis: { categories: [] },
  };
  return (
    <Card sx={{ backgroundColor: '#122033', border: '1px solid #1e293b', p: 2, borderRadius: '12px' }}>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>{title}</Typography>
      <Typography variant="h5" sx={{ color: '#fff', fontWeight: 700, mt: 0.5 }}>{value}</Typography>
      <Box sx={{ mt: 1.5 }}>
        <Chart options={chartOptions} series={[{ data: chartSeries }]} type="area" height={60} width="100%" />
      </Box>
    </Card>
  );
};

interface AlarmTopCardsProps {
  data?: {
    totalSite?: number;
    deviceOnline?: number;
    totalDevice?: number;
    totalAlarmActive?: number;
    totalTrouble?: number;
    eventsToday?: number;
  };
}

const AlarmTopCards: React.FC<AlarmTopCardsProps> = ({ data }) => {
  const cards = [
    { title: 'TOTAL SITE', value: (data?.totalSite ?? 0).toLocaleString(), series: [30, 40, 45, 50, 55, 60, data?.totalSite ?? 65], color: '#3b82f6' },
    { title: 'DEVICE ONLINE', value: (data?.deviceOnline ?? 0).toLocaleString(), series: [80, 85, 90, 95, 92, 96, data?.deviceOnline ?? 98], color: '#22c55e' },
    { title: 'ALARM AKTIF', value: (data?.totalAlarmActive ?? 0).toLocaleString(), series: [5, 7, 6, 8, 9, 10, data?.totalAlarmActive ?? 12], color: '#ef4444' },
    { title: 'TROUBLE', value: (data?.totalTrouble ?? 0).toLocaleString(), series: [2, 3, 4, 5, 4, 6, data?.totalTrouble ?? 7], color: '#f59e0b' },
    { title: 'EVENT HARI INI', value: (data?.eventsToday ?? 0).toLocaleString(), series: [120, 130, 140, 150, 155, 156, data?.eventsToday ?? 158], color: '#3b82f6' },
  ];
  return (
    <Grid container spacing={2}>
      {cards.map((c, i) => (
        <Grid item xs={12} sm={6} md={4} lg={2.4} key={i}>
          <MetricCard title={c.title} value={c.value} chartSeries={c.series} chartColor={c.color} />
        </Grid>
      ))}
    </Grid>
  );
};

export default AlarmTopCards;
