import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
} from '@mui/material';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { EventItem, Severity } from '../sidebar/EventSidebar';
import { IconInfoCircle } from '@tabler/icons-react';

type LogTabType = 'Semua' | 'Event' | 'Alarm' | 'System';

interface LogEntry {
  id: string;
  time: string;
  message: string;
  type: LogTabType;
  color: string;
  severity: Severity;
  site: string;
  area: string;
  deviceName: string;
  deviceType: string;
  description: string;
}

const logEntries: LogEntry[] = [
  // {
  //   id: 'dummy-1',
  //   time: '10:28:45',
  //   message: 'Motion Terdeteksi',
  //   type: 'Event',
  //   color: '#EF4444',
  //   severity: 'Critical',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Zona 1',
  //   deviceName: 'Motion Sensor 1',
  //   deviceType: 'MotionSensor',
  //   description: 'Gerakan mencurigakan terdeteksi di area pintu masuk utama.',
  // },
  // {
  //   id: 'dummy-2',
  //   time: '10:27:12',
  //   message: 'Motion Dihentikan',
  //   type: 'Event',
  //   color: '#F59E0B',
  //   severity: 'High',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Zona 1',
  //   deviceName: 'Motion Sensor 1',
  //   deviceType: 'MotionSensor',
  //   description: 'Sensor gerak kembali ke status normal.',
  // },
  // {
  //   id: 'dummy-3',
  //   time: '10:15:33',
  //   message: 'Connection Lost',
  //   type: 'System',
  //   color: '#EF4444',
  //   severity: 'Critical',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Server Room',
  //   deviceName: 'Gateway Node 3',
  //   deviceType: 'Gateway',
  //   description: 'Koneksi ke gateway utama terputus, memeriksa jalur cadangan.',
  // },
  // {
  //   id: 'dummy-4',
  //   time: '10:15:45',
  //   message: 'Connection Restore',
  //   type: 'System',
  //   color: '#22C55E',
  //   severity: 'Low',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Server Room',
  //   deviceName: 'Gateway Node 3',
  //   deviceType: 'Gateway',
  //   description: 'Koneksi ke gateway utama berhasil dipulihkan.',
  // },
  // {
  //   id: 'dummy-5',
  //   time: '09:45:21',
  //   message: 'Motion Terdeteksi',
  //   type: 'Event',
  //   color: '#F59E0B',
  //   severity: 'High',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Zona 2',
  //   deviceName: 'Motion Sensor 2',
  //   deviceType: 'MotionSensor',
  //   description: 'Gerakan terdeteksi di koridor belakang.',
  // },
  // {
  //   id: 'dummy-6',
  //   time: '09:44:10',
  //   message: 'Motion Dihentikan',
  //   type: 'Event',
  //   color: '#F59E0B',
  //   severity: 'High',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Zona 2',
  //   deviceName: 'Motion Sensor 2',
  //   deviceType: 'MotionSensor',
  //   description: 'Sensor gerak koridor belakang kembali ke status normal.',
  // },
  // {
  //   id: 'dummy-7',
  //   time: '09:30:02',
  //   message: 'Device Restart',
  //   type: 'System',
  //   color: '#3B82F6',
  //   severity: 'Low',
  //   site: 'KCP Surabaya Diponegoro',
  //   area: 'Panel Box 1',
  //   deviceName: 'Control Panel',
  //   deviceType: 'ControlPanel',
  //   description: 'Restart terjadwal selesai dilakukan pada unit kontrol utama.',
  // },
];

export const matchEventToDevice = (event: EventItem, device: DeviceMappingType): boolean => {
  // 1. Direct ID matches
  if (event.deviceId && (event.deviceId === device.id || event.deviceId === device.deviceId)) {
    return true;
  }
  
  // 2. Direct deviceName matches
  if (event.deviceName && event.deviceName.toLowerCase() === device.deviceName.toLowerCase()) {
    return true;
  }

  // 3. Fallback: match by deviceType or deviceName / label keywords with event titles
  const deviceType = (device.deviceType || '').toLowerCase();
  const deviceName = (device.deviceName || '').toLowerCase();
  const label = (device.label || '').toLowerCase();
  const title = (event.title || '').toLowerCase();

  // Match Door sensors
  if (deviceType.includes('door') || deviceName.includes('door') || label.includes('door') || deviceName.includes('pintu')) {
    if (title.includes('door') || title.includes('pintu')) return true;
  }

  // Match Motion sensors
  if (deviceType.includes('motion') || deviceName.includes('motion') || label.includes('motion') || deviceName.includes('gerakan') || deviceType.includes('walk') || deviceName.includes('walk')) {
    if (title.includes('motion') || title.includes('gerakan') || title.includes('run') || title.includes('walk')) return true;
  }

  // Match Glass Break sensors
  if (deviceType.includes('glass') || deviceName.includes('glass') || label.includes('glass') || deviceName.includes('kaca')) {
    if (title.includes('glass') || title.includes('kaca') || title.includes('pecah')) return true;
  }

  // Match Panic buttons
  if (deviceType.includes('panic') || deviceName.includes('panic') || label.includes('panic') || deviceName.includes('tombol')) {
    if (title.includes('panic') || title.includes('tombol') || title.includes('button') || title.includes('press')) return true;
  }

  // Match Fire/Flame sensors
  if (deviceType.includes('fire') || deviceType.includes('flame') || deviceName.includes('fire') || deviceName.includes('kebakaran') || label.includes('fire')) {
    if (title.includes('fire') || title.includes('flame') || title.includes('kebakaran') || title.includes('asap')) return true;
  }

  // Match Touch sensors
  if (deviceType.includes('touch') || deviceName.includes('touch') || label.includes('touch') || deviceName.includes('sentuh') || deviceType.includes('fingerprint') || deviceName.includes('fingerprint')) {
    if (title.includes('touch') || title.includes('sensor') || title.includes('sentuh') || title.includes('sidik') || title.includes('fingerprint')) return true;
  }

  // Generic fallback: if the title contains the device name or label
  if (title.includes(deviceName) || (device.label && title.includes(label))) {
    return true;
  }

  return false;
};

