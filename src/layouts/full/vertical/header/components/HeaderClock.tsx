import { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import dayjs from 'dayjs';

const HeaderClock = () => {
  const [time, setTime] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <AccessTimeRoundedIcon
        sx={{
          color: '#38BDF8',
          fontSize: 28,
        }}
      />

      <Box>
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
          }}
        >
          {time.format('DD MMM YYYY')}
        </Typography>

        <Typography
          sx={{
            color: '#94A3B8',
            fontSize: 13,
          }}
        >
          {time.format('HH:mm:ss')} WIB
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderClock;