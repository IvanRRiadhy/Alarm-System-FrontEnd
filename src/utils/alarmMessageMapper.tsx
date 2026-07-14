import { EventItem, getEventIconAndColor } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { controllerType } from 'src/store/apps/crud/controller';
import { channelType } from 'src/store/apps/crud/channel';
import { deviceType } from 'src/store/apps/crud/devices';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import type { Severity } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { AlarmEvent } from 'src/store/apps/crud/alarmEvent';

// ── MQTT Message Types ──────────────────────────────────────────────────

export interface MqttZone {
  id: number;
  en: boolean;
  trg: boolean;
  mem: boolean;
  type: string; // "FIRE" | "INTRUSION" | "PANIC" | "TAMPER" | "EMERGENCY" etc.
  stay: boolean;
  stay_bypassed: boolean;
  '24h': boolean;
  pnc: boolean;
}

export interface MqttRelay {
  id: number;
  state: boolean;
  rule: string; // "ALL_ALARM" | "MANUAL" etc.
  mask: number;
}

export interface MqttAlarmMessage {
  site_id: string;
  device_id: string;
  controller_id: string;
  client_id: string;
  fw: string;
  online: boolean;
  alarm_state: string;
  active_network: string;
  ip: string;
  wifi_ip: string;
  ethernet_ip: string;
  ap_ip: string;
  rssi: number;
  time_valid: boolean;
  time_source: string;
  timestamp: string;
  rtc_present: boolean;
  rtc_valid: boolean;
  offline_queue: number;
  uptime: number;
  schedule_enabled: boolean;
  last_access_source: string;
  last_access_action: string;
  last_access_name: string;
  last_rf_result: string;
  last_rf_action: string;
  zones: MqttZone[];
  relays: MqttRelay[];
}

// ── Lookup Data Bundle ──────────────────────────────────────────────────

export interface AlarmLookupData {
  controllers: controllerType[];
  channels: channelType[];
  devices: deviceType[];
  deviceMappings: DeviceMappingType[];
}

// ── Severity Mapping ────────────────────────────────────────────────────

/**
 * Map a device's AlarmSeverity to the EventItem Severity type.
 */
function mapSeverity(deviceSeverity: string | undefined): Severity {
  switch (deviceSeverity?.toLowerCase()) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    case 'low':
    default:
      return 'Low';
  }
}

// ── Zone/Relay Type to Icon Mapping ─────────────────────────────────────

/**
 * Derive an event type string from a zone type to feed into getEventIconAndColor.
 */
function zoneTypeToEventType(zoneType: string): string {
  switch (zoneType.toUpperCase()) {
    case 'FIRE':
      return 'fire';
    case 'INTRUSION':
      return 'motion'; // maps to motion/run icon
    case 'PANIC':
      return 'panic';
    case 'TAMPER':
      return 'kick'; // tamper → alert triangle
    case 'EMERGENCY':
      return 'door'; // emergency → alert
    default:
      return zoneType.toLowerCase();
  }
}

// ── Main Mapper Function ────────────────────────────────────────────────

/**
 * Maps an MQTT alarm message to an array of EventItem objects.
 * 
 * Each zone and relay in the message produces one EventItem.
 * - Zones: zone.id N → channelNo N
 * - Relays: relay.id N → channelNo (zonesCount + N)
 * 
 * The device_id in the MQTT message matches controllerType.hardwareId,
 * which lets us find the controller and its associated site.
 * Then we find the channel by (controllerId + channelNo), and from the
 * channel we find the device (device.channelId === channel.id).
 * Finally, we look up the device mapping to get the area name.
 */