interface DeviceLogProps {
  selectedDevice: DeviceMappingType | null;
  events: EventItem[];
  selectedLog: LogEntry | null;
  onSelectLog: (log: LogEntry | null) => void;
}

const DeviceLog: React.FC<DeviceLogProps> = ({ selectedDevice, events, selectedLog, onSelectLog }) => {
  if (!selectedDevice) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: '#111827',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          p: 3,
          color: '#64748B',
          textAlign: 'center',
        }}
      >
        <IconInfoCircle size={32} />
        <Typography sx={{ mt: 1, fontSize: 12 }}>
          Pilih device pada floorplan untuk melihat informasi detail.
        </Typography>
      </Box>
    );
  }

  const [activeTab, setActiveTab] = useState<number>(0);

  const tabLabels: LogTabType[] = ['Semua', 'Event', 'Alarm', 'System'];

  const displayLogs = React.useMemo<LogEntry[]>(() => {
    return selectedDevice
      ? events
          .filter((e) => matchEventToDevice(e, selectedDevice))
          .map((e) => ({
            id: e.rawId || e.id.toString(),
            time: e.time,
            message: e.title,
            type: e.severity === 'Critical' ? 'Alarm' as const : 'Event' as const,
            color: e.iconColor || '#3B82F6',
            severity: e.severity,
            site: e.site,
            area: e.area,
            deviceName: e.deviceName || selectedDevice.deviceName,
            deviceType: selectedDevice.deviceType,
            description: `${e.title} terdeteksi di area ${e.area || 'pengawasan'}.`,
          }))
      : logEntries;
  }, [selectedDevice, events]);

  const filteredLogs = React.useMemo(() => {
    return activeTab === 0
      ? displayLogs
      : displayLogs.filter((l) => l.type === tabLabels[activeTab]);
  }, [displayLogs, activeTab]);

  React.useEffect(() => {
    if (filteredLogs.length > 0) {
      const isSelectedInFiltered = filteredLogs.some((l) => l.id === selectedLog?.id);
      if (!selectedLog || !isSelectedInFiltered) {
        onSelectLog(filteredLogs[0]);
      }
    } else {
      onSelectLog(null);
    }
  }, [filteredLogs, selectedLog, onSelectLog]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#111827',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          sx={{
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.5px',
          }}
        >
          LOG DEVICE
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 1 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newVal) => setActiveTab(newVal)}
          sx={{
            minHeight: 32,
            '& .MuiTab-root': {
              minHeight: 32,
              py: 0.5,
              px: 1.5,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'none',
              color: '#64748B',
              minWidth: 'auto',
              '&.Mui-selected': {
                color: '#E2E8F0',
              },
            },
            '& .MuiTabs-indicator': {
              bgcolor: '#2563EB',
              height: 2,
            },
          }}
        >
          {tabLabels.map((label) => (
            <Tab key={label} label={label} />
          ))}
        </Tabs>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />

      {/* Log entries */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 2,
          py: 1,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {filteredLogs.map((log, index) => {
          const isSelected = selectedLog && log.id === selectedLog.id;
          return (
            <Box
              key={log.id || index}
              onClick={() => onSelectLog(log)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                py: 0.85,
                px: 1,
                cursor: 'pointer',
                borderRadius: 1,
                transition: 'all 0.15s ease',
                bgcolor: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                borderLeft: `2px solid ${isSelected ? '#2563EB' : 'transparent'}`,
                '&:hover': {
                  bgcolor: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                },
              }}
            >
              {/* Color dot */}
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: log.color,
                  boxShadow: `0 0 4px ${log.color}60`,
                  flexShrink: 0,
                }}
              />

              {/* Time */}
              <Typography
                sx={{
                  color: '#94A3B8',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                  minWidth: 55,
                }}
              >
                {log.time}
              </Typography>

              {/* Message */}
              <Typography
                sx={{
                  color: '#E2E8F0',
                  fontSize: 11,
                  fontWeight: 500,
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {log.message}
              </Typography>

              {/* Type badge */}
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                {log.type}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      {/* <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="text"
          sx={{
            color: '#60A5FA',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'none',
            py: 0.75,
            borderRadius: 1.5,
            bgcolor: 'rgba(37,99,235,0.06)',
            border: '1px solid rgba(37,99,235,0.15)',
            '&:hover': { bgcolor: 'rgba(37,99,235,0.12)' },
          }}
        >
          Lihat Semua Log
        </Button>
      </Box> */}
    </Box>
  );
};

export default DeviceLog;
