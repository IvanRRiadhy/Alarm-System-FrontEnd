import React from 'react';
import { Box, Typography } from '@mui/material';

type FloorPlanProps = {};

const FloorPlan: React.FC<FloorPlanProps> = () => {
  return (
    <Box
      sx={{
        p: 2,
        background: 'linear-gradient(135deg, #0d1117, #1e293b)',
        borderRadius: '12px',
        color: '#fff',
        minHeight: '250px',
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Floor Plan
      </Typography>
      {/* Placeholder for floor plan visualization */}
      <Typography variant="body2" sx={{ opacity: 0.7 }}>
        Floor plan graphic goes here.
      </Typography>
    </Box>
  );
};

export default FloorPlan;
