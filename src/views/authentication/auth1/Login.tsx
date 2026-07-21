import { Box, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import img1 from '/images/img1.png';
import AuthLogin from '../authForms/AuthLogin';

const Login = () => (
  <PageContainer title="Login" description="Login to SOC Alarm System">
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundImage: `url(${img1})`,
        backgroundSize: 'cover',
        backgroundPosition: 'left center',
        backgroundRepeat: 'no-repeat',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.85) 100%)',
          zIndex: 1,
        },
      }}
    >
      {/* Left half - Empty to offset the login card to the right half */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          flex: 1,
          zIndex: 2,
        }}
      />

      {/* Right half - Centering the login card inside it */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 2, lg: 0 },
          py: 4,
          zIndex: 2,
        }}
      >
        {/* Floating Glassmorphic Login Card */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '480px',
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header section (logo, title, subtitle) */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
            {/* Logo */}
            <Box mb={2} sx={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src="/Logo Bionics.png" 
                alt="Logo Bionics" 
                style={{ height: '70px', objectFit: 'contain' }} 
              />
            </Box>
            
            {/* Title */}
            <Typography 
              variant="h5" 
              fontWeight={700} 
              color="white" 
              sx={{ 
                letterSpacing: '1.5px', 
                textTransform: 'uppercase',
                textAlign: 'center',
                fontSize: '1.4rem'
              }}
            >
              SOC ALARM SYSTEM
            </Typography>
            
            {/* Subtitle */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#94A3B8', 
                mt: 0.5,
                textAlign: 'center',
                letterSpacing: '0.5px'
              }}
            >
              Secure. Monitor. Respond.
            </Typography>

            {/* Blue accent indicator */}
            <Box sx={{ width: 40, height: 3, bgcolor: '#1D4ED8', mt: 2, borderRadius: '2px' }} />
          </Box>

          <AuthLogin hideDivider />
        </Box>
      </Box>
    </Box>
  </PageContainer>
);

export default Login;
