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
import { UpdateFilter } from 'src/store/apps/crud/controller';
import { defaultControllerFilter } from 'src/store/apps/defaultForm';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { useSiteLookup } from 'src/hooks/useSite';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

const statusOptions = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'error', label: 'Error' },
];

const ControllerFilter = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const { data: siteResponse } = useSiteLookup();
  const siteList = siteResponse?.data || [];

  const controllerFilter = useSelector((state: RootState) => state.ControllerReducer.controllerFilter);

  // Local copy of filters
  const [appliedFilter, setAppliedFilter] = useState(controllerFilter);

  // --- Fetch + Sync ---
  useEffect(() => {
    setAppliedFilter(controllerFilter);
  }, [controllerFilter]);

  // --- Drawer Controls ---
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // --- Site change handler ---
  const handleSiteChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      siteId: val?.id ?? undefined,
    }));
  };

  // --- Status change handler ---
  const handleStatusChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      status: (val?.value as 'offline' | 'online' | 'error') ?? undefined,
    }));
  };

  // --- Apply & Reset ---
  const handleApplyFilter = () => {
    dispatch(UpdateFilter({ ...appliedFilter, page: 1 }));
    setOpen(false);
  };

  const handleResetFilter = () => {
    setAppliedFilter(defaultControllerFilter);
    dispatch(UpdateFilter({ ...defaultControllerFilter }));
    setOpen(false);
  };

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
          Controller Filter
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
              value={siteList.find((s) => s.id === appliedFilter.siteId) || null}
              onChange={handleSiteChange}
              getOptionLabel={(o) => o.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
          </Grid>

          {/* 📶 Status Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Status :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select Status"
              options={statusOptions}
              value={statusOptions.find((s) => s.value === appliedFilter.status) || null}
              onChange={handleStatusChange}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
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
                disabled={isEqual(appliedFilter, controllerFilter)}
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

export default ControllerFilter;
