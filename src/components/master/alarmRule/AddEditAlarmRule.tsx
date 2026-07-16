import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  Checkbox,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import { toastError } from 'src/utils/errors';
import React, { useState, useEffect, useMemo } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { defaultAlarmRuleForm } from 'src/store/apps/defaultForm';
import { AlarmRuleDataType } from 'src/store/apps/crud/alarmRule';
import { useAddAlarmRule, useEditAlarmRule } from 'src/hooks/useAlarmRule';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import { useScheduleList } from 'src/hooks/useSchedule';
import { useDeviceLookup } from 'src/hooks/useDevice';
import { SiteType } from 'src/store/apps/crud/site';
import { ScheduleDataType } from 'src/store/apps/crud/schedule';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

interface FormType {
  type?: 'add' | 'edit';
  alarmRule?: AlarmRuleDataType;
}

const AddEditAlarmRule = ({ type = 'add', alarmRule }: FormType) => {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<AlarmRuleDataType>({
    ...defaultAlarmRuleForm,
    ...alarmRule,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch Sites
  const { data: siteResponse } = useSiteLookup();
  const siteData = siteResponse?.data || [];

  // Fetch Schedules
  const { data: scheduleResponse } = useScheduleList({ page: 1, limit: 100 } as any);
  const scheduleData = scheduleResponse?.data || [];

  // Fetch Devices for Input and Output sections
  const inputDeviceParams = useMemo(() => ({
    page: 1,
    limit: 1000,
    deviceIO: 'Input',
    ...(formData.siteId ? { siteId: formData.siteId } : {}),
  }), [formData.siteId]);

  const outputDeviceParams = useMemo(() => ({
    page: 1,
    limit: 1000,
    deviceIO: 'Output',
    ...(formData.siteId ? { siteId: formData.siteId } : {}),
  }), [formData.siteId]);

  const { data: inputDevicesResponse, isLoading: isInputLoading } = useDeviceLookup(inputDeviceParams as any);
  const { data: outputDevicesResponse, isLoading: isOutputLoading } = useDeviceLookup(outputDeviceParams as any);

  // Fetch Stream Devices
  const streamDeviceParams = useMemo(() => ({
    page: 1,
    limit: 1000,
    deviceIO: 'Stream',
    ...(formData.siteId ? { siteId: formData.siteId } : {}),
  }), [formData.siteId]);

  const { data: streamDevicesResponse, isLoading: isStreamLoading } = useDeviceLookup(streamDeviceParams as any);

  const inputDevices = inputDevicesResponse?.data || [];
  const outputDevices = outputDevicesResponse?.data || [];
  const streamDevices = streamDevicesResponse?.data || [];

  const addMutation = useAddAlarmRule();
  const editMutation = useEditAlarmRule();

  // Reset form when opening dialog
  const handleClickOpen = () => {
    setFormErrors({});
    if (type === 'edit' && alarmRule) {
      setFormData({
        ...defaultAlarmRuleForm,
        ...alarmRule,
      });
    } else {
      setFormData({
        ...defaultAlarmRuleForm,
      });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Alarm Rule Name is required';
    if (!formData.siteId) errors.siteId = 'Site selection is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save handler
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    try {
      setIsSaving(true);
      const { outputs, streams, ...restFormData } = formData;
      const payload = {
        ...restFormData,
        outputDeviceIds: (outputs || []).map((d) => d.deviceId),
        streamDeviceIds: (streams || []).map((d) => d.deviceId),
      };

      if (type === 'add') {
        await addMutation.mutateAsync(payload);
        toast.success('Alarm Rule added successfully!');
      } else {
        await editMutation.mutateAsync(payload);
        toast.success('Alarm Rule updated successfully!');
      }

      handleClose();
    } catch (error) {
      console.error('Error saving Alarm Rule:', error);
      toastError(error, 'Saving data unsuccessful.');
    } finally {
      setIsSaving(false);
    }
  };

  // Device selection toggle logic
  const handleToggleInputDevice = (device: any) => {
    setFormData((prev) => {
      const isCurrentlySelected = prev.inputDeviceId === device.id;
      return {
        ...prev,
        inputDeviceId: isCurrentlySelected ? '' : device.id,
        // inputDeviceName: isCurrentlySelected ? '' : device.name,
      };
    });
  };

  const handleToggleOutputDevice = (device: any) => {
    const currentOutputs = formData.outputs || [];
    const isChecked = currentOutputs.some((d) => d.deviceId === device.id);
    let newOutputs = [...currentOutputs];

    if (isChecked) {
      newOutputs = newOutputs.filter((d) => d.deviceId !== device.id);
    } else {
      newOutputs.push({ deviceId: device.id, deviceName: device.name });
    }

    setFormData((prev) => ({
      ...prev,
      outputs: newOutputs,
    }));
  };

  const handleToggleStreamDevice = (device: any) => {
    const currentStreams = formData.streams || [];
    const isChecked = currentStreams.some((d) => d.deviceId === device.id);
    let newStreams = [...currentStreams];

    if (isChecked) {
      newStreams = newStreams.filter((d) => d.deviceId !== device.id);
    } else {
      newStreams.push({ deviceId: device.id, deviceName: device.name });
    }

    setFormData((prev) => ({
      ...prev,
      streams: newStreams,
    }));
  };

  return (
    <>
      {type === 'edit' && (
        <Tooltip title="Edit Alarm Rule">
          <IconButton color="primary" size="small" onClick={handleClickOpen}>
            <IconPencil size={20} />
          </IconButton>
        </Tooltip>
      )}
      {type === 'add' && (
        <Tooltip title="Add Alarm Rule">
          <Button
            variant="contained"
            color="primary"
            sx={{ p: 0.5, minWidth: 40, minHeight: 40 }}
            onClick={handleClickOpen}
          >
            <IconPlus size={20} />
          </Button>
        </Tooltip>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="lg">
        <DialogTitle>
          <Typography component="div" variant="h4" my={2} fontWeight={700}>
            {type === 'add' ? 'Add Alarm Rule' : 'Edit Alarm Rule'}
          </Typography>
          <Divider />
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={3} mt={1}>
            {/* TOP BAR INPUTS */}
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel htmlFor="name" sx={{ mt: 0 }}>Alarm Rule Name</CustomFormLabel>
              <CustomTextField
                id="name"
                value={formData.name}
                onChange={(e: any) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
                variant="outlined"
                placeholder="Enter Alarm Rule Name"
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel htmlFor="siteId" sx={{ mt: 0 }}>Site</CustomFormLabel>
              <CustomAutocomplete<SiteType>
                multiple={false}
                label="Site"
                options={siteData}
                value={siteData.find((s) => s.id === formData.siteId) || null}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    siteId: val?.id ?? '',
                    siteName: val?.name ?? '',
                    inputDeviceId: '',
                    // inputDeviceName: '',
                    outputs: [], // Reset outputs
                    streams: [], // Reset streams
                  }));
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.siteId;
                    return next;
                  });
                }}
                getOptionLabel={(o) => o?.name ?? ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                required
                error={!!formErrors.siteId}
                helperText={formErrors.siteId}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel htmlFor="scheduleTemplateId" sx={{ mt: 0 }}>Schedule Template (Optional)</CustomFormLabel>
              <CustomAutocomplete<ScheduleDataType>
                multiple={false}
                label="Schedule Template"
                options={scheduleData}
                value={scheduleData.find((s) => s.id === formData.scheduleTemplateId) || null}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    scheduleTemplateId: val?.id ?? '',
                    scheduleTemplateName: val?.name ?? '',
                  }));

                }}
                getOptionLabel={(o) => o?.name ?? ''}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}

              />
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            {/* SECTIONS */}
            {/* Section 1: Inputs (Single select, thinner) */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Input Device
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, height: 400, overflowY: 'auto' }}>
                {isInputLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : !formData.siteId ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">Please select a Site first.</Typography>
                  </Box>
                ) : inputDevices.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">No input devices found.</Typography>
                  </Box>
                ) : (
                  <List>
                    {inputDevices.map((device) => {
                      const isSelected = formData.inputDeviceId === device.id;
                      const hasSelection = !!formData.inputDeviceId;
                      const isGreyed = hasSelection && !isSelected;
                      return (
                        <ListItemButton
                          key={device.id}
                          dense
                          onClick={() => handleToggleInputDevice(device)}
                          sx={{
                            opacity: isGreyed ? 0.45 : 1,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={isSelected}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={device.name}
                            secondary={`Serial: ${device.serialNumber || 'N/A'} | Type: ${device.deviceType}`}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Section 2: Outputs (Multiple select) */}
            <Grid size={{ xs: 12, md: 4.5 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Output Devices
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, height: 400, overflowY: 'auto' }}>
                {isOutputLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : !formData.siteId ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">Please select a Site first.</Typography>
                  </Box>
                ) : outputDevices.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">No output devices found.</Typography>
                  </Box>
                ) : (
                  <List>
                    {outputDevices.map((device) => {
                      const isChecked = (formData.outputs || []).some((d) => d.deviceId === device.id);
                      return (
                        <ListItemButton
                          key={device.id}
                          dense
                          onClick={() => handleToggleOutputDevice(device)}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={isChecked}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={device.name}
                            secondary={`Serial: ${device.serialNumber || 'N/A'} | Type: ${device.deviceType}`}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>

            {/* Section 3: Streams (Multiple select) */}
            <Grid size={{ xs: 12, md: 4.5 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Stream Devices
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, height: 400, overflowY: 'auto' }}>
                {isStreamLoading ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                  </Box>
                ) : !formData.siteId ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">Please select a Site first.</Typography>
                  </Box>
                ) : streamDevices.length === 0 ? (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Typography color="textSecondary">No stream devices found.</Typography>
                  </Box>
                ) : (
                  <List>
                    {streamDevices.map((device) => {
                      const isChecked = (formData.streams || []).some((d) => d.deviceId === device.id);
                      return (
                        <ListItemButton
                          key={device.id}
                          dense
                          onClick={() => handleToggleStreamDevice(device)}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={isChecked}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={device.name}
                            secondary={`Serial: ${device.serialNumber || 'N/A'} | Type: ${device.deviceType}`}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={handleClose} variant="outlined" sx={{ fontSize: '1rem', py: 1, px: 3 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ fontSize: '1rem', py: 1, px: 3 }}
            disabled={isSaving}
          >
            {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditAlarmRule;