import React, { useState, useEffect } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip, useMediaQuery } from '@mui/material';
import { useSelector } from 'src/store/Store';
import img1 from 'src/assets/images/profile/user-1.jpg';
import { IconPower } from '@tabler/icons-react';
import { RootState } from 'src/store/Store';
import { Link, useNavigate } from 'react-router';
import axiosServices from 'src/utils/axios';

import { useUserProfile } from 'src/hooks/useUser';

export const Profile = () => {
  const customizer = useSelector((state: RootState) => state.customizer);
  const lgUp = useMediaQuery((theme: any) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const navigate = useNavigate();
  const { data: profileData } = useUserProfile();

  const responseStr = localStorage.getItem('response');
  const userProfileStr = localStorage.getItem('userProfile');
  let fallbackData: any = {};
  try {
    fallbackData = userProfileStr ? JSON.parse(userProfileStr) : (responseStr ? JSON.parse(responseStr) : {});
  } catch (e) {}

  const name = profileData?.fullName || profileData?.username || fallbackData?.fullName || fallbackData?.username || localStorage.getItem('fullName') || 'User';
  const email = profileData?.email || fallbackData?.email || '';
  const role = profileData?.role || fallbackData?.role || localStorage.getItem('role') || 'Staff';
  const profilePicture = profileData?.profilePicture || fallbackData?.profilePicture;

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
      localStorage.removeItem('userProfile');
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
            src={profilePicture || undefined}
            alt={name}
            sx={{
              bgcolor: '#0d233a',
              color: '#4ea5ff',
            }}
          >
            {!profilePicture && (
              <svg
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="8.5" r="3.5" />
                <path d="M12 13.5c-3.8 0-6.5 2-6.5 4.5v1.2c0 .4.3.8.8.8h11.4c.5 0 .8-.4.8-.8v-1.2c0-2.5-2.7-4.5-6.5-4.5z" />
              </svg>
            )}
          </Avatar>

          <Box>
            <Typography variant="h6">{name}</Typography>
            {email && (
              <Typography variant="caption" display="block" color="textSecondary">
                {email}
              </Typography>
            )}
            <Typography variant="caption" color="textSecondary">{role}</Typography>
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
