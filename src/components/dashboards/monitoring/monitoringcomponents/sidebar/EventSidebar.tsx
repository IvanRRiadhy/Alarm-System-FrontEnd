import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Button,
  Avatar,
  Divider,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  IconFilter,
  IconDoor,
  IconAlertTriangle,
  IconFlame,
  IconHandStop,
  IconRun,
  IconGlassFull,
  IconFingerprint,
} from '@tabler/icons-react';

export type Severity = 'Critical' | 'High' | 'Low';
export type FilterType = 'Semua' | Severity;

export interface EventItem {
  id: number;
  time: string;
  title: string;
  site: string;
  severity: Severity;
  area: string;
  icon: React.ReactNode;
  iconColor: string;
  deviceId?: string;
  deviceName?: string;
  floorplanId?: string | null;
  statusAlarm?: string;
  rawId?: string;
}

export const dummyEvents: EventItem[] = [
  // {
  //   id: 1,
  //   time: '10:28:45',
  //   title: 'Pintu Utama Terbuka',
  //   site: 'KCP Surabaya Diponegoro',
  //   severity: 'Critical',
  //   area: 'Zona 1',
  //   icon: <IconDoor size={18} />,
  //   iconColor: '#EF4444',
  // },
  // {
  //   id: 2,
  //   time: '10:27:12',
  //   title: 'Gerakan Terdeteksi',
  //   site: 'KCP Medan Iskandar Muda',
  //   severity: 'High',
  //   area: 'Zona 2',
  //   icon: <IconRun size={18} />,
  //   iconColor: '#F59E0B',
  // },
  // {
  //   id: 3,
  //   time: '10:25:08',
  //   title: 'Kaca Pecah Terdeteksi',
  //   site: 'KCP Makassar Ratulangi',
  //   severity: 'High',
  //   area: 'Zona 3',
  //   icon: <IconGlassFull size={18} />,
  //   iconColor: '#F59E0B',
  // },
  // {
  //   id: 4,
  //   time: '10:22:37',
  //   title: 'Panic Button Ditekan',
  //   site: 'KCP Bandung Asia Afrika',
  //   severity: 'Critical',
  //   area: 'Zona 1',
  //   icon: <IconHandStop size={18} />,
  //   iconColor: '#EF4444',
  // },
  // {
  //   id: 5,
  //   time: '10:21:19',
  //   title: 'Gerakan Terdeteksi',
  //   site: 'KCP Palembang Sudirman',
  //   severity: 'Low',
  //   area: 'Zona 5',
  //   icon: <IconRun size={18} />,
  //   iconColor: '#3B82F6',
  // },
  // {
  //   id: 6,
  //   time: '10:18:44',
  //   title: 'Pintu Belakang Terbuka',
  //   site: 'KCP Makassar Ratulangi',
  //   severity: 'High',
  //   area: 'Zona 1',
  //   icon: <IconDoor size={18} />,
  //   iconColor: '#F59E0B',
  // },
  // {
  //   id: 7,
  //   time: '10:16:33',
  //   title: 'Motion Dihentikan',
  //   site: 'KCP Surabaya Diponegoro',
  //   severity: 'Low',
  //   area: 'Zona 4',
  //   icon: <IconRun size={18} />,
  //   iconColor: '#3B82F6',
  // },
  // {
  //   id: 8,
  //   time: '10:15:02',
  //   title: 'Kick Alarm',
  //   site: 'KCP Semarang Pandanaran',
  //   severity: 'High',
  //   area: 'Zona 2',
  //   icon: <IconAlertTriangle size={18} />,
  //   iconColor: '#F59E0B',
  // },
  // {
  //   id: 9,
  //   time: '10:13:27',
  //   title: 'Fire Alarm',
  //   site: 'KCP Jakarta Thamrin',
  //   severity: 'Critical',
  //   area: 'Zona 3',
  //   icon: <IconFlame size={18} />,
  //   iconColor: '#EF4444',
  // },
  // {
  //   id: 10,
  //   time: '10:11:08',
  //   title: 'Touch Sensor Aktif',
  //   site: 'KCP Bandung Asia Afrika',
  //   severity: 'Low',
  //   area: 'Zona 6',
  //   icon: <IconFingerprint size={18} />,
  //   iconColor: '#3B82F6',
  // },
];

export const getEventIconAndColor = (eventType: string) => {
  const type = (eventType || '').toLowerCase();
  if (type.includes('door') || type.includes('pintu')) {
    return { icon: <IconDoor size={18} />, color: '#EF4444' };
  }
  if (type.includes('motion') || type.includes('run') || type.includes('gerakan') || type.includes('walk')) {
    return { icon: <IconRun size={18} />, color: '#F59E0B' };
  }
  if (type.includes('glass') || type.includes('kaca')) {
    return { icon: <IconGlassFull size={18} />, color: '#F59E0B' };
  }
  if (type.includes('panic') || type.includes('hand') || type.includes('tombol')) {
    return { icon: <IconHandStop size={18} />, color: '#EF4444' };
  }
  if (type.includes('kick') || type.includes('tendang')) {
    return { icon: <IconAlertTriangle size={18} />, color: '#F59E0B' };
  }
  if (type.includes('fire') || type.includes('flame') || type.includes('kebakaran')) {
    return { icon: <IconFlame size={18} />, color: '#EF4444' };
  }
  if (type.includes('touch') || type.includes('fingerprint') || type.includes('sentuh')) {
    return { icon: <IconFingerprint size={18} />, color: '#3B82F6' };
  }
  // Default fallback
  return { icon: <IconAlertTriangle size={18} />, color: '#3B82F6' };
};

