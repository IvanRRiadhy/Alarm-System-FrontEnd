import { useState, useEffect, useRef, useCallback } from 'react';
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
  getEventIconAndColor,
  Severity,
} from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import FloorplanView from 'src/components/dashboards/monitoring/monitoringcomponents/mainview/FloorplanView';
import LiveCamera from 'src/components/dashboards/monitoring/monitoringcomponents/footer/LiveCamera';
import DeviceInfo from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceInfo';
import DeviceLog from 'src/components/dashboards/monitoring/monitoringcomponents/footer/DeviceLog';
import EventDetail from 'src/components/dashboards/monitoring/monitoringcomponents/footer/EventDetail';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
// import { startMQTTclient } from 'src/utils/MQTT';
import { AlarmLookupData } from 'src/utils/alarmMessageMapper';
import { useControllerList } from 'src/hooks/useController';
import { useChannel } from 'src/hooks/useChannel';
import { useDeviceList } from 'src/hooks/useDevice';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { useAlarmEventList } from 'src/hooks/useAlarmEvent';
import { AlarmEvent } from 'src/store/apps/crud/alarmEvent';
import { startMQTTclient } from 'src/utils/MQTT';

// Helper function to map AlarmEvent to EventItem
const mapAlarmEventToEventItem = (event: AlarmEvent): EventItem => {
  let hash = 5381;
  for (let i = 0; i < event.id.length; i++) {
    hash = (hash * 33) ^ event.id.charCodeAt(i);
  }
  const numericId = Math.abs(hash);
  // const eventTime = event.createdAt.endsWith("Z") ? event.createdAt : `${event.createdAt}Z`;
  const dateObj = new Date(event.createdAt);
  let timeStr = '';
  if (!isNaN(dateObj.getTime())) {
    const datePart = dateObj.toLocaleDateString('en-GB'); // "DD/MM/YYYY"
    const timePart = dateObj.toLocaleTimeString('it-IT'); // "HH:mm:ss"
    timeStr = `${datePart} ${timePart}`;
  }

  let severity: Severity = 'Low';
  const sevLower = (event.severity || '').toLowerCase();
  if (sevLower === 'critical') {
    severity = 'Critical';
  } else if (sevLower === 'high' || sevLower === 'medium') {
    severity = 'High';
  }

  const { icon, color } = getEventIconAndColor(event.deviceType || event.message);

  let statusAlarm = event.statusAlarm;
  if (event.statusEvents && typeof event.statusEvents === 'object') {
    const eventType = event.statusEvents.event_type || event.statusEvents.eventType;
    if (eventType === 'TRIGGER') {
      statusAlarm = 'ON';
    } else if (eventType === 'RELEASE') {
      statusAlarm = 'OFF';
    }
  }

  return {
    id: numericId,
    time: timeStr,
    title: event.message,
    site: event.siteName || 'Unknown Site',
    severity,
    area: event.floorName || event.buildingName || event.siteRegion || 'Unknown Area',
    icon,
    iconColor: color,
    deviceId: event.deviceId,
    deviceName: event.deviceName,
    floorplanId: event.floorplanId,
    statusAlarm,
    rawId: event.id,
    createdAt: event.createdAt,
  };
};

const Monitoring = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [footerOpen, setFooterOpen] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceMappingType | null>(null);
  const [events, setEvents] = useState<EventItem[]>(dummyEvents);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedFloorplan, setSelectedFloorplan] = useState<FloorplanType | null>(null);

  // Fetch all lookup data needed for MQTT message mapping
  const { data: controllerResponse } = useControllerList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' });
  const { data: channelResponse } = useChannel({ page: 1, limit: 1000, sortBy: 'channelNo', sortOrder: 'asc', controllerId: null });
  const { data: deviceResponse } = useDeviceList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc' });
  const { data: deviceMappingResponse } = useDeviceMappingList({ page: 1, limit: 1000, sortBy: 'name', sortOrder: 'asc', floorplanId: '' });
  const { data: alarmEventsResponse } = useAlarmEventList({ page: 1, limit: 100 });

  const handleSelectEvent = useCallback((event: EventItem) => {
    const matchingDevice = deviceMappingResponse?.data?.find(
      (dm) => event.deviceId && (dm.id?.toLowerCase() === event.deviceId?.toLowerCase() || dm.deviceId?.toLowerCase() === event.deviceId?.toLowerCase())
    );
    
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
      };
      setSelectedLog(mappedLog);
    } else {
      console.warn('No matching device mapping found for event:', event);
    }
  }, [deviceMappingResponse]);


  // Load and map history events on initialization
  useEffect(() => {
    if (alarmEventsResponse?.data) {
      const mapped = alarmEventsResponse.data.map(mapAlarmEventToEventItem);
      setEvents((prev) => {
        const existingIds = new Set(prev.map((e) => e.id));
        const newUnique = mapped.filter((e) => !existingIds.has(e.id));
        return [...prev, ...newUnique];
      });
    }
  }, [alarmEventsResponse]);

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

  // Stable MQTT message handler that reads direct AlarmEvent payload
  const handleMqttMessage = useCallback((data: any) => {
    console.log('[MQTT] Received alarm message:', data);

    const message = data as AlarmEvent;

    // Validate that the message has the expected structure
    if (!message.id || !message.deviceId || !message.message) {
      console.warn('[MQTT] Message does not match expected alarm structure, skipping:', data);
      return;
    }

    const newEvent = mapAlarmEventToEventItem(message);
    console.log(`[MQTT] Mapped event from alarm message`, newEvent);

    setEvents((prev) => [newEvent, ...prev]);
  }, []);

  useEffect(() => {
    console.log('[MQTT] Connecting & subscribing to event/alarm');
    const unsubscribe = startMQTTclient(handleMqttMessage, 'event/alarm');

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
