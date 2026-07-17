import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
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
  Box,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { IconPencil, IconX, IconUpload, IconTrash, IconPaperclip, IconChevronLeft } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import {
  useAcknowledgeInvestigation,
  useDispatchInvestigation,
  useResolveInvestigation,
  usePostponeInvestigation,
  useCreateAlarmInvestigation,
} from 'src/hooks/useAlarmInvestigation';
import { usePersonnelLookup } from 'src/hooks/usePersonnel';
import { useUploadCDN } from 'src/hooks/useCDN';
import { AlarmInvestigationType, AttachmentsType } from 'src/store/apps/report/alarmInvestigation';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';

interface InvestigationUpdateProps {
  device: AlarmInvestigationType;
}

const InvestigationUpdate: React.FC<InvestigationUpdateProps> = ({ device }) => {
  // Hide the Update Button for investigations that are done or resolved
  if (device.status === 'Done' || device.status === 'Resolved') {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [showPostponeForm, setShowPostponeForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatDateTimeLocal = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parsed = dayjs(dateStr);
    return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : '';
  };

  const [formData, setFormData] = useState({
    personnelIds: (device.personnelId ? [device.personnelId] : []) as string[],
    note: device.note || '',
    result: device.result || '',
    isNoAction: false,
    postponedUntil: formatDateTimeLocal(device.postponedUntil),
    attachments: device.attachments || [],
  });

  const { data: personnelResponse } = usePersonnelLookup({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', search:'' });
  const personnelList = personnelResponse?.data || [];

  const uploadMutation = useUploadCDN();

  const createInvestigationMutation = useCreateAlarmInvestigation({
    AlarmCaseId: device.id,
    note: 'Case investigation started.',
  });

  const acknowledgeMutation = useAcknowledgeInvestigation(device.id);
  const dispatchMutation = useDispatchInvestigation(device.id, formData.personnelIds);
  const resolveMutation = useResolveInvestigation(device.id, {
    note: formData.note,
    result: formData.result,
    isNoAction: formData.isNoAction,
    attachments: formData.attachments,
  });
  const postponeMutation = usePostponeInvestigation(device.id, {
    postponedUntil: formData.postponedUntil ? dayjs(formData.postponedUntil).toISOString() : '',
    note: formData.note,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        personnelIds: device.personnelId ? [device.personnelId] : [],
        note: device.note || '',
        result: device.result || '',
        isNoAction: false,
        postponedUntil: formatDateTimeLocal(device.postponedUntil),
        attachments: device.attachments || [],
      });
      setShowPostponeForm(false);
    }
  }, [open, device]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const uploadData = new FormData();
      uploadData.append('file', file);

      const uploadRes = await uploadMutation.mutateAsync(uploadData);
      const uploaded = uploadRes?.collection?.data?.[0];
      if (!uploaded || !uploaded.fileUrl) {
        throw new Error('Invalid response from CDN upload');
      }

      const newAttachment: AttachmentsType = {
        fileType: file.type || 'application/octet-stream',
        fileUrl: uploaded.fileUrl,
      };

      setFormData((prev) => ({
        ...prev,
        attachments: [...prev.attachments, newAttachment],
      }));
      toast.success('Attachment uploaded successfully!');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload attachment.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleAcknowledge = async () => {
    try {
      setIsSaving(true);
      await acknowledgeMutation.mutateAsync();
      toast.success('Investigation acknowledged successfully!');
      handleClose();
    } catch (error) {
      console.error('Error acknowledging investigation:', error);
      toast.error('Failed to acknowledge investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatch = async () => {
    if (formData.personnelIds.length === 0) {
      toast.error('Please select personnel to dispatch.');
      return;
    }
    try {
      setIsSaving(true);
      await dispatchMutation.mutateAsync();
      toast.success('Personnel dispatched successfully!');
      handleClose();
    } catch (error) {
      console.error('Error dispatching investigation:', error);
      toast.error('Failed to dispatch personnel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsSaving(true);
      await resolveMutation.mutateAsync();
      toast.success('Investigation resolved successfully!');
      handleClose();
    } catch (error) {
      console.error('Error resolving investigation:', error);
      toast.error('Failed to resolve investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePostpone = async () => {
    if (!formData.postponedUntil) {
      toast.error('Please select postponed date and time.');
      return;
    }
    try {
      setIsSaving(true);
      await postponeMutation.mutateAsync();
      toast.success('Investigation postponed successfully!');
      handleClose();
    } catch (error) {
      console.error('Error postponing investigation:', error);
      toast.error('Failed to postpone investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  let tooltipTitle = "Update Investigation";
  if (!device.status) {
    tooltipTitle = "Investigate";
  } else if (device.status === 'Acknowledged') {
    tooltipTitle = "Dispatch Personnel";
  } else if (device.status === 'Dispatched') {
    tooltipTitle = "Resolve Case";
  }

  const handleActionClick = async () => {
    if (!device.status) {
      try {
        setIsSaving(true);
        await createInvestigationMutation.mutateAsync();
        toast.success('Investigation started successfully!');
      } catch (error) {
        console.error('Error starting investigation:', error);
        toast.error('Failed to start investigation.');
      } finally {
        setIsSaving(false);
      }
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <Tooltip title={tooltipTitle}>
        <IconButton onClick={handleActionClick} color="primary" size="small" disabled={isSaving}>
          {isSaving && !open ? <CircularProgress size={20} /> : <IconPencil size={20} />}
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Update Investigation Stage
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {showPostponeForm ? (
            <Grid container spacing={2}>
              <Grid size={12}>
                <Typography variant="subtitle1" fontWeight="semibold" mb={1} color="warning.main">
                  Postpone Investigation
                </Typography>
              </Grid>
              <Grid size={12}>
                <CustomFormLabel htmlFor="postponedUntil">Postponed Until</CustomFormLabel>
                <CustomTextField
                  id="postponedUntil"
                  name="postponedUntil"
                  type="datetime-local"
                  fullWidth
                  value={formData.postponedUntil}
                  onChange={handleInputChange}
                  slotProps={{
                    htmlInput: {
                      min: dayjs().format('YYYY-MM-DDTHH:mm'),
                    },
                  }}
                />
              </Grid>
              <Grid size={12}>
                <CustomFormLabel htmlFor="note">Postpone Note</CustomFormLabel>
                <CustomTextField
                  id="note"
                  name="note"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Enter postponement reason/note..."
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2}>
              <Grid size={12}>
                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2, mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Current Status:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">{device.status}</Typography>
                  </Stack>
                </Box>
              </Grid>

              {/* Status specific fields */}
              {(device.status === 'Acknowledged' || device.status === 'Postponed') && (
                <Grid size={12}>
                  <CustomFormLabel htmlFor="personnelIds">Select Personnel for Dispatch</CustomFormLabel>
                  <CustomAutocomplete<PersonnelType>
                    id="personnelIds"
                    placeholder="Select Personnel"
                    multiple={true}
                    options={personnelList}
                    value={personnelList.filter((p) => formData.personnelIds.includes(p.id))}
                    onChange={(selectedOptions) => {
                      setFormData((prev) => ({
                        ...prev,
                        personnelIds: selectedOptions.map((p) => p.id),
                      }));
                    }}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                  />
                </Grid>
              )}

              {device.status === 'Dispatched' && (
                <>
                  <Grid size={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.isNoAction}
                          onChange={handleCheckboxChange}
                          name="isNoAction"
                          color="primary"
                        />
                      }
                      label="No Action Required (False Alarm)"
                    />
                  </Grid>

                  <Grid size={12}>
                    <CustomFormLabel htmlFor="result">Investigation Result / Findings</CustomFormLabel>
                    <CustomTextField
                      id="result"
                      name="result"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Enter investigation details and findings..."
                      value={formData.result}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  <Grid size={12}>
                    <CustomFormLabel htmlFor="note">Resolution Note</CustomFormLabel>
                    <CustomTextField
                      id="note"
                      name="note"
                      multiline
                      rows={2}
                      fullWidth
                      placeholder="Additional resolution notes..."
                      value={formData.note}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  <Grid size={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                      <CustomFormLabel>Attachments (Photos/Files)</CustomFormLabel>
                      <Button
                        variant="outlined"
                        component="label"
                        size="small"
                        startIcon={isUploading ? <CircularProgress size={16} /> : <IconUpload size={16} />}
                        disabled={isUploading}
                      >
                        {isUploading ? 'Uploading...' : 'Upload'}
                        <input type="file" hidden onChange={handleFileUpload} />
                      </Button>
                    </Box>

                    <Stack gap={1} mt={1}>
                      {formData.attachments.map((att, idx) => (
                        <Box
                          key={idx}
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          p={1.5}
                          border="1px solid"
                          borderColor="divider"
                          borderRadius="8px"
                        >
                          <Box display="flex" alignItems="center" gap={1} overflow="hidden">
                            <IconPaperclip size={18} style={{ flexShrink: 0 }} />
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ maxWidth: '350px' }}
                              title={att.fileUrl}
                            >
                              {att.fileUrl.split('/').pop() || 'Attachment'}
                            </Typography>
                          </Box>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveAttachment(idx)}
                          >
                            <IconTrash size={16} />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </>
              )}

              {device.status === 'Idle' && (
                <Grid size={12}>
                  <Typography variant="body2" textAlign="center" color="text.secondary" my={2}>
                    This investigation is currently <strong>Idle</strong>. Click the Acknowledge button below to acknowledge the alarm and proceed to the next stage.
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3 }}>
          {showPostponeForm ? (
            <>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<IconChevronLeft size={16} />}
                onClick={() => setShowPostponeForm(false)}
                disabled={isSaving}
              >
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button
                variant="contained"
                color="warning"
                onClick={handlePostpone}
                disabled={isSaving}
              >
                {isSaving ? 'Postponing...' : 'Confirm Postpone'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
                Cancel
              </Button>
              <Box sx={{ flexGrow: 1 }} />

              {/* Stage Specific Buttons */}
              {device.status === 'Idle' && (
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handleAcknowledge}
                  disabled={isSaving}
                  sx={{
                    px: 3,
                    fontWeight: 'bold',
                    boxShadow: '0px 4px 10px rgba(245, 158, 11, 0.3)',
                    '&:hover': {
                      backgroundColor: 'warning.dark',
                    }
                  }}
                >
                  {isSaving ? 'Acknowledging...' : 'Acknowledge'}
                </Button>
              )}

              {device.status === 'Acknowledged' && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setShowPostponeForm(true)}
                    disabled={isSaving}
                  >
                    Postpone
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDispatch}
                    disabled={isSaving || formData.personnelIds.length === 0}
                    sx={{
                      px: 3,
                      fontWeight: 'bold',
                      boxShadow: '0px 4px 10px rgba(25, 118, 210, 0.3)',
                    }}
                  >
                    {isSaving ? 'Dispatching...' : 'Dispatch'}
                  </Button>
                </Stack>
              )}

              {device.status === 'Dispatched' && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => setShowPostponeForm(true)}
                    disabled={isSaving}
                  >
                    Postpone
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleResolve}
                    disabled={isSaving}
                    sx={{
                      px: 3,
                      fontWeight: 'bold',
                      color: 'white',
                      boxShadow: '0px 4px 10px rgba(46, 125, 50, 0.3)',
                      '&:hover': {
                        backgroundColor: 'success.dark',
                      }
                    }}
                  >
                    {isSaving ? 'Resolving...' : 'Resolve'}
                  </Button>
                </Stack>
              )}

              {device.status === 'Postponed' && (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleAcknowledge}
                    disabled={isSaving}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {isSaving ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleDispatch}
                    disabled={isSaving || formData.personnelIds.length === 0}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {isSaving ? 'Dispatching...' : 'Dispatch'}
                  </Button>
                </Stack>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvestigationUpdate;
