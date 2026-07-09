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
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import React, { useState } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { defaultDeviceForm } from 'src/store/apps/defaultForm';
import { deviceType } from 'src/store/apps/crud/devices';
import { useAddDevice, useEditDevice } from 'src/hooks/useDevice';
import { useSiteList } from 'src/hooks/useSite';
import { SiteType } from 'src/store/apps/crud/site';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

interface FormType {
    type?: 'add' | 'edit';
    device?: deviceType;
}

const AddEditDevices = ({ type = 'add', device }: FormType) => {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<deviceType>({
        ...defaultDeviceForm,
        ...device,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const { data: siteResponse } = useSiteList();
    const siteData = siteResponse?.data || [];

    const addMutation = useAddDevice();
    const editMutation = useEditDevice();

    // 🧭 Open/close dialog
    const handleClickOpen = () => {
      setFormErrors({});
      if (type === 'edit' && device) {
        setFormData({ 
          ...defaultDeviceForm, 
          ...device,
        });
      } else {
        setFormData({ 
          ...defaultDeviceForm,
        });
      }
      setOpen(true);
    };

    const handleClose = () => setOpen(false);

    // 🧩 Validation
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};
      if (!formData.name?.trim()) errors.name = 'Device name is required';
      if (!formData.siteId) errors.siteId = 'Site is required';
      // if (!formData.channelId?.trim()) errors.channelId = 'Channel ID is required';
      if (!formData.hardwareId?.trim()) errors.hardwareId = 'Hardware ID is required';
      if (!formData.serialNumber?.trim()) errors.serialNumber = 'Serial Number is required';

      // Conditional validation if device is a CCTV camera
      if (formData.deviceType === 'CctvCamera') {
        if (!formData.ipAddress?.trim()) errors.ipAddress = 'IP Address is required for CCTV';
        if (!formData.port?.trim()) errors.port = 'Port is required for CCTV';
        if (!formData.username?.trim()) errors.username = 'Username is required for CCTV';
        if (!formData.password?.trim()) errors.password = 'Password is required for CCTV';
        if (!formData.rtspUrl?.trim()) errors.rtspUrl = 'RTSP URL is required for CCTV';
      }

      setFormErrors(errors);    
      return Object.keys(errors).length === 0;
    };
  
    // 💾 Save handler
    const handleSave = async () => {
      if (!validateForm()) {
        toast.error('Please fill in all required fields.');
        return;
      }
  
      try {
        setIsSaving(true);
  
        const payload: Partial<deviceType> = {
          id: formData.id,
          siteId: formData.siteId,
          name: formData.name,
          channelId: null,
          hardwareId: formData.hardwareId,
          serialNumber: formData.serialNumber,
          model: formData.model,
          deviceType: formData.deviceType,
          AlarmSeverity: formData.AlarmSeverity,
          alarmMode: formData.alarmMode,
          isNormalyClose: formData.isNormalyClose,
          is24H: formData.is24H,
          isPanic: formData.isPanic,
          isEntry: formData.isEntry,
          deviceIO: formData.deviceIO,
          ipAddress: formData.deviceType === 'CctvCamera' ? formData.ipAddress : null,
          port: formData.deviceType === 'CctvCamera' ? formData.port : null,
          username: formData.deviceType === 'CctvCamera' ? formData.username : null,
          password: formData.deviceType === 'CctvCamera' ? formData.password : null,
          rtspUrl: formData.deviceType === 'CctvCamera' ? formData.rtspUrl : null,
        };
  
        if (type === 'add') {
          await addMutation.mutateAsync(payload);
          toast.success('Device added successfully!');
        } else {
          await editMutation.mutateAsync(payload);
          toast.success('Device updated successfully!');
        }
  
        handleClose();
      } catch (error) {
        console.error('Error saving device:', error);
        toast.error('Saving data unsuccessful.');
      } finally {
        setIsSaving(false);
      }
    };

    // 🧠 Handle input changes
    const handleInputChange = (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | { target: { id?: string; name?: string; value: string } },
    ) => {
      const { id, name, value } = e.target;
      const key = (id || name) as keyof typeof formData;
      if (!key) return;
  
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleSwitchChange = (key: keyof deviceType) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [key]: e.target.checked,
      }));
    };

    return (
        <>
            {type === 'edit' && (
                <Tooltip title="Edit Device">
                  <IconButton color="primary" size="small" onClick={handleClickOpen}>
                    <IconPencil size={20} />
                  </IconButton>
                </Tooltip>
            )}
            {type === 'add' && (
                <Tooltip title="Add Device">
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
                        {type === 'add' ? 'Add Device' : 'Edit Device'}
                    </Typography>
                    <Divider />
                </DialogTitle>
                
                <DialogContent>
                    <Grid container spacing={4} mt={1}>
                        {/* Left & Middle Column (8 out of 12) - Basic Info */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Grid container spacing={3}>
                                {/* Site Autocomplete */}
                                <Grid size={{ xs: 12, sm: 6 }}>
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
                                                siteName: val?.name ?? ''
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

                                {/* Device Name */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="name" sx={{ mt: 0 }}>Device Name</CustomFormLabel>
                                    <CustomTextField
                                        id="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Device Name"
                                        error={!!formErrors.name}
                                        helperText={formErrors.name}
                                        required
                                    />
                                </Grid>

                                {/* Model */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="model">Model</CustomFormLabel>
                                    <CustomTextField
                                        id="model"
                                        value={formData.model}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Device Model"
                                    />
                                </Grid>

                                {/* Hardware ID */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="hardwareId">Hardware ID</CustomFormLabel>
                                    <CustomTextField
                                        id="hardwareId"
                                        value={formData.hardwareId}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Hardware ID"
                                        error={!!formErrors.hardwareId}
                                        helperText={formErrors.hardwareId}
                                        required
                                    />
                                </Grid>

                                {/* Serial Number */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="serialNumber">Serial Number</CustomFormLabel>
                                    <CustomTextField
                                        id="serialNumber"
                                        value={formData.serialNumber}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Serial Number"
                                        error={!!formErrors.serialNumber}
                                        helperText={formErrors.serialNumber}
                                        required
                                    />
                                </Grid>

                                {/* Channel ID */}
                                {/* <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="channelId">Channel ID</CustomFormLabel>
                                    <CustomTextField
                                        id="channelId"
                                        value={formData.channelId}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Channel ID"
                                        error={!!formErrors.channelId}
                                        helperText={formErrors.channelId}
                                        required
                                    />
                                </Grid> */}

                                {/* Device Type Select */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="deviceType">Device Type</CustomFormLabel>
                                    <CustomTextField
                                        id="deviceType"
                                        name="deviceType"
                                        value={formData.deviceType}
                                        onChange={handleInputChange}
                                        fullWidth
                                        select
                                        variant="outlined"
                                    >
                                        <MenuItem value="Other">Other</MenuItem>
                                        <MenuItem value="MotionSensor">Motion Sensor</MenuItem>
                                        <MenuItem value="DoorSensor">Door Sensor</MenuItem>
                                        <MenuItem value="GlassBreakSensor">Glass Break Sensor</MenuItem>
                                        <MenuItem value="BeamSensor">Beam Sensor</MenuItem>
                                        <MenuItem value="VibrationSensor">Vibration Sensor</MenuItem>
                                        <MenuItem value="CctvCamera">CCTV (Camera)</MenuItem>
                                        <MenuItem value="DoorLock">Door Lock</MenuItem>
                                        <MenuItem value="Siren">Siren</MenuItem>
                                        <MenuItem value="StrobeLight">Strobe Light</MenuItem>
                                        <MenuItem value="PanicButton">Panic Button</MenuItem>
                                    </CustomTextField>
                                </Grid>

                                {/* Alarm Severity Select */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="AlarmSeverity">Alarm Severity</CustomFormLabel>
                                    <CustomTextField
                                        id="AlarmSeverity"
                                        name="AlarmSeverity"
                                        value={formData.AlarmSeverity}
                                        onChange={handleInputChange}
                                        fullWidth
                                        select
                                        variant="outlined"
                                    >
                                        <MenuItem value="low">Low</MenuItem>
                                        <MenuItem value="medium">Medium</MenuItem>
                                        <MenuItem value="high">High</MenuItem>
                                        <MenuItem value="critical">Critical</MenuItem>
                                    </CustomTextField>
                                </Grid>

                                {/* Alarm Mode */}
                                {/* <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="alarmMode">Alarm Mode</CustomFormLabel>
                                    <CustomTextField
                                        id="alarmMode"
                                        value={formData.alarmMode}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        placeholder="Enter Alarm Mode"
                                    />
                                </Grid> */}

                                {/* Device IO */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <CustomFormLabel htmlFor="deviceIO">Device I/O</CustomFormLabel>
                                    <CustomTextField
                                        id="deviceIO"
                                        name="deviceIO"
                                        value={formData.deviceIO}
                                        onChange={handleInputChange}
                                        fullWidth
                                        select
                                        variant="outlined"
                                    >
                                      <MenuItem value="None">None</MenuItem>
                                        <MenuItem value="Input">Input</MenuItem>
                                        <MenuItem value="Output">Output</MenuItem>
                                        <MenuItem value="Stream">Stream</MenuItem>
                                    </CustomTextField>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Right Column (4 out of 12) - Settings & CCTV Configuration */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Box 
                                sx={{ 
                                    borderLeft: { md: '1px solid rgba(0, 0, 0, 0.12)' }, 
                                    pl: { md: 3 }, 
                                    height: '100%' 
                                }}
                            >
                                <Typography variant="h6" fontWeight={600} mb={2}>
                                    Setting Options
                                </Typography>
                                <Grid container direction="column" spacing={2}>
                                    <Grid size={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.isNormalyClose}
                                                    onChange={handleSwitchChange('isNormalyClose')}
                                                    color="primary"
                                                />
                                            }
                                            label="Normally Close"
                                        />
                                    </Grid>
                                    <Grid size={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.is24H}
                                                    onChange={handleSwitchChange('is24H')}
                                                    color="primary"
                                                />
                                            }
                                            label="24H Mode"
                                        />
                                    </Grid>
                                    <Grid size={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.isPanic}
                                                    onChange={handleSwitchChange('isPanic')}
                                                    color="primary"
                                                />
                                            }
                                            label="Panic Mode"
                                        />
                                    </Grid>
                                    <Grid size={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.isEntry}
                                                    onChange={handleSwitchChange('isEntry')}
                                                    color="primary"
                                                />
                                            }
                                            label="Entry Mode"
                                        />
                                    </Grid>
                                </Grid>

                                {/* CCTV Specific Fields */}
                                {formData.deviceType === 'CctvCamera' && (
                                    <>
                                        <Divider sx={{ my: 3 }} />
                                        <Typography variant="h6" color="primary" fontWeight={600} mb={2}>
                                            CCTV (Camera) Configuration
                                        </Typography>
                                        <Grid container direction="column" spacing={2}>
                                            {/* IP Address */}
                                            <Grid size={12}>
                                                <CustomFormLabel htmlFor="ipAddress" sx={{ mt: 0 }}>IP Address</CustomFormLabel>
                                                <CustomTextField
                                                    id="ipAddress"
                                                    value={formData.ipAddress ?? ''}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Enter CCTV IP Address"
                                                    error={!!formErrors.ipAddress}
                                                    helperText={formErrors.ipAddress}
                                                    required
                                                />
                                            </Grid>

                                            {/* Port */}
                                            <Grid size={12}>
                                                <CustomFormLabel htmlFor="port" sx={{ mt: 1 }}>Port</CustomFormLabel>
                                                <CustomTextField
                                                    id="port"
                                                    value={formData.port ?? ''}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Enter CCTV Port"
                                                    error={!!formErrors.port}
                                                    helperText={formErrors.port}
                                                    required
                                                />
                                            </Grid>

                                            {/* Username */}
                                            <Grid size={12}>
                                                <CustomFormLabel htmlFor="username" sx={{ mt: 1 }}>Username</CustomFormLabel>
                                                <CustomTextField
                                                    id="username"
                                                    value={formData.username ?? ''}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Enter CCTV Username"
                                                    error={!!formErrors.username}
                                                    helperText={formErrors.username}
                                                    required
                                                />
                                            </Grid>

                                            {/* Password */}
                                            <Grid size={12}>
                                                <CustomFormLabel htmlFor="password" sx={{ mt: 1 }}>Password</CustomFormLabel>
                                                <CustomTextField
                                                    id="password"
                                                    type="password"
                                                    value={formData.password ?? ''}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="Enter CCTV Password"
                                                    error={!!formErrors.password}
                                                    helperText={formErrors.password}
                                                    required
                                                />
                                            </Grid>

                                            {/* RTSP URL */}
                                            <Grid size={12}>
                                                <CustomFormLabel htmlFor="rtspUrl" sx={{ mt: 1 }}>RTSP URL</CustomFormLabel>
                                                <CustomTextField
                                                    id="rtspUrl"
                                                    value={formData.rtspUrl ?? ''}
                                                    onChange={handleInputChange}
                                                    fullWidth
                                                    variant="outlined"
                                                    placeholder="rtsp://[username]:[password]@[ip]:[port]/h264/ch1/main/av_stream"
                                                    error={!!formErrors.rtspUrl}
                                                    helperText={formErrors.rtspUrl}
                                                    required
                                                />
                                            </Grid>
                                        </Grid>
                                    </>
                                )}
                            </Box>
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

export default AddEditDevices;