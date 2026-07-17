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
import { UpdateFilter } from 'src/store/apps/crud/floorplan';
import { defaultFloorplanFilter } from 'src/store/apps/defaultForm';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { useBuildingList } from 'src/hooks/useBuilding';
import { useFloorList } from 'src/hooks/useFloor';
import { useSiteLookup } from 'src/hooks/useSite';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import AreaHierarchySelector, { SelectedNode } from 'src/components/shared/AreaHierarchySelector';

const FloorplanFilter = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const { data: buildingResponse } = useBuildingList({
    page: 1,
    limit: 1000,
    search: '',
    sortOrder: 'desc',
    sortBy: '',
    siteId: '',
  });
  const buildingList = buildingResponse?.data || [];

  const { data: floorResponse } = useFloorList({
    page: 1,
    limit: 1000,
    search: '',
    sortOrder: 'desc',
    sortBy: '',
  });
  const floorList = floorResponse?.data || [];

  const { data: siteResponse } = useSiteLookup();
  const siteList = siteResponse?.data || [];

  const floorplanFilter = useSelector((state: RootState) => state.floorplanReducer.floorplanFilter);

  // Local copy of filters
  const [appliedFilter, setAppliedFilter] = useState(floorplanFilter);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(null);

  // --- Fetch + Sync ---
  useEffect(() => {
    setAppliedFilter(floorplanFilter);

    const fId = floorplanFilter.floorId;
    if (!fId) {
      setSelectedSiteId('');
      setSelectedNode(null);
      return;
    }

    // Try to determine the selected node based on floorId
    // If it's a comma-separated list of floor IDs
    if (fId.includes(',')) {
      const ids = fId.split(',');
      // Check if they all belong to a single building
      const matchingFloors = floorList.filter((f) => ids.includes(f.id));
      if (matchingFloors.length > 0) {
        const firstBId = matchingFloors[0].buildingId;
        const allFloorsOfBuilding = floorList.filter((f) => f.buildingId === firstBId);
        
        // If the number of matching floors matches the total floors of that building, then the building itself is selected
        const isAllOfBuilding = allFloorsOfBuilding.length > 0 && allFloorsOfBuilding.every((f) => ids.includes(f.id));
        if (isAllOfBuilding) {
          const building = buildingList.find((b) => b.id === firstBId);
          if (building) {
            setSelectedNode({ type: 'building', data: building });
            setSelectedSiteId(building.siteId || '');
            return;
          }
        }
      }

      // Check if it's a Site
      // Find which site contains all these floors
      if (siteList.length > 0) {
        for (const site of siteList) {
          const buildingsInSite = buildingList.filter((b) => b.siteId === site.id);
          const bIds = buildingsInSite.map((b) => b.id);
          const floorsInSite = floorList.filter((f) => bIds.includes(f.buildingId));
          const allFloorsMatch = floorsInSite.length > 0 && floorsInSite.every((f) => ids.includes(f.id));
          if (allFloorsMatch) {
            setSelectedSiteId(site.id);
            setSelectedNode(null);
            return;
          }
        }
      }
    } else {
      // Single floor ID selected
      const floor = floorList.find((f) => f.id === fId);
      if (floor) {
        setSelectedNode({ type: 'floor', data: floor });
        const b = buildingList.find((x) => x.id === floor.buildingId);
        if (b) {
          setSelectedSiteId(b.siteId || '');
        }
        return;
      }
    }
  }, [floorplanFilter, buildingList, floorList, siteList]);

  // --- Drawer Controls ---
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // --- Site change handler ---
  const handleSiteChange = (val: any) => {
    const sId = val?.id ?? '';
    setSelectedSiteId(sId);
    setSelectedNode(null);

    if (sId) {
      // Rollup all floor IDs under this site
      const siteBuildings = buildingList.filter((b) => b.siteId === sId);
      const bIds = siteBuildings.map((b) => b.id);
      const siteFloors = floorList.filter((f) => bIds.includes(f.buildingId));
      const fIds = siteFloors.map((f) => f.id).join(',');
      setAppliedFilter((prev) => ({
        ...prev,
        floorId: fIds || null,
      }));
    } else {
      setAppliedFilter((prev) => ({
        ...prev,
        floorId: null,
      }));
    }
  };

  // --- Hierarchy change handler (Building or Floor) ---
  const handleHierarchyChange = (val: SelectedNode) => {
    setSelectedNode(val);
    if (!val) {
      // Revert to site filter if site is selected, otherwise clear
      if (selectedSiteId) {
        const siteBuildings = buildingList.filter((b) => b.siteId === selectedSiteId);
        const bIds = siteBuildings.map((b) => b.id);
        const siteFloors = floorList.filter((f) => bIds.includes(f.buildingId));
        const fIds = siteFloors.map((f) => f.id).join(',');
        setAppliedFilter((prev) => ({
          ...prev,
          floorId: fIds || null,
        }));
      } else {
        setAppliedFilter((prev) => ({
          ...prev,
          floorId: null,
        }));
      }
      return;
    }

    if (val.type === 'building') {
      const bId = val.data.id;
      const bFloors = floorList.filter((f) => f.buildingId === bId);
      const fIds = bFloors.map((f) => f.id).join(',');
      setAppliedFilter((prev) => ({
        ...prev,
        floorId: fIds || null,
      }));
    } else if (val.type === 'floor') {
      setAppliedFilter((prev) => ({
        ...prev,
        floorId: val.data.id,
      }));
    }
  };

  // --- Apply & Reset ---
  const handleApplyFilter = () => {
    dispatch(UpdateFilter({ ...appliedFilter, page: 1 }));
    setOpen(false);
  };

  const handleResetFilter = () => {
    setAppliedFilter(defaultFloorplanFilter);
    setSelectedSiteId('');
    setSelectedNode(null);
    dispatch(UpdateFilter({ ...defaultFloorplanFilter }));
    setOpen(false);
  };

  const buildingIdsWithFloors = new Set(floorList.map((f) => f.buildingId));
  const filteredBuildings = (selectedSiteId
    ? buildingList.filter((b) => b.siteId === selectedSiteId)
    : buildingList
  ).filter((b) => buildingIdsWithFloors.has(b.id));

  // Filter floor list under selected site so tree is clean
  const filteredFloors = selectedSiteId
    ? floorList.filter((f) => {
        const b = buildingList.find((x) => x.id === f.buildingId);
        return b && b.siteId === selectedSiteId;
      })
    : floorList;

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
            padding: 3,
            backgroundColor: 'background.paper',
          },
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ my: 4, borderBottom: 5, borderColor: 'primary.main' }}
        >
          Floorplan Filter
        </Typography>

        <Grid container spacing={3}>
          {/* 🏢 Site Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Site :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select Site"
              options={siteList}
              value={siteList.find((s) => s.id === selectedSiteId) || null}
              onChange={handleSiteChange}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
          </Grid>

          {/* 🏢 Building / Floor Filter (AreaHierarchySelector) */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Building / Floor :</Typography>
            </CustomFormLabel>

            <AreaHierarchySelector
              buildings={filteredBuildings}
              floors={filteredFloors}
              floorplans={[]} // hide deeper levels
              maskedAreas={[]} // hide deeper levels
              value={selectedNode}
              onChange={handleHierarchyChange}
              label="Select Building / Floor"
            />
          </Grid>
        </Grid>

        {/* Footer Buttons */}
        <Box mt={3}>
          <Grid container justifyContent="space-between">
            <Grid size={3}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                onClick={handleResetFilter}
              >
                Reset
              </Button>
            </Grid>
            <Grid size={6}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleApplyFilter}
                disabled={isEqual(appliedFilter, floorplanFilter)}
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

export default FloorplanFilter;
