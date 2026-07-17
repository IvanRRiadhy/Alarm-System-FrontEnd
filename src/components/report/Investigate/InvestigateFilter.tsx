import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Grid2 as Grid,
  Typography,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { isEqual } from 'lodash';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { UpdateFilter } from 'src/store/apps/report/investigate';
import { defaultDeviceFilter } from 'src/store/apps/defaultForm';
import { useSiteLookup } from 'src/hooks/useSite';
import { useBuildingList } from 'src/hooks/useBuilding';
import { useFloorList } from 'src/hooks/useFloor';
import { useFloorplanList } from 'src/hooks/useFloorplan';
import { useAreaList } from 'src/hooks/useArea';
import { useDeviceList } from 'src/hooks/useDevice';
import { useControllerList } from 'src/hooks/useController';
import { usePersonnelList } from 'src/hooks/usePersonnel';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import AreaHierarchySelector, { SelectedNode } from 'src/components/shared/AreaHierarchySelector';

const severityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const statusOptions = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'noAction', label: 'No Action' },
  { value: 'doneInvestigated', label: 'Done Investigated' },
  { value: 'done', label: 'Done' },
];

const isClearedOptions = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Cleared' },
  { value: 'false', label: 'Uncleared' },
];

const hasInvestigationOptions = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const InvestigateFilter = () => {
  const dispatch = useDispatch();

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

  const { data: personnelResponse } = usePersonnelList({ page: 1, limit: 1000 });
  const personnelList = personnelResponse?.data || [];

  const investigateFilter = useSelector((state: RootState) => state.InvestigateReducer.investigateFilter);

  // Local filter copy
  const [appliedFilter, setAppliedFilter] = useState(investigateFilter);
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);

  // Sync state with store
  useEffect(() => {
    setAppliedFilter(investigateFilter);

    // Resolve initial SelectedNode for AreaHierarchySelector
    if (investigateFilter.areaId) {
      const area = areaList.find((a) => a.id === investigateFilter.areaId);
      if (area) setSelectedNode({ type: 'area', data: area });
    } else if (investigateFilter.floorplanId) {
      const fp = floorplanList.find((f) => f.id === investigateFilter.floorplanId);
      if (fp) setSelectedNode({ type: 'floorplan', data: fp });
    } else if (investigateFilter.floorId) {
      const floor = floorList.find((f) => f.id === investigateFilter.floorId);
      if (floor) setSelectedNode({ type: 'floor', data: floor });
    } else if (investigateFilter.buildingId) {
      const building = buildingList.find((b) => b.id === investigateFilter.buildingId);
      if (building) setSelectedNode({ type: 'building', data: building });
    } else {
      setSelectedNode(null);
    }
  }, [investigateFilter, buildingList, floorList, floorplanList, areaList]);

  const handleSiteChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      siteId: val?.id ?? undefined,
    }));
  };

  const handleHierarchyChange = (val: SelectedNode) => {
    setSelectedNode(val);
    setAppliedFilter((prev) => {
      const next = {
        ...prev,
        buildingId: undefined,
        floorId: undefined,
        floorplanId: undefined,
        areaId: undefined,
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
      deviceId: val?.id ?? undefined,
    }));
  };

  const handleControllerChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      controllerId: val?.id ?? undefined,
    }));
  };

  const handleSeverityChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      severity: val?.value ?? undefined,
    }));
  };

  const handlePersonnelChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      personnelId: val?.id ?? undefined,
    }));
  };

  const handleStatusChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      investigationStatus: val?.value ?? undefined,
    }));
  };

  const handleClearedChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      isCleared: val?.value === 'true' ? true : val?.value === 'false' ? false : undefined,
    }));
  };

  const handleHasInvestigationChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      HasInvestigation: val?.value === 'true' ? true : val?.value === 'false' ? false : undefined,
    }));
  };

  const handleApply = () => {
    dispatch(UpdateFilter({ ...appliedFilter, page: 1 }));
  };

  const handleReset = () => {
    const defaultFilter = {
      page: 1,
      limit: 10,
      search: investigateFilter.search,
      sortBy: investigateFilter.sortBy,
      sortOrder: investigateFilter.sortOrder,
      startDate: investigateFilter.startDate,
      endDate: investigateFilter.endDate,
      timeRange: investigateFilter.timeRange,
    };
    setAppliedFilter(defaultFilter);
    setSelectedNode(null);
    dispatch(UpdateFilter(defaultFilter));
  };

  const filteredBuildings = appliedFilter.siteId
    ? buildingList.filter((b) => b.siteId === appliedFilter.siteId)
    : buildingList;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }} variant="outlined">
      {/* Sticky Header */}
      <Box sx={{ p: 3, pb: 1 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Filters
        </Typography>
        <Divider />
      </Box>

      {/* Scrollable Fields */}
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <Scrollbar sx={{ height: '100%' }}>
          <Box sx={{ px: 3, pb: 3 }}>
            <Grid container spacing={2}>
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

              {/* Area Hierarchy */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Area / Building / Floor</CustomFormLabel>
                <AreaHierarchySelector
                  buildings={filteredBuildings}
                  floors={floorList}
                  floorplans={floorplanList}
                  maskedAreas={areaList}
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
                  options={deviceList}
                  value={deviceList.find((d) => d.id === appliedFilter.deviceId) || null}
                  onChange={handleDeviceChange}
                  getOptionLabel={(o) =>  o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                />
              </Grid>

              {/* Controller */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Controller</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Controller"
                  options={controllerList}
                  value={controllerList.find((c) => c.id === appliedFilter.controllerId) || null}
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

              {/* Personnel */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Personnel</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Personnel"
                  options={personnelList}
                  value={personnelList.find((p) => p.id === appliedFilter.personnelId) || null}
                  onChange={handlePersonnelChange}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                />
              </Grid>

              {/* Status */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Investigation Status</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Status"
                  options={statusOptions}
                  value={statusOptions.find((s) => s.value === appliedFilter.investigationStatus) || null}
                  onChange={handleStatusChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>

              {/* Cleared */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Cleared Status</CustomFormLabel>
                <CustomAutocomplete
                  label="Cleared"
                  options={isClearedOptions}
                  value={isClearedOptions.find((o) => o.value === (appliedFilter.isCleared === undefined ? 'all' : String(appliedFilter.isCleared))) || null}
                  onChange={handleClearedChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>

              {/* Has Investigation */}
              <Grid size={12}>
                <CustomFormLabel sx={{ mt: 1 }}>Has Investigation</CustomFormLabel>
                <CustomAutocomplete
                  label="Has Investigation"
                  options={hasInvestigationOptions}
                  value={hasInvestigationOptions.find((o) => o.value === (appliedFilter.HasInvestigation === undefined ? 'all' : String(appliedFilter.HasInvestigation))) || null}
                  onChange={handleHasInvestigationChange}
                  getOptionLabel={(o) => o.label}
                  isOptionEqualToValue={(a, b) => a.value === b.value}
                />
              </Grid>
            </Grid>
          </Box>
        </Scrollbar>
      </Box>

      {/* Sticky Footer */}
      <Box sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" color="error" fullWidth onClick={handleReset}>
            Reset
          </Button>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleApply}
            disabled={isEqual(appliedFilter, investigateFilter)}
          >
            Apply
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default InvestigateFilter;
