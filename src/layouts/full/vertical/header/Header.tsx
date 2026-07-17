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

import { IconMenu2, IconRefresh } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  const handleRefetchSummary = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const customizer = useSelector(
    (state: RootState) => state.customizer
  );

  const [selectedSite, setSelectedSite] = useState<SiteType | null>(null);
  const [userRole, setUserRole] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  const { data: siteLookupResponse, isLoading: isLoadingSites } = useSiteLookup();
  const sites = siteLookupResponse?.data || [];

  useEffect(() => {
    const syncSelectedSite = () => {
      const savedSite = localStorage.getItem('selectedSite');
      if (savedSite) {
        try {
          setSelectedSite(JSON.parse(savedSite));
        } catch (e) {
          console.error(e);
        }
      } else {
        setSelectedSite(null);
      }
    };

    syncSelectedSite();

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

    window.addEventListener('siteChanged', syncSelectedSite);
    return () => {
      window.removeEventListener('siteChanged', syncSelectedSite);
    };
  }, []);

  // Synchronize selectedSite if selectedSiteId is present in localStorage but selectedSite is not
  useEffect(() => {
    const savedSite = localStorage.getItem('selectedSite');
    const savedSiteId = localStorage.getItem('selectedSiteId');
    if (!savedSite && savedSiteId && sites.length > 0) {
      const matchingSite = sites.find((s: SiteType) => s.id === savedSiteId);
      if (matchingSite) {
        setSelectedSite(matchingSite);
        localStorage.setItem('selectedSite', JSON.stringify(matchingSite));
        window.dispatchEvent(new Event('siteChanged'));
      }
    }
  }, [sites]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setShowHeader(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > 10) {
        if (e.clientY < 80) {
          setShowHeader(true);
        } else {
          setShowHeader(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const AppBarStyled = styled(AppBar, {
    shouldForwardProp: (prop) => prop !== 'isScrolled' && prop !== 'showHeader',
  })<{ isScrolled: boolean; showHeader: boolean }>(({ theme, isScrolled, showHeader }) => ({
    background: '#111827',
    boxShadow: 'none',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    backdropFilter: 'blur(10px)',
    position: 'sticky',
    top: 0,
    zIndex: 1100,
    transform: isScrolled && !showHeader ? 'translateY(-100%)' : 'translateY(0)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease, box-shadow 0.3s ease, border-bottom 0.3s ease',

    [theme.breakpoints.up('lg')]: {
      minHeight: customizer.TopbarHeight,
    },

    ...(isScrolled && {
      background: 'rgba(17, 24, 39, 0.85)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }),
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
      isScrolled={isScrolled}
      showHeader={showHeader}
      onMouseEnter={() => setShowHeader(true)}
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

            <Box display="flex" alignItems="center" gap={1}>
              <HeaderSummary />
              <IconButton
                color="inherit"
                onClick={handleRefetchSummary}
                title="Refresh Dashboard Summary"
                sx={{
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <IconRefresh size={16} />
              </IconButton>
            </Box>

            <Box width={40} />

            <HeaderClock />

            <Box width={30} />

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