import React, { useState, useEffect } from 'react';
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
  GlobalStyles,
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

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type FilterType = 'Semua' | Severity;

export type IoDeviceItem = {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: 'active' | 'nonActive';
  controllerNo?: number;
};

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
  createdAt?: string;
  alarmCaseId: string | null;
  controllerId?: string;
  controllerName?: string;
  buildingId?: string | null;
  buildingName?: string | null;
  floorId?: string | null;
  floorName?: string | null;
  siteId?: string;
  siteName?: string;
  areaName?: string | null;
  floorplanName?: string | null;
  seenStatus?: boolean;
  inputDevice?: IoDeviceItem | null;
  outputDevices?: IoDeviceItem[];
  streamDevices?: IoDeviceItem[];
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
  Critical: '#991B1B',
  High: '#EF4444',
  Medium: '#F97316',
  Low: '#EAB308',
};

interface EventSidebarProps {
  events: EventItem[];
  onSelectEvent?: (event: EventItem) => void;
  selectedEventId?: number | string | null;
  currentFloorplanId?: string | null;
}

const isNewEvent = (createdAtStr?: string) => {
  if (!createdAtStr) return false;
  const elapsed = Date.now() - new Date(createdAtStr).getTime();
  return elapsed >= 0 && elapsed < 15000; // 15 seconds window
};

const getBreathingBg = (severity: Severity) => {
  switch (severity) {
    case 'Critical':
      return 'rgba(153, 27, 27, 0.22)';
    case 'High':
      return 'rgba(239, 68, 68, 0.15)';
    case 'Medium':
      return 'rgba(249, 115, 22, 0.15)';
    case 'Low':
      return 'rgba(234, 179, 8, 0.15)';
    default:
      return 'rgba(37, 99, 235, 0.15)';
  }
};

