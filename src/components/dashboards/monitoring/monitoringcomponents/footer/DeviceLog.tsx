import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Divider,
} from '@mui/material';

type LogTabType = 'Semua' | 'Event' | 'Alarm' | 'System';

interface LogEntry {
  time: string;
  message: string;
  type: LogTabType;
  color: string;
}

const logEntries: LogEntry[] = [
  { time: '10:28:45', message: 'Motion Terdeteksi', type: 'Event', color: '#EF4444' },
  { time: '10:27:12', message: 'Motion Dihentikan', type: 'Event', color: '#F59E0B' },
  { time: '10:15:33', message: 'Connection Lost', type: 'System', color: '#EF4444' },
  { time: '10:15:45', message: 'Connection Restore', type: 'System', color: '#22C55E' },
  { time: '09:45:21', message: 'Motion Terdeteksi', type: 'Event', color: '#F59E0B' },
  { time: '09:44:10', message: 'Motion Dihentikan', type: 'Event', color: '#F59E0B' },
  { time: '09:30:02', message: 'Device Restart', type: 'System', color: '#3B82F6' },
];

const DeviceLog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabLabels: LogTabType[] = ['Semua', 'Event', 'Alarm', 'System'];

  const filteredLogs =
    activeTab === 0
      ? logEntries
      : logEntries.filter((l) => l.type === tabLabels[activeTab]);

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
        {filteredLogs.map((log, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              py: 0.85,
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
        ))}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
      </Box>
    </Box>
  );
};

export default DeviceLog;
