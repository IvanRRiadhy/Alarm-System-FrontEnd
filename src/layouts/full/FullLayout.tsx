import { FC, useEffect, useState } from 'react';
import { styled, Container, Box, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'src/store/Store';
import { Outlet } from 'react-router';
import { RootState, AppDispatch } from 'src/store/Store';
import Header from './vertical/header/Header';
import Sidebar from './vertical/sidebar/Sidebar';
import Customizer from './shared/customizer/Customizer';
import Navigation from '../full/horizontal/navbar/Navigation';
import HorizontalHeader from '../full/horizontal/header/Header';
import ScrollToTop from '../../components/shared/ScrollToTop';
import LoadingBar from '../../LoadingBar';
import { Toaster } from 'react-hot-toast';
import { startMQTTclient } from 'src/utils/MQTT';
import { AddAlarmEvent, AlarmEvent } from 'src/store/apps/crud/alarmEvent';
import toast from 'react-hot-toast';
import { useAlarmEventList } from 'src/hooks/useAlarmEvent';
import { mapAlarmEventToEventItem } from 'src/utils/alarmMessageMapper';
import AlarmPopup from 'src/utils/AlarmPopup';
import { useQueryClient } from '@tanstack/react-query';

const MainWrapper = styled('div')(() => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '0px',
  flexDirection: 'column',
  zIndex: 1,
  width: '100%',
  backgroundColor: 'transparent',
}));

const FullLayout: FC = () => {
  const customizer = useSelector((state: RootState) => state.customizer);
  const theme = useTheme();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [criticalAlarm, setCriticalAlarm] = useState<AlarmEvent | null>(null);

  useAlarmEventList({ page: 1, limit: 100 });
  useEffect(() => {
    console.log('[MQTT] Connected to global event/alarm subscription');
    
    const handleMqttMessage = (data: any) => {
      console.log('[MQTT] Global received alarm message:', data);
      const message = data as AlarmEvent;

      if (!message.id || !message.deviceId || !message.message) {
        console.warn('[MQTT] Message does not match expected alarm structure, skipping:', data);
        return;
      }

      const cache = queryClient.getQueriesData<any>({ queryKey: ['alarm-rule-list'] });
      const ruleEntry = cache.find((item) => item[1]?.data);
      const alarmRules = ruleEntry ? ruleEntry[1].data : [];

      const eventItem = mapAlarmEventToEventItem(message, alarmRules);

      // Dispatch mapped event to Redux store
      dispatch(AddAlarmEvent(eventItem));

      // Trigger standard toast notification
      const sev = (message.severity || '').toLowerCase();
      const isOnDashboard = window.location.pathname.includes('/dashboards/');
      const role = localStorage.getItem('role');
      if (sev === 'critical') {
        // toast.error(`CRITICAL ALARM: ${message.message} (Device: ${message.deviceName || message.deviceId})`);
        if(message.triggered) setCriticalAlarm(message);
      } else if (sev === 'high' && role?.toLowerCase() === "admin") {
        // toast.error(`Alarm: ${message.message} (Device: ${message.deviceName || message.deviceId})`);
        if(message.triggered) setCriticalAlarm(message);

      } else {
        // toast.success(`Info: ${message.message} (Device: ${message.deviceName || message.deviceId})`);
      }

      // Post message for Notification.tsx to trigger bubble and bell animation
      window.postMessage(
        {
          type: 'app:new-alarm',
          detail: { alarm: eventItem },
        },
        '*'
      );
    };

    const unsubscribe = startMQTTclient(handleMqttMessage, 'event/alarm/#');

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [dispatch]);

  return (
    <>
      <LoadingBar />
      <MainWrapper className={customizer.activeMode === 'dark' ? 'darkbg mainwrapper' : 'mainwrapper'} >

        {/* ------------------------------------------- */}
        {/* Sidebar */}
        {/* ------------------------------------------- */}
        {customizer.isHorizontal ? '' : <Sidebar />}
        {/* ------------------------------------------- */}
        {/* Main Wrapper */}
        {/* ------------------------------------------- */}
        <PageWrapper
          className="page-wrapper"
          sx={{
            ...(customizer.isCollapse && {
              [theme.breakpoints.up('lg')]: { ml: `${customizer.MiniSidebarWidth}px` },
            }),
              overflow: "hidden",
              padding: "0px !important",
          }}
        >
          {/* ------------------------------------------- */}
          {/* Header */}
          {/* ------------------------------------------- */}
          {customizer.isHorizontal ? <HorizontalHeader /> : <Header />}
          {/* PageContent */}
          {customizer.isHorizontal ? <Navigation /> : ''}
          <Container
            sx={{
              pt: '0px',
              maxWidth: customizer.isLayout === 'boxed' ? 'lg' : '100%!important',
              overflow: "hidden",
              '& .css-7ndfpp-MuiContainer-root': {
                padding: '0!important',
              },
              paddingRight: '0px !important',
              paddingLeft: '0px !important'
            }}
          >
            {/* ------------------------------------------- */}
            {/* PageContent */}
            {/* ------------------------------------------- */}

            <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
              <ScrollToTop>
                <Outlet />
              </ScrollToTop>
            </Box>

            {/* ------------------------------------------- */}
            {/* End Page */}
            {/* ------------------------------------------- */}
          </Container>
          {/* <Customizer /> */}
        </PageWrapper>
      </MainWrapper>
            <AlarmPopup alarm={criticalAlarm} onClose={() => setCriticalAlarm(null)} />
      <Toaster
        position="top-center"
        containerStyle={{
          fontSize: '1.15rem',
          padding: '16px 24px',
          minWidth: '500px',
        }}
        toastOptions={{
          success: {
            style: {
              background: 'darkgreen',
              color: '#fff',
            },
          },
          error: {
            style: {
              background: 'darkred',
              color: '#fff',
            },
          },
        }}
      />
    </>

  );
};

export default FullLayout;
