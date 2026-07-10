import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, IconButton } from '@mui/material';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsDown,
  IconChevronsUp,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import EventSidebar, { dummyEvents, EventItem } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import FloorplanView from 'src/components/dashboards/monitoring/monitoringcomponents/mainview/FloorplanView';
import LiveCamera from 'src/components/dashboards/monitoring/monitoringcomponents/footer/LiveCamera';
import DeviceInfo from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceInfo';
import DeviceLog from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceLog';
import EventDetail from 'src/components/dashboards/monitoring/monitoringcomponents/footer/EventDetail';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { startMQTTclient } from 'src/utils/MQTT';
import { mapAlarmMessageToEvents, MqttAlarmMessage, AlarmLookupData } from 'src/utils/alarmMessageMapper';
import { useControllerList } from 'src/hooks/useController';
import { useChannel } from 'src/hooks/useChannel';
import { useDeviceList } from 'src/hooks/useDevice';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';

const Monitoring = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [footerOpen, setFooterOpen] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMappingType | null>(null);
  const [events, setEvents] = useState<EventItem[]>(dummyEvents);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Fetch all lookup data needed for MQTT message mapping
  const { data: controllerResponse } = useControllerList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' });
  const { data: channelResponse } = useChannel({ page: 1, limit: 1000, sortBy: 'channelNo', sortOrder: 'asc', controllerId: null });
  const { data: deviceResponse } = useDeviceList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' });
  const { data: deviceMappingResponse } = useDeviceMappingList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc', floorplanId: null });

  // Keep lookup data in a ref so the MQTT callback always sees the latest
  const lookupRef = useRef<AlarmLookupData>({
    controllers: [],
    channels: [],
    devices: [],
    deviceMappings: [],
  });

  useEffect(() => {
    lookupRef.current = {
      controllers: controllerResponse?.data || [],
      channels: channelResponse?.data || [],
      devices: deviceResponse?.data || [],
      deviceMappings: deviceMappingResponse?.data || [],
    };
  }, [controllerResponse, channelResponse, deviceResponse, deviceMappingResponse]);

  // Stable MQTT message handler that reads from lookupRef
  const handleMqttMessage = useCallback((data: any) => {
    console.log('[MQTT] Received alarm message:', data);

    const message = data as MqttAlarmMessage;

    // Validate that the message has the expected structure
    if (!message.site_id || !message.client_id || !message.zones || !message.relays) {
      console.warn('[MQTT] Message does not match expected alarm structure, skipping:', data);
      return;
    }

    const newEvents = mapAlarmMessageToEvents(message, lookupRef.current);
    console.log(`[MQTT] Mapped ${newEvents.length} events from alarm message`);

    if (newEvents.length > 0) {
      setEvents((prev) => [...newEvents, ...prev]);
    }
  }, []);

  useEffect(() => {
    console.log('[MQTT] Connecting & subscribing to alarm/events/');
    const unsubscribe = startMQTTclient(handleMqttMessage, 'alarm/events/');

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleMqttMessage]);

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
            <EventSidebar events={events} />
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
              {footerOpen ? <IconChevronsDown size={20  } /> : <IconChevronsUp size={20} />}
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
            <LiveCamera selectedDevice={selectedDevice} />
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