const severityColors: Record<Severity, string> = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Low: '#3B82F6',
};

interface EventSidebarProps {
  events: EventItem[];
  onSelectEvent?: (event: EventItem) => void;
  selectedEventId?: number | null;
  currentFloorplanId?: string | null;
}

const EventSidebar: React.FC<EventSidebarProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
  currentFloorplanId,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const [floorplanFilterActive, setFloorplanFilterActive] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectFilterAll = () => {
    setFloorplanFilterActive(false);
    handleCloseMenu();
  };

  const handleSelectFilterFloorplan = () => {
    setFloorplanFilterActive(true);
    handleCloseMenu();
  };

  const baseEventsForCount = floorplanFilterActive && currentFloorplanId
    ? events.filter((e) => e.floorplanId === currentFloorplanId)
    : events;

  const criticalCount = baseEventsForCount.filter((e) => e.severity === 'Critical').length;
  const highCount = baseEventsForCount.filter((e) => e.severity === 'High').length;
  const lowCount = baseEventsForCount.filter((e) => e.severity === 'Low').length;

  const baseFilteredEvents =
    activeFilter === 'Semua'
      ? events
      : events.filter((e) => e.severity === activeFilter);

  const filteredEvents = floorplanFilterActive && currentFloorplanId
    ? baseFilteredEvents.filter((e) => e.floorplanId === currentFloorplanId)
    : baseFilteredEvents;

  const filters: { label: string; value: FilterType; count?: number; color?: string }[] = [
    { label: 'Semua', value: 'Semua' },
    { label: `Critical (${criticalCount})`, value: 'Critical', color: '#EF4444' },
    { label: `High (${highCount})`, value: 'High', color: '#F59E0B' },
    { label: `Low (${lowCount})`, value: 'Low', color: '#3B82F6' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#111827',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Typography
          sx={{
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.5px',
            mb: 1.5,
          }}
        >
          EVENT TERBARU
        </Typography>

        {/* Filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
          {filters.map((f) => (
            <Chip
              key={f.value}
              label={f.label}
              size="small"
              onClick={() => setActiveFilter(f.value)}
              sx={{
                height: 26,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                bgcolor:
                  activeFilter === f.value
                    ? f.color || '#2563EB'
                    : f.color
                    ? `${f.color}20`
                    : 'rgba(255,255,255,0.06)',
                color: activeFilter === f.value ? '#fff' : f.color || '#94A3B8',
                border: `1px solid ${
                  activeFilter === f.value
                    ? f.color || '#2563EB'
                    : f.color
                    ? `${f.color}40`
                    : 'rgba(255,255,255,0.1)'
                }`,
                '&:hover': {
                  bgcolor: f.color ? `${f.color}40` : 'rgba(255,255,255,0.1)',
                },
              }}
            />
          ))}
          <IconButton
            size="small"
            onClick={handleOpenMenu}
            sx={{
              color: floorplanFilterActive ? '#2563EB' : '#94A3B8',
              ml: 'auto',
              bgcolor: floorplanFilterActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              '&:hover': {
                bgcolor: floorplanFilterActive ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.06)',
              }
            }}
          >
            <IconFilter size={16} />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                bgcolor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid rgba(255,255,255,0.08)',
                '& .MuiMenuItem-root:hover': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                },
                '& .Mui-selected': {
                  bgcolor: 'rgba(37, 99, 235, 0.25) !important',
                },
              }
            }}
          >
            <MenuItem selected={!floorplanFilterActive} onClick={handleSelectFilterAll}>
              Tampilkan Semua Event (Show All)
            </MenuItem>
            <MenuItem selected={floorplanFilterActive} onClick={handleSelectFilterFloorplan}>
              Hanya Event Layout Ini (Current Layout Only)
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      {/* Event List */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {filteredEvents.map((event, index) => {
          const isSelected = selectedEventId === event.id;
          return (
            <React.Fragment key={event.id}>
              <Box
                onClick={() => onSelectEvent?.(event)}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  transition: 'background .2s',
                  bgcolor: isSelected ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
                  borderLeft: `3px solid ${isSelected ? '#2563EB' : 'transparent'}`,
                  '&:hover': { bgcolor: isSelected ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.04)' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: `${event.iconColor}18`,
                      color: event.iconColor,
                      mt: 0.25,
                    }}
                  >
                    {event.icon}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: '#64748B', fontSize: 11, lineHeight: 1.2 }}>
                      {event.time}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#F8FAFC',
                        fontSize: 13,
                        fontWeight: 600,
                        lineHeight: 1.4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {event.title}
                    </Typography>
                    <Typography sx={{ color: '#64748B', fontSize: 11, lineHeight: 1.3 }}>
                      {event.site}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 0.5,
                      flexShrink: 0,
                    }}
                  >
                    <Chip
                      label={event.severity}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: 10,
                        fontWeight: 700,
                        bgcolor: `${severityColors[event.severity]}20`,
                        color: severityColors[event.severity],
                        border: `1px solid ${severityColors[event.severity]}40`,
                      }}
                    />
                    <Typography sx={{ color: '#64748B', fontSize: 10 }}>
                      {event.area}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              {index < filteredEvents.length - 1 && (
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
              )}
            </React.Fragment>
          );
        })}
      </Box>

      {/* Footer */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="text"
          sx={{
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 500,
            textTransform: 'none',
            py: 1,
            borderRadius: 1.5,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          Lihat Semua Event
        </Button>
      </Box>
    </Box>
  );
};

export default EventSidebar;
