import { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, IconButton } from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import EventSidebar, {
  dummyEvents,
  EventItem,
} from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import FloorplanView from 'src/components/dashboards/monitoring/monitoringcomponents/mainview/FloorplanView';
import LiveCamera from 'src/components/dashboards/monitoring/monitoringcomponents/footer/LiveCamera';
import DeviceInfo from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceInfo';
import DeviceLog from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceLog';
import EventDetail from 'src/components/dashboards/monitoring/monitoringcomponents/footer/EventDetail';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useSelector, RootState } from 'src/store/Store';
import { useSearchParams } from 'react-router';

const Monitoring = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [footerOpen, setFooterOpen] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMappingType | null>(null);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedFloorplan, setSelectedFloorplan] = useState<FloorplanType | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [siteId, setSiteId] = useState<string | null>(() => {
    const urlId = new URLSearchParams(window.location.search).get('siteId');
    if (urlId) return urlId;
    return localStorage.getItem('selectedSiteId');
  });

  const [role, setRole] = useState('');
  useEffect(() => {
    let currentRole = '';
    try {
      const responseStr = localStorage.getItem('response');
      const loggedInUser = responseStr ? JSON.parse(responseStr) : null;
      currentRole = loggedInUser?.role || localStorage.getItem('role') || '';
    } catch (e) {
      currentRole = localStorage.getItem('role') || '';
    }
    setRole(currentRole);
  }, []);

  const isSuperAdmin = role === 'SuperAdmin' || role?.toLowerCase() === 'superadmin';

  // Keep URL, state, and localStorage synced
  useEffect(() => {
    const handleSiteChange = () => {
      const currentSiteId = localStorage.getItem('selectedSiteId');
      setSiteId(currentSiteId);
      
      if (currentSiteId) {
        setSearchParams({ siteId: currentSiteId }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    };

    const urlId = searchParams.get('siteId');
    if (urlId && urlId !== localStorage.getItem('selectedSiteId')) {
      localStorage.setItem('selectedSiteId', urlId);
      localStorage.removeItem('selectedSite');
      window.dispatchEvent(new Event('siteChanged'));
    } else if (!urlId && siteId) {
      setSearchParams({ siteId }, { replace: true });
    }

    window.addEventListener('siteChanged', handleSiteChange);
    return () => {
      window.removeEventListener('siteChanged', handleSiteChange);
    };
  }, [searchParams, setSearchParams, siteId]);

  // Fetch all lookup data needed for MQTT message mapping
  const { data: deviceMappingResponse } = useDeviceMappingList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc', floorplanId: '' });
  const { data: floorplanResponse } = useFloorplanList();

  const alarmEventList = useSelector((state: RootState) => state.alarmEventReducer.alarmEventList);

  const events = useMemo(() => {
    const rawEvents = alarmEventList.length === 0 ? dummyEvents : alarmEventList;
    if (isSuperAdmin && !siteId) {
      return rawEvents.filter((evt) => {
        const sev = (evt.severity || '').toLowerCase();
        return sev === 'critical' || sev === 'high';
      });
    }
    return rawEvents;
  }, [alarmEventList, isSuperAdmin, siteId]);

  const handleSelectEvent = useCallback((event: EventItem) => {
    console.log("Event Clicked! ", event);
    const matchingDevice = deviceMappingResponse?.data?.find(
      (dm) => event.deviceId && (dm.id?.toLowerCase() === event.deviceId?.toLowerCase() || dm.deviceId?.toLowerCase() === event.deviceId?.toLowerCase())
    );

    // Auto-select floorplan based on event's floorplanId or matching device's floorplanId
    const targetFloorplanId = event.floorplanId || matchingDevice?.floorplanId;
    if (targetFloorplanId && floorplanResponse?.data) {
      const matchingFloorplan = floorplanResponse.data.find(
        (fp) => fp.id === targetFloorplanId
      );
      if (matchingFloorplan) {
        setSelectedFloorplan(matchingFloorplan);
      }
    }
    
    if (matchingDevice) {
      setSelectedDevice(matchingDevice);

      const mappedLog = {
        id: event.rawId || event.id.toString(),
        time: event.time,
        message: event.title,
        type: event.severity === 'Critical' ? ('Alarm' as const) : ('Event' as const),
        color: event.iconColor || '#3B82F6',
        severity: event.severity,
        site: event.site,
        area: event.area,
        deviceName: event.deviceName || matchingDevice.deviceName,
        deviceType: matchingDevice.deviceType,
        description: `${event.title} terdeteksi di area ${event.area || 'pengawasan'}.`,
        statusAlarm: event.statusAlarm,
        alarmCaseId: event.alarmCaseId
      };
      setSelectedLog(mappedLog);
    } else {
      console.warn('No matching device mapping found for event:', event);
    }
  }, [deviceMappingResponse, floorplanResponse, setSelectedFloorplan]);

  return (
    <PageContainer title="Monitoring" description="Security Monitoring Dashboard">
      <Box
        sx={{
          display: 'flex',
          bgcolor: '#0b0f19',
          height: 'calc(100vh - 90px)',
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Left Sidebar - Event List */}
        <Box
          sx={{
            width: sidebarOpen ? 260 : 0,
            minWidth: sidebarOpen ? 260 : 0,
            flexShrink: 0,
            borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
            position: 'relative',
            // transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'visible',
          }}
        >
          {/* Collapse/Expand Sidebar Button */}
          <IconButton
            onClick={() => setSidebarOpen((prev) => !prev)}
            size="small"
            sx={{
              position: 'absolute',
              right: sidebarOpen ? 0 : -24,
              top: 55,
              zIndex: 10,
              width: 28,
              height: 28,
              bgcolor: '#0b0f19',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              color: '#94A3B8',
              '&:hover': { bgcolor: '#111827', color: '#fff' },
            }}
          >
            {sidebarOpen ? <IconChevronLeft size={16} /> : <IconChevronRight size={16} />}
          </IconButton>

          <Box sx={{ flex: 1, overflow: 'hidden', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.2s' }}>
            <EventSidebar
              events={events}
              onSelectEvent={handleSelectEvent}
              selectedEventId={selectedLog ? Number(selectedLog.id) : null}
              currentFloorplanId={selectedFloorplan?.id}
            />
          </Box>
        </Box>

        {/* Right Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Top: Floorplan View */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              position: 'relative',
            }}
          >
            <FloorplanView
              selectedDeviceId={selectedDevice?.id}
              onSelectDevice={setSelectedDevice}
              selectedFloorplan={selectedFloorplan}
              onSelectFloorplan={setSelectedFloorplan}
            />

            {/* Collapse/Expand Footer Button */}
            <IconButton
              onClick={() => setFooterOpen((prev) => !prev)}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 45,
                right: "50%",
                zIndex: 10,
                width: 50,
                height: 28,
                bgcolor: '#0b0f19',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%',
                color: '#94A3B8',
                '&:hover': { bgcolor: '#111827', color: '#fff' },
              }}
            >
              {footerOpen ? <IconChevronsDown size={20} /> : <IconChevronsUp size={20} />}
            </IconButton>
          </Box>

          {/* Bottom: Footer Panels */}
          <Box
            sx={{
              height: footerOpen ? 300 : 0,
              minHeight: footerOpen ? 300 : 0,
              flexShrink: 0,
              display: footerOpen ? 'grid' : 'none',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 1.5,
              p: 1.5,
              pt: 1,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              bgcolor: '#0b0f19',
              transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <LiveCamera selectedDevice={selectedDevice} deviceMappings={deviceMappingResponse?.data || []} />
            <DeviceInfo selectedDevice={selectedDevice} />
            <DeviceLog selectedDevice={selectedDevice} events={events} selectedLog={selectedLog} onSelectLog={setSelectedLog} />
            <EventDetail selectedLog={selectedLog} />
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Monitoring;
