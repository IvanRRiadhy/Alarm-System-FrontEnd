import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IconButton,
  Box,
  Badge,
  Menu,
  Typography,
  Button,
  Chip,
  Stack,
  Paper,
  useTheme,
  alpha,
  darken,
  Tooltip,
  Portal,
  Avatar,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBellRinging, IconChecks, IconAlertTriangle } from '@tabler/icons-react';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { Link, useLocation } from 'react-router';
import { AppDispatch, RootState, useDispatch, useSelector } from 'src/store/Store';
import { EventItem } from 'src/components/dashboards/monitoring/monitoringcomponents/sidebar/EventSidebar';
import { MarkAlarmEventSeen, MarkAllAlarmEventsSeen } from 'src/store/apps/crud/alarmEvent';
import { uniqueId } from 'lodash';
import { audioManager } from 'src/utils/audioManager';

type BubbleData = {
  id: string;
  triggerId: string;
  title: string;
  subtitle: string;
  status: string;
  priority: string;
  priorityColor: string;
  chipColor: string;
  category: string;
  createdAt: number;
};

const AUTOHIDE_MS = 6000;
const MAX_BUBBLES = 4;

const severityColors: Record<string, string> = {
  Critical: '#991B1B',
  High: '#EF4444',
  Medium: '#F97316',
  Low: '#EAB308',
};

