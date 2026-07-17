import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Paper,
  Popover,
  Divider,
  Collapse,
  Chip,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  IconCalendar,
  IconClock,
  IconChevronLeft,
  IconChevronRight,
  IconChevronDown,
  IconChevronUp,
  IconPlayerPlay,
  IconTrash,
  IconX,
  IconPlus,
  IconInfoCircle,
  IconAlertCircle,
  IconCircleCheck,
  IconClearAll,
  IconArrowLeft,
} from '@tabler/icons-react';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import { SiteType } from 'src/store/apps/crud/site';
import { RootState, useSelector } from 'src/store/Store';
import { useAddSchedule, useEditSchedule } from 'src/hooks/useSchedule';
import toast from 'react-hot-toast';
import { toastError } from 'src/utils/errors';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';

// ─── Types ───────────────────────────────────────────────────────────────────
export type DaySchedule = {
  dayOfWeek: number; // 0=Sun … 6=Sat
  startTime: string | null; // "HH:00"
  endTime: string | null;   // "HH:00"
};

export type WeeklySchedule = {
  days: DaySchedule[];
};

// ─── Constants ───────────────────────────────────────────────────────────────
const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_NAMES_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const CELL_HEIGHT = 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const parseHour = (t: string | null): number | null => {
  if (!t) return null;
  const h = parseInt(t.split(':')[0], 10);
  return isNaN(h) ? null : h;
};
const parseTimeToDayjs = (timeStr: string | null, defaultHour: number, defaultMinute: number = 0): Dayjs => {
  if (!timeStr) {
    return dayjs().hour(defaultHour).minute(defaultMinute).second(0);
  }
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return dayjs().hour(h).minute(m).second(0);
};
const fmtHour = (h: number | null): string | null => (h === null ? null : `${String(h).padStart(2, '0')}:00`);
const formatHourDisplay = (h: number) => `${String(h).padStart(2, '0')}:00`;

const emptyWeek = (): DaySchedule[] =>
  [1, 2, 3, 4, 5, 6, 0].map((d) => ({ dayOfWeek: d, startTime: null, endTime: null }));

type CellRole = 'start' | 'end' | 'middle' | 'both' | null;

const getMinutes = (t: string | null): number | null => {
  if (!t) return null;
  const parts = t.split(':');
  const hrs = parseInt(parts[0], 10);
  const mins = parseInt(parts[1] || '0', 10);
  return isNaN(hrs) || isNaN(mins) ? null : hrs * 60 + mins;
};

const getCellRole = (schedule: WeeklySchedule, dayIdx: number, h: number): CellRole => {
  const ds = schedule.days.find((d) => d.dayOfWeek === dayIdx);
  if (!ds) return null;
  if (!ds.startTime || !ds.endTime) return null;

  const startMins = getMinutes(ds.startTime);
  const endMins = getMinutes(ds.endTime);
  if (startMins === null || endMins === null) return null;

  const cellStart = h * 60;
  const cellEnd = (h + 1) * 60;

  // Does the schedule block overlap this hour?
  const overlaps = startMins < cellEnd && endMins > cellStart;
  if (!overlaps) return null;

  // Is this the first hour of the block?
  const isFirstHour = startMins >= cellStart && startMins < cellEnd;
  // Is this the last hour of the block?
  const isLastHour = endMins > cellStart && endMins <= cellEnd;

  if (isFirstHour && isLastHour) return 'both';
  if (isFirstHour) return 'start';
  if (isLastHour) return 'end';
  return 'middle';
};

const getDayIndex = (dayStr: string): number => {
  const val = parseInt(dayStr, 10);
  if (!isNaN(val)) return val;
  const idx = DAY_NAMES_LONG.findIndex((d) => d.toLowerCase() === dayStr.toLowerCase());
  return idx !== -1 ? idx : 0;
};

