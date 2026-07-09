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
} from '@mui/material';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import React, { useState } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { defaultControllerForm } from 'src/store/apps/defaultForm';
import { controllerType } from 'src/store/apps/crud/controller';
import { useAddController, useEditController } from 'src/hooks/useController';
import { useSiteList } from 'src/hooks/useSite';
import { SiteType } from 'src/store/apps/crud/site';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

interface FormType {
    type?: 'add' | 'edit';
    controller?: controllerType;
}

const AddEditController = ({ type = 'add', controller }: FormType) => {
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        ...defaultControllerForm,
        ...controller,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const { data: siteResponse } = useSiteList();
    const siteData = siteResponse?.data || [];

    const addMutation = useAddController();
    const editMutation = useEditController();

    // 🧭 Open/close dialog
    const handleClickOpen = () => {
      setFormErrors({});
      if (type === 'edit' && controller) {
        setFormData({ 
          ...defaultControllerForm, 
          ...controller,
        });
      } else {
        setFormData({ 
          ...defaultControllerForm,
        });
      }
      setOpen(true);
    };

    const handleClose = () => setOpen(false);

    // 🧩 Validation
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};
      if (!formData.name?.trim()) errors.name = 'Controller name is required';
      if (!formData.siteId) errors.siteId = 'Site is required';
      if (!formData.ipAddress?.trim()) errors.ipAddress = 'IP Address is required';
      if (formData.port === undefined || formData.port === null || isNaN(Number(formData.port))) {
        errors.port = 'Port is required and must be a number';
      }
      if (formData.channelCount === undefined || formData.channelCount === null || isNaN(Number(formData.channelCount))) {
        errors.channelCount = 'Channel Count is required and must be a number';
      } else if (Number(formData.channelCount) > 64) {
        errors.channelCount = 'Channel Count cannot be more than 64';
      } else if (Number(formData.channelCount) < 0) {
        errors.channelCount = 'Channel Count cannot be less than 0';
      }
      if (!formData.macAddress?.trim()) errors.macAddress = 'MAC Address is required';

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
  
        const payload = {
          id: formData.id,
          siteId: formData.siteId,
          name: formData.name,
          ipAddress: formData.ipAddress,
          port: Number(formData.port),
          channelCount: formData.channelCount,
          macAddress: formData.macAddress,
          firmwareVersion: formData.firmwareVersion,
          alarmMode: formData.alarmMode,
        };
  
        if (type === 'add') {
          await addMutation.mutateAsync(payload);
          toast.success('Controller added successfully!');
        } else {
          await editMutation.mutateAsync(payload);
          toast.success('Controller updated successfully!');
        }
  
        handleClose();
      } catch (error) {
        console.error('Error saving controller:', error);
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

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, name, value } = e.target;
      const key = (id || name) as keyof typeof formData;
      if (!key) return;

      const numVal = value === '' ? '' : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [key]: isNaN(numVal as number) ? '' : numVal,
      }));
    };

    return (
        <>
            {type === 'edit' && (
                <Tooltip title="Edit Controller">
                  <IconButton color="primary" size="small" onClick={handleClickOpen}>
                    <IconPencil size={20} />
                  </IconButton>
                </Tooltip>
            )}
            {type === 'add' && (
                <Tooltip title="Add Controller">
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

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>
                    <Typography component="div" variant="h4" my={2} fontWeight={700}>
                        {type === 'add' ? 'Add Controller' : 'Edit Controller'}
                    </Typography>
                    <Divider />
                </DialogTitle>
                
                <DialogContent>
                    <Grid container spacing={3} mt={1}>
                        {/* Site Autocomplete */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="siteId">Site</CustomFormLabel>
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

                        {/* Controller Name */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="name">Controller Name</CustomFormLabel>
                            <CustomTextField
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Controller Name"
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                required
                            />
                        </Grid>

                        {/* IP Address */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="ipAddress">IP Address</CustomFormLabel>
                            <CustomTextField
                                id="ipAddress"
                                value={formData.ipAddress}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter IP Address"
                                error={!!formErrors.ipAddress}
                                helperText={formErrors.ipAddress}
                                required
                            />
                        </Grid>

                        {/* Port */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="port">Port</CustomFormLabel>
                            <CustomTextField
                                id="port"
                                type="number"
                                value={formData.port ?? 0}
                                onChange={handleNumberInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Port"
                                error={!!formErrors.port}
                                helperText={formErrors.port}
                                required
                            />
                        </Grid>

                        {/* Channel Count */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="channelCount">Channel Count</CustomFormLabel>
                            <CustomTextField
                                id="channelCount"
                                type="number"
                                value={formData.channelCount ?? 0}
                                onChange={handleNumberInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Channel Count"
                                error={!!formErrors.channelCount}
                                helperText={formErrors.channelCount}
                                required
                                slotProps={{
                                    htmlInput: { min: 0, max: 64 }
                                }}
                            />
                        </Grid>

                        {/* MAC Address */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="macAddress">MAC Address</CustomFormLabel>
                            <CustomTextField
                                id="macAddress"
                                value={formData.macAddress}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter MAC Address"
                                error={!!formErrors.macAddress}
                                helperText={formErrors.macAddress}
                                required
                            />
                        </Grid>

                        {/* Firmware Version */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="firmwareVersion">Firmware Version</CustomFormLabel>
                            <CustomTextField
                                id="firmwareVersion"
                                value={formData.firmwareVersion}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Firmware Version"
                            />
                        </Grid>
                        {/* Alarm Mode */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="alarmMode">Alarm Mode</CustomFormLabel>
                            <CustomTextField
                                id="alarmMode"
                                value={formData.alarmMode}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Firmware Version"
                                select
                                error={!!formErrors.alarmMode}
                                helperText={formErrors.alarmMode}
                                required
                            >
                                <MenuItem value={"Disarmed"}>Disarmed</MenuItem>
                                <MenuItem value={"ArmedStay"}>Armed Stay</MenuItem>
                                <MenuItem value={"ArmedAway"}>Armed Away</MenuItem>
                                <MenuItem value={"Acknowledge"}>Acknowledge</MenuItem>
                            </CustomTextField>
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

export default AddEditController;