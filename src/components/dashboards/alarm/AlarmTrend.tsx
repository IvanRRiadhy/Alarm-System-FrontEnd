import React from 'react';
import Chart from 'react-apexcharts';
import { Box, Typography } from '@mui/material';
import { ApexOptions } from 'apexcharts';

type AlarmTrendProps = {
  alarmTrends?: { label: string; count: number }[];
};

const AlarmTrend: React.FC<AlarmTrendProps> = ({ alarmTrends = [] }) => {
  const categories = alarmTrends.map((t) => t.label);
  const data = alarmTrends.map((t) => t.count);

  const options: ApexOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      background: 'transparent',
    },

    stroke: {
      curve: 'smooth',
      width: 3,
    },

    colors: ['#ef4444'],

    dataLabels: {
      enabled: false,
    },

    grid: {
      borderColor: '#233046',
      strokeDashArray: 4,
    },

    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
      axisBorder: {
        show: false,
      },
    },

    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
        },
      },
    },

    tooltip: {
      theme: 'dark',
    },

    legend: {
      show: false,
    },
  };

  const series = [
    {
      name: 'Alarm',
      data: data,
    },
  ];

  return (
    <Box
      sx={{
        background: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        p: 2,
      }}
    >
      <Typography
        sx={{
          color: '#fff',
          fontWeight: 700,
          mb: 2,
        }}
      >
        TREND ALARM
      </Typography>

      <Chart
        options={options}
        series={series}
        type="line"
        height={220}
      />
    </Box>
  );
};

export default AlarmTrend;