import React from 'react';
import { Box, Typography } from '@mui/material';

type AlarmTrendProps = {
  region: string;
};

const AlarmTrend: React.FC<AlarmTrendProps> = ({ region }) => {
  return (
    <Box sx={{ p: 2, backgroundColor: '#1e293b', borderRadius: '8px' }}>
      <Typography variant="h6" sx={{ color: '#fff' }}>
        Alarm Trend for {region}
      </Typography>
      {/* TODO: Add chart visualization */}
    </Box>
  );
};

export default AlarmTrend;
