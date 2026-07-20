import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  lighten,
  darken,
  Button,
} from '@mui/material';
import {
  IconPlus,
  IconMinus,
  IconMaximize,
  IconMinimize,
  IconArrowsMinimize,
  IconCamera,
  IconDoor,
  IconWalk,
  IconGlassFull,
  IconAlertTriangle,
  IconHandStop,
  IconFlame,
  IconFingerprint,
  IconCircleDot,
  IconMapPin,
  IconArrowLeft,
} from '@tabler/icons-react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Circle, Line, Arc } from 'react-konva';
import Konva from 'konva';
import SiteSelector from './SiteSelector';
import { useLocation } from 'react-router';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { audioManager } from 'src/utils/audioManager';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { useAreaList } from 'src/hooks/useArea';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import { AppDispatch, useDispatch, useSelector, RootState } from 'src/store/Store';
import { useSiteList } from 'src/hooks/useSite';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useAlarmCaseList } from 'src/hooks/useAlarmCase';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const getMarkerColor = (type: string, status: string) => {
  if (status?.toLowerCase() === 'alarm' || status?.toLowerCase() === 'active') {
    return '#EF4444'; // Red alert!
  }
  const t = (type || '').toLowerCase();
  if (t.includes('motionsensor')) return '#F59E0B';
  if (t.includes('doorsensor')) return '#38BDF8';
  if (t.includes('glassbreaksensor')) return '#8B5CF6';
  // if (t.includes('beamsensor')) return '#06B6D4';
  if (t.includes('vibrationsensor')) return '#10B981';
  if (t.includes('cctvcamera')) return '#22C55E';
  if (t.includes('doorlock')) return '#6366F1';
  if (t.includes('siren')) return '#EF4444';
  if (t.includes('strobelight')) return '#EC4899';
  if (t.includes('panicbutton')) return '#D946EF';
  return '#94A3B8'; // Other / default grey
};

const getDeviceInitials = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t.includes('motionsensor')) return 'MOT';
  if (t.includes('doorsensor')) return 'DOR';
  if (t.includes('glassbreaksensor')) return 'GLS';
  // if (t.includes('beamsensor')) return 'BEM';
  if (t.includes('vibrationsensor')) return 'VIB';
  if (t.includes('cctvcamera')) return 'CAM';
  if (t.includes('doorlock')) return 'LCK';
  if (t.includes('siren')) return 'SRN';
  if (t.includes('strobelight')) return 'STB';
  if (t.includes('panicbutton')) return 'PAN';
  return 'OTH'; // Other
};

const namedColorsMap: Record<string, string> = {
  orange: '#f97316',
  pink: '#ec4899',
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#10b981',
  yellow: '#eab308',
  purple: '#8b5cf6',
  grey: '#64748b',
  gray: '#64748b',
  white: '#ffffff',
  black: '#000000',
};

const getHexColor = (colorStr: string): string => {
  if (!colorStr) return '#ff4d4f';
  const normalized = colorStr.trim().toLowerCase();
  if (namedColorsMap[normalized]) {
    return namedColorsMap[normalized];
  }
  return colorStr;
};

const hexToRgb = (hex: string) => {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map(char => char + char).join('');
  }
  if (c.length !== 6) return { r: 255, g: 77, b: 79 };
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

