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
const fmtHour = (h: number | null): string | null => (h === null ? null : `${String(h).padStart(2, '0')}:00`);
const formatHourDisplay = (h: number) => `${String(h).padStart(2, '0')}:00`;

const emptyWeek = (): DaySchedule[] =>
  [1, 2, 3, 4, 5, 6, 0].map((d) => ({ dayOfWeek: d, startTime: null, endTime: null }));

type CellRole = 'start' | 'end' | 'middle' | 'both' | null;

const getCellRole = (schedule: WeeklySchedule, dayIdx: number, h: number): CellRole => {
  const ds = schedule.days.find((d) => d.dayOfWeek === dayIdx);
  if (!ds) return null;
  const s = parseHour(ds.startTime);
  const e = parseHour(ds.endTime);
  const endSlot = e !== null ? e - 1 : null;
  if (s !== null && endSlot !== null && s === endSlot && h === s) return 'both';
  if (h === s) return 'start';
  if (h === endSlot) return 'end';
  if (s !== null && endSlot !== null) {
    const lo = Math.min(s, endSlot);
    const hi = Math.max(s, endSlot);
    if (h > lo && h < hi) return 'middle';
  }
  return null;
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
  const updateDay = (dayIdx: number, s: number | null, e: number | null) => {
    const days = [...schedule.days];
    const i = days.findIndex((d) => d.dayOfWeek === dayIdx);
    const entry: DaySchedule = { dayOfWeek: dayIdx, startTime: fmtHour(s), endTime: fmtHour(e) };
    if (i !== -1) days[i] = entry; else days.push(entry);
    setSchedule({ days });
  };

  const setStart = () => {
    if (!menuCtx) return;
    const ds = schedule.days.find((d) => d.dayOfWeek === menuCtx.dayIdx);
    const end = ds ? parseHour(ds.endTime) : null;
    updateDay(menuCtx.dayIdx, menuCtx.hour, end === menuCtx.hour ? null : end);
    closeMenu();
  };

  const setEnd = () => {
    if (!menuCtx) return;
    const ds = schedule.days.find((d) => d.dayOfWeek === menuCtx.dayIdx);
    const start = ds ? parseHour(ds.startTime) : null;
    const target = menuCtx.hour + 1;
    updateDay(menuCtx.dayIdx, start === target ? null : start, target);
    closeMenu();
  };

  const removeSlot = () => {
    if (!menuCtx) return;
    const ds = schedule.days.find((d) => d.dayOfWeek === menuCtx.dayIdx);
    let s = ds ? parseHour(ds.startTime) : null;
    let e = ds ? parseHour(ds.endTime) : null;
    if (menuCtx.role === 'start') s = null;
    else if (menuCtx.role === 'end') e = null;
    else { s = null; e = null; }
    updateDay(menuCtx.dayIdx, s, e);
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
  };
  const closeMenu = () => { setAnchorEl(null); setMenuCtx(null); };

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
              <IconCalendar size={20} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
          </Box>

          <Box display="flex" gap={1} alignItems="center">
            <Button size="small" variant="outlined" startIcon={<IconClearAll size={16} />} onClick={clearAll}>
              Clear
            </Button>
            <Button size="small" variant="outlined" onClick={goToday}>
              Today
            </Button>
            <Box display="flex" sx={{ border: `1px solid ${borderColor}`, borderRadius: 2 }}>
              <IconButton size="small" onClick={prevWeek}><IconChevronLeft size={18} /></IconButton>
              <IconButton size="small" onClick={nextWeek}><IconChevronRight size={18} /></IconButton>
            </Box>
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
                  py={1}
                  sx={{ borderRight: idx < 6 ? `1px solid ${borderColor}` : 'none' }}
                >
                  <Typography
                    variant="caption"
                    fontSize={10}
                    fontWeight={700}
                    letterSpacing={1}
                    color={td ? blue.main : 'textSecondary'}
                  >
                    {DAY_NAMES_SHORT[idx]}
                  </Typography>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mt: 0.5,
                      fontWeight: 700,
                      fontSize: 14,
                      bgcolor: td ? blue.main : 'transparent',
                      color: td ? '#fff' : theme.palette.text.primary,
                      boxShadow: td ? `0 2px 8px ${blue.main}44` : 'none',
                    }}
                  >
                    {date.getDate()}
                  </Box>
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
                              <BlockLabel color={green.main}>Start: {formatHourDisplay(s)}</BlockLabel>
                              <BlockLabel color={amber.main}>End: {formatHourDisplay(e)}</BlockLabel>
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
                              <BlockTime color={e === null ? green.main : blue.main}>{formatHourDisplay(s)}</BlockTime>
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
                              <BlockTime color={s === null ? amber.main : blue.main}>{formatHourDisplay(e)}</BlockTime>
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
          slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 190, p: 1 } } }}
        >
          {menuCtx && (
            <>
              <Box display="flex" alignItems="center" justifyContent="space-between" px={1.5} py={0.75}>
                <Typography variant="caption" fontWeight={700} color="textSecondary">
                  {formatHourDisplay(menuCtx.hour)}
                </Typography>
                <IconButton size="small" onClick={closeMenu}><IconX size={14} /></IconButton>
              </Box>
              <Divider sx={{ mb: 0.5 }} />

              {menuCtx.role === null && (
                <>
                  <PopMenuItem icon={<IconPlayerPlay size={16} />} color={blue.main} onClick={setStart}>
                    <Typography variant="caption" fontWeight={600}>Set Start Time</Typography>
                    <Typography variant="caption" fontSize={10} color="textSecondary">
                      {formatHourDisplay(menuCtx.hour)}
                    </Typography>
                  </PopMenuItem>
                  <PopMenuItem icon={<IconClock size={16} />} color={amber.main} onClick={setEnd}>
                    <Typography variant="caption" fontWeight={600}>Set End Time</Typography>
                    <Typography variant="caption" fontSize={10} color="textSecondary">
                      {formatHourDisplay((menuCtx.hour + 1) % 24)}
                    </Typography>
                  </PopMenuItem>
                </>
              )}

              {menuCtx.role === 'middle' && (
                <>
                  <PopMenuItem icon={<IconPlayerPlay size={16} />} color={blue.main} onClick={setStart}>
                    <Typography variant="caption" fontWeight={600}>Set Start Time</Typography>
                  </PopMenuItem>
                  <PopMenuItem icon={<IconClock size={16} />} color={amber.main} onClick={setEnd}>
                    <Typography variant="caption" fontWeight={600}>Set End Time</Typography>
                  </PopMenuItem>
                  <Divider sx={{ my: 0.5 }} />
                  <PopMenuItem icon={<IconTrash size={16} />} color={theme.palette.error.main} onClick={removeSlot}>
                    <Typography variant="caption" fontWeight={600}>Remove Schedule</Typography>
                  </PopMenuItem>
                </>
              )}

              {(menuCtx.role === 'start' || menuCtx.role === 'end') && (
                <PopMenuItem icon={<IconTrash size={16} />} color={theme.palette.error.main} onClick={removeSlot}>
                  <Typography variant="caption" fontWeight={600}>Remove</Typography>
                </PopMenuItem>
              )}
            </>
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

/** Popover menu row */
const PopMenuItem: React.FC<{
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ icon, color, onClick, children }) => (
  <Box
    onClick={onClick}
    display="flex"
    alignItems="center"
    gap={1.5}
    sx={{
      px: 1.5,
      py: 1,
      borderRadius: 2,
      cursor: 'pointer',
      transition: 'background 0.15s',
      '&:hover': { bgcolor: `${color}11` },
    }}
  >
    <Box sx={{ color, display: 'flex' }}>{icon}</Box>
    <Box display="flex" flexDirection="column">{children}</Box>
  </Box>
);

export default ScheduleTimeTable;