const EventSidebar: React.FC<EventSidebarProps> = ({
  events,
  onSelectEvent,
  selectedEventId,
  currentFloorplanId,
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('Semua');
  const [floorplanFilterActive, setFloorplanFilterActive] = useState(false);
  const [localSelectedId, setLocalSelectedId] = useState<number | string | null>(null);

  useEffect(() => {
    if (selectedEventId !== undefined && selectedEventId !== null) {
      setLocalSelectedId(selectedEventId);
    }
  }, [selectedEventId]);

  const checkIsSelected = (eventId: number, rawId?: string) => {
    const idToCompare = (selectedEventId !== undefined && selectedEventId !== null)
      ? selectedEventId
      : localSelectedId;

    if (idToCompare === null || idToCompare === undefined) return false;

    return (
      idToCompare === eventId ||
      idToCompare.toString() === eventId.toString() ||
      (rawId !== undefined && idToCompare === rawId)
    );
  };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});

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
  const mediumCount = baseEventsForCount.filter((e) => e.severity === 'Medium').length;
  const lowCount = baseEventsForCount.filter((e) => e.severity === 'Low').length;

  const baseFilteredEvents =
    activeFilter === 'Semua'
      ? events
      : events.filter((e) => e.severity === activeFilter);

  const filteredEvents = floorplanFilterActive && currentFloorplanId
    ? baseFilteredEvents.filter((e) => e.floorplanId === currentFloorplanId)
    : baseFilteredEvents;

  const sortedFilteredEvents = React.useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB) {
        return timeB - timeA;
      }
      return b.time.localeCompare(a.time);
    });
  }, [filteredEvents]);

  const groupedEvents = React.useMemo(() => {
    const resultGroups: {
      alarmCaseId: string;
      latestEvent: EventItem;
      events: EventItem[];
      createdAtTime: number;
    }[] = [];

    let currentGroupKey: string | null = null;
    let currentGroupEvents: EventItem[] = [];

    for (const event of sortedFilteredEvents) {
      const groupKey = event.alarmCaseId
        ? event.alarmCaseId
        : `nocase_${event.title || ''}_${event.site || ''}_${event.statusAlarm || ''}`;

      if (groupKey !== currentGroupKey) {
        if (currentGroupKey !== null && currentGroupEvents.length > 0) {
          const latestEvent = currentGroupEvents.reduce((latest, current) => {
            const latestTime = latest.createdAt ? new Date(latest.createdAt).getTime() : 0;
            const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : 0;
            return currentTime > latestTime ? current : latest;
          }, currentGroupEvents[0]);

          resultGroups.push({
            alarmCaseId: `${currentGroupKey}_grp_${latestEvent.id}`,
            latestEvent,
            events: currentGroupEvents,
            createdAtTime: latestEvent.createdAt ? new Date(latestEvent.createdAt).getTime() : 0,
          });
        }
        currentGroupKey = groupKey;
        currentGroupEvents = [event];
      } else {
        currentGroupEvents.push(event);
      }
    }

    if (currentGroupKey !== null && currentGroupEvents.length > 0) {
      const latestEvent = currentGroupEvents.reduce((latest, current) => {
        const latestTime = latest.createdAt ? new Date(latest.createdAt).getTime() : 0;
        const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : 0;
        return currentTime > latestTime ? current : latest;
      }, currentGroupEvents[0]);

      resultGroups.push({
        alarmCaseId: `${currentGroupKey}_grp_${latestEvent.id}`,
        latestEvent,
        events: currentGroupEvents,
        createdAtTime: latestEvent.createdAt ? new Date(latestEvent.createdAt).getTime() : 0,
      });
    }

    resultGroups.sort((a, b) => b.createdAtTime - a.createdAtTime);
    return resultGroups;
  }, [sortedFilteredEvents]);

  const filters: { label: string; value: FilterType; count?: number; color?: string }[] = [
    { label: 'Semua', value: 'Semua' },
    { label: `CRITICAL (${criticalCount})`, value: 'Critical', color: '#991B1B' },
    { label: `High (${highCount})`, value: 'High', color: '#EF4444' },  
    { label: `Medium (${mediumCount})`, value: 'Medium', color:  '#F97316'},
    { label: `Low (${lowCount})`, value: 'Low', color: '#EAB308' },
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
      <GlobalStyles
        styles={{
          '@keyframes breatheOnce': {
            '0%': { backgroundColor: 'transparent' },
            '30%': { backgroundColor: 'var(--pulse-bg)' },
            '100%': { backgroundColor: 'transparent' },
          },
          '@keyframes breatheLoop': {
            '0%': { backgroundColor: 'transparent' },
            '50%': { backgroundColor: 'var(--pulse-bg)' },
            '100%': { backgroundColor: 'transparent' },
          },
        }}
      />
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
        {groupedEvents.map((group) => {
          const { alarmCaseId, latestEvent, events } = group;
          const isSelected = checkIsSelected(latestEvent.id, latestEvent.rawId);
          const isAnySubSelected = events.some((subEvent: EventItem) => checkIsSelected(subEvent.id, subEvent.rawId));
          const isExpanded = !!expandedCases[alarmCaseId];
          const hasMultiple = events.length > 1;

          // Check if alarm is active
          const isAlarmActive =
            latestEvent.statusAlarm?.toLowerCase() === 'on' ||
            latestEvent.statusAlarm?.toLowerCase() === 'active' ||
            latestEvent.statusAlarm?.toLowerCase() === 'alarm_trigger' ||
            latestEvent.statusAlarm?.toLowerCase() === 'triggered' ||
            latestEvent.inputDevice?.status === 'active';

          // Determine breathing animation
          let animationStyle: any = {};
          const isCriticalActive = latestEvent.severity === 'Critical' && isAlarmActive;
          const isNew = isNewEvent(latestEvent.createdAt);

          if (isCriticalActive) {
            animationStyle = {
              animation: 'breatheLoop 2.5s infinite ease-in-out',
              '--pulse-bg': getBreathingBg(latestEvent.severity),
            };
          } else if (isNew) {
            animationStyle = {
              animation: 'breatheOnce 3s 1 ease-in-out',
              '--pulse-bg': getBreathingBg(latestEvent.severity),
            };
          }

          return (
            <Box
              key={alarmCaseId}
              sx={{
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                ...animationStyle,
              }}
            >
              {/* Group Header (Latest Event) */}
              <Box
                onClick={() => {
                  setLocalSelectedId(latestEvent.rawId || latestEvent.id);
                  onSelectEvent?.(latestEvent);
                  if (hasMultiple) {
                    setExpandedCases((prev) => ({ ...prev, [alarmCaseId]: !prev[alarmCaseId] }));
                  }
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  transition: 'background .2s',
                  bgcolor: isSelected
                    ? 'rgba(37, 99, 235, 0.15)'
                    : isAnySubSelected
                    ? 'rgba(37, 99, 235, 0.08)'
                    : 'transparent',
                  borderLeft: `3px solid ${
                    isSelected ? '#2563EB' : isAnySubSelected ? 'rgba(37, 99, 235, 0.5)' : 'transparent'
                  }`,
                  '&:hover': {
                    bgcolor: isSelected
                      ? 'rgba(37, 99, 235, 0.2)'
                      : isAnySubSelected
                      ? 'rgba(37, 99, 235, 0.12)'
                      : 'rgba(255,255,255,0.04)',
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* Top Row: Time & Status Badge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#64748B', fontSize: 10, fontFamily: 'monospace' }}>
                      {latestEvent.time}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      {hasMultiple && (
                        <Chip
                          label={`${events.length} kejadian`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: '#94A3B8',
                            border: 'none',
                          }}
                        />
                      )}
                      {(latestEvent.alarmCaseId && (latestEvent.statusAlarm?.toLowerCase() === "alarm_trigger" || latestEvent.statusAlarm?.toLowerCase() === "triggered")) ? (
                        <Chip
                          label={latestEvent.severity === "Critical" ? latestEvent.severity.toUpperCase() : latestEvent.severity}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: `${severityColors[latestEvent.severity]}20`,
                            color: severityColors[latestEvent.severity],
                            border: `1px solid ${severityColors[latestEvent.severity]}40`,
                          }}
                        />
                      ) : (
                        <Chip
                          label={latestEvent.statusAlarm || 'NORMAL'}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 9,
                            fontWeight: 700,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: '#94A3B8',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Middle Row: Icon/Avatar & Title */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: `${severityColors[latestEvent.severity] || '#3B82F6'}12`,
                        color: severityColors[latestEvent.severity] || '#3B82F6',
                        flexShrink: 0,
                      }}
                    >
                      {latestEvent.icon}
                    </Avatar>
                    <Typography
                      sx={{
                        color: '#F8FAFC',
                        fontSize: 12.5,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                        flex: 1,
                      }}
                    >
                      {latestEvent.title}
                    </Typography>
                  </Box>

                  {/* Bottom Row: Location Info */}
                  <Box sx={{ pl: 0.25 }}>
                    <Typography
                      sx={{
                        color: '#94A3B8',
                        fontSize: 10.5,
                        lineHeight: 1.4,
                        fontWeight: 500,
                      }}
                    >
                      {latestEvent.site}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#64748B',
                        fontSize: 9.5,
                        lineHeight: 1.3,
                        mt: 0.25,
                      }}
                    >
                      {latestEvent.area}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Nested Sub-events */}
              {hasMultiple && isExpanded && (
                <Box
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.15)',
                    pl: 3,
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {events.map((subEvent, subIndex) => {
                    const isSubSelected = checkIsSelected(subEvent.id, subEvent.rawId);
                    return (
                      <Box
                        key={subEvent.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSelectedId(subEvent.rawId || subEvent.id);
                          onSelectEvent?.(subEvent);
                        }}
                        sx={{
                          py: 1.2,
                          pr: 2,
                          pl: 1,
                          cursor: 'pointer',
                          bgcolor: isSubSelected ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                          borderBottom: subIndex < events.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                            <Typography sx={{ color: '#F8FAFC', fontSize: 11.5, fontWeight: 500, wordBreak: 'break-word', flex: 1 }}>
                              {subEvent.title}
                            </Typography>
                            {(subEvent.alarmCaseId && (subEvent.statusAlarm?.toLowerCase() === "alarm_trigger" || subEvent.statusAlarm?.toLowerCase() === "triggered")) ? (
                              <Chip
                                label={subEvent.severity === "Critical" ? subEvent.severity.toUpperCase() : subEvent.severity}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: 8,
                                  fontWeight: 700,
                                  bgcolor: `${severityColors[subEvent.severity]}20`,
                                  color: severityColors[subEvent.severity],
                                  border: `1px solid ${severityColors[subEvent.severity]}40`,
                                }}
                              />
                            ) : (
                              <Chip
                                label={subEvent.statusAlarm || 'NORMAL'}
                                size="small"
                                sx={{
                                  height: 16,
                                  fontSize: 8,
                                  fontWeight: 700,
                                  bgcolor: 'rgba(255,255,255,0.05)',
                                  color: '#94A3B8',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}
                              />
                            )}
                          </Box>
                          <Typography sx={{ color: '#64748B', fontSize: 9.5 }}>
                            {subEvent.time} • {subEvent.area}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
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
