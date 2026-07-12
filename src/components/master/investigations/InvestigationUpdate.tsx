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
} from '@mui/material';
import { IconPencil, IconX, IconUpload, IconTrash, IconPaperclip } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useUpdateAlarmInvestigation } from 'src/hooks/useAlarmInvestigation';
import { usePersonnelList, usePersonnelLookup } from 'src/hooks/usePersonnel';
import { useUploadCDN } from 'src/hooks/useCDN';
import { AlarmInvestigationType, AttachmentsType } from 'src/store/apps/crud/alarmInvestigation';
import { investigationResultType } from 'src/types/crud/input';

interface InvestigationUpdateProps {
  device: AlarmInvestigationType;
}

const statusOptions = [
  { label: 'New', value: 'New' },
  { label: 'In Progress', value: 'InProgress' },
  { label: 'Postponed', value: 'Postponed' },
  { label: 'Done', value: 'Done' },
];

const InvestigationUpdate: React.FC<InvestigationUpdateProps> = ({ device }) => {
  // Hide the Update Button for investigation that are done
  if (device.status === 'Done') {
    return null;
  }

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const formatDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const parsed = dayjs(dateStr);
    return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : '';
  };

  const [formData, setFormData] = useState({
    personnelId: device.personnelId || '',
    note: device.note || '',
    status: device.status || '',
    result: device.result || '',
    postponedUntil: formatDateTimeLocal(device.postponedUntil),
    attachments: device.attachments || [],
  });

  const { data: personnelResponse } = usePersonnelLookup({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', search:'' });
  const personnelList = personnelResponse?.data || [];

  const uploadMutation = useUploadCDN();

  const payload = {
    personnelId: formData.personnelId,
    note: formData.note,
    status: formData.status,
    result: formData.result,
    postponedUntil: formData.status === 'Postponed' && formData.postponedUntil
      ? dayjs(formData.postponedUntil).toISOString()
      : '',
    attachments: formData.attachments,
  };

  const updateMutation = useUpdateAlarmInvestigation(device.id, payload);

  useEffect(() => {
    if (open) {
      setFormData({
        personnelId: device.personnelId || '',
        note: device.note || '',
        status: device.status || '',
        result: device.result || '',
        postponedUntil: formatDateTimeLocal(device.postponedUntil),
        attachments: device.attachments || [],
      });
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

  const handleSave = async () => {
    if (!formData.personnelId) {
      toast.error('Please select a personnel.');
      return;
    }
    if (!formData.status) {
      toast.error('Please select a status.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync();
      toast.success('Investigation updated successfully!');
      handleClose();
    } catch (error) {
      console.error('Error saving investigation:', error);
      toast.error('Failed to update investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Tooltip title="Update Investigation">
        <IconButton onClick={handleClickOpen} color="primary" size="small">
          <IconPencil size={20} />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Update Alarm Investigation
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            {/* Personnel Name Select */}
            <Grid size={6}>
              <CustomFormLabel htmlFor="personnelId">Personnel Name</CustomFormLabel>
              <CustomTextField
                id="personnelId"
                name="personnelId"
                select
                fullWidth
                value={formData.personnelId}
                onChange={handleInputChange}
              >
                <MenuItem value="" disabled>
                  Select Personnel
                </MenuItem>
                {personnelList.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>

            {/* Status Select */}
            <Grid size={6}>
              <CustomFormLabel htmlFor="status">Status</CustomFormLabel>
              <CustomTextField
                id="status"
                name="status"
                select
                fullWidth
                value={formData.status}
                onChange={handleInputChange}
              >
                <MenuItem value="" disabled>
                  Select Status
                </MenuItem>
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>



            {/* Postponed Until Date Input */}
            {formData.status === 'Postponed' && (
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
            )}

            {/* Operator Note Text Field */}
            <Grid size={12}>
              <CustomFormLabel htmlFor="result">Result</CustomFormLabel>
              <CustomTextField
                id="result"
                name="result"
                multiline
                rows={3}
                fullWidth
                placeholder="Enter result..."
                value={formData.result}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Attachment Uploader */}
            <Grid size={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                <CustomFormLabel>Attachments</CustomFormLabel>
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
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving || isUploading}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvestigationUpdate;
