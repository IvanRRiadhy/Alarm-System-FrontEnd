import {
  Box,
  Button,
  Drawer,
  Grid2 as Grid,
  Typography,
  MenuItem,
  ListSubheader,
} from '@mui/material';
import { IconAdjustmentsHorizontal } from '@tabler/icons-react';
import { isEqual } from 'lodash';
import { useEffect, useState } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { UpdateFilter } from 'src/store/apps/crud/devices';
import { defaultDeviceFilter } from 'src/store/apps/defaultForm';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { useSiteLookup } from 'src/hooks/useSite';
import { useControllerList } from 'src/hooks/useController';
import { useChannel } from 'src/hooks/useChannel';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

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

const statusOptions = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'error', label: 'Error' },
];

const deviceIOOptions = [
  { value: 'None', label: 'None' },
  { value: 'Input', label: 'Input' },
  { value: 'Output', label: 'Output' },
  { value: 'Stream', label: 'Stream' },
];

const DeviceFilter = () => {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const { data: siteResponse } = useSiteLookup();
  const siteList = siteResponse?.data || [];

  const { data: controllerResponse } = useControllerList({ page: 1, limit: 1000 });
  const controllerList = controllerResponse?.data || [];

  const deviceFilter = useSelector((state: RootState) => state.deviceReducer.deviceFilter);

  // Local copy of filters
  const [appliedFilter, setAppliedFilter] = useState(deviceFilter);

  // Sync with store
  useEffect(() => {
    setAppliedFilter(deviceFilter);
  }, [deviceFilter]);

  // Fetch channels for selected controller
  const { data: channelResponse } = useChannel({
    page: 1,
    limit: 1000,
    controllerId: appliedFilter.controllerId || 'none',
  });
  const channelList = channelResponse?.data || [];

  // --- Drawer Controls ---
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // --- Change Handlers ---
  const handleSiteChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      siteId: val?.id ?? undefined,
    }));
  };

  const handleTypeChange = (val: any) => {
    const type = val?.value ?? undefined;
    setAppliedFilter((prev) => {
      const next = { ...prev, deviceType: type };
      if (type === 'CctvCamera') {
        next.deviceIO = 'Stream';
        delete next.controllerId;
        delete next.channelId;
      } else if (prev.deviceType === 'CctvCamera' && next.deviceIO === 'Stream') {
        next.deviceIO = undefined;
      }
      return next;
    });
  };

  const handleStatusChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      status: val?.value ?? undefined,
    }));
  };

  const handleDeviceIOChange = (val: any) => {
    const io = val?.value ?? undefined;
    setAppliedFilter((prev) => {
      const next = { ...prev, deviceIO: io };
      // Clear controller/channel if deviceIO becomes Stream or None
      if (io === 'Stream' || io === 'None') {
        delete next.controllerId;
        delete next.channelId;
      }
      if (io === 'Stream') {
        next.deviceType = 'CctvCamera';
      } else if (prev.deviceIO === 'Stream' && next.deviceType === 'CctvCamera') {
        next.deviceType = undefined;
      }
      return next;
    });
  };

  const handleControllerChange = (val: any) => {
    setAppliedFilter((prev) => ({
      ...prev,
      controllerId: val?.id ?? undefined,
      channelId: undefined, // Reset channel when controller changes
    }));
  };

  // --- Apply & Reset ---
  const handleApplyFilter = () => {
    dispatch(UpdateFilter({ ...appliedFilter, page: 1 }));
    setOpen(false);
  };

  const handleResetFilter = () => {
    setAppliedFilter(defaultDeviceFilter);
    dispatch(UpdateFilter({ ...defaultDeviceFilter }));
    setOpen(false);
  };

  const showControllerFilter = !appliedFilter.deviceIO || appliedFilter.deviceIO === 'Input' || appliedFilter.deviceIO === 'Output';
  const showChannelFilter = showControllerFilter && !!appliedFilter.controllerId;

  const inputChannels = channelList.filter(c => c.type === 'Input');
  const outputChannels = channelList.filter(c => c.type === 'Output');

  const showInputs = appliedFilter.deviceIO !== 'Output';
  const showOutputs = appliedFilter.deviceIO !== 'Input';

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
          Device Filter
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

          {/* 🏷️ Type Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Device Type :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select Type"
              options={typeOptions}
              value={typeOptions.find((t) => t.value === appliedFilter.deviceType) || null}
              onChange={handleTypeChange}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
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

          {/* 🔌 DeviceIO Filter */}
          <Grid size={12}>
            <CustomFormLabel>
              <Typography variant="caption">Device I/O :</Typography>
            </CustomFormLabel>
            <CustomAutocomplete
              label="Select I/O"
              options={deviceIOOptions}
              value={deviceIOOptions.find((d) => d.value === appliedFilter.deviceIO) || null}
              onChange={handleDeviceIOChange}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
            />
          </Grid>

          {/* 🎮 Controller Filter */}
          {showControllerFilter && (
            <Grid size={12}>
              <CustomFormLabel>
                <Typography variant="caption">Controller :</Typography>
              </CustomFormLabel>
              <CustomAutocomplete
                label="Select Controller"
                options={controllerList}
                value={controllerList.find((c) => c.id === appliedFilter.controllerId) || null}
                onChange={handleControllerChange}
                getOptionLabel={(o) => o.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
              />
            </Grid>
          )}

          {/* 📺 Channel Filter */}
          {showChannelFilter && (
            <Grid size={12}>
              <CustomFormLabel>
                <Typography variant="caption">Channel :</Typography>
              </CustomFormLabel>
              <CustomTextField
                select
                fullWidth
                value={appliedFilter.channelId || ''}
                onChange={(e: any) => setAppliedFilter(prev => ({ ...prev, channelId: e.target.value || undefined }))}
              >
                <MenuItem value="">None</MenuItem>
                {showInputs && inputChannels.length > 0 && <ListSubheader>Input Channels</ListSubheader>}
                {showInputs && inputChannels.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    Input {c.channelNo} ({c.name || 'Unnamed'})
                  </MenuItem>
                ))}
                {showOutputs && outputChannels.length > 0 && <ListSubheader>Output Channels</ListSubheader>}
                {showOutputs && outputChannels.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    Output {c.channelNo} ({c.name || 'Unnamed'})
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
          )}
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
                disabled={isEqual(appliedFilter, deviceFilter)}
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

export default DeviceFilter;
