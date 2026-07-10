import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  CircularProgress,
} from '@mui/material';
import {
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconBuildingSkyscraper,
  IconBuilding,
  IconStack2,
  IconMap,
} from '@tabler/icons-react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import { useBuildingList } from 'src/hooks/useBuilding';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useDeviceMappingList, useEditDeviceMapping } from 'src/hooks/useDeviceMapping';
import { FloorplanType } from 'src/store/apps/crud/floorplan';
import { DeviceMappingType } from 'src/store/apps/crud/deviceMapping';
import toast from 'react-hot-toast';
import { toastError } from 'src/utils/errors';

interface MapDeviceDialogProps {
  open: boolean;
  onClose: () => void;
  device: any; // the device being mapped
}

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const MapDeviceDialog: React.FC<MapDeviceDialogProps> = ({ open, onClose, device }) => {
  const [selectedFloorplan, setSelectedFloorplan] = useState<FloorplanType | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<DeviceMappingType | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Tree expansion states
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  // Fetch Hierarchy Data
  const { data: siteResponse } = useSiteLookup();
  const sites = siteResponse?.data || [];
  const { data: buildingResponse } = useBuildingList();
  const buildings = buildingResponse?.data || [];
  const { data: floorResponse } = useFloorList();
  const floors = floorResponse?.data || [];
  const { data: floorplanResponse } = useFloorplanList();
  const floorplans = floorplanResponse?.data || [];

  // Fetch device mappings for the selected floorplan
  const { data: mappingResponse, isLoading: isLoadingMappings } = useDeviceMappingList({
    page: 1,
    limit: 100,
    sortBy: '',
    sortOrder: 'asc',
    floorplanId: selectedFloorplan?.id || 'none',
  });
  const mappings = mappingResponse?.data || [];

  const editMutation = useEditDeviceMapping();

  // Reset selected mapping when floorplan changes
  useEffect(() => {
    setSelectedMapping(null);
  }, [selectedFloorplan]);

  // Handle tree toggles
  const handleToggleSite = (siteId: string) => {
    setExpandedSites((prev) => ({ ...prev, [siteId]: !prev[siteId] }));
  };
  const handleToggleBuilding = (bId: string) => {
    setExpandedBuildings((prev) => ({ ...prev, [bId]: !prev[bId] }));
  };
  const handleToggleFloor = (fId: string) => {
    setExpandedFloors((prev) => ({ ...prev, [fId]: !prev[fId] }));
  };

  const handleConfirmMapping = () => {
    if (!selectedMapping) return;

    editMutation.mutate(
      {
        id: selectedMapping.id,
        deviceId: device.id,
        label: selectedMapping.label || device.name,
      },
      {
        onSuccess: () => {
          toast.success('Device mapped successfully!');
          setConfirmOpen(false);
          onClose();
        },
        onError: (error) => {
          toastError(error, 'Failed to map device.');
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'between', py: 2 }}>
        <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
          Map Device: {device?.name}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', height: '65vh', p: 0, borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        {/* Left Side: Tree Hierarchy Selector */}
        <Box sx={{ width: 300, minWidth: 300, borderRight: '1px solid rgba(0,0,0,0.08)', overflowY: 'auto', p: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" mb={1} px={1}>
            Select Floorplan
          </Typography>
          <List disablePadding>
            {sites.map((site) => {
              const isSiteExpanded = !!expandedSites[site.id];
              const siteBuildings = buildings.filter((b) => b.siteId === site.id);

              return (
                <React.Fragment key={site.id}>
                  <ListItemButton onClick={() => handleToggleSite(site.id)} sx={{ py: 0.5, borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}>
                      {isSiteExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'primary.main' }}>
                      <IconBuildingSkyscraper size={16} />
                    </Box>
                    <ListItemText primary={site.name} primaryTypographyProps={{ sx: { fontSize: 13, fontWeight: 600 } }} />
                  </ListItemButton>

                  <Collapse in={isSiteExpanded}>
                    <List disablePadding sx={{ pl: 2 }}>
                      {siteBuildings.map((building) => {
                        const isBuildingExpanded = !!expandedBuildings[building.id];
                        const buildingFloors = floors.filter((f) => f.buildingId === building.id);

                        return (
                          <React.Fragment key={building.id}>
                            <ListItemButton onClick={() => handleToggleBuilding(building.id)} sx={{ py: 0.5, borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}>
                                {isBuildingExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'success.main' }}>
                                <IconBuilding size={15} />
                              </Box>
                              <ListItemText primary={building.name} primaryTypographyProps={{ sx: { fontSize: 12.5, fontWeight: 550 } }} />
                            </ListItemButton>

                            <Collapse in={isBuildingExpanded}>
                              <List disablePadding sx={{ pl: 2 }}>
                                {buildingFloors.map((floor) => {
                                  const isFloorExpanded = !!expandedFloors[floor.id];
                                  const floorplanList = floorplans.filter((fp) => fp.floorId === floor.id);

                                  return (
                                    <React.Fragment key={floor.id}>
                                      <ListItemButton onClick={() => handleToggleFloor(floor.id)} sx={{ py: 0.5, borderRadius: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: 'text.secondary' }}>
                                          {isFloorExpanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'warning.main' }}>
                                          <IconStack2 size={14} />
                                        </Box>
                                        <ListItemText primary={floor.name} primaryTypographyProps={{ sx: { fontSize: 12, fontWeight: 500 } }} />
                                      </ListItemButton>

                                      <Collapse in={isFloorExpanded}>
                                        <List disablePadding sx={{ pl: 2 }}>
                                          {floorplanList.map((fp) => {
                                            const isSelected = selectedFloorplan?.id === fp.id;
                                            return (
                                              <ListItemButton
                                                key={fp.id}
                                                onClick={() => setSelectedFloorplan(fp)}
                                                selected={isSelected}
                                                sx={{ py: 0.4, px: 1.5, borderRadius: 1, mb: 0.25 }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                                                  <IconMap size={13} />
                                                </Box>
                                                <ListItemText primary={fp.name} primaryTypographyProps={{ sx: { fontSize: 11.5, fontWeight: isSelected ? 600 : 400 } }} />
                                              </ListItemButton>
                                            );
                                          })}
                                        </List>
                                      </Collapse>
                                    </React.Fragment>
                                  );
                                })}
                              </List>
                            </Collapse>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Collapse>
                </React.Fragment>
              );
            })}
          </List>
        </Box>

        {/* Right Side: Floorplan Canvas View */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', bgcolor: 'action.hover', position: 'relative' }}>
          {selectedFloorplan ? (
            <FloorplanMapCanvas
              imageUrl={getCdnUrl(selectedFloorplan.imageUrl)}
              mappings={mappings}
              selectedMappingId={selectedMapping?.id || null}
              onSelectMapping={setSelectedMapping}
              isLoading={isLoadingMappings}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <Typography color="text.secondary">Select a floorplan to begin mapping</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => setConfirmOpen(true)}
          color="primary"
          variant="contained"
          disabled={!selectedMapping}
        >
          Map Device
        </Button>
      </DialogActions>

      {/* Are you sure confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Device Mapping</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to map <strong>{device?.name}</strong> to the position <strong>{selectedMapping?.label || 'Unnamed Mapping'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmMapping} color="primary" variant="contained" disabled={editMutation.isPending}>
            {editMutation.isPending ? 'Mapping...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

/* INNER CANVAS COMPONENT */
interface FloorplanMapCanvasProps {
  imageUrl: string;
  mappings: DeviceMappingType[];
  selectedMappingId: string | null;
  onSelectMapping: (mapping: DeviceMappingType) => void;
  isLoading: boolean;
}

const FloorplanMapCanvas: React.FC<FloorplanMapCanvasProps> = ({
  imageUrl,
  mappings,
  selectedMappingId,
  onSelectMapping,
  isLoading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [image] = useImage(imageUrl);
  const [containerSize, setContainerSize] = useState({ width: 500, height: 400 });
  const [baseSize, setBaseSize] = useState({ width: 500, height: 400 });
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Update bounds on resize/image load
  useEffect(() => {
    if (!containerRef.current || !image) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    setContainerSize({ width, height });

    const imgRatio = image.width / image.height;
    const containerRatio = width / height;

    let baseW = width;
    let baseH = height;

    if (containerRatio > imgRatio) {
      baseW = height * imgRatio;
    } else {
      baseH = width / imgRatio;
    }

    setBaseSize({ width: baseW, height: baseH });
    setStageScale(1);
    setStagePos({ x: (width - baseW) / 2, y: (height - baseH) / 2 });
  }, [image]);

  const handleWheel = (e: any) => {
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
  };

  if (isLoading || !image) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <CircularProgress size={30} />
        <Typography variant="caption" sx={{ mt: 1 }} color="text.secondary">
          Loading layout...
        </Typography>
      </Box>
    );
  }

  return (
    <Box ref={containerRef} sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      <Stage
        width={containerSize.width}
        height={containerSize.height}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable
        onWheel={handleWheel}
        onDragEnd={(e) => {
          if (e.target.getClassName() === 'Stage') {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          <KonvaImage image={image} width={baseSize.width} height={baseSize.height} />
        </Layer>
        <Layer>
          {mappings.map((mapping) => {
            const hasDevice = !!mapping.deviceId;
            const isSelected = selectedMappingId === mapping.id;
            const x = (mapping.posPxX / 100) * baseSize.width;
            const y = (mapping.posPxY / 100) * baseSize.height;

            // Colors depending on assignment
            const markerColor = hasDevice ? '#94A3B8' : (isSelected ? '#3B82F6' : '#10B981');
            const outlineColor = hasDevice ? '#64748B' : (isSelected ? '#2563EB' : '#059669');

            return (
              <Group
                key={mapping.id}
                x={x}
                y={y}
                onClick={() => {
                  if (hasDevice) return; // Assigned markers are not clickable
                  onSelectMapping(mapping);
                }}
                listening={!hasDevice}
                style={{ cursor: hasDevice ? 'default' : 'pointer' }}
              >
                {/* Selection Ring */}
                {isSelected && (
                  <Rect
                    x={-20}
                    y={-20}
                    width={40}
                    height={40}
                    stroke="#2563EB"
                    strokeWidth={2}
                    cornerRadius={6}
                    dash={[4, 4]}
                  />
                )}
                {/* Marker Rect */}
                <Rect
                  x={-14}
                  y={-14}
                  width={28}
                  height={28}
                  fill={markerColor}
                  stroke={outlineColor}
                  strokeWidth={2}
                  cornerRadius={6}
                  opacity={hasDevice ? 0.45 : 1}
                  shadowColor="rgba(0,0,0,0.15)"
                  shadowBlur={4}
                />
                {/* Acronym / Label */}
                <Text
                  text={mapping.label?.substring(0, 3) || 'M'}
                  x={-14}
                  y={-5}
                  width={28}
                  align="center"
                  fontSize={9}
                  fontStyle="bold"
                  fill="#ffffff"
                  opacity={hasDevice ? 0.5 : 1}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </Box>
  );
};

export default MapDeviceDialog;
