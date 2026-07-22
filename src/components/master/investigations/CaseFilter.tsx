import {
  Box,
  Button,
  Drawer,
  Grid2 as Grid,
  Typography,
} from '@mui/material';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import { SetAlarmCaseFilter, defaultAlarmCaseFilter } from 'src/store/apps/crud/alarmCase';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { useSiteLookup } from 'src/hooks/useSite';
import { useBuildingList } from 'src/hooks/useBuilding';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useAreaList } from 'src/hooks/useArea';
import { useDeviceList } from 'src/hooks/useDevice';
import { useControllerList } from 'src/hooks/useController';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import AreaHierarchySelector, { SelectedNode } from 'src/components/shared/AreaHierarchySelector';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const clearedOptions = [
  { value: 'true', label: 'Cleared' },
  { value: 'false', label: 'Uncleared' },
];

const typeOptions = [
  { value: 'Other', label: 'Other' },
  { value: 'MotionSensor', label: 'Motion Sensor' },
  { value: 'DoorSensor', label: 'Door Sensor' },
  { value: 'GlassBreakSensor', label: 'Glass Break Sensor' },
  { value: 'VibrationSensor', label: 'Vibration Sensor' },
  { value: 'CctvCamera', label: 'CCTV (Camera)' },
  { value: 'DoorLock', label: 'Door Lock' },
  { value: 'Siren', label: 'Siren' },
  { value: 'StrobeLight', label: 'Strobe Light' },
  { value: 'PanicButton', label: 'Panic Button' },
];

