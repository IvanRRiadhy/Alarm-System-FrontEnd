import React from 'react';
import { Box, Typography } from '@mui/material';

type DeviceStatusProps = {
  region: string;
};

const DeviceStatus: React.FC<DeviceStatusProps> = ({ region }) => {
  return (
    <Box sx={{ p: 2, backgroundColor: '#1e293b', borderRadius: '8px' }}>
      <Typography variant="h6" sx={{ color: '#fff' }}>
        Device Status for {region}
      </Typography>
      {/* TODO: Add actual device status details */}
    </Box>
  );
};

export default DeviceStatus;
