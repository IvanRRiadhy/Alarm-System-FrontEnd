import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  Box,
  Menu,
  Avatar,
  Typography,
  Divider,
  Button,
  IconButton,
  Stack
} from '@mui/material';
import * as dropdownData from './data';

import { IconMail } from '@tabler/icons-react';

import ProfileImg from 'src/assets/images/profile/user-1.jpg';
import unlimitedImg from 'src/assets/images/backgrounds/unlimited-bg.png';
import axiosServices from 'src/utils/axios';

import { useUserProfile } from 'src/hooks/useUser';

const Profile = () => {
  const [anchorEl2, setAnchorEl2] = useState(null);
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
  const role = profileData?.role || fallbackData?.role || localStorage.getItem('role') || 'Admin';
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
      localStorage.removeItem('selectedSiteId');
      localStorage.removeItem('selectedSite');
      navigate('/auth/login');
    }
  };

  const handleClick2 = (event: any) => {
    setAnchorEl2(event.currentTarget);
  };
  const handleClose2 = () => {
    setAnchorEl2(null);
  };

  return (
    <Box>
      <IconButton
        size="large"
        aria-label="show 11 new notifications"
        color="inherit"
        aria-controls="msgs-menu"
        aria-haspopup="true"
        sx={{
          ...(typeof anchorEl2 === 'object' && {
            color: 'primary.main',
          }),
        }}
        onClick={handleClick2}
      >
        <Avatar
          src={profilePicture || undefined}
          sx={{
            width: 35,
            height: 35,
            bgcolor: '#0d233a',
            color: '#4ea5ff',
          }}
        >
          {!profilePicture && (
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <circle cx="12" cy="8.5" r="3.5" />
              <path d="M12 13.5c-3.8 0-6.5 2-6.5 4.5v1.2c0 .4.3.8.8.8h11.4c.5 0 .8-.4.8-.8v-1.2c0-2.5-2.7-4.5-6.5-4.5z" />
            </svg>
          )}
        </Avatar>
      </IconButton>
      {/* ------------------------------------------- */}
      {/* Message Dropdown */}
      {/* ------------------------------------------- */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl2}
        keepMounted
        open={Boolean(anchorEl2)}
        onClose={handleClose2}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{
          '& .MuiMenu-paper': {
            width: '360px',
            p: 4,
          },
        }}
      >
        <Typography variant="h5">User Profile</Typography>
        <Stack direction="row" py={3} spacing={2} alignItems="center">
          <Avatar
            src={profilePicture || undefined}
            sx={{
              width: 95,
              height: 95,
              bgcolor: '#0d233a',
              color: '#4ea5ff',
            }}
          >
            {!profilePicture && (
              <svg
                width={52}
                height={52}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="8.5" r="3.5" />
                <path d="M12 13.5c-3.8 0-6.5 2-6.5 4.5v1.2c0 .4.3.8.8.8h11.4c.5 0 .8-.4.8-.8v-1.2c0-2.5-2.7-4.5-6.5-4.5z" />
              </svg>
            )}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" color="textPrimary" fontWeight={600}>
              {name}
            </Typography>
            {email && (
              <Typography variant="subtitle2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <IconMail size={16} />
                {email}
              </Typography>
            )}
            <Typography variant="subtitle2" color="textSecondary" mt={0.5}>
              Role: {role}
            </Typography>
          </Box>
        </Stack>
        <Divider />
        {/* {dropdownData.profile.map((profile) => (
          <Box key={profile.title}>
            <Box sx={{ py: 2, px: 0 }} className="hover-text-primary">
              <Link to={profile.href}>
                <Stack direction="row" spacing={2}>
                  <Box
                    width="45px"
                    height="45px"
                    bgcolor="primary.light"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Avatar
                      src={profile.icon}
                      alt={profile.icon}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={600}
                      color="textPrimary"
                      className="text-hover"
                      noWrap
                      sx={{
                        width: '240px',
                      }}
                    >
                      {profile.title}
                    </Typography>
                    <Typography
                      color="textSecondary"
                      variant="subtitle2"
                      sx={{
                        width: '240px',
                      }}
                      noWrap
                    >
                      {profile.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </Link>
            </Box>
          </Box>
        ))} */}
        <Stack spacing={1} mt={2}>
          <Button
            component={Link}
            to="/user-profile/edit"
            onClick={handleClose2}
            variant="contained"
            color="primary"
            fullWidth
          >
            Edit Profile
          </Button>
          <Button onClick={handleLogout} variant="outlined" color="error" fullWidth>
            Logout
          </Button>
        </Stack>
      </Menu>
    </Box>
  );
};

export default Profile;