export function mapAlarmMessageToEvents(
  message: MqttAlarmMessage,
  lookupData: AlarmLookupData,
): EventItem[] {
  const { controllers, channels, devices, deviceMappings } = lookupData;
  const zonesCount = message.zones?.length || 0;
  const now = new Date().toLocaleTimeString('it-IT'); // HH:mm:ss format

  let createdAtIso = new Date().toISOString();
  if (message.timestamp) {
    const parsedNum = Number(message.timestamp);
    if (!isNaN(parsedNum)) {
      if (parsedNum < 10000000000) {
        createdAtIso = new Date(parsedNum * 1000).toISOString();
      } else {
        createdAtIso = new Date(parsedNum).toISOString();
      }
    } else {
      const parsedDate = new Date(message.timestamp);
      if (!isNaN(parsedDate.getTime())) {
        createdAtIso = parsedDate.toISOString();
      }
    }
  }

  // 1. Find the controller by matching device_id to hardwareId
  const controller = controllers.find(
    (c) => c.hardwareId === message.device_id,
  );
  const controllerSite = controller?.siteName || message.site_id;

  // 2. Get channels for this controller
  const controllerChannels = controller
    ? channels.filter((ch) => ch.controllerId === controller.id)
    : [];

  // Helper: find device & mapping info for a given channelNo
  const resolveChannel = (channelNo: number) => {
    const channel = controllerChannels.find((ch) => ch.channelNo === channelNo);
    if (!channel) return { device: undefined, mapping: undefined };

    const device = devices.find((d) => d.channelId === channel.id);
    const mapping = device
      ? deviceMappings.find((dm) => dm.deviceId === device.id)
      : undefined;

    return { device, mapping };
  };

  const events: EventItem[] = [];

  // 3. Map each zone to an EventItem
  if (message.zones) {
    for (const zone of message.zones) {
      const channelNo = zone.id; // zone id 1 → channelNo 1
      const { device, mapping } = resolveChannel(channelNo);

      const eventType = zoneTypeToEventType(zone.type);
      const { icon, color } = getEventIconAndColor(eventType);

      // Unique ID: combination of identifiers + zone id
      const compositeId = `${message.site_id}_${message.client_id}_${message.timestamp}_zone_${zone.id}`;
      const numericId = hashStringToNumber(compositeId);

      const event: EventItem = {
        id: numericId,
        time: now,
        title: message.alarm_state,
        site: device?.siteName || controllerSite,
        severity: device ? mapSeverity(device.alarmSeverity) : 'Low',
        area: mapping?.areaName || `Zone ${zone.id}`,
        icon,
        iconColor: color,
        deviceId: device?.id,
        deviceName: device?.name || `Zone ${zone.id} - ${zone.type}`,
        createdAt: createdAtIso,
      };

      events.push(event);
    }
  }

  // 4. Map each relay to an EventItem
  if (message.relays) {
    for (const relay of message.relays) {
      const channelNo = zonesCount + relay.id; // relay id 1 → channelNo (zonesCount + 1)
      const { device, mapping } = resolveChannel(channelNo);

      // Relays don't have a zone type, use relay rule as a hint
      const eventType = relay.rule?.toLowerCase() || 'relay';
      const { icon, color } = getEventIconAndColor(eventType);

      const compositeId = `${message.site_id}_${message.client_id}_${message.timestamp}_relay_${relay.id}`;
      const numericId = hashStringToNumber(compositeId);

      const event: EventItem = {
        id: numericId,
        time: now,
        title: message.alarm_state,
        site: device?.siteName || controllerSite,
        severity: device ? mapSeverity(device.alarmSeverity) : 'Low',
        area: mapping?.areaName || `Relay ${relay.id}`,
        icon,
        iconColor: color,
        deviceId: device?.id,
        deviceName: device?.name || `Relay ${relay.id} - ${relay.rule}`,
        createdAt: createdAtIso,
      };

      events.push(event);
    }
  }

  return events;
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

export function mapAlarmEventToEventItem(event: AlarmEvent): EventItem {
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
    
    // Original IDs for Redux store grouping/lookup
    controllerId: event.controllerId,
    controllerName: event.controllerName,
    buildingId: event.buildingId,
    floorId: event.floorId,
    siteId: event.siteId,
  };
}
