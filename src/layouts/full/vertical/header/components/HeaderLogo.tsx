import { Box, Typography } from '@mui/material';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import Logo from '/Logo Bionics.png';

const HeaderLogo = () => {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={1.5}
    >
      <Box
        sx={{
          width: 46,
          height: 46,
          borderRadius: 2,
          bgcolor: 'transparent',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <img
          src={Logo}
          alt="Logo"
          style={{
            width: 46,
            height: 46,
            borderRadius: 2,
          }}
        />
      </Box>

      <Box>
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 18,
            lineHeight: 1.2,
          }}
        >
          Bionics Alarm Monitoring System
        </Typography>

        <Typography
          sx={{
            color: '#94A3B8',
            fontSize: 12,
          }}
        >
          Security Operations Center
        </Typography>
      </Box>
    </Box>
  );
};

export default HeaderLogo;