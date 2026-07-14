import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useSelector } from 'src/store/Store';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconPower } from '@tabler/icons-react';
import { RootState } from 'src/store/Store';
import { Link, useNavigate } from 'react-router';
import axiosServices from 'src/utils/axios';

export const Profile = () => {
  const customizer = useSelector((state: RootState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({ name: 'User', role: 'Staff' });

  useEffect(() => {
    const responseStr = localStorage.getItem('response');
    if (responseStr) {
      try {
        const data = JSON.parse(responseStr);
        setUserInfo({
          name: data?.fullName || data?.username || localStorage.getItem('fullName') || 'User',
          role: data?.role || localStorage.getItem('role') || 'Staff',
        });
      } catch (e) {
        setUserInfo({
          name: localStorage.getItem('fullName') || 'User',
          role: localStorage.getItem('role') || 'Staff',
        });
      }
    } else {
      setUserInfo({
        name: localStorage.getItem('fullName') || 'User',
        role: localStorage.getItem('role') || 'Staff',
      });
    }
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await axiosServices.post('/api/auth/revoke', { refreshToken });
      }
    } catch (error) {
      console.error('Failed to revoke token:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('siteIds');
      localStorage.removeItem('response');
      navigate('/auth/login');
    }
  };

  return (
    <Box
      display={'flex'}
      alignItems="center"
      gap={2}
      sx={{ m: 3, p: 2, bgcolor: `${'secondary.light'}` }}
    >
      {!hideMenu ? (
        <>
          <Avatar
            alt="Remy Sharp"
            sx={{
              bgcolor: '#0d233a',
              color: '#4ea5ff',
            }}
          >
            <svg
              width={22}
              height={22}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M12 13.5c-3.8 0-6.5 2-6.5 4.5v1.2c0 .4.3.8.8.8h11.4c.5 0 .8-.4.8-.8v-1.2c0-2.5-2.7-4.5-6.5-4.5z" />
            </svg>
          </Avatar>

          <Box>
            <Typography variant="h6">{userInfo.name}</Typography>
            <Typography variant="caption">{userInfo.role}</Typography>
          </Box>
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title="Logout" placement="top">
              <IconButton
                color="primary"
                onClick={handleLogout}
                aria-label="logout"
                size="small"
              >
                <IconPower size="20" />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      ) : (
        ''
      )}
    </Box>
  );
};
