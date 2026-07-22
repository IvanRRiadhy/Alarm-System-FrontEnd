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
import { UpdateFilter } from 'src/store/apps/crud/site';
import { defaultSiteFilter } from 'src/store/apps/defaultForm';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { region as regionOptions } from 'src/types/crud/input';

const timezoneOptions = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura'];

const SiteFilter = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const siteFilter = useSelector((state: RootState) => state.siteReducer.siteFilter);

  // Local copy of filters
  const [appliedFilter, setAppliedFilter] = useState(siteFilter);

  // --- Fetch + Sync ---
  useEffect(() => {
    setAppliedFilter(siteFilter);
  }, [siteFilter]);

  // --- Drawer Controls ---
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // --- Change Handlers ---
  const handleRegionChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      region: val?.name ?? undefined,
    }));
  };

  const handleTimezoneChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      timezone: val ?? undefined,
    }));
  };

  // --- Apply & Reset ---
  const handleApplyFilter = () => {
    dispatch(UpdateFilter({ ...appliedFilter, page: 1 }));
    setOpen(false);
  };

  const handleResetFilter = () => {
    setAppliedFilter(defaultSiteFilter);
    dispatch(UpdateFilter({ ...defaultSiteFilter }));
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
          Site Filter
        </Typography>

        <Grid container spacing={3}>
          {/* 🗺️ Region Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Region :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select Region"
              options={regionOptions}
              value={regionOptions.find((r) => r.name === appliedFilter.region) || null}
              onChange={handleRegionChange}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
          </Grid>

          {/* 🕒 Timezone Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Timezone :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select Timezone"
              options={timezoneOptions}
              value={timezoneOptions.find((tz) => tz === appliedFilter.timezone) || null}
              onChange={handleTimezoneChange}
              getOptionLabel={(o) => o ?? ''}
              isOptionEqualToValue={(a, b) => a === b}
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
                disabled={isEqual(appliedFilter, siteFilter)}
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

export default SiteFilter;
