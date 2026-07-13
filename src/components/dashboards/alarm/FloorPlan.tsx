import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Tooltip,
  lighten,
  darken,
} from '@mui/material';
import {
  IconPlus,
  IconMinus,
  IconArrowsMinimize,
  IconMaximize,
  IconMapPin,
} from '@tabler/icons-react';
import { Stage, Layer, Image as KonvaImage, Text, Group, Circle, Line } from 'react-konva';
import Konva from 'konva';
import SiteSelector from 'src/components/dashboards/monitoring/monitoringcomponents/mainview/SiteSelector';
import { useDeviceMappingList } from 'src/hooks/useDeviceMapping';
import { useAreaList } from 'src/hooks/useArea';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const getMarkerColor = (type: string, status: string) => {
  if (status?.toLowerCase() === 'alarm' || status?.toLowerCase() === 'active') {
    return '#EF4444';
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
  return '#94A3B8';
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
  return 'OTH';
};

const legendItems = [
  { label: 'Motion Sensor', type: 'MotionSensor' },
  { label: 'Door Sensor', type: 'DoorSensor' },
  { label: 'Glass Break', type: 'GlassBreakSensor' },
  { label: 'Beam Sensor', type: 'BeamSensor' },
  { label: 'Vibration', type: 'VibrationSensor' },
  { label: 'CCTV', type: 'CctvCamera' },
  { label: 'Door Lock', type: 'DoorLock' },
  { label: 'Siren', type: 'Siren' },
  { label: 'Strobe', type: 'StrobeLight' },
  { label: 'Panic', type: 'PanicButton' },
  { label: 'Other', type: 'Other' },
];

const FloorPlan = () => {
  const navigate = useNavigate();
  const [showSiteSelector, setShowSiteSelector] = useState(false);
  const [selectedFloorplan, setSelectedFloorplan] = useState<FloorplanType | null>(null);

  const handleGoToMonitor = () => {
    navigate('/dashboards/monitoring', {
      state: { floorplanId: selectedFloorplan?.id },
    });
  };

  // Fetch site, floor, and floorplan lists to auto-select the first floor of the first site
  const { data: siteResponse } = useSiteLookup();
  const { data: floorResponse } = useFloorList();
  const { data: floorplanResponse } = useFloorplanList();

  useEffect(() => {
    if (selectedFloorplan) return;

    const sites = siteResponse?.data || [];
    const floorData = floorResponse?.data || [];
    const floorplanData = floorplanResponse?.data || [];

    if (sites.length > 0 && floorData.length > 0 && floorplanData.length > 0) {
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
    selectedFloorplan?.id ? filter : undefined,
  );
  const mappings = selectedFloorplan ? (mappingResponse?.data || []) : [];

  const { data: areaResponse } = useAreaList(
    selectedFloorplan?.id
      ? {
          page: 1,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc' as const,
          floorplanId: selectedFloorplan.id,
        }
      : undefined,
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
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            FLOORPLAN
          </Typography>
          <Typography sx={{ color: '#94A3B8', fontSize: 11, mt: 0.25 }}>
            {selectedFloorplan
              ? `${selectedFloorplan.siteName} - ${selectedFloorplan.buildingName} - ${selectedFloorplan.floorName} - ${selectedFloorplan.name}`
              : 'Silakan Pilih Layout / Floorplan'}
          </Typography>
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
          minHeight: 200,
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
                    area.areaNodes?.flatMap((node: any) => [
                      node.x_px * fitScale,
                      node.y_px * fitScale,
                    ]) || [];
                  const color = area.colorArea || '#FF4D4F';

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
                            (area.areaNodes.reduce((acc: number, curr: any) => acc + curr.x_px, 0) /
                              area.areaNodes.length) *
                              fitScale -
                            50
                          }
                          y={
                            (area.areaNodes.reduce((acc: number, curr: any) => acc + curr.y_px, 0) /
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
                const isAlarm =
                  (mapping.deviceStatus || '').toLowerCase().includes('alarm') ||
                  (mapping.deviceStatus || '').toLowerCase().includes('active');

                return (
                  <Group key={mapping.id} x={x} y={y}>
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

                    {/* Main Dot */}
                    <Circle
                      radius={11}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      shadowColor="rgba(0,0,0,0.4)"
                      shadowBlur={4}
                      shadowOffset={{ x: 0, y: 2 }}
                    />

                    {/* Initials Text inside Dot */}
                    <Text
                      text={getDeviceInitials(mapping.deviceType)}
                      x={-15}
                      y={-4}
                      width={30}
                      fontSize={8}
                      fontStyle="bold"
                      fill="#ffffff"
                      align="center"
                    />

                    {/* Label below marker */}
                    {(mapping.label || mapping.deviceName) && (
                      <Text
                        text={mapping.label || mapping.deviceName || ''}
                        x={-40}
                        y={14}
                        width={80}
                        fontSize={9}
                        fontStyle="bold"
                        fill="#E2E8F0"
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
            <Tooltip title="Go to Monitor">
              <IconButton
                size="small"
                onClick={handleGoToMonitor}
                sx={{
                  bgcolor: 'rgba(17,24,39,0.85)',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255,255,255,0.1)',
                  width: 30,
                  height: 30,
                  '&:hover': { bgcolor: 'rgba(17,24,39,0.95)' },
                }}
              >
                <IconMapPin size={14} />
              </IconButton>
            </Tooltip>
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
          gap: 1.5,
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
                gap: 0.5,
                flexShrink: 0,
              }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 16,
                  bgcolor: color,
                  color: '#fff',
                  fontSize: 7.5,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }}
              >
                {initials}
              </Box>
              <Typography
                sx={{
                  color: '#94A3B8',
                  fontSize: 10,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
};

export default FloorPlan;