const CaseFilter = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  // Load select options using hooks
  const { data: siteResponse } = useSiteLookup();
  const siteList = siteResponse?.data || [];

  const { data: buildingResponse } = useBuildingList({ page: 1, limit: 1000 });
  const buildingList = buildingResponse?.data || [];

  const { data: floorResponse } = useFloorList({ page: 1, limit: 1000 });
  const floorList = floorResponse?.data || [];

  const { data: floorplanResponse } = useFloorplanList({ page: 1, limit: 1000 });
  const floorplanList = floorplanResponse?.data || [];

  const { data: areaResponse } = useAreaList({ page: 1, limit: 1000 });
  const areaList = areaResponse?.data || [];

  const { data: deviceResponse } = useDeviceList({ page: 1, limit: 1000 });
  const deviceList = deviceResponse?.data || [];

  const { data: controllerResponse } = useControllerList({ page: 1, limit: 1000 });
  const controllerList = controllerResponse?.data || [];

  const alarmCaseFilter = useSelector((state: RootState) => state.alarmCaseReducer.alarmCaseFilter);

  // Local filter copy
  const [appliedFilter, setAppliedFilter] = useState(alarmCaseFilter);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);

  // Sync state with store
  useEffect(() => {
    setAppliedFilter(alarmCaseFilter);

    // Resolve initial SelectedNode for AreaHierarchySelector
    if (alarmCaseFilter.areaId) {
      const area = areaList.find((a) => a.id === alarmCaseFilter.areaId);
      if (area) setSelectedNode({ type: 'area', data: area });
    } else if (alarmCaseFilter.floorplanId) {
      const fp = floorplanList.find((f) => f.id === alarmCaseFilter.floorplanId);
      if (fp) setSelectedNode({ type: 'floorplan', data: fp });
    } else if (alarmCaseFilter.floorId) {
      const floor = floorList.find((f) => f.id === alarmCaseFilter.floorId);
      if (floor) setSelectedNode({ type: 'floor', data: floor });
    } else if (alarmCaseFilter.buildingId) {
      const building = buildingList.find((b) => b.id === alarmCaseFilter.buildingId);
      if (building) setSelectedNode({ type: 'building', data: building });
    } else {
      setSelectedNode(null);
    }
  }, [alarmCaseFilter, buildingList, floorList, floorplanList, areaList]);

  // --- Drawer Controls ---
  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // --- Change Handlers ---
  const handleSiteChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      siteId: val?.id ?? null,
      buildingId: null,
      floorId: null,
      floorplanId: null,
      areaId: null,
      deviceId: null,
      controllerId: null,
    }));
    setSelectedNode(null);
  };

  const handleHierarchyChange = (val: SelectedNode) => {
    setSelectedNode(val);
    setAppliedFilter((prev) => {
      const next = {
        ...prev,
        buildingId: null,
        floorId: null,
        floorplanId: null,
        areaId: null,
      };
      if (val) {
        if (val.type === 'building') next.buildingId = val.data.id;
        if (val.type === 'floor') next.floorId = val.data.id;
        if (val.type === 'floorplan') next.floorplanId = val.data.id;
        if (val.type === 'area') next.areaId = val.data.id;
      }
      return next;
    });
  };

  const handleDeviceChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      deviceId: val?.id ?? null,
    }));
  };

  const handleControllerChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      controllerId: val?.id ?? null,
    }));
  };

  const handleSeverityChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      severity: val?.value ?? null,
    }));
  };

  const handleClearedChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      isCleared: val?.value ?? null,
    }));
  };

  const handleDeviceTypeChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      deviceType: val?.value ?? null,
    }));
  };

  // --- Apply & Reset ---
  const handleApply = () => {
    dispatch(SetAlarmCaseFilter({ ...appliedFilter, page: 1 }));
    setOpen(false);
  };

  const handleReset = () => {
    setAppliedFilter(defaultAlarmCaseFilter);
    setSelectedNode(null);
    dispatch(SetAlarmCaseFilter({ ...defaultAlarmCaseFilter }));
    setOpen(false);
  };

  // --- Filter Options based on selected Site ---
  const filteredBuildings = appliedFilter.siteId
    ? buildingList.filter((b) => b.siteId === appliedFilter.siteId)
    : buildingList;

  const filteredFloors = appliedFilter.siteId
    ? floorList.filter((f) => f.siteId === appliedFilter.siteId)
    : floorList;

  const filteredFloorplans = appliedFilter.siteId
    ? floorplanList.filter((fp) => fp.siteId === appliedFilter.siteId)
    : floorplanList;

  const filteredAreas = appliedFilter.siteId
    ? areaList.filter((a) => a.siteId === appliedFilter.siteId)
    : areaList;

  const filteredDevices = appliedFilter.siteId
    ? deviceList.filter((d) => d.siteId === appliedFilter.siteId)
    : deviceList;

  const filteredControllers = appliedFilter.siteId
    ? controllerList.filter((c) => c.siteId === appliedFilter.siteId)
    : controllerList;

  return (
    <>
      {/* Filter Button */}
      <Button
        onClick={handleClickOpen}
        size="medium"
        variant="outlined"
        startIcon={<IconAdjustmentsHorizontal />}
        color="info"
        sx={{ height: 36, mx: 2 }}
      >
        <Typography variant="caption" fontSize={'0.7rem'}>
          Filter
        </Typography>
      </Button>

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 320,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 3, pb: 1 }}>
          <Typography variant="h4" gutterBottom sx={{ borderBottom: 5, borderColor: 'primary.main', pb: 1 }}>
            Case Filter
          </Typography>
        </Box>

        {/* Form Fields (Scrollable) */}
        <Box sx={{ flexGrow: 1, minHeight: 0, px: 3 }}>
          <Scrollbar sx={{ height: '100%' }}>
            <Grid container spacing={3} sx={{ pb: 3 }}>
              {/* Site */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Site</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Site"
                  options={siteList}
                  value={siteList.find((s) => s.id === appliedFilter.siteId) || null}
                  onChange={handleSiteChange}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                />
              </Grid>

              {/* Area Hierarchy Selector */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Location</CustomFormLabel>
                <AreaHierarchySelector
                  buildings={filteredBuildings}
                  floors={filteredFloors}
                  floorplans={filteredFloorplans}
                  maskedAreas={filteredAreas}
                  value={selectedNode}
                  onChange={handleHierarchyChange}
                  label="Select Location"
                />
              </Grid>

              {/* Device */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Device</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Device"
                  options={filteredDevices}
                  value={filteredDevices.find((d) => d.id === appliedFilter.deviceId) || null}
                  onChange={handleDeviceChange}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                />
              </Grid>

              {/* Controller */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Controller</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Controller"
                  options={filteredControllers}
                  value={filteredControllers.find((c) => c.id === appliedFilter.controllerId) || null}
                  onChange={handleControllerChange}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                />
              </Grid>

              {/* Severity */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Severity</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Severity"
                  options={severityOptions}
                  value={severityOptions.find((s) => s.value === appliedFilter.severity) || null}
                  onChange={handleSeverityChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>

              {/* Cleared Status */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Cleared Status</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Cleared"
                  options={clearedOptions}
                  value={clearedOptions.find((o) => o.value === appliedFilter.isCleared) || null}
                  onChange={handleClearedChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>

              {/* Device Type */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Device Type</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Device Type"
                  options={typeOptions}
                  value={typeOptions.find((o) => o.value === appliedFilter.deviceType) || null}
                  onChange={handleDeviceTypeChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>
            </Grid>
          </Scrollbar>
        </Box>

        {/* Footer (Sticky) */}
        <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Grid container justifyContent="space-between">
            <Grid size={3}>
              <Button variant="outlined" color="error" fullWidth onClick={handleReset}>
                Reset
              </Button>
            </Grid>
            <Grid size={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleApply}
                disabled={isEqual(appliedFilter, alarmCaseFilter)}
              >
                Apply
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Drawer>
    </>
  );
};

export default CaseFilter;