const safeLighten = (colorStr: string, coefficient: number): string => {
  try {
    const hex = getHexColor(colorStr);
    const rgb = hexToRgb(hex);
    const r = Math.round(rgb.r + (255 - rgb.r) * coefficient);
    const g = Math.round(rgb.g + (255 - rgb.g) * coefficient);
    const b = Math.round(rgb.b + (255 - rgb.b) * coefficient);
    return `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    console.error("Error in safeLighten:", e);
    return 'rgb(255, 255, 255)';
  }
};

const safeDarken = (colorStr: string, coefficient: number): string => {
  try {
    const hex = getHexColor(colorStr);
    const rgb = hexToRgb(hex);
    const r = Math.round(rgb.r * (1 - coefficient));
    const g = Math.round(rgb.g * (1 - coefficient));
    const b = Math.round(rgb.b * (1 - coefficient));
    return `rgb(${r}, ${g}, ${b})`;
  } catch (e) {
    console.error("Error in safeDarken:", e);
    return 'rgb(0, 0, 0)';
  }
};

const legendItems = [
  { label: 'Motion Sensor', type: 'MotionSensor' },
  { label: 'Door Sensor', type: 'DoorSensor' },
  { label: 'Glass Break Sensor', type: 'GlassBreakSensor' },
  // { label: 'Beam Sensor', type: 'BeamSensor' },
  { label: 'Vibration Sensor', type: 'VibrationSensor' },
  { label: 'CCTV Camera', type: 'CctvCamera' },
  { label: 'Door Lock', type: 'DoorLock' },
  { label: 'Siren', type: 'Siren' },
  { label: 'Strobe Light', type: 'StrobeLight' },
  { label: 'Panic Button', type: 'PanicButton' },
  { label: 'Other', type: 'Other' },
];

const mapBounds: [[number, number], [number, number]] = [
  [-12, 94],
  [8, 142],
];

const leafletColors = {
  normal: '#10b981',
  alarm: '#ef4444',
  trouble: '#f59e0b',
  offline: '#64748b',
};

const createLeafletMarker = (status: keyof typeof leafletColors, count: number) =>
  L.divIcon({
    className: '',
    html: `
        <div class="soc-marker">
            <div
                class="pulse"
                style="background:${leafletColors[status]}"
            ></div>
            <div
                class="core"
                style="background:${leafletColors[status]}"
            >
                ${count}
            </div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

interface FloorplanViewProps {
  selectedDeviceId?: string;
  onSelectDevice?: (device: DeviceMappingType) => void;
  selectedFloorplan?: FloorplanType | null;
  onSelectFloorplan?: (floorplan: FloorplanType | null) => void;
}

const FloorplanView: React.FC<FloorplanViewProps> = ({
  selectedDeviceId,
  onSelectDevice,
  selectedFloorplan: propSelectedFloorplan,
  onSelectFloorplan,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const alarmEvents = useSelector((state: RootState) => state.alarmEventReducer.alarmEventList);

  const [pulseValue, setPulseValue] = useState(1);

  const [localSelectedFloorplan, setLocalSelectedFloorplan] = useState<FloorplanType | null>(null);
  const selectedFloorplan = propSelectedFloorplan !== undefined ? propSelectedFloorplan : localSelectedFloorplan;
  const setSelectedFloorplan = (fp: FloorplanType | null) => {
    if (onSelectFloorplan) {
      onSelectFloorplan(fp);
    } else {
      setLocalSelectedFloorplan(fp);
    }
  };

  useEffect(() => {
    if (!selectedFloorplan) return;
    let animId: number;
    const tick = () => {
      setPulseValue((prev) => {
        let next = prev + 0.02;
        if (next >= 1.6) {
          next = 0.8;
        }
        return next;
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [selectedFloorplan]);

  const getActiveAlarm = (mappingId: string, deviceId: string | null) => {
    if (!alarmEvents || alarmEvents.length === 0) return undefined;
    
    const deviceEvents = alarmEvents.filter((evt) => {
      // 1. Direct input match
      const isInputMatch = (deviceId && evt.deviceId === deviceId) || evt.deviceId === mappingId || (evt.inputDevice && evt.inputDevice.deviceId === deviceId);
      if (isInputMatch) return true;

      // 2. Output devices match
      if (evt.outputDevices && Array.isArray(evt.outputDevices)) {
        const hasOutputMatch = evt.outputDevices.some(
          (out: any) => (deviceId && out.deviceId === deviceId) || out.deviceId === mappingId || out.deviceName === mappingId
        );
        if (hasOutputMatch) return true;
      }

      // 3. Stream devices match
      if (evt.streamDevices && Array.isArray(evt.streamDevices)) {
        const hasStreamMatch = evt.streamDevices.some(
          (str: any) => (deviceId && str.deviceId === deviceId) || str.deviceId === mappingId || str.deviceName === mappingId
        );
        if (hasStreamMatch) return true;
      }

      return false;
    });
    
    if (deviceEvents.length === 0) return undefined;
    
    // Group by alarmCaseId and keep only the newest event per case
    const newestPerCase: Record<string, typeof deviceEvents[0]> = {};
    for (const evt of deviceEvents) {
      const caseKey = evt.alarmCaseId || evt.rawId || String(evt.id);
      const existing = newestPerCase[caseKey];
      if (!existing) {
        newestPerCase[caseKey] = evt;
      } else {
        const existingTime = existing.createdAt ? new Date(existing.createdAt).getTime() : 0;
        const evtTime = evt.createdAt ? new Date(evt.createdAt).getTime() : 0;
        if (evtTime > existingTime) {
          newestPerCase[caseKey] = evt;
        }
      }
    }

    // From the deduplicated events, find the newest overall
    const deduped = Object.values(newestPerCase);
    const newestEvent = deduped.reduce((latest, current) => {
      const latestTime = latest.createdAt ? new Date(latest.createdAt).getTime() : 0;
      const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : 0;
      return currentTime > latestTime ? current : latest;
    }, deduped[0]);
    
    if (newestEvent) {
      // Check if it's the input device and is active
      const isInputMatch = (deviceId && newestEvent.deviceId === deviceId) || newestEvent.deviceId === mappingId || (newestEvent.inputDevice && newestEvent.inputDevice.deviceId === deviceId);
      if (isInputMatch) {
        const statusAlarmVal = newestEvent.statusAlarm?.toLowerCase();
        if (statusAlarmVal === 'on' || statusAlarmVal === 'active' || statusAlarmVal === 'alarm_trigger' || statusAlarmVal === 'triggered') {
          return newestEvent;
        }
        if (newestEvent.inputDevice && newestEvent.inputDevice.status === 'active') {
          return newestEvent;
        }
      }

      // Check output devices
      if (newestEvent.outputDevices && Array.isArray(newestEvent.outputDevices)) {
        const matchingOutput = newestEvent.outputDevices.find(
          (out: any) => (deviceId && out.deviceId === deviceId) || out.deviceId === mappingId || out.deviceName === mappingId
        );
        if (matchingOutput && matchingOutput.status === 'active') {
          return newestEvent;
        }
      }

      // Check stream devices
      if (newestEvent.streamDevices && Array.isArray(newestEvent.streamDevices)) {
        const matchingStream = newestEvent.streamDevices.find(
          (str: any) => (deviceId && str.deviceId === deviceId) || str.deviceId === mappingId || str.deviceName === mappingId
        );
        if (matchingStream && matchingStream.status === 'active') {
          return newestEvent;
        }
      }
    }
    
    return undefined;
  };

  const getActiveOutput = (mapping: DeviceMappingType) => {
    if (!alarmEvents || alarmEvents.length === 0) return null;
    
    // Find the NEWEST event that references this output device, then check if active
    let newestMatch: { event: typeof alarmEvents[0]; output: any; time: number } | null = null;
    
    for (const evt of alarmEvents) {
      if (evt.outputDevices && Array.isArray(evt.outputDevices)) {
        const match = evt.outputDevices.find(
          (out: any) =>
            (mapping.deviceId && out.deviceId === mapping.deviceId) ||
            out.deviceId === mapping.id ||
            out.deviceName === mapping.deviceName ||
            out.deviceName === mapping.label
        );
        if (match) {
          const evtTime = evt.createdAt ? new Date(evt.createdAt).getTime() : 0;
          if (!newestMatch || evtTime > newestMatch.time) {
            newestMatch = { event: evt, output: match, time: evtTime };
          }
        }
      }
    }
    
    // Only return if the newest event still has this output as active
    if (newestMatch && newestMatch.output.status === 'active') {
      return { event: newestMatch.event, output: newestMatch.output };
    }
    return null;
  };

  const getSeverityColor = (severity?: string) => {
    const s = (severity || '').toLowerCase();
    if (s === 'low') return '#EAB308';
    if (s === 'medium') return '#F97316';
    if (s === 'high') return '#EF4444';
    if (s === 'critical') return '#991B1B';
    return '#EF4444';
  };
  const location = useLocation();

  // Resolve user role
  let role = '';
  try {
    const responseStr = localStorage.getItem('response');
    const loggedInUser = responseStr ? JSON.parse(responseStr) : null;
    role = loggedInUser?.role || localStorage.getItem('role') || '';
  } catch (e) {
    role = localStorage.getItem('role') || '';
  }
  const isSuperAdmin = role === 'SuperAdmin' || role?.toLowerCase() === 'superadmin';

  // Fetch alarm cases if SuperAdmin (limit 1000 to get all active cases)
  const { data: alarmCaseResponse } = useAlarmCaseList(
    isSuperAdmin ? { page: 1, limit: 1000, sortBy: 'triggeredAt', sortOrder: 'desc' } : undefined
  );
  const alarmCases = alarmCaseResponse?.data || [];

  const [showSiteSelector, setShowSiteSelector] = useState(true);
  const [activePopupSiteId, setActivePopupSiteId] = useState<string | null>(null);
  const [modeEdit, setModeEdit] = useState(false);

  // Fetch site, floor, and floorplan lists to auto-select the first floor of the first site
  const { data: siteResponse } = useSiteList({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: floorResponse } = useFloorList();
  const { data: floorplanResponse } = useFloorplanList();

  useEffect(() => {
    if (selectedFloorplan) return;
    if (isSuperAdmin) return; // Do not auto-select floorplan for SuperAdmin to show the map of Indonesia by default

    const sites = siteResponse?.data || [];
    const floorData = floorResponse?.data || [];
    const floorplanData = floorplanResponse?.data || [];

    if (sites.length > 0 && floorData.length > 0 && floorplanData.length > 0) {
      const passedFloorplanId = location.state?.floorplanId;
      if (passedFloorplanId) {
        const match = floorplanData.find((fp) => fp.id === passedFloorplanId);
        if (match) {
          setSelectedFloorplan(match);
          return;
        }
      }

      const firstSite = sites[0];
      const siteFloors = floorData.filter((f) => f.siteId === firstSite.id);
      
      // Find floor level 0
      let targetFloor = siteFloors.find((f) => f.level === 0);
      if (!targetFloor) {
        // Find floor with smallest level > 0
        const positiveFloors = siteFloors.filter((f) => f.level > 0).sort((a, b) => a.level - b.level);
        if (positiveFloors.length > 0) {
          targetFloor = positiveFloors[0];
        }
      }
      if (!targetFloor && siteFloors.length > 0) {
        // Sort all levels ascending and take the first one
        const sortedFloors = [...siteFloors].sort((a, b) => a.level - b.level);
        targetFloor = sortedFloors[0];
      }

      if (targetFloor) {
        const floorplans = floorplanData.filter((fp) => fp.floorId === targetFloor.id);
        if (floorplans.length > 0) {
          setSelectedFloorplan(floorplans[0]);
          return;
        }
      }

      // Fallback 1: Any floorplan in the first site
      const siteFloorplans = floorplanData.filter((fp) => fp.siteId === firstSite.id);
      if (siteFloorplans.length > 0) {
        setSelectedFloorplan(siteFloorplans[0]);
        return;
      }

      // Fallback 2: Any floorplan overall
      if (floorplanData.length > 0) {
        setSelectedFloorplan(floorplanData[0]);
      }
    }
  }, [siteResponse, floorResponse, floorplanResponse, selectedFloorplan]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (wrapperRef.current) {
        wrapperRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };



  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [baseSize, setBaseSize] = useState({ width: 800, height: 600 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Fetch device mappings for selected floorplan
  const filter = {
    page: 1,
    limit: 200,
    sortBy: '',
    sortOrder: 'asc' as const,
    floorplanId: selectedFloorplan?.id || '',
  };
  const { data: mappingResponse } = useDeviceMappingList(
    selectedFloorplan?.id ? filter : undefined
  );
  const mappings = selectedFloorplan ? (mappingResponse?.data || []) : [];

  const hasCriticalAlarm = mappings.some((mapping) => {
    const activeAlarm = getActiveAlarm(mapping.id, mapping.deviceId);
    return activeAlarm && activeAlarm.severity?.toLowerCase() === 'critical';
  });

  useEffect(() => {
    if (hasCriticalAlarm) {
      audioManager.requestLoop('FloorplanView', '/alarm-sfx/alarm_slow.mp3');
    } else {
      audioManager.releaseLoop('FloorplanView');
    }
    return () => {
      audioManager.releaseLoop('FloorplanView');
    };
  }, [hasCriticalAlarm]);

  const { data: areaResponse } = useAreaList(
    selectedFloorplan?.id
      ? {
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc' as const,
          floorplanId: selectedFloorplan.id,
        }
      : undefined
  );
  const areas = selectedFloorplan ? (areaResponse?.data || []) : [];

  const cdnImageUrl = selectedFloorplan ? getCdnUrl(selectedFloorplan.imageUrl) : '';

  // Load Floorplan Image
  useEffect(() => {
    if (!cdnImageUrl) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = cdnImageUrl;
    img.onload = () => {
      setImage(img);
      if (containerRef.current) {
        const cWidth = containerRef.current.offsetWidth;
        const cHeight = containerRef.current.offsetHeight || 500;
        setContainerSize({ width: cWidth, height: cHeight });

        const fitScale = Math.min(cWidth / img.width, cHeight / img.height);
        const sWidth = img.width * fitScale;
        const sHeight = img.height * fitScale;

        setBaseSize({ width: sWidth, height: sHeight });
        setStageScale(1);

        setStagePos({
          x: (cWidth - sWidth) / 2,
          y: (cHeight - sHeight) / 2,
        });
      }
    };
  }, [cdnImageUrl]);

  // Handle Resize of the container
  useEffect(() => {
    if (!containerRef.current) return;
    const handleResize = () => {
      if (containerRef.current && image) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);
    
    // Call initially
    handleResize();

    return () => {
      observer.disconnect();
    };
  }, [image]);

  // Wheel Zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = e.target.getStage();
      if (!stage) return;

      const scaleBy = 1.1;
      const oldScale = stageScale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      if (newScale < 0.3 || newScale > 8) return;

      setStageScale(newScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });
    },
    [stageScale, stagePos],
  );

  const handleZoomIn = () => {
    setStageScale((z) => Math.min(z * 1.2, 8));
  };

  const handleZoomOut = () => {
    setStageScale((z) => Math.max(z / 1.2, 0.3));
  };

  const handleResetZoom = () => {
    setStageScale(1);
    if (image && containerRef.current) {
      const cWidth = containerRef.current.offsetWidth;
      const cHeight = containerRef.current.offsetHeight || 500;
      const fitScale = Math.min(cWidth / image.width, cHeight / image.height);
      const sWidth = image.width * fitScale;
      const sHeight = image.height * fitScale;
      setStagePos({
        x: (cWidth - sWidth) / 2,
        y: (cHeight - sHeight) / 2,
      });
    }
  };

  

  return (
    <Box
      ref={wrapperRef}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0B1120',
        overflow: 'hidden',
      }}
    >
      {/* Critical Alarm Vignette Overlay */}
      {hasCriticalAlarm && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: 'inset 0 0 60px rgba(153, 27, 27, 0.8)',
            animation: 'vignetteBreath 2s infinite ease-in-out',
            '@keyframes vignetteBreath': {
              '0%, 100%': {
                boxShadow: 'inset 0 0 40px rgba(153, 27, 27, 0.4)',
              },
              '50%': {
                boxShadow: 'inset 0 0 100px rgba(153, 27, 27, 0.95)',
              },
            },
          }}
        />
      )}

      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          bgcolor: '#111827',
          zIndex: 5,
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.5px',
            }}
          >
            {isSuperAdmin && !selectedFloorplan ? 'MAIN VIEW - MAP' : 'MAIN VIEW - FLOORPLAN'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: 12 }}>
              {isSuperAdmin && !selectedFloorplan
                ? 'Peta Sebaran Site Seluruh Indonesia'
                : selectedFloorplan
                ? `${selectedFloorplan.siteName} - ${selectedFloorplan.buildingName} - ${selectedFloorplan.floorName} - ${selectedFloorplan.name}`
                : 'Silakan Pilih Layout / Floorplan'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSuperAdmin && selectedFloorplan && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              startIcon={<IconArrowLeft size={16} />}
              onClick={() => setSelectedFloorplan(null)}
              sx={{
                fontSize: 11,
                textTransform: 'none',
                borderColor: 'rgba(255,255,255,0.15)',
                color: '#E2E8F0',
                py: 0.5,
                px: 1.5,
                '&:hover': {
                  borderColor: '#2563EB',
                  bgcolor: 'rgba(37,99,235,0.1)',
                },
              }}
            >
              Back to Map
            </Button>
          )}

          <IconButton
            size="small"
            onClick={() => setShowSiteSelector(!showSiteSelector)}
            sx={{
              color: '#94A3B8',
              bgcolor: 'rgba(255,255,255,0.04)',
              borderRadius: 1,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
            }}
          >
            <IconMapPin size={16} />
          </IconButton>
        </Box>
      </Box>

      {/* Floorplan Area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {isSuperAdmin && !selectedFloorplan ? (
          <Box sx={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
            <style>
              {`
              .soc-marker {
                position: relative;
                width: 36px;
                height: 36px;
                cursor: pointer;
              }
              .soc-marker * {
                pointer-events: none;
              }

              .soc-marker .pulse {
                position: absolute;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                animation: markerPulse 2s infinite;
                opacity: .35;
              }
              .soc-marker .core {
                position: absolute;
                width: 28px;
                height: 28px;
                left: 4px;
                top: 4px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 11px;
                font-weight: bold;
                border: 2px solid white;
                box-shadow: 0 0 12px rgba(0,0,0,.5);
              }
              @keyframes markerPulse {
                0% {
                  transform: scale(.8);
                  opacity: .5;
                }
                70% {
                  transform: scale(1.7);
                  opacity: 0;
                }
                100% {
                  transform: scale(.8);
                  opacity: 0;
                }
              }
              .leaflet-container {
                background: #0f172a;
              }
              .leaflet-marker-icon {
                pointer-events: auto !important;
                cursor: pointer !important;
              }
              .leaflet-popup-content-wrapper {
                background: #111827 !important;
                color: white !important;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px;
              }
              .leaflet-popup-tip {
                background: #111827 !important;
                border: 1px solid rgba(255,255,255,0.08);
              }
              `}
            </style>
            <MapContainer
              center={[-2.5, 118]}
              zoom={5}
              minZoom={5}
              maxZoom={15}
              maxBounds={mapBounds}
              maxBoundsViscosity={1}
              style={{
                height: '100%',
                width: '100%',
              }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {(siteResponse?.data || []).map((site) => {
                const siteCases = alarmCases.filter((c) => c.siteId === site.id);
                const activeCases = siteCases.filter((c) => {
                  const s = c.investigationStatus?.toLowerCase();
                  return s !== 'done' && s !== 'investigationcompleted';
                });

                let status: 'normal' | 'alarm' | 'trouble' = 'normal';
                const count = activeCases.length;

                if (count > 0) {
                  const hasNull = activeCases.some(
                    (c) => c.investigationStatus === null || c.investigationStatus === undefined || c.investigationStatus === ''
                  );
                  if (hasNull) {
                    status = 'alarm';
                  } else {
                    status = 'trouble';
                  }
                } else {
                  status = 'normal';
                }
                // Find the first floorplan of this site using Admin's logic
                const siteFloors = (floorResponse?.data || []).filter((f) => f.siteId === site.id);
                const floorplanData = floorplanResponse?.data || [];
                let targetFloorplan: any = null;
                let targetFloor = siteFloors.find((f) => f.level === 0);
                if (!targetFloor) {
                  const positiveFloors = siteFloors.filter((f) => f.level > 0).sort((a, b) => a.level - b.level);
                  if (positiveFloors.length > 0) {
                    targetFloor = positiveFloors[0];
                  }
                }
                if (!targetFloor && siteFloors.length > 0) {
                  const sortedFloors = [...siteFloors].sort((a, b) => a.level - b.level);
                  targetFloor = sortedFloors[0];
                }
                if (targetFloor) {
                  const floorplans = floorplanData.filter((fp) => fp.floorId === targetFloor.id);
                  if (floorplans.length > 0) {
                    targetFloorplan = floorplans[0];
                  }
                }
                if (!targetFloorplan) {
                  const siteFloorplans = floorplanData.filter((fp) => fp.siteId === site.id);
                  if (siteFloorplans.length > 0) {
                    targetFloorplan = siteFloorplans[0];
                  }
                }

                return (
                  <Marker
                    key={site.id}
                    position={[Number(site.latitude) || 0, Number(site.longitude) || 0]}
                    icon={createLeafletMarker(status, count)}
                  >
                    <Popup>
                      <div style={{ color: '#F8FAFC', fontSize: '12px', lineHeight: '1.6', fontFamily: 'sans-serif' }}>
                        <b>{site.name}</b>
                        <br />
                        Region : {site.region}
                        <br />
                        Active Cases : {count}
                        <br />
                        Status : {status === 'alarm' ? 'alarm' : status === 'trouble' ? 'trouble' : 'normal'}
                        
                        {targetFloorplan ? (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              onClick={() => {
                                setSelectedFloorplan(targetFloorplan);
                              }}
                              style={{
                                backgroundColor: '#2563EB',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-block',
                              }}
                            >
                              View Floorplan
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: '8px', color: '#64748B', fontStyle: 'italic', fontSize: '11px' }}>
                            No floorplans available
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </Box>
        ) : image ? (
          <Stage
            width={containerSize.width}
            height={containerSize.height}
            scaleX={stageScale}
            scaleY={stageScale}
            x={stagePos.x}
            y={stagePos.y}
            draggable
            onDragEnd={(e: any) => {
              if (e.target.getClassName() === 'Stage') {
                setStagePos({ x: e.target.x(), y: e.target.y() });
              }
            }}
            onWheel={handleWheel}
            style={{ display: 'block', cursor: stageScale > 1 ? 'grab' : 'default' }}
            onMouseDown={(e: any) => {
              if (e.target.getClassName() === 'Stage' || e.target.getClassName() === 'Image') {
                const container = e.target.getStage()?.container();
                if (container) container.style.cursor = 'grabbing';
              }
            }}
            onMouseUp={(e: any) => {
              const container = e.target.getStage()?.container();
              if (container) container.style.cursor = stageScale > 1 ? 'grab' : 'default';
            }}
          >
            {/* Background image layer */}
            <Layer>
              <KonvaImage image={image} width={baseSize.width} height={baseSize.height} />
            </Layer>

            {/* Areas Layer */}
            {areas.length > 0 && (() => {
              const selectedDevice = mappings.find((m) => m.id === selectedDeviceId);
              const selectedAreaId = selectedDevice?.areaId;

              return (
                <Layer>
                  {areas.map((area) => {
                    const fitScale = baseSize.width / image.width;
                    const points =
                      area.areaNodes?.flatMap((node) => [
                        node.x_px * fitScale,
                        node.y_px * fitScale,
                      ]) || [];
                    const color = getHexColor(area.colorArea || '#FF4D4F');
                    const isAreaSelected = selectedAreaId && String(area.id) === String(selectedAreaId);

                    // Check if any devices in this area have an active alarm
                    const areaMappings = mappings.filter((m) => String(m.areaId) === String(area.id));
                    const areaAlarms = areaMappings
                      .map((m) => getActiveAlarm(m.id, m.deviceId))
                      .filter((a) => !!a);
                    const hasAreaAlarm = areaAlarms.length > 0;

                    const highestSeverityAlarm = areaAlarms.reduce((highest, current) => {
                      if (!highest) return current;
                      if (!current) return highest;
                      const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
                      const rCurrent = severityRank[current.severity?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'] || 1;
                      const rHighest = severityRank[highest.severity?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'] || 1;
                      return rCurrent > rHighest ? current : highest;
                    }, areaAlarms[0]);

                    const alarmColor = highestSeverityAlarm
                      ? getSeverityColor(highestSeverityAlarm.severity)
                      : '#EF4444';

                    const lineStrokeColor = hasAreaAlarm
                      ? alarmColor
                      : (isAreaSelected ? safeLighten(color, 0.2) : safeDarken(color, 0.4));

                    const lineFillColor = hasAreaAlarm
                      ? safeLighten(alarmColor, 0.6)
                      : (isAreaSelected ? safeLighten(color, 0.5) : safeLighten(color, 0.75));

                    const textFillColor = hasAreaAlarm
                      ? alarmColor
                      : (isAreaSelected ? "#60A5FA" : safeDarken(color, 0.5));

                    const textStroke = isAreaSelected || hasAreaAlarm ? "#0b0f19" : undefined;
                    const textStrokeWidth = isAreaSelected || hasAreaAlarm ? 3 : 0;

                    const centerX = area.areaNodes && area.areaNodes.length > 0
                      ? (area.areaNodes.reduce((acc, curr) => acc + curr.x_px, 0) / area.areaNodes.length) * fitScale
                      : 0;
                    const centerY = area.areaNodes && area.areaNodes.length > 0
                      ? (area.areaNodes.reduce((acc, curr) => acc + curr.y_px, 0) / area.areaNodes.length) * fitScale
                      : 0;

                    return (
                      <Group key={area.id}>
                        {/* Main area polygon */}
                        <Line
                          points={points}
                          stroke={lineStrokeColor}
                          strokeWidth={isAreaSelected || hasAreaAlarm ? 4 : 2}
                          lineJoin="round"
                          lineCap="round"
                          closed
                          fill={lineFillColor}
                          opacity={isAreaSelected || hasAreaAlarm ? 0.75 : 0.55}
                        />

                        {/* Ripple animation outline */}
                        {hasAreaAlarm && (
                          <Line
                            points={points}
                            stroke={alarmColor}
                            strokeWidth={2 + (pulseValue - 0.8) * 16}
                            opacity={Math.max(0, 1.8 - pulseValue) * 0.45}
                            lineJoin="round"
                            lineCap="round"
                            closed
                          />
                        )}

                        {/* Area Name Text */}
                        {area.areaNodes && area.areaNodes.length > 0 && (
                          <Text
                            text={area.name}
                            x={centerX}
                            y={centerY}
                            offsetX={50}
                            offsetY={6}
                            width={100}
                            align="center"
                            fontSize={isAreaSelected || hasAreaAlarm ? 14.5 : 12}
                            fontStyle="bold"
                            fill={textFillColor}
                            stroke={textStroke}
                            strokeWidth={textStrokeWidth}
                            fillAfterStrokeEnabled={true}
                            scaleX={1 / stageScale}
                            scaleY={1 / stageScale}
                            shadowColor="rgba(0,0,0,0.5)"
                            shadowBlur={isAreaSelected || hasAreaAlarm ? 4 : 0}
                            shadowOffset={isAreaSelected || hasAreaAlarm ? { x: 0, y: 1 } : { x: 0, y: 0 }}
                          />
                        )}
                      </Group>
                    );
                  })}
                </Layer>
              );
            })()}

            {/* Device markers layer */}
            <Layer>
              {(() => {
                const sortedMappings = [...mappings].sort((a, b) => {
                  const activeAlarmA = getActiveAlarm(a.id, a.deviceId) || getActiveOutput(a)?.event;
                  const isAlarmA = (a.deviceStatus || '').toLowerCase().includes('alarm') ||
                                   (a.deviceStatus || '').toLowerCase().includes('active') ||
                                   !!activeAlarmA;

                  const activeAlarmB = getActiveAlarm(b.id, b.deviceId) || getActiveOutput(b)?.event;
                  const isAlarmB = (b.deviceStatus || '').toLowerCase().includes('alarm') ||
                                   (b.deviceStatus || '').toLowerCase().includes('active') ||
                                   !!activeAlarmB;

                  if (isAlarmA && !isAlarmB) return 1;
                  if (!isAlarmA && isAlarmB) return -1;

                  const isSelectedA = selectedDeviceId === a.id;
                  const isSelectedB = selectedDeviceId === b.id;
                  if (isSelectedA && !isSelectedB) return 1;
                  if (!isSelectedA && isSelectedB) return -1;

                  return 0;
                });

                return sortedMappings.map((mapping) => {
                  const x = (mapping.posPxX / 100) * baseSize.width;
                  const y = (mapping.posPxY / 100) * baseSize.height;

                  // Detect active output relay and retrieve associated alarm info
                  const activeOutputInfo = getActiveOutput(mapping);
                  const isOutputActive = !!activeOutputInfo;
                  const alarmSeverity = activeOutputInfo?.event?.severity;
                  const activeOutputColor = activeOutputInfo ? getSeverityColor(alarmSeverity) : null;

                  const color = activeOutputColor || getMarkerColor(mapping.deviceType, mapping.deviceStatus);
                  const isAlarm = (mapping.deviceStatus || '').toLowerCase().includes('alarm') ||
                                  (mapping.deviceStatus || '').toLowerCase().includes('active') ||
                                  isOutputActive;

                  const isSelected = selectedDeviceId === mapping.id;
                  const activeAlarm = getActiveAlarm(mapping.id, mapping.deviceId) || activeOutputInfo?.event;
                  const isBlinking = !!activeAlarm;
                  const blinkColor = activeAlarm ? getSeverityColor(activeAlarm.severity) : '#EF4444';
                  const alarmColor = blinkColor;

                  const deviceTypeLower = (mapping.deviceType || '').toLowerCase();
                  
                  const isSirenActive = isOutputActive && (
                    deviceTypeLower.includes('siren') || 
                    deviceTypeLower.includes('buzzer') || 
                    deviceTypeLower.includes('bell')
                  );
                  
                  const isLockActive = isOutputActive && deviceTypeLower.includes('doorlock');
                  
                  const isStrobeActive = isOutputActive && deviceTypeLower.includes('strobelight');

                  const isOutputDevice = deviceTypeLower.includes('siren') || 
                                         deviceTypeLower.includes('buzzer') || 
                                         deviceTypeLower.includes('bell') ||
                                         deviceTypeLower.includes('doorlock') ||
                                         deviceTypeLower.includes('strobelight');

                  return (
                    <Group
                      key={mapping.id}
                      x={x}
                      y={y}
                      onClick={() => onSelectDevice?.(mapping)}
                      onTouchEnd={() => onSelectDevice?.(mapping)}
                      onMouseEnter={(e: any) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = 'pointer';
                      }}
                      onMouseLeave={(e: any) => {
                        const container = e.target.getStage()?.container();
                        if (container) container.style.cursor = stageScale > 1 ? 'grab' : 'default';
                      }}
                    >
                      {/* Pulsing alarm ring */}
                      {isBlinking && !isOutputActive && !isOutputDevice && (
                        <Circle
                          radius={(isSelected ? 30.5 : 25) * pulseValue}
                          fill={blinkColor}
                          opacity={Math.max(0, 1.8 - pulseValue) * 0.65}
                          stroke={blinkColor}
                          strokeWidth={1.5}
                        />
                      )}

                      {/* Ring indicator for alarms */}
                      {isAlarm && (
                        <Circle
                          radius={16}
                          stroke={color}
                          strokeWidth={2}
                          dash={[4, 2]}
                          shadowColor={color}
                          shadowBlur={10}
                        />
                      )}

                      {/* Highlight ring for selected device */}
                      {isSelected && (
                        <Circle
                          radius={16.5}
                          stroke="#60A5FA"
                          strokeWidth={2}
                          shadowColor="#60A5FA"
                          shadowBlur={8}
                        />
                      )}

                      {/* Sound waves on both sides for Siren / Buzzer / Bell */}
                      {isSirenActive && (
                        <>
                          {/* Right side waves */}
                          {pulseValue > 0.9 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={-30}
                              innerRadius={15}
                              outerRadius={15}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}
                          {pulseValue > 1.1 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={-30}
                              innerRadius={21}
                              outerRadius={21}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}
                          {pulseValue > 1.3 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={-30}
                              innerRadius={27}
                              outerRadius={27}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}

                          {/* Left side waves */}
                          {pulseValue > 0.9 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={150}
                              innerRadius={15}
                              outerRadius={15}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}
                          {pulseValue > 1.1 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={150}
                              innerRadius={21}
                              outerRadius={21}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}
                          {pulseValue > 1.3 && (
                            <Arc
                              x={0}
                              y={0}
                              angle={60}
                              rotation={150}
                              innerRadius={27}
                              outerRadius={27}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                            />
                          )}
                        </>
                      )}

                      {/* Strobe Light scanner beam */}
                      {isStrobeActive && (() => {
                        const beamAngle = ((pulseValue - 0.8) / 0.8) * 360;
                        return (
                          <>
                            {/* Scanner wedge */}
                            <Arc
                              x={0}
                              y={0}
                              angle={360}
                              rotation={beamAngle - 360}
                              innerRadius={0}
                              outerRadius={35}
                              fill={alarmColor}
                              opacity={0.2}
                            />
                            {/* Leading beam line */}
                            <Line
                              points={[0, 0, 35, 0]}
                              stroke={alarmColor}
                              strokeWidth={1.5}
                              rotation={beamAngle}
                            />
                          </>
                        );
                      })()}

                      {/* Main Dot */}
                      <Circle
                        radius={isSelected ? 13.5 : 11}
                        fill={color}
                        stroke={isSelected ? "#60A5FA" : "#ffffff"}
                        strokeWidth={isSelected ? 2 : 1.5}
                        shadowColor="rgba(0,0,0,0.4)"
                        shadowBlur={4}
                        shadowOffset={{ x: 0, y: 2 }}
                      />

                      {/* Lock Icon inside Dot for active DoorLock, otherwise initials text */}
                      {isLockActive ? (
                        <Group>
                          {/* Shackle */}
                          <Group>
                            <Rect
                              x={-3.5}
                              y={isSelected ? -8 : -7}
                              width={7}
                              height={6}
                              stroke="#ffffff"
                              strokeWidth={1.5}
                              cornerRadius={[3.5, 3.5, 0, 0]}
                            />
                            {/* Lock Body */}
                            <Rect
                              x={-5}
                              y={isSelected ? -3 : -2}
                              width={10}
                              height={8}
                              fill="#ffffff"
                              cornerRadius={1}
                            />
                          </Group>
                        </Group>
                      ) : (
                        /* Initials Text inside Dot */
                        <Text
                          text={getDeviceInitials(mapping.deviceType)}
                          x={isSelected ? -18 : -15}
                          y={isSelected ? -5 : -4}
                          width={isSelected ? 36 : 30}
                          fontSize={isSelected ? 9.5 : 8}
                          fontStyle="bold"
                          fill="#ffffff"
                          align="center"
                        />
                      )}

                      {/* Label below marker */}
                      {(mapping.label || mapping.deviceName) && (
                        <Text
                          text={mapping.label || mapping.deviceName || ''}
                          x={0}
                          y={isSelected ? 17 : 14}
                          offsetX={40}
                          width={80}
                          fontSize={isSelected ? 12.5 : 10}
                          fontStyle="bold"
                          fill={isSelected ? "#60A5FA" : "#E2E8F0"}
                          stroke="#0b0f19"
                          strokeWidth={3}
                          fillAfterStrokeEnabled={true}
                          align="center"
                          scaleX={1 / stageScale}
                          scaleY={1 / stageScale}
                        />
                      )}
                    </Group>
                  );
                });
              })()}
            </Layer>
          </Stage>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 1.5,
            }}
          >
            <IconMapPin size={48} color="#475569" />
            <Typography sx={{ color: '#94A3B8', fontSize: 14 }}>
              {selectedFloorplan ? 'Loading floorplan image...' : 'Pilih layout / floorplan dari Site Selector'}
            </Typography>
          </Box>
        )}

        {/* Zoom Controls */}
        {image && !isSuperAdmin && (
          <Box
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
              zIndex: 5,
            }}
          >
            <IconButton
              size="small"
              onClick={handleZoomIn}
              sx={{
                bgcolor: 'rgba(17,24,39,0.85)',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 30,
                height: 30,
                '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
              }}
            >
              <IconPlus size={14} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleZoomOut}
              sx={{
                bgcolor: 'rgba(17,24,39,0.85)',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 30,
                height: 30,
                '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
              }}
            >
              <IconMinus size={14} />
            </IconButton>
            <IconButton
              size="small"
              onClick={handleResetZoom}
              sx={{
                bgcolor: 'rgba(17,24,39,0.85)',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 30,
                height: 30,
                '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
              }}
            >
              <IconArrowsMinimize size={14} />
            </IconButton>
            <IconButton
              size="small"
              onClick={toggleFullscreen}
              sx={{
                bgcolor: 'rgba(17,24,39,0.85)',
                color: '#E2E8F0',
                border: '1px solid rgba(255,255,255,0.1)',
                width: 30,
                height: 30,
                '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
              }}
            >
              {isFullscreen ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
            </IconButton>
          </Box>
        )}

        {/* Site Selector overlay */}
        <SiteSelector
          open={showSiteSelector}
          onClose={() => setShowSiteSelector(false)}
          selectedFloorplanId={selectedFloorplan?.id}
          onSelectFloorplan={(floorplan) => {
            setSelectedFloorplan(floorplan);
            setShowSiteSelector(false);
          }}
        />
      </Box>

      {/* Legend Bar */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 2.5,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          bgcolor: '#111827',
          flexShrink: 0,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {isSuperAdmin && !selectedFloorplan ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                Normal (All alarms Done)
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#f59e0b' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                Acknowledged / Dispatched
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ef4444' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: 11, whiteSpace: 'nowrap' }}>
                New / Unprocessed (Status is null)
              </Typography>
            </Box>
          </>
        ) : (
          legendItems.map((item) => {
            const initials = getDeviceInitials(item.type);
            const color = getMarkerColor(item.type, 'normal');

            return (
              <Box
                key={item.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    width: 28,
                    height: 18,
                    bgcolor: color,
                    color: '#fff',
                    fontSize: 8.5,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  {initials}
                </Box>
                <Typography
                  sx={{
                    color: '#94A3B8',
                    fontSize: 11,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          })
        )}

        {/* <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={modeEdit}
                onChange={(e) => setModeEdit(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#2563EB' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    bgcolor: '#2563EB',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#94A3B8', fontSize: 11 }}>
                Mode Edit
              </Typography>
            }
            sx={{ m: 0 }}
          />
        </Box> */}
      </Box>
    </Box>
  );
};

export default FloorplanView;
