import React from 'react';
import {
  Box,
  Typography,
  Stack,
} from '@mui/material';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

type DeviceStatusProps = {
  deviceOnline?: number;
  deviceOffline?: number;
  totalTrouble?: number;
};

const DeviceStatus: React.FC<DeviceStatusProps> = ({
  deviceOnline = 0,
  deviceOffline = 0,
  totalTrouble = 0,
}) => {
  const series = [deviceOnline, deviceOffline, totalTrouble];

  const total = series.reduce((a, b) => a + b, 0);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      background: 'transparent',
      toolbar: {
        show: false,
      },
    },

    labels: ['Online', 'Offline', 'Trouble'],

    colors: ['#22c55e', '#f59e0b', '#ef4444'],

    legend: {
      show: false,
    },

    stroke: {
      width: 0,
    },

    dataLabels: {
      enabled: false,
    },

    tooltip: {
      theme: 'dark',
    },

    plotOptions: {
      pie: {
        donut: {
          size: '72%',

          labels: {
            show: true,

            name: {
              show: false,
            },

            value: {
              show: false,
            },

            total: {
              show: true,
              showAlways: true,
              label: 'Total',

              formatter: () => total.toLocaleString('id-ID'),
            },
          },
        },
      },
    },
  };

  const items = [
    {
      color: '#22c55e',
      label: 'Online',
      value: deviceOnline,
    },
    {
      color: '#f59e0b',
      label: 'Offline',
      value: deviceOffline,
    },
    {
      color: '#ef4444',
      label: 'Trouble',
      value: totalTrouble,
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
          color: 'white',
          fontWeight: 700,
          mb: 2,
        }}
      >
        STATUS DEVICE
      </Typography>

      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box width={"60%"}>
          <Chart
            options={options}
            series={series}
            type="donut"
            height={200}
          />
        </Box>

        <Stack spacing={2} flex={1}>
          {items.map((item) => {
            const percent = total > 0 ? Math.round((item.value / total) * 100) : 0;

            return (
              <Box
                key={item.label}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: item.color,
                    }}
                  />

                  <Typography
                    sx={{
                      color: '#E5E7EB',
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>

                <Typography
                  sx={{
                    color: '#94A3B8',
                  }}
                >
                  {item.value.toLocaleString('id-ID')} ({percent}%)
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
};

export default DeviceStatus;