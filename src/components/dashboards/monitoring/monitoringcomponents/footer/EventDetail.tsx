import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  IconButton,
  CircularProgress,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { IconInfoCircle, IconX, IconUpload, IconTrash, IconPaperclip, IconChevronLeft } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  useCreateAlarmInvestigation,
  useAcknowledgeInvestigation,
  useDispatchInvestigation,
  useResolveInvestigation,
  usePostponeInvestigation,
  useAlarmInvestigationList,
} from 'src/hooks/useAlarmInvestigation';
import { useAlarmCaseList } from 'src/hooks/useAlarmCase';
import { usePersonnelLookup } from 'src/hooks/usePersonnel';
import { useUploadCDN } from 'src/hooks/useCDN';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import { AlarmInvestigationType, AttachmentsType } from 'src/store/apps/report/alarmInvestigation';
import dayjs from 'dayjs';

interface EventDetailProps {
  selectedLog: any;
}

const severityColors: Record<string, string> = {
  Critical: '#991B1B',
  High: '#EF4444',
  Medium: '#F97316',
  Low: '#EAB308',
};

const EventDetail: React.FC<EventDetailProps> = ({ selectedLog }) => {
  // Format today's date: e.g. "Selasa, 6 Mei 2025"
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: alarmCaseResponse } = useAlarmCaseList({ limit: 1000 });
  const alarmCaseData = alarmCaseResponse?.data ?? [];

  const { data: investigationResponse } = useAlarmInvestigationList({ limit: 1000 });
  const investigationData = investigationResponse?.data ?? [];

  const [isSaving, setIsSaving] = useState(false);
  const [isSavingStage, setIsSavingStage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPostponeForm, setShowPostponeForm] = useState(false);

  const [formData, setFormData] = useState({
    personnelIds: [] as string[],
    note: '',
    result: '',
    isNoAction: false,
    postponedUntil: '',
    attachments: [] as AttachmentsType[],
  });

  const { data: personnelResponse } = usePersonnelLookup({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', search: '' });
  const personnelList = personnelResponse?.data || [];

  const uploadMutation = useUploadCDN();
  const queryClient = useQueryClient();

  const caseInvestigations = useMemo(() => {
    if (!selectedLog?.alarmCaseId || !investigationData) return [];
    return investigationData.filter((inv) => String(inv.alarmCaseId) === String(selectedLog.alarmCaseId));
  }, [selectedLog?.alarmCaseId, investigationData]);

  const latestInvestigation = useMemo(() => {
    return caseInvestigations.length > 0 ? caseInvestigations[caseInvestigations.length - 1] : null;
  }, [caseInvestigations]);

  const matchingCase = useMemo(() => {
    if (!selectedLog?.alarmCaseId || !alarmCaseData) return null;
    return alarmCaseData.find((c) => String(c.id) === String(selectedLog.alarmCaseId)) || null;
  }, [selectedLog?.alarmCaseId, alarmCaseData]);

  const device = useMemo<AlarmInvestigationType | null>(() => {
    if (latestInvestigation) return latestInvestigation;
    if (!matchingCase) return null;
    return {
      id: matchingCase.id,
      alarmCaseId: matchingCase.id,
      personnelName: '',
      dispatchedPersonnelIds: [],
      dispatchedPersonnelNames: [],
      status: matchingCase.investigationStatus || 'Idle',
      acknowledgedNote: null,
      dispatchedNote: null,
      postponedNote: null,
      resolvedNote: null,
      note: '',
      result: '',
      postponedUntil: null,
      acknowledgedAt: null,
      dispatchedAt: null,
      waitingAt: null,
      acceptedAt: null,
      arrivedAt: null,
      investigationCompletedAt: null,
      doneAt: null,
      noActionAt: null,
      postponedAt: null,
      createdAt: matchingCase.triggeredAt,
      createdBy: '',
      updatedAt: '',
      attachments: (matchingCase as any).attachments || [],
    };
  }, [latestInvestigation, matchingCase]);

  const formatDateTimeLocal = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parsed = dayjs(dateStr);
    return parsed.isValid() ? parsed.format('YYYY-MM-DDTHH:mm') : '';
  };

  useEffect(() => {
    if (device) {
      setFormData((prev) => {
        const newPersonnelIds = device.dispatchedPersonnelIds || [];
        const newNote = device.note || '';
        const newResult = device.result || '';
        const newPostponedUntil = formatDateTimeLocal(device.postponedUntil);
        const newAttachments = device.attachments || [];

        const isSame =
          JSON.stringify(prev.personnelIds) === JSON.stringify(newPersonnelIds) &&
          prev.note === newNote &&
          prev.result === newResult &&
          prev.postponedUntil === newPostponedUntil &&
          JSON.stringify(prev.attachments) === JSON.stringify(newAttachments);

        if (isSame) {
          return prev;
        }

        return {
          personnelIds: newPersonnelIds,
          note: newNote,
          result: newResult,
          isNoAction: false,
          postponedUntil: newPostponedUntil,
          attachments: newAttachments,
        };
      });
      setShowPostponeForm(false);
    }
  }, [device]);

  const createMutation = useCreateAlarmInvestigation({
    AlarmCaseId: selectedLog?.alarmCaseId ? String(selectedLog.alarmCaseId) : '',
    note: 'Case investigation started.',
  });

  const deviceId = device?.id || '';
  const acknowledgeMutation = useAcknowledgeInvestigation(deviceId);
  const dispatchMutation = useDispatchInvestigation(deviceId, formData.personnelIds);
  const resolveMutation = useResolveInvestigation(deviceId, {
    note: formData.note,
    // result: formData.result,
    isNoAction: formData.isNoAction,
    attachments: formData.attachments,
  });
  const postponeMutation = usePostponeInvestigation(deviceId, {
    postponedUntil: formData.postponedUntil ? dayjs(formData.postponedUntil).toISOString() : '',
    note: formData.note,
  });

  if (!selectedLog) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          bgcolor: '#111827',
          borderRadius: 2,
          border: '1px solid rgba(255,255,255,0.08)',
          p: 3,
          color: '#64748B',
          textAlign: 'center',
        }}
      >
        <IconInfoCircle size={28} />
        <Typography sx={{ mt: 1.5, fontSize: 12, fontWeight: 500 }}>
          Pilih Log untuk melihat informasi detail.
        </Typography>
      </Box>
    );
  }

  const severity = selectedLog.severity || 'Low';
  const severityColor = severityColors[severity] || '#EAB308';

  const details = [
    { label: 'Lokasi', value: selectedLog.site || 'Unknown Site' },
    { label: 'Bangunan', value: selectedLog.building || 'Unknown Building' },
    { label: 'Lantai', value: selectedLog.floor || 'Unknown Floor' },
    { label: 'Device', value: selectedLog.deviceName || 'Unknown Device' },
    { label: 'Deskripsi', value: selectedLog.description || selectedLog.message || 'No Message Available' },
  ];

  const handleInvestigate = async () => {
    if (!selectedLog.alarmCaseId) {
      toast.error('No case associated with this event.');
      return;
    }

    try {
      setIsSaving(true);
      await createMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['alarm-event-list'] });
      toast.success('Investigation started successfully!');
    } catch (error) {
      console.error('Error starting alarm investigation:', error);
      toast.error('Failed to start investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      setIsSavingStage(true);
      await acknowledgeMutation.mutateAsync();
      toast.success('Investigation acknowledged successfully!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error acknowledging investigation:', error);
      toast.error('Failed to acknowledge investigation.');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleDispatch = async () => {
    if (formData.personnelIds.length === 0) {
      toast.error('Please select personnel to dispatch.');
      return;
    }
    try {
      setIsSavingStage(true);
      await dispatchMutation.mutateAsync();
      toast.success('Personnel dispatched successfully!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error dispatching investigation:', error);
      toast.error('Failed to dispatch personnel.');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsSavingStage(true);
      await resolveMutation.mutateAsync();
      toast.success('Investigation resolved successfully!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error resolving investigation:', error);
      toast.error('Failed to resolve investigation.');
    } finally {
      setIsSavingStage(false);
    }
  };

  const handlePostpone = async () => {
    if (!formData.postponedUntil) {
      toast.error('Please select postponed date and time.');
      return;
    }
    try {
      setIsSavingStage(true);
      await postponeMutation.mutateAsync();
      toast.success('Investigation postponed successfully!');
      setDialogOpen(false);
    } catch (error) {
      console.error('Error postponing investigation:', error);
      toast.error('Failed to postpone investigation.');
    } finally {
      setIsSavingStage(false);
    }
  };

  const renderActionSection = () => {
    if (!selectedLog.alarmCaseId) return null;

    const isAlarmActive =
      selectedLog.statusAlarm?.toLowerCase() === 'on' ||
      selectedLog.statusAlarm?.toLowerCase() === 'active';

    if (!isAlarmActive) {
      if (!device || device.status === 'Idle') {
        return (
          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleInvestigate}
              disabled={isSaving}
              sx={{
                bgcolor: '#2563EB',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'none',
                py: 1.25,
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                '&:hover': {
                  bgcolor: '#1d4ed8',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.45)',
                },
              }}
            >
              {isSaving ? 'Starting Investigation...' : 'Investigate'}
            </Button>
          </Box>
        );
      }
      return null;
    }

    const status = device?.status || 'Idle';

    if (status === 'Done' || status === 'Resolved') {
      return (
        <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            fullWidth
            variant="contained"
            disabled
            sx={{
              bgcolor: 'action.disabledBackground',
              color: 'text.disabled',
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'none',
              py: 1.25,
              borderRadius: 2,
            }}
          >
            Resolved
          </Button>
        </Box>
      );
    }

    let buttonLabel = 'Investigate';
    let buttonColor = '#2563EB';
    let hoverColor = '#1d4ed8';
    let shadowColor = 'rgba(37,99,235,0.35)';
    let hoverShadowColor = 'rgba(37,99,235,0.45)';

    if (status === 'Idle') {
      buttonLabel = 'Acknowledge';
      buttonColor = '#EAB308';
      hoverColor = '#CA8A04';
      shadowColor = 'rgba(234,179,8,0.35)';
      hoverShadowColor = 'rgba(234,179,8,0.45)';
    } else if (status === 'Acknowledged' || status === 'Postponed') {
      buttonLabel = 'Dispatch Personnel';
      buttonColor = '#3B82F6';
      hoverColor = '#2563EB';
      shadowColor = 'rgba(59,130,246,0.35)';
      hoverShadowColor = 'rgba(59,130,246,0.45)';
    } else if (status === 'Dispatched') {
      buttonLabel = 'Resolve Case';
      buttonColor = '#10B981';
      hoverColor = '#059669';
      shadowColor = 'rgba(16,185,129,0.35)';
      hoverShadowColor = 'rgba(16,185,129,0.45)';
    }

    return (
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => setDialogOpen(true)}
          sx={{
            bgcolor: buttonColor,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'none',
            py: 1.25,
            borderRadius: 2,
            boxShadow: `0 4px 14px ${shadowColor}`,
            '&:hover': {
              bgcolor: hoverColor,
              boxShadow: `0 6px 20px ${hoverShadowColor}`,
            },
          }}
        >
          {buttonLabel}
        </Button>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: '#111827',
        borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.5px',
          }}
        >
          DETAIL EVENT
        </Typography>
        <Typography
          sx={{
            color: '#64748B',
            fontSize: 11,
          }}
        >
          {selectedLog.time || formattedDate}
        </Typography>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          px: 2,
          py: 1.5,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        {/* Event Title + Severity */}
        <Box>
          <Typography
            sx={{
              color: '#F8FAFC',
              fontSize: 14,
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            {selectedLog.message}
          </Typography>
          <Chip
            label={severity}
            size="small"
            sx={{
              height: 20,
              fontSize: 10,
              fontWeight: 700,
              bgcolor: `${severityColor}20`,
              color: severityColor,
              border: `1px solid ${severityColor}40`,
            }}
          />
        </Box>

        {/* Detail Fields */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {details.map((field) => (
            <Box
              key={field.label}
              sx={{
                display: 'flex',
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  color: '#64748B',
                  fontSize: 11,
                  minWidth: 60,
                  flexShrink: 0,
                }}
              >
                {field.label}
              </Typography>
              <Typography
                sx={{
                  color: '#E2E8F0',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {field.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Action Button Section */}
      {renderActionSection()}

      {/* Dialog for updating investigation stage */}
      {device && (
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight="bold">
              Update Investigation Stage
            </Typography>
            <IconButton onClick={() => setDialogOpen(false)} size="small" sx={{ color: 'text.secondary' }}>
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
                  disabled={isSavingStage}
                >
                  Back
                </Button>
                <Box sx={{ flexGrow: 1 }} />
                <Button
                  variant="contained"
                  color="warning"
                  onClick={handlePostpone}
                  disabled={isSavingStage}
                >
                  {isSavingStage ? 'Postponing...' : 'Confirm Postpone'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outlined" color="error" onClick={() => setDialogOpen(false)} disabled={isSavingStage}>
                  Cancel
                </Button>
                <Box sx={{ flexGrow: 1 }} />

                {device.status === 'Idle' && (
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleAcknowledge}
                    disabled={isSavingStage}
                    sx={{
                      px: 3,
                      fontWeight: 'bold',
                      boxShadow: '0px 4px 10px rgba(245, 158, 11, 0.3)',
                      '&:hover': {
                        backgroundColor: 'warning.dark',
                      }
                    }}
                  >
                    {isSavingStage ? 'Acknowledging...' : 'Acknowledge'}
                  </Button>
                )}

                {device.status === 'Acknowledged' && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setShowPostponeForm(true)}
                      disabled={isSavingStage}
                    >
                      Postpone
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDispatch}
                      disabled={isSavingStage || formData.personnelIds.length === 0}
                      sx={{
                        px: 3,
                        fontWeight: 'bold',
                        boxShadow: '0px 4px 10px rgba(25, 118, 210, 0.3)',
                      }}
                    >
                      {isSavingStage ? 'Dispatching...' : 'Dispatch'}
                    </Button>
                  </Stack>
                )}

                {device.status === 'Dispatched' && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={() => setShowPostponeForm(true)}
                      disabled={isSavingStage}
                    >
                      Postpone
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleResolve}
                      disabled={isSavingStage}
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
                      {isSavingStage ? 'Resolving...' : 'Resolve'}
                    </Button>
                  </Stack>
                )}

                {device.status === 'Postponed' && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={handleAcknowledge}
                      disabled={isSavingStage}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {isSavingStage ? 'Acknowledging...' : 'Acknowledge'}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleDispatch}
                      disabled={isSavingStage || formData.personnelIds.length === 0}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {isSavingStage ? 'Dispatching...' : 'Dispatch'}
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EventDetail;