const Notifications = () => {
  const location = useLocation();

  if (location.pathname.includes('/monitoring')) {
    return null;
  }

  const dispatch: AppDispatch = useDispatch();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const [bubbles, setBubbles] = useState<BubbleData[]>([]);
  const hideTimers = useRef<Record<string, number>>({});
  const [bellKey, setBellKey] = useState(0);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const alarmEventList = useSelector(
    (state: RootState) => state.alarmEventReducer.alarmEventList
  );

  // Group by deviceId, only keep the latest event
  const { unseenEvents, seenEvents } = useMemo(() => {
    const latestMap: Record<string, EventItem> = {};
    alarmEventList.forEach((e) => {
      const dId = e.deviceId || 'unknown';
      const existing = latestMap[dId];
      if (!existing) {
        latestMap[dId] = e;
      } else {
        const timeA = e.createdAt ? new Date(e.createdAt).getTime() : 0;
        const timeB = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
        if (timeA > timeB) {
          latestMap[dId] = e;
        }
      }
    });

    const uniqueLatestEvents = Object.values(latestMap);
    const unseen = uniqueLatestEvents.filter(e => !e.seenStatus);
    const seen = uniqueLatestEvents.filter(e => e.seenStatus);

    // Sort by time desc
    const sortByTimeDesc = (a: EventItem, b: EventItem) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    };

    return {
      unseenEvents: unseen.sort(sortByTimeDesc),
      seenEvents: seen.sort(sortByTimeDesc),
    };
  }, [alarmEventList]);

  const computeBubblePos = (index: number) => {
    if (!bellRef.current) return null;
    const rect = bellRef.current.getBoundingClientRect();
    const baseTop = rect.bottom + 8;
    const spacing = 125; // bubble height + gap
    return { top: baseTop + index * spacing, left: rect.right - 350 };
  };

  // Handle new alarms posted by postMessage
  useEffect(() => {
    const onNewAlarm = (e: MessageEvent) => {
      if (e.data?.type !== 'app:new-alarm') return;

      const alarmData = e.data.detail.alarm as EventItem;
      if (!alarmData) return;

      const priority = alarmData.severity || 'Medium';
      const color = severityColors[priority] || '#F97316';

      const bd: BubbleData = {
        id: uniqueId(),
        triggerId: alarmData.id.toString(),
        title: alarmData.deviceName || 'Alarm Triggered',
        subtitle: `${alarmData.title} · ${alarmData.area} · ${alarmData.site}`,
        status: alarmData.statusAlarm || 'Active',
        priority: priority,
        priorityColor: color,
        chipColor: color,
        category: priority.toUpperCase(),
        createdAt: Date.now(),
      };

      setBubbles((prev) => {
        const next = [...prev, bd];
        if (next.length > MAX_BUBBLES) next.shift();
        return next;
      });

      // Animate Bell
      setBellKey((prev) => prev + 1);

      // Play Sound
      audioManager.playNotification('/sfx/AlarmNotification/Calm-Warning.wav', 0.6);

      // auto-hide timer
      const timerId = window.setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== bd.id));
        delete hideTimers.current[bd.id];
      }, AUTOHIDE_MS);
      hideTimers.current[bd.id] = timerId;
    };

    window.addEventListener('message', onNewAlarm);
    return () => {
      window.removeEventListener('message', onNewAlarm);
      Object.values(hideTimers.current).forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const bubbleVariants = {
    hidden: { opacity: 0, y: 25, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring', stiffness: 260, damping: 20 },
    },
    exit: { opacity: 0, y: -15, scale: 0.96, transition: { duration: 0.25 } },
  };

  const errorColor = theme.palette.error.main;
  const primaryColor = theme.palette.primary.main;

  const unseenBg = alpha(errorColor, 0.08);
  const seenBg = alpha(primaryColor, 0.04);
  const hoverBg = alpha(theme.palette.action.hover, 0.08);

  const unseenBorder = errorColor;
  const seenBorder = theme.palette.divider;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Notification Bell */}
      <IconButton
        ref={bellRef}
        size="large"
        onClick={openMenu}
        sx={{ color: anchorEl ? 'primary.main' : 'text.secondary' }}
      >
        <Badge badgeContent={unseenEvents.length} color="error">
          <motion.div
            key={bellKey}
            animate={bellKey > 0 ? {
              rotate: [0, -15, 15, -10, 10, -5, 5, 0],
              scale: [1, 1.15, 1.15, 1],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <IconBellRinging size="21" stroke="1.5" />
          </motion.div>
        </Badge>
      </IconButton>

      {/* 🎨 Animated Bubble Stack */}
      <Portal>
        <AnimatePresence>
          {bubbles.map((b, i) => {
            const pos = computeBubblePos(i);
            const isTop = i === 0;
            return (
              <motion.div
                key={b.id}
                variants={bubbleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                style={{
                  position: 'fixed',
                  top: pos?.top ?? 64,
                  left: pos ? pos.left : undefined,
                  zIndex: 2000,
                  width: 360,
                }}
              >
                <Paper
                  onClick={() => {
                    setBubbles((prev) => prev.filter((x) => x.id !== b.id));
                    dispatch(MarkAlarmEventSeen(Number(b.triggerId)));
                    openMenu({ currentTarget: bellRef.current } as any);
                  }}
                  elevation={6}
                  sx={{
                    position: 'relative',
                    px: 2.5,
                    py: 2,
                    borderRadius: 3,
                    color: 'white',
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${alpha(b.priorityColor, 0.95)}, ${darken(
                      b.priorityColor,
                      0.3,
                    )})`,
                    border: `1px solid ${alpha(b.priorityColor, 0.4)}`,
                    boxShadow: `0 8px 30px ${alpha(b.priorityColor, 0.5)}`,
                    backdropFilter: 'blur(6px)',
                    overflow: 'visible',
                    ...(isTop && {
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -8,
                        right: 24,
                        borderWidth: '0 8px 8px 8px',
                        borderStyle: 'solid',
                        borderColor: `transparent transparent ${darken(b.priorityColor, 0.15)} transparent`,
                      },
                    }),
                  }}
                >
                  <Chip
                    label={b.category}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.65rem',
                      height: '20px',
                      borderRadius: 1,
                    }}
                  />

                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" sx={{ opacity: 0.75, pt: 0.5 }}>
                      Alarm Triggered
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {b.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {b.subtitle}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Priority: <strong>{b.priority.toUpperCase()}</strong>
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Status: {b.status}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Portal>

      {/* 🔔 Notifications Menu */}
      <Menu
        id="msgs-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        sx={{ '& .MuiMenu-paper': { width: '360px' } }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backgroundColor: theme.palette.background.paper,
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2,
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight="bold">Notifications</Typography>
            {unseenEvents.length > 0 && (
              <Tooltip title="Mark all as seen">
                <IconButton
                  size="small"
                  onClick={() => {
                    dispatch(MarkAllAlarmEventsSeen());
                  }}
                >
                  <IconChecks size={18} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Scrollbar sx={{ height: '385px' }}>
          <Box p={2}>
            {/* 🔴 UNSEEN EVENTS */}
            {unseenEvents.length > 0 && (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Typography variant="subtitle2" color="error" fontWeight="bold">
                    Unseen
                  </Typography>
                  <Chip
                    size="small"
                    label={unseenEvents.length}
                    sx={{
                      backgroundColor: alpha(theme.palette.error.main, 0.15),
                      color: theme.palette.error.main,
                      fontWeight: 600,
                      height: 20,
                    }}
                  />
                </Box>

                <Stack spacing={1} mb={3}>
                  {unseenEvents.map((event) => {
                    const sevColor = severityColors[event.severity] || '#F97316';
                    return (
                      <Paper
                        key={event.id}
                        onClick={() => {
                          dispatch(MarkAlarmEventSeen(event.id));
                        }}
                        sx={{
                          p: 1.5,
                          cursor: 'pointer',
                          backgroundColor: unseenBg,
                          borderLeft: `3px solid ${unseenBorder}`,
                          borderColor: unseenBorder,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: hoverBg,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: alpha(sevColor, 0.15),
                              color: sevColor,
                              width: 36,
                              height: 36,
                            }}
                          >
                            <IconAlertTriangle size={20} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {event.deviceName || 'Alarm Triggered'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {event.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {event.area} · {event.site}
                            </Typography>
                          </Box>
                          <Chip
                            label={event.severity === "Critical" ? "CRITICAL" : event.severity}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 9,
                              fontWeight: 'bold',
                              bgcolor: alpha(sevColor, 0.15),
                              color: sevColor,
                            }}
                          />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </>
            )}

            {/* ⚪ SEEN EVENTS */}
            {seenEvents.length > 0 && (
              <>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">
                    Seen
                  </Typography>
                  <Chip
                    size="small"
                    label={seenEvents.length}
                    sx={{
                      backgroundColor: theme.palette.action.hover,
                      color: theme.palette.text.secondary,
                      fontWeight: 600,
                      height: 20,
                    }}
                  />
                </Box>

                <Stack spacing={1}>
                  {seenEvents.map((event) => {
                    const sevColor = severityColors[event.severity] || '#F97316';
                    return (
                      <Paper
                        key={event.id}
                        sx={{
                          p: 1.5,
                          backgroundColor: seenBg,
                          borderLeft: `3px solid ${seenBorder}`,
                          transition: 'all 0.2s',
                          opacity: 0.8,
                          '&:hover': {
                            backgroundColor: hoverBg,
                          },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar
                            sx={{
                              bgcolor: alpha(theme.palette.grey[500], 0.1),
                              color: theme.palette.text.secondary,
                              width: 36,
                              height: 36,
                            }}
                          >
                            <IconAlertTriangle size={20} />
                          </Avatar>
                          <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Typography variant="subtitle2" noWrap>
                              {event.deviceName || 'Alarm Triggered'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {event.title}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" display="block">
                              {event.area} · {event.site}
                            </Typography>
                          </Box>
                          <Chip
                            label={event.severity}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: 9,
                              bgcolor: alpha(theme.palette.grey[500], 0.1),
                              color: theme.palette.text.secondary,
                            }}
                          />
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </>
            )}

            {/* Empty State */}
            {unseenEvents.length === 0 && seenEvents.length === 0 && (
              <Box py={4} textAlign="center">
                <Typography variant="body2" color="textSecondary">
                  No notifications
                </Typography>
              </Box>
            )}

            <Box mt={2}>
              <Button to="/dashboards/monitoring" component={Link} fullWidth variant="outlined">
                View All Events
              </Button>
            </Box>
          </Box>
        </Scrollbar>
      </Menu>
    </Box>
  );
};

export default Notifications;
