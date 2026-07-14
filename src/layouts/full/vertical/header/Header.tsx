import React, { useState, useEffect } from 'react';

import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Stack,
  styled,
  useMediaQuery,
} from '@mui/material';

import { IconMenu2 } from '@tabler/icons-react';

import { useDispatch, useSelector } from 'src/store/Store';
import {
  toggleMobileSidebar,
  toggleSidebar,
} from 'src/store/customizer/CustomizerSlice';

import { RootState } from 'src/store/Store';

import Notifications from './Notification';
import Profile from './Profile';
import MobileRightSidebar from './MobileRightSidebar';

import HeaderLogo from './components/HeaderLogo';
import HeaderClock from './components/HeaderClock';
import HeaderSummary from './components/HeaderSummary';
import HeaderStatus from './components/HeaderStatus';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { useSiteLookup } from 'src/hooks/useSite';
import { SiteType } from 'src/store/apps/crud/site';

const Header = () => {
  const lgUp = useMediaQuery((theme: any) =>
    theme.breakpoints.up('lg')
  );

  const lgDown = useMediaQuery((theme: any) =>
    theme.breakpoints.down('lg')
  );

  const dispatch = useDispatch();

  const customizer = useSelector(
    (state: RootState) => state.customizer
  );

  const [selectedSite, setSelectedSite] = useState<SiteType | null>(null);
  const [userRole, setUserRole] = useState('');

  const { data: siteLookupResponse, isLoading: isLoadingSites } = useSiteLookup();
  const sites = siteLookupResponse?.data || [];

  useEffect(() => {
    const savedSite = localStorage.getItem('selectedSite');
    if (savedSite) {
      try {
        setSelectedSite(JSON.parse(savedSite));
      } catch (e) {
        console.error(e);
      }
    }

    const responseStr = localStorage.getItem('response');
    if (responseStr) {
      try {
        const parsed = JSON.parse(responseStr);
        setUserRole(parsed?.role || localStorage.getItem('role') || '');
      } catch (e) {
        setUserRole(localStorage.getItem('role') || '');
      }
    } else {
      setUserRole(localStorage.getItem('role') || '');
    }
  }, []);

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    background: '#111827',
    boxShadow: 'none',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    backdropFilter: 'blur(10px)',

    [theme.breakpoints.up('lg')]: {
      minHeight: customizer.TopbarHeight,
    },
  }));

  const ToolbarStyled = styled(Toolbar)(() => ({
    minHeight: 82,
    paddingLeft: 20,
    paddingRight: 20,
  }));

  return (
    <AppBarStyled
      position="sticky"
      color="transparent"
    >
      <ToolbarStyled>

        {/* Sidebar */}

        <IconButton
          color="inherit"
          sx={{
            color: 'white',
            mr: 2,
          }}
          onClick={
            lgUp
              ? () => dispatch(toggleSidebar())
              : () => dispatch(toggleMobileSidebar())
          }
        >
          <IconMenu2 size={24} />
        </IconButton>

        {/* Logo */}

        <HeaderLogo />

        {/* Desktop */}

        {lgUp && (
          <>
            <Box flex={1} />

            <HeaderSummary />

            <Box width={40} />

            <HeaderClock />

            <Box width={30} />

             {userRole === 'Admin' && (
               <Box sx={{ minWidth: 220 }}>
                 <CustomAutocomplete<SiteType>
                   id="header-site-select"
                   placeholder="Pilih Site"
                   options={sites}
                   loading={isLoadingSites}
                   value={selectedSite}
                   onChange={(val) => {
                     setSelectedSite(val);
                     if (val) {
                       localStorage.setItem('selectedSiteId', val.id);
                       localStorage.setItem('selectedSite', JSON.stringify(val));
                     } else {
                       localStorage.removeItem('selectedSiteId');
                       localStorage.removeItem('selectedSite');
                     }
                     window.dispatchEvent(new Event('siteChanged'));
                   }}
                   getOptionLabel={(option) => option.name}
                   isOptionEqualToValue={(option, value) => option.id === value.id}
                   sx={{
                     '& .MuiOutlinedInput-root': {
                       bgcolor: '#0F172A',
                       color: '#F8FAFC',
                       fontSize: 13,
                       borderRadius: 2,
                       '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                       '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                       '&.Mui-focused fieldset': { borderColor: '#2563EB' },
                     },
                     '& .MuiInputBase-input::placeholder': { color: '#64748B', opacity: 1 },
                   }}
                 />
               </Box>
             )}

            <Box width={20} />

            <HeaderStatus />

            <Box width={16} />

            <Notifications />

            <Profile />
          </>
        )}

        {/* Mobile */}

        {lgDown && (
          <>
            <Box flex={1} />

            <Notifications />

            <MobileRightSidebar />

            <Profile />
          </>
        )}

      </ToolbarStyled>
    </AppBarStyled>
  );
};

export default Header;