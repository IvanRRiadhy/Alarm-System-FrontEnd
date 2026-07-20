import { EventItem, IoDeviceItem, getEventIconAndColor } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { controllerType } from 'src/store/apps/crud/controller';
import { channelType } from 'src/store/apps/crud/channel';
import { deviceType } from 'src/store/apps/crud/devices';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import type { Severity } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { AlarmEvent } from 'src/store/apps/crud/alarmEvent';
import { AlarmCaseType, AlarmCaseOutputType } from 'src/store/apps/crud/alarmCase';

// ── MQTT Message Types ──────────────────────────────────────────────────

export interface MqttRelayOnEvent {
  index: number;
  name: string;
  rule: string;
  state: boolean;
  deviceNameCms: string;
  deviceTypeCms: string;
}

export interface MqttStatusEventSource {
  type: string;
  name: string;
  deviceIdCms: string;
  deviceNameCms: string;
  deviceTypeCms: string;
  zoneType: string;
  timestampUtc: string;
}

export interface MqttStatusEvents {
  siteId: string;
  deviceId: string;
  ts: string;
  state: string;
  source: MqttStatusEventSource;
  relaysOnEvent: MqttRelayOnEvent[];
}

export interface MqttAlarmMessage {
  id: string;
  alarmCaseId: string | null;
  deviceId: string;
  controllerId: string;
  siteId: string;
  buildingId: string | null;
  floorId: string | null;
  floorplanId: string | null;
  statusDevice: string;
  statusAlarm: string;
  posPxX: number | null;
  posPxY: number | null;
  createdAt: string;
  severity: string;
  message: string;
  siteRegion: string | null;
  deviceName: string;
  deviceType: string;
  controllerName: string;
  controllerMac: string;
  siteName: string;
  buildingName: string | null;
  floorName: string | null;
  triggered: boolean;
  restored: boolean;
  statusEvents?: MqttStatusEvents | null;
}

// ── Lookup Data Bundle ──────────────────────────────────────────────────

export interface AlarmLookupData {
  controllers: controllerType[];
  channels: channelType[];
  devices: deviceType[];
  deviceMappings: DeviceMappingType[];
}

// ── Main Mapper Function ────────────────────────────────────────────────

/**
 * Maps an MQTT alarm message to an array of EventItem objects.
 * 
 * Uses mapAlarmEventToEventItem internally since MqttAlarmMessage and AlarmEvent
 * share the same basic properties.
 */
export function mapAlarmMessageToEvents(
  message: MqttAlarmMessage,
  lookupData?: AlarmLookupData,
  alarmRules: any[] = [],
): EventItem[] {
  const eventItem = mapAlarmEventToEventItem(message as unknown as AlarmEvent, alarmRules);
  return [eventItem];
}

// ── Hash Utility ────────────────────────────────────────────────────────

/**
 * Simple string → number hash for generating a numeric ID from the composite string.
 * Uses a djb2-like algorithm to produce a positive integer.
 */
function hashStringToNumber(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

export function mapAlarmEventToEventItem(event: AlarmEvent, alarmRules: any[] = []): EventItem {
  let hash = 5381;
  for (let i = 0; i < event.id.length; i++) {
    hash = (hash * 33) ^ event.id.charCodeAt(i);
  }
  const numericId = Math.abs(hash);
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
  } else if (sevLower === 'high') {
    severity = 'High';
  } else if (sevLower === 'medium') {
    severity = 'Medium';
  }

  const { icon, color } = getEventIconAndColor(event.deviceType || event.message);

  // let statusAlarm = event.statusAlarm;
  // if (event.statusEvents && typeof event.statusEvents === 'object') {
  //   const eventType = event.statusEvents.event_type || event.statusEvents.eventType;
  //   if (eventType === 'TRIGGER') {
  //     statusAlarm = 'ON';
  //   } else if (eventType === 'RELEASE') {
  //     statusAlarm = 'OFF';
  //   }
  // }
  let statusAlarm = event.statusAlarm;
  // if(event.triggered) {
  //   statusAlarm = "ON";
  // } else if(event.restored) {
  //   statusAlarm = "RESTORED";
  // }


  // 1. Map InputDevice
  let inputDevice: any = null;
  const hasStatusEvents = event.statusEvents && typeof event.statusEvents === 'object';
  const statusVal =  event.triggered ? hasStatusEvents ? 'active' : 'nonActive' : 'nonActive';

  if (hasStatusEvents && event.statusEvents.source) {
    const src = event.statusEvents.source;
    inputDevice = {
      deviceId: event.deviceId || '',
      deviceName: src.deviceNameCms || event.deviceName || '',
      deviceType: src.deviceTypeCms || event.deviceType || '',
      status: statusVal,
    };
  } else {
    inputDevice = {
      deviceId: event.deviceId || '',
      deviceName: event.deviceName || '',
      deviceType: event.deviceType || '',
      status: statusVal,
    };
  }

  // 2. Map OutputDevices
  const outputDevices: any[] = [];
  if (hasStatusEvents && Array.isArray(event.statusEvents.relaysOnEvent)) {
    for (const relay of event.statusEvents.relaysOnEvent) {
      outputDevices.push({
        deviceId: relay.name || relay.deviceNameCms || '',
        deviceName: relay.deviceNameCms || relay.name || '',
        deviceType: relay.deviceTypeCms || 'Siren',
        status: relay.state ? 'active' : 'nonActive',
        controllerNo: Number(relay.index),
      });
    }
  }

  // 3. Map StreamDevices
  const matchingRule = alarmRules.find(
    (rule) => rule.inputDeviceId === inputDevice.deviceId
  );
  const streamDevices: any[] = (matchingRule?.streams || []).map((stream: any) => ({
    deviceId: stream.deviceId || '',
    deviceName: stream.deviceName || '',
    deviceType: 'CctvCamera',
    status: 'nonActive',
  }));

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
    alarmCaseId: event.alarmCaseId,
    // Original IDs for Redux store grouping/lookup
    controllerId: event.controllerId,
    controllerName: event.controllerName,
    buildingId: event.buildingId,
    buildingName: event.buildingName,
    floorId: event.floorId,
    floorName: event.floorName,
    siteId: event.siteId,
    siteName: event.siteName,
    inputDevice,
    outputDevices,
    streamDevices,
  };
}

// ── AlarmCase → EventItem Mapper ────────────────────────────────────────

/**
 * Maps an AlarmCaseType (from /api/alarm-cases) to an EventItem for the sidebar.
 * 
 * - Input device ON/OFF: based on alarmCase.isCleared (false = active, true = nonActive)
 * - Output devices: mapped from alarmCase.outputs with isCleared logic
 * - Area info: areaName, floorplanName, floorName, buildingName, siteName
 */
export function mapAlarmCaseToEventItem(alarmCase: AlarmCaseType): EventItem {
  // Generate numeric ID from case ID
  let hash = 5381;
  for (let i = 0; i < alarmCase.id.length; i++) {
    hash = (hash * 33) ^ alarmCase.id.charCodeAt(i);
  }
  const numericId = Math.abs(hash);

  // Format time from triggeredAt
  const dateObj = new Date(alarmCase.triggeredAt);
  let timeStr = '';
  if (!isNaN(dateObj.getTime())) {
    const datePart = dateObj.toLocaleDateString('en-GB');
    const timePart = dateObj.toLocaleTimeString('it-IT');
    timeStr = `${datePart} ${timePart}`;
  }

  // Severity mapping
  let severity: Severity = 'Low';
  const sevLower = (alarmCase.severity || '').toLowerCase();
  if (sevLower === 'critical') severity = 'Critical';
  else if (sevLower === 'high') severity = 'High';
  else if (sevLower === 'medium') severity = 'Medium';

  const { icon, color } = getEventIconAndColor(alarmCase.deviceType || alarmCase.deviceName);

  // Status alarm based on isCleared
  const statusAlarm = !alarmCase.isCleared ? 'alarm_trigger' : 'alarm_restore';

  // Input device: ON if not cleared
  const inputDevice: IoDeviceItem = {
    deviceId: alarmCase.deviceId || '',
    deviceName: alarmCase.deviceName || '',
    deviceType: alarmCase.deviceType || '',
    status: !alarmCase.isCleared ? 'active' : 'nonActive',
  };

  // Output devices from case outputs
  const outputDevices: IoDeviceItem[] = (alarmCase.outputs || []).map((output: AlarmCaseOutputType) => ({
    deviceId: output.outputDeviceId || output.id || '',
    deviceName: output.deviceName || '',
    deviceType: output.deviceType || 'Siren',
    status: !output.isCleared ? 'active' as const : 'nonActive' as const,
  }));

  // Build area display string
  const areaParts = [
    alarmCase.areaName,
    alarmCase.floorplanName,
    alarmCase.floorName,
    alarmCase.buildingName,
  ].filter(Boolean);
  const areaDisplay = areaParts.length > 0 ? areaParts.join(' • ') : alarmCase.siteRegion || 'Unknown Area';

  // Title: use caseNumber or device info
  const title = `${alarmCase.deviceName || 'Alarm'} - ${alarmCase.deviceType || 'Unknown'}`;

  return {
    id: numericId,
    time: timeStr,
    title,
    site: alarmCase.siteName || 'Unknown Site',
    severity,
    area: areaDisplay,
    icon,
    iconColor: color,
    deviceId: alarmCase.deviceId,
    deviceName: alarmCase.deviceName,
    floorplanId: alarmCase.floorplanId,
    statusAlarm,
    rawId: alarmCase.id,
    createdAt: alarmCase.triggeredAt,
    alarmCaseId: alarmCase.id,
    controllerId: alarmCase.controllerId,
    controllerName: alarmCase.controllerName,
    buildingId: alarmCase.buildingId,
    buildingName: alarmCase.buildingName,
    floorId: alarmCase.floorId,
    floorName: alarmCase.floorName,
    siteId: alarmCase.siteId,
    siteName: alarmCase.siteName,
    areaName: alarmCase.areaName,
    floorplanName: alarmCase.floorplanName,
    inputDevice,
    outputDevices,
    streamDevices: [],
  };
}
