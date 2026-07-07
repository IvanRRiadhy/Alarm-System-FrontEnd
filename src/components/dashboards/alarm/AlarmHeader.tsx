import React from 'react';
import { Box, Typography } from '@mui/material';
import { IconHome2 } from '@tabler/icons-react';

interface AlarmHeaderProps {
  title?: string;
}

const AlarmHeader: React.FC<AlarmHeaderProps> = ({ title = 'SOC Dashboard' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, color: '#fff' }}>
    <IconHome2 size={32} stroke={1.5} style={{ marginRight: 8, color: '#3b82f6' }} />
    <Typography variant="h4" sx={{ fontWeight: 700, fontSize: '1.8rem' }}>
      {title}
    </Typography>
  </Box>
);

export default AlarmHeader;