interface ScheduleTimeTableProps {
  onBack?: () => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
const ScheduleTimeTable: React.FC<ScheduleTimeTableProps> = ({ onBack }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // ─ Redux & Hooks ─
  const selectedSchedule = useSelector((state: RootState) => state.scheduleReducer.selectedSchedule);
  const addMutation = useAddSchedule();
  const editMutation = useEditSchedule();

  // ─ Form state ─
  const [scheduleName, setScheduleName] = useState('');
  const [selectedSite, setSelectedSite] = useState<{ label: string; id: string } | null>(null);
  const [schedule, setSchedule] = useState<WeeklySchedule>({ days: emptyWeek() });

  // ─ UI state ─
  const [showGuide, setShowGuide] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const [showSummary, setShowSummary] = useState(true);

  // ─ Calendar navigation ─
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // ─ Menu popover ─
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuCtx, setMenuCtx] = useState<{
    dayIdx: number;
    hour: number;
    role: CellRole;
  } | null>(null);

  // ─ Edit Time Picker states ─
  const [editStartTime, setEditStartTime] = useState<Dayjs | null>(null);
  const [editEndTime, setEditEndTime] = useState<Dayjs | null>(null);
  const [showDaySelector, setShowDaySelector] = useState(false);
  const [selectedExtraDays, setSelectedExtraDays] = useState<number[]>([]);

  const isTimeInvalid = useMemo(() => {
    if (!editStartTime || !editEndTime) return true;
    const startMins = editStartTime.hour() * 60 + editStartTime.minute();
    const endMins = editEndTime.hour() * 60 + editEndTime.minute();
    return startMins >= endMins;
  }, [editStartTime, editEndTime]);

  // ─ Site data ─
  const { data: siteRes, isLoading: sitesLoading } = useSiteLookup();
  const siteOptions = useMemo(() => {
    const list = siteRes?.data || [];
    return list.map((s: SiteType) => ({ label: s.name, id: s.id }));
  }, [siteRes]);

  // ─ Populate Form from selectedSchedule ─
  useEffect(() => {
    if (selectedSchedule) {
      setScheduleName(selectedSchedule.name || '');
      if (selectedSchedule.siteId && siteOptions.length > 0) {
        const matchingSite = siteOptions.find((opt) => opt.id === selectedSchedule.siteId);
        if (matchingSite) {
          setSelectedSite(matchingSite);
        }
      }
      if (selectedSchedule.items && selectedSchedule.items.length > 0) {
        const initialWeek = emptyWeek();
        selectedSchedule.items.forEach((item: any) => {
          const dayIdx = getDayIndex(item.dayOfWeek);
          const match = initialWeek.find((d) => d.dayOfWeek === dayIdx);
          if (match) {
            match.startTime = item.startTime || null;
            match.endTime = item.endTime || null;
          }
        });
        setSchedule({ days: initialWeek });
      } else {
        setSchedule({ days: emptyWeek() });
      }
    }
  }, [selectedSchedule, siteOptions]);

  // ─ Clock tick ─
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ─ Auto-scroll to current hour ─
  useEffect(() => {
    if (scrollRef.current) {
      const target = Math.max(0, currentTime.getHours() - 2);
      scrollRef.current.scrollTop = target * CELL_HEIGHT;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─ Week helpers ─
  const weekDates = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + i);
      return nd;
    });
  }, [currentDate]);

  const isToday = (d: Date) => {
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  };

  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const goToday = () => {
    setCurrentDate(new Date());
    if (scrollRef.current) {
      const target = Math.max(0, new Date().getHours() - 2);
      scrollRef.current.scrollTop = target * CELL_HEIGHT;
    }
  };

  // ─ Schedule logic ─
  const removeSlot = () => {
    if (!menuCtx) return;
    const days = [...schedule.days];
    const idx = days.findIndex((d) => d.dayOfWeek === menuCtx.dayIdx);
    const entry: DaySchedule = {
      dayOfWeek: menuCtx.dayIdx,
      startTime: null,
      endTime: null,
    };
    if (idx !== -1) days[idx] = entry;
    else days.push(entry);
    setSchedule({ days });
    closeMenu();
  };

  const clearAll = () => {
    setSchedule({ days: emptyWeek() });
    closeMenu();
  };

  const openMenu = (e: React.MouseEvent<HTMLElement>, dayIdx: number, hour: number, role: CellRole) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuCtx({ dayIdx, hour, role });

    const ds = schedule.days.find((d) => d.dayOfWeek === dayIdx);
    const sStr = ds?.startTime;
    const eStr = ds?.endTime;

    const defaultEndHour = hour === 23 ? 23 : (hour + 1) % 24;
    const defaultEndMinute = hour === 23 ? 59 : 0;

    setEditStartTime(parseTimeToDayjs(sStr || null, hour, 0));
    setEditEndTime(parseTimeToDayjs(eStr || null, defaultEndHour, defaultEndMinute));
  };

  const closeMenu = () => {
    setAnchorEl(null);
    setMenuCtx(null);
    setEditStartTime(null);
    setEditEndTime(null);
    setShowDaySelector(false);
    setSelectedExtraDays([]);
  };

  const toggleExtraDay = (d: number) => {
    setSelectedExtraDays((prev) =>
      prev.includes(d) ? prev.filter((day) => day !== d) : [...prev, d]
    );
  };

  const handleSave = async () => {
    if (!scheduleName.trim()) {
      toast.error('Schedule Name is required');
      return;
    }
    if (!selectedSite) {
      toast.error('Site selection is required');
      return;
    }

    // Map schedule items to the structure expected by the API
    const items = schedule.days
      .filter((d) => d.startTime && d.endTime)
      .map((d) => ({
        dayOfWeek: String(d.dayOfWeek),
        startTime: d.startTime || '',
        endTime: d.endTime || '',
      }));

    const isEditMode = selectedSchedule && selectedSchedule.id;
    const payload = {
      id: selectedSchedule?.id || '',
      name: scheduleName,
      siteId: selectedSite.id,
    //   isActive: selectedSchedule ? selectedSchedule.isActive : true,
      items,
    };

    try {
      if (isEditMode) {
        await editMutation.mutateAsync(payload);
        toast.success('Schedule updated successfully');
      } else {
        await addMutation.mutateAsync(payload);
        toast.success('Schedule created successfully');
      }
      if (onBack) onBack();
    } catch (error) {
      console.error(error);
      toastError(error, 'Failed to save schedule');
    }
  };

  const hoursArr = Array.from({ length: 24 }, (_, i) => i);
  const redLineTop = (currentTime.getHours() + currentTime.getMinutes() / 60) * CELL_HEIGHT;

  // ─── Palette helpers ──────────────────────────────────────────────────────
  const blue = theme.palette.primary;
  const green = theme.palette.success;
  const amber = theme.palette.warning;
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

  const isMutationPending = addMutation.isPending || editMutation.isPending;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Box display="flex" gap={3} sx={{ height: 'calc(100vh - 140px)', overflow: 'hidden' }}>
      {/* ═══════════ LEFT SIDEBAR ═══════════ */}
      <Box
        sx={{
          width: 320,
          minWidth: 280,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 140px)',
          minHeight: 0,
          pr: 1,
        }}
      >
        {/* Back Button */}
        {onBack && (
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={16} />}
            onClick={onBack}
            sx={{ alignSelf: 'flex-start', mb: 1, flexShrink: 0 }}
          >
            Back to List
          </Button>
        )}

        {/* --- Guide Accordion --- */}
        <SidebarAccordion
          title="Setup Guide"
          icon={<IconCalendar size={20} />}
          iconBg={blue.light}
          iconColor={blue.main}
          open={showGuide}
          onToggle={() => setShowGuide(!showGuide)}
        >
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Set the start and end times for each day of the week.
          </Typography>
          <GuideItem
            icon={<IconClock size={14} />}
            title="Select Hour"
            desc="Click on an empty cell to set start or end time."
          />
          <GuideItem
            icon={<IconAlertCircle size={14} />}
            title="Change Hour"
            desc="Selecting a new hour on the same day replaces the previous one."
          />
          <GuideItem
            icon={<IconCircleCheck size={14} />}
            title="Remove Slot"
            desc="Click an active slot to remove or cancel it."
          />
        </SidebarAccordion>

        {/* --- Details Accordion --- */}
        <SidebarAccordion
          title="Schedule Details"
          icon={<IconInfoCircle size={18} />}
          iconBg="transparent"
          iconColor={theme.palette.text.secondary}
          open={showDetails}
          onToggle={() => setShowDetails(!showDetails)}
        >
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <CustomFormLabel>Schedule Name *</CustomFormLabel>
              <CustomTextField
                value={scheduleName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScheduleName(e.target.value)}
                placeholder="e.g. Regular Shift"
                fullWidth
              />
            </Box>
            <Box>
              <CustomFormLabel>Site</CustomFormLabel>
              <CustomAutocomplete
                label="Site"
                options={siteOptions}
                value={selectedSite}
                onChange={(v) => setSelectedSite(v)}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                loading={sitesLoading}
                sx={{ width: '100%' }}
              />
            </Box>
          </Box>
        </SidebarAccordion>

        {/* --- Summary Accordion --- */}
        <SidebarAccordion
          title="Schedule Summary"
          icon={<IconInfoCircle size={18} />}
          iconBg="transparent"
          iconColor={theme.palette.text.secondary}
          open={showSummary}
          onToggle={() => setShowSummary(!showSummary)}
        >
          <Box display="flex" flexDirection="column" gap={1}>
            {DAY_NAMES_LONG.map((name, idx) => {
              const ds = schedule.days.find((d) => d.dayOfWeek === idx) || { startTime: null, endTime: null };
              const hasData = ds.startTime || ds.endTime;
              return (
                <Box
                  key={idx}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${borderColor}`,
                    bgcolor: hoverBg,
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="textSecondary">
                    {name}
                  </Typography>
                  {hasData ? (
                    <Box textAlign="right">
                      <Typography variant="caption" fontWeight={600}>
                        {ds.startTime ?? '-'} – {ds.endTime ?? '-'}
                      </Typography>
                      <br />
                      <Chip label="SET" size="small" color="success" sx={{ height: 16, fontSize: 9, fontWeight: 700 }} />
                    </Box>
                  ) : (
                    <Typography variant="caption" fontStyle="italic" color="textSecondary">
                      Not set
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </SidebarAccordion>

        {/* --- Save Button --- */}
        <Button
          variant="contained"
          fullWidth
          sx={{ py: 1.5, fontWeight: 700, mt: 1, flexShrink: 0 }}
          disabled={schedule.days.every((d) => !d.startTime && !d.endTime) || isMutationPending}
          onClick={handleSave}
          startIcon={isMutationPending ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isMutationPending ? 'Saving...' : 'Save Schedule'}
        </Button>
      </Box>

      {/* ═══════════ RIGHT: WEEKLY CALENDAR ═══════════ */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 1,
          border: `1px solid ${borderColor}`,
          overflow: 'hidden',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        {/* ─── Top Navigation ─── */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          px={3}
          py={1.5}
          sx={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: isDark ? 'rgba(93,135,255,0.1)' : '#EBF2FF',
                color: blue.main,
                display: 'flex',
              }}
            >
              <IconClock size={20} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Weekly Schedule Template
            </Typography>
          </Box>

          <Box display="flex" gap={1} alignItems="center">
            <Button size="small" variant="outlined" startIcon={<IconClearAll size={16} />} onClick={clearAll}>
              Clear All
            </Button>
          </Box>
        </Box>

        {/* ─── Sticky Day Header ─── */}
        <Box display="flex" sx={{ borderBottom: `1px solid ${borderColor}`, flexShrink: 0 }}>
          {/* Timezone label */}
          <Box
            sx={{
              width: 70,
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${borderColor}`,
              py: 1.5,
            }}
          >
            <IconClock size={14} color={theme.palette.text.disabled} />
            <Typography variant="caption" fontSize={9} fontWeight={700} color="textDisabled">
              GMT+07
            </Typography>
          </Box>
          {/* Day columns header */}
          <Box flex={1} display="grid" gridTemplateColumns="repeat(7,1fr)">
            {weekDates.map((date, idx) => {
              const td = isToday(date);
              return (
                <Box
                  key={idx}
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  py={2}
                  sx={{ borderRight: idx < 6 ? `1px solid ${borderColor}` : 'none' }}
                >
                  <Typography
                    variant="caption"
                    fontSize={11}
                    fontWeight={700}
                    letterSpacing={1}
                    color={td ? blue.main : 'textSecondary'}
                  >
                    {DAY_NAMES_SHORT[idx]}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ─── Scrollable Grid ─── */}
        <Box ref={scrollRef} flex={1} sx={{ overflowY: 'auto', position: 'relative', scrollBehavior: 'smooth' }}>
          <Box display="flex" position="relative" sx={{ minHeight: 24 * CELL_HEIGHT }}>
            {/* Hours gutter */}
            <Box sx={{ width: 70, flexShrink: 0, position: 'relative', borderRight: `1px solid ${borderColor}`, zIndex: 2 }}>
              {hoursArr.slice(1).map((h) => (
                <Typography
                  key={h}
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: h * CELL_HEIGHT,
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    fontWeight: 700,
                    color: theme.palette.text.disabled,
                  }}
                >
                  {formatHourDisplay(h)}
                </Typography>
              ))}
            </Box>

            {/* Day columns */}
            <Box flex={1} position="relative" display="grid" gridTemplateColumns="repeat(7,1fr)" sx={{ height: 24 * CELL_HEIGHT }}>
              {/* Horizontal lines */}
              {hoursArr.map((h) => (
                <Box
                  key={`hl-${h}`}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: h * CELL_HEIGHT,
                    height: '1px',
                    bgcolor: borderColor,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {weekDates.map((date, dayIdx) => {
                const td = isToday(date);
                return (
                  <Box
                    key={dayIdx}
                    position="relative"
                    sx={{
                      height: '100%',
                      borderRight: dayIdx < 6 ? `1px solid ${borderColor}` : 'none',
                    }}
                  >
                    {hoursArr.map((h) => {
                      const role = getCellRole(schedule, dayIdx, h);
                      const ds = schedule.days.find((d) => d.dayOfWeek === dayIdx) || { startTime: null, endTime: null };
                      const s = parseHour(ds.startTime);
                      const e = parseHour(ds.endTime);

                      return (
                        <Box
                          key={h}
                          sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: h * CELL_HEIGHT,
                            height: CELL_HEIGHT,
                          }}
                        >
                          {/* Empty cell hover target */}
                          {role === null && (
                            <Box
                              onClick={(ev) => openMenu(ev, dayIdx, h, null)}
                              sx={{
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: isDark ? 'rgba(93,135,255,0.06)' : 'rgba(93,135,255,0.04)' },
                              }}
                            />
                          )}

                          {/* Both (1-hour slot) */}
                          {role === 'both' && s !== null && e !== null && (
                            <ScheduleBlock
                              onClick={(ev) => openMenu(ev, dayIdx, h, 'middle')}
                              borderLeft={blue.main}
                              bgFrom={isDark ? 'rgba(93,135,255,0.12)' : '#EBF3FF'}
                              bgTo={isDark ? 'rgba(93,135,255,0.06)' : '#F0F4FF'}
                              rounded
                            >
                              <BlockLabel color={green.main}>Start: {ds.startTime}</BlockLabel>
                              <BlockLabel color={amber.main}>End: {ds.endTime}</BlockLabel>
                            </ScheduleBlock>
                          )}

                          {/* Start */}
                          {role === 'start' && s !== null && (
                            <ScheduleBlock
                              onClick={(ev) => openMenu(ev, dayIdx, h, 'start')}
                              borderLeft={e === null ? green.main : blue.main}
                              bgFrom={e === null ? (isDark ? 'rgba(76,175,80,0.12)' : '#E8F5E9') : (isDark ? 'rgba(93,135,255,0.12)' : '#EBF3FF')}
                              bgTo={e === null ? (isDark ? 'rgba(76,175,80,0.06)' : '#F1F8E9') : (isDark ? 'rgba(93,135,255,0.06)' : '#F0F4FF')}
                              roundedTop={e !== null && s < (e - 1)}
                              roundedBottom={e !== null && s > (e - 1)}
                              rounded={e === null}
                            >
                              <BlockLabel color={e === null ? green.main : green.main}>Start</BlockLabel>
                              <BlockTime color={e === null ? green.main : blue.main}>{ds.startTime}</BlockTime>
                            </ScheduleBlock>
                          )}

                          {/* End */}
                          {role === 'end' && e !== null && (
                            <ScheduleBlock
                              onClick={(ev) => openMenu(ev, dayIdx, h, 'end')}
                              borderLeft={s === null ? amber.main : blue.main}
                              bgFrom={s === null ? (isDark ? 'rgba(255,152,0,0.12)' : '#FFF8E1') : (isDark ? 'rgba(93,135,255,0.12)' : '#EBF3FF')}
                              bgTo={s === null ? (isDark ? 'rgba(255,152,0,0.06)' : '#FFF3E0') : (isDark ? 'rgba(93,135,255,0.06)' : '#F0F4FF')}
                              roundedBottom={s !== null && (e - 1) > s}
                              roundedTop={s !== null && (e - 1) < s}
                              rounded={s === null}
                            >
                              <BlockLabel color={s === null ? amber.main : amber.main}>End</BlockLabel>
                              <BlockTime color={s === null ? amber.main : blue.main}>{ds.endTime}</BlockTime>
                            </ScheduleBlock>
                          )}

                          {/* Middle filler */}
                          {role === 'middle' && (
                            <Box
                              onClick={(ev) => openMenu(ev, dayIdx, h, 'middle')}
                              sx={{
                                position: 'absolute',
                                inset: '0 4px',
                                borderLeft: `4px solid ${blue.main}`,
                                background: isDark
                                  ? 'linear-gradient(90deg, rgba(93,135,255,0.12), rgba(93,135,255,0.06))'
                                  : 'linear-gradient(90deg, #EBF3FF, #F0F4FF)',
                                cursor: 'pointer',
                                zIndex: 1,
                                '&:hover': { filter: 'brightness(0.96)' },
                              }}
                            />
                          )}
                        </Box>
                      );
                    })}

                    {/* Red current-time line */}
                    {td && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: redLineTop,
                          display: 'flex',
                          alignItems: 'center',
                          zIndex: 10,
                          pointerEvents: 'none',
                        }}
                      >
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main', ml: '-5px', boxShadow: '0 0 0 2px white' }} />
                        <Box sx={{ flex: 1, height: 2, bgcolor: 'error.main' }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* ─── Context Popover ─── */}
        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={closeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{ paper: { sx: { borderRadius: 3, width: 280, p: 2 } } }}
        >
          {menuCtx && (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {DAY_NAMES_LONG[menuCtx.dayIdx]} Schedule
                    </Typography>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setShowDaySelector(!showDaySelector)}
                      sx={{ p: 0.5 }}
                    >
                      <IconPlus size={16} />
                    </IconButton>
                  </Box>
                  <IconButton size="small" onClick={closeMenu}><IconX size={16} /></IconButton>
                </Box>

                {showDaySelector && (
                  <Box sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                      Copy times to:
                    </Typography>
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                        if (d === menuCtx.dayIdx) return null;
                        const isSelected = selectedExtraDays.includes(d);
                        return (
                          <Button
                            key={d}
                            size="small"
                            variant={isSelected ? 'contained' : 'outlined'}
                            sx={{
                              px: 1,
                              py: 0.5,
                              minWidth: 0,
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 1.5,
                            }}
                            onClick={() => toggleExtraDay(d)}
                          >
                            {DAY_NAMES_SHORT[d]}
                          </Button>
                        );
                      })}
                    </Box>
                  </Box>
                )}
                <Divider />

                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box>
                    <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
                      Start Time
                    </Typography>
                    <TimePicker
                      value={editStartTime}
                      onChange={(val) => setEditStartTime(val)}
                      ampm={false}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight={600} color="textSecondary" sx={{ mb: 0.5, display: 'block' }}>
                      End Time
                    </Typography>
                    <TimePicker
                      value={editEndTime}
                      onChange={(val) => setEditEndTime(val)}
                      ampm={false}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Box>
                </Box>

                {isTimeInvalid && (
                  <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                    Start time must be earlier than end time.
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<IconTrash size={14} />}
                    onClick={removeSlot}
                  >
                    Clear Day
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    disabled={isTimeInvalid}
                    onClick={() => {
                      if (editStartTime && editEndTime) {
                        const startStr = editStartTime.format('HH:mm');
                        const endStr = editEndTime.format('HH:mm');
                        const days = [...schedule.days];
                        const targetDays = [menuCtx.dayIdx, ...selectedExtraDays];

                        targetDays.forEach((targetDay) => {
                          const idx = days.findIndex((d) => d.dayOfWeek === targetDay);
                          const entry: DaySchedule = {
                            dayOfWeek: targetDay,
                            startTime: startStr,
                            endTime: endStr,
                          };
                          if (idx !== -1) days[idx] = entry;
                          else days.push(entry);
                        });

                        setSchedule({ days });
                      }
                      closeMenu();
                    }}
                  >
                    Save
                  </Button>
                </Box>
              </Box>
            </LocalizationProvider>
          )}
        </Popover>
      </Paper>
    </Box>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Sidebar collapsible card */
const SidebarAccordion: React.FC<{
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ title, icon, iconBg, iconColor, open, onToggle, children }) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 3,
      overflow: 'hidden',
      flexShrink: 0,
    }}
  >
    <Box
      onClick={onToggle}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      sx={{ px: 2.5, py: 2, cursor: 'pointer' }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
    </Box>
    <Collapse in={open}>
      <Box px={2.5} pb={2.5}>
        {children}
      </Box>
    </Collapse>
  </Paper>
);

/** Guide list item */
const GuideItem: React.FC<{ icon: React.ReactNode; title: string; desc: string }> = ({ icon, title, desc }) => (
  <Box display="flex" gap={1.5} alignItems="flex-start" mb={1.5}>
    <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'action.hover', display: 'flex', mt: 0.25 }}>
      {icon}
    </Box>
    <Box>
      <Typography variant="caption" fontWeight={700}>{title}</Typography>
      <Typography variant="caption" display="block" color="textSecondary" lineHeight={1.4}>
        {desc}
      </Typography>
    </Box>
  </Box>
);

/** Schedule block (the colored card inside a cell) */
const ScheduleBlock: React.FC<{
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  borderLeft: string;
  bgFrom: string;
  bgTo: string;
  rounded?: boolean;
  roundedTop?: boolean;
  roundedBottom?: boolean;
  children: React.ReactNode;
}> = ({ onClick, borderLeft, bgFrom, bgTo, rounded, roundedTop, roundedBottom, children }) => {
  let radius = '0';
  if (rounded) radius = '12px';
  else if (roundedTop) radius = '12px 12px 0 0';
  else if (roundedBottom) radius = '0 0 12px 12px';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'absolute',
        inset: '2px 4px',
        borderLeft: `4px solid ${borderLeft}`,
        background: `linear-gradient(90deg, ${bgFrom}, ${bgTo})`,
        borderRadius: radius,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 1,
        cursor: 'pointer',
        transition: 'filter 0.15s',
        '&:hover': { filter: 'brightness(0.95)' },
      }}
    >
      {children}
    </Box>
  );
};

const BlockLabel: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <Typography variant="caption" fontSize={8} fontWeight={700} sx={{ color, textTransform: 'uppercase', letterSpacing: 0.5, lineHeight: 1 }}>
    {children}
  </Typography>
);

const BlockTime: React.FC<{ color: string; children: React.ReactNode }> = ({ color, children }) => (
  <Typography variant="caption" fontSize={10} fontWeight={700} sx={{ color, mt: 0.25, lineHeight: 1 }}>
    {children}
  </Typography>
);

export default ScheduleTimeTable;
