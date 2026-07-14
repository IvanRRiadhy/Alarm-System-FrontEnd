import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  lighten,
  darken,
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
} from '@tabler/icons-react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group, Circle, Line } from 'react-konva';
import Konva from 'konva';
import SiteSelector from './SiteSelector';
import { useLocation } from 'react-router';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import { useAreaList } from 'src/hooks/useArea';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import { AppDispatch, useDispatch, useSelector, RootState } from 'src/store/Store';
import { useSiteList } from 'src/hooks/useSite';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';

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
  if (t.includes('beamsensor')) return '#06B6D4';
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
  if (t.includes('beamsensor')) return 'BEM';
  if (t.includes('vibrationsensor')) return 'VIB';
  if (t.includes('cctvcamera')) return 'CAM';
  if (t.includes('doorlock')) return 'LCK';
  if (t.includes('siren')) return 'SRN';
  if (t.includes('strobelight')) return 'STB';
  if (t.includes('panicbutton')) return 'PAN';
  return 'OTH'; // Other
};

const legendItems = [
  { label: 'Motion Sensor', type: 'MotionSensor' },
  { label: 'Door Sensor', type: 'DoorSensor' },
  { label: 'Glass Break Sensor', type: 'GlassBreakSensor' },
  { label: 'Beam Sensor', type: 'BeamSensor' },
  { label: 'Vibration Sensor', type: 'VibrationSensor' },
  { label: 'CCTV Camera', type: 'CctvCamera' },
  { label: 'Door Lock', type: 'DoorLock' },
  { label: 'Siren', type: 'Siren' },
  { label: 'Strobe Light', type: 'StrobeLight' },
  { label: 'Panic Button', type: 'PanicButton' },
  { label: 'Other', type: 'Other' },
];

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

  useEffect(() => {
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
  }, []);

  const getActiveAlarm = (mappingId: string, deviceId: string | null) => {
    if (!alarmEvents || alarmEvents.length === 0) return undefined;
    
    const deviceEvents = alarmEvents.filter(
      (evt) => (deviceId && evt.deviceId === deviceId) || evt.deviceId === mappingId
    );
    
    if (deviceEvents.length === 0) return undefined;
    
    const newestEvent = deviceEvents.reduce((latest, current) => {
      const latestTime = latest.createdAt ? new Date(latest.createdAt).getTime() : 0;
      const currentTime = current.createdAt ? new Date(current.createdAt).getTime() : 0;
      return currentTime > latestTime ? current : latest;
    }, deviceEvents[0]);
    
    if (newestEvent && newestEvent.statusAlarm?.toLowerCase() === 'on') {
      return newestEvent;
    }
    
    return undefined;
  };

  const getSeverityColor = (severity?: string) => {
    const s = (severity || '').toLowerCase();
    if (s === 'low') return '#EAB308';
    if (s === 'medium') return '# ';
    if (s === 'high') return '#EF4444';
    if (s === 'critical') return '#991B1B';
    return '#EF4444';
  };
  const location = useLocation();
  const [showSiteSelector, setShowSiteSelector] = useState(true);
  const [modeEdit, setModeEdit] = useState(false);
  const [localSelectedFloorplan, setLocalSelectedFloorplan] = useState<FloorplanType | null>(null);
  const selectedFloorplan = propSelectedFloorplan !== undefined ? propSelectedFloorplan : localSelectedFloorplan;
  const setSelectedFloorplan = (fp: FloorplanType | null) => {
    if (onSelectFloorplan) {
      onSelectFloorplan(fp);
    } else {
      setLocalSelectedFloorplan(fp);
    }
  };

  // Fetch site, floor, and floorplan lists to auto-select the first floor of the first site
  const { data: siteResponse } = useSiteList({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const { data: floorResponse } = useFloorList();
  const { data: floorplanResponse } = useFloorplanList();

  useEffect(() => {
    if (selectedFloorplan) return;

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
            MAIN VIEW - FLOORPLAN
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: 12 }}>
              {selectedFloorplan
                ? `${selectedFloorplan.siteName} - ${selectedFloorplan.buildingName} - ${selectedFloorplan.floorName} - ${selectedFloorplan.name}`
                : 'Silakan Pilih Layout / Floorplan'}
            </Typography>
          </Box>
        </Box>

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

      {/* Floorplan Area */}
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {image ? (
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
            {areas.length > 0 && (
              <Layer>
                {areas.map((area) => {
                  const fitScale = baseSize.width / image.width;
                  const points =
                    area.areaNodes?.flatMap((node) => [
                      node.x_px * fitScale,
                      node.y_px * fitScale,
                    ]) || [];
                  const color = area.colorArea || '#FF4D4F';
                    // console.log("Areas", areas)
                  return (
                    <Group key={area.id}>
                      <Line
                        points={points}
                        stroke={darken(color, 0.4)}
                        strokeWidth={2}
                        lineJoin="round"
                        lineCap="round"
                        closed
                        fill={lighten(color, 0.75)}
                        opacity={0.55}
                      />
                      {/* Area Name Text */}
                      {area.areaNodes && area.areaNodes.length > 0 && (
                        <Text
                          text={area.name}
                          x={
                            (area.areaNodes.reduce((acc, curr) => acc + curr.x_px, 0) /
                              area.areaNodes.length) *
                              fitScale -
                            50
                          }
                          y={
                            (area.areaNodes.reduce((acc, curr) => acc + curr.y_px, 0) /
                              area.areaNodes.length) *
                              fitScale -
                            6
                          }
                          width={100}
                          align="center"
                          fontSize={10}
                          fontStyle="bold"
                          fill={darken(color, 0.5)}
                        />
                      )}
                    </Group>
                  );
                })}
              </Layer>
            )}

            {/* Device markers layer */}
            <Layer>
              {mappings.map((mapping) => {
                const x = (mapping.posPxX / 100) * baseSize.width;
                const y = (mapping.posPxY / 100) * baseSize.height;
                const color = getMarkerColor(mapping.deviceType, mapping.deviceStatus);
                const isAlarm = (mapping.deviceStatus || '').toLowerCase().includes('alarm') ||
                                (mapping.deviceStatus || '').toLowerCase().includes('active');
                const isSelected = selectedDeviceId === mapping.id;
                const activeAlarm = getActiveAlarm(mapping.id, mapping.deviceId);
                const isBlinking = !!activeAlarm;
                const blinkColor = activeAlarm ? getSeverityColor(activeAlarm.severity) : '#EF4444';
                // if(isBlinking) console.log("ActiveAlarm: ", activeAlarm)
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
                    {isBlinking && (
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

                    {/* Initials Text inside Dot */}
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

                    {/* Label below marker */}
                    {(mapping.label || mapping.deviceName) && (
                      <Text
                        text={mapping.label || mapping.deviceName || ''}
                        x={-40}
                        y={isSelected ? 17 : 14}
                        width={80}
                        fontSize={isSelected ? 10.5 : 9}
                        fontStyle="bold"
                        fill={isSelected ? "#60A5FA" : "#E2E8F0"}
                        align="center"
                        scaleX={1 / stageScale}
                        scaleY={1 / stageScale}
                      />
                    )}
                  </Group>
                );
              })}
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
        {image && (
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
          gap: 2,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          bgcolor: '#111827',
          flexShrink: 0,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {legendItems.map((item) => {
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
        })}

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
