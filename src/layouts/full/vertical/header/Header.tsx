import React, { useState } from 'react';

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
import HeaderRegion from './components/HeaderRegion';

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

  const [region, setRegion] = useState('Semua Region');

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

            <HeaderRegion
              region={region}
              onChange={setRegion}
            />

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