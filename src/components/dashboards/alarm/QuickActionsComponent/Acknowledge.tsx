import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Divider,
  Box,
  CircularProgress,
  Stack,
  Chip,
  Card,
  CardContent,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { IconX, IconPaperclip } from '@tabler/icons-react';
import { useAlarmCaseList } from 'src/hooks/useAlarmCase';
import {
  useAlarmInvestigationList,
  useAcknowledgeInvestigation,
  useDispatchInvestigation,
  useResolveInvestigation,
} from 'src/hooks/useAlarmInvestigation';
import { usePersonnelLookup } from 'src/hooks/usePersonnel';
import { useUploadCDN } from 'src/hooks/useCDN';
import { AlarmInvestigationType, AttachmentsType } from 'src/store/apps/report/alarmInvestigation';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

interface AcknowledgeDialogProps {
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'postponed':
      return 'warning';
    case 'done':
    case 'resolved':
    case 'noaction':
      return 'success';
    case 'in progress':
    case 'acknowledged':
      return 'info';
    case 'dispatched':
      return 'secondary';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const InvestigationRow = ({
  inv,
  matchingCase,
  personnelList,
}: {
  inv: AlarmInvestigationType;
  matchingCase: any;
  personnelList: PersonnelType[];
}) => {
  const [personnelIds, setPersonnelIds] = useState<string[]>([]);
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [isNoAction, setIsNoAction] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentsType[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentsType | null>(null);

  const uploadMutation = useUploadCDN();
  const acknowledgeMutation = useAcknowledgeInvestigation(inv.id);
  const dispatchMutation = useDispatchInvestigation(inv.id, personnelIds);
  const resolveMutation = useResolveInvestigation(inv.id, {
    result,
    note,
    isNoAction,
    attachments,
  });

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

      setAttachments((prev) => [...prev, newAttachment]);
      toast.success('Attachment uploaded successfully!');
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload attachment.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAcknowledge = async () => {
    try {
      setIsSaving(true);
      await acknowledgeMutation.mutateAsync();
      toast.success('Case Acknowledged');
    } catch (e) {
      console.error(e);
      toast.error('Failed to acknowledge');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDispatch = async () => {
    if (personnelIds.length === 0) return;
    try {
      setIsSaving(true);
      await dispatchMutation.mutateAsync();
      toast.success('Personnel Dispatched');
    } catch (e) {
      console.error(e);
      toast.error('Failed to dispatch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolve = async () => {
    try {
      setIsSaving(true);
      await resolveMutation.mutateAsync();
      toast.success('Case Resolved');
    } catch (e) {
      console.error(e);
      toast.error('Failed to resolve');
    } finally {
      setIsSaving(false);
    }
  };

  const status = inv.status || 'Idle';

  return (
    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#1E293B', borderColor: 'rgba(255,255,255,0.06)' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2} sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
              {matchingCase?.caseNumber || `Case: ${inv.alarmCaseId}`}
            </Typography>
            {matchingCase && (
              <Typography variant="caption" display="block" color="text.secondary">
                {matchingCase.deviceName} ({matchingCase.severity}) • {matchingCase.siteName} - {matchingCase.buildingName}
              </Typography>
            )}
            <Typography variant="caption" display="block" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              Created: {dayjs(inv.createdAt).format('DD MMM YYYY HH:mm:ss')}
            </Typography>
          </Box>
          <Chip label={status} size="small" color={getStatusColor(status) as any} sx={{ fontWeight: 700 }} />
        </Stack>

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Action Forms */}
        {status === 'Idle' && (
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Investigation started. Needs operator acknowledgment.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              size="small"
              onClick={handleAcknowledge}
              disabled={isSaving}
            >
              {isSaving ? <CircularProgress size={16} color="inherit" /> : 'Acknowledge'}
            </Button>
          </Stack>
        )}

        {status === 'Acknowledged' && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Assign and dispatch personnel to investigate.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ flexGrow: 1 }}>
                <CustomAutocomplete<PersonnelType>
                  id={`personnel-select-${inv.id}`}
                  placeholder="Select Personnel"
                  multiple={true}
                  options={personnelList}
                  value={personnelList.filter((p) => personnelIds.includes(p.id))}
                  onChange={(selected) => setPersonnelIds(selected.map((p) => p.id))}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#0F172A',
                      color: '#F8FAFC',
                      fontSize: 12,
                      borderRadius: 1.5,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                      '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                    },
                  }}
                />
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={handleDispatch}
                disabled={isSaving || personnelIds.length === 0}
                sx={{ height: 40 }}
              >
                {isSaving ? <CircularProgress size={16} color="inherit" /> : 'Dispatch'}
              </Button>
            </Stack>
          </Stack>
        )}

        {status === 'Dispatched' && (
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Investigation ongoing. Enter findings to resolve case.
            </Typography>
            <TextField
              placeholder="Result / Findings..."
              size="small"
              multiline
              rows={2}
              fullWidth
              value={result}
              onChange={(e) => setResult(e.target.value)}
              slotProps={{
                input: {
                  style: { color: '#F8FAFC', backgroundColor: '#0F172A', fontSize: 12 },
                },
              }}
            />
            <TextField
              placeholder="Additional Notes..."
              size="small"
              fullWidth
              value={note}
              onChange={(e) => setNote(e.target.value)}
              slotProps={{
                input: {
                  style: { color: '#F8FAFC', backgroundColor: '#0F172A', fontSize: 12 },
                },
              }}
            />
            
            {/* Attachment Upload Button */}
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="outlined"
                component="label"
                size="small"
                disabled={isUploading || isSaving}
                startIcon={isUploading ? <CircularProgress size={16} color="inherit" /> : <IconPaperclip size={16} />}
                sx={{
                  color: '#F8FAFC',
                  borderColor: 'rgba(255,255,255,0.08)',
                  textTransform: 'none',
                  fontSize: 11,
                  py: 0.75,
                  '&:hover': { borderColor: 'rgba(255,255,255,0.2)' }
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload File / Photo'}
                <input type="file" hidden onChange={handleFileUpload} />
              </Button>
            </Stack>

            {/* Uploaded Attachments Chips */}
            {attachments.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                {attachments.map((att, idx) => (
                  <Chip
                    key={idx}
                    label={att.fileType ? att.fileType.split('/')[1] || att.fileType : 'file'}
                    onClick={() => setPreviewAttachment(att)}
                    onDelete={() => handleRemoveAttachment(idx)}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      fontSize: 10,
                      fontWeight: 600,
                      borderColor: 'rgba(59, 130, 246, 0.4)',
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.1)',
                      }
                    }}
                  />
                ))}
              </Stack>
            )}

            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isNoAction}
                    onChange={(e) => setIsNoAction(e.target.checked)}
                    color="primary"
                    size="small"
                    sx={{ color: 'rgba(255,255,255,0.3)' }}
                  />
                }
                label={<Typography variant="caption" color="text.secondary">No Action (False Alarm)</Typography>}
              />
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleResolve}
                disabled={isSaving || !result.trim()}
              >
                {isSaving ? <CircularProgress size={16} color="inherit" /> : 'Resolve'}
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewAttachment}
        onClose={() => setPreviewAttachment(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            bgcolor: '#111827',
            color: '#F8FAFC',
            border: '1px solid rgba(255,255,255,0.08)',
            p: 1,
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Attachment Preview
          </Typography>
          <IconButton onClick={() => setPreviewAttachment(null)} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={18} />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', bgcolor: '#0F172A' }}>
          {previewAttachment && (() => {
            const fileUrl = previewAttachment.fileUrl || '';
            const fileType = previewAttachment.fileType || '';
            const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
            const isVideo = fileType.startsWith('video/') || /\.(mp4|webm|ogg)$/i.test(fileUrl);

            if (isImage) {
              return (
                <Box
                  component="img"
                  src={fileUrl}
                  alt="Attachment Preview"
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              );
            } else if (isVideo) {
              return (
                <Box
                  component="video"
                  src={fileUrl}
                  controls
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '70vh',
                    borderRadius: '8px',
                  }}
                />
              );
            } else {
              return (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Preview not available for this file type.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open / Download File
                  </Button>
                </Box>
              );
            }
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export const AcknowledgeDialog = ({ open, onClose }: AcknowledgeDialogProps) => {
  const { data: casesResponse } = useAlarmCaseList({ page: 1, limit: 100 });
  const casesList = casesResponse?.data || [];

  const { data: investigationsResponse, isLoading } = useAlarmInvestigationList({ page: 1, limit: 100 });
  const investigationData = investigationsResponse?.data || [];

  const { data: personnelResponse } = usePersonnelLookup({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', search: '' });
  const personnelList = personnelResponse?.data || [];

  const activeInvestigations = investigationData.filter(
    (inv) => inv.status !== 'Done' && inv.status !== 'Resolved' && inv.status !== 'NoAction'
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: '16px',
          bgcolor: '#111827',
          color: '#F8FAFC',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Quick Investigation Update
        </Typography>
        <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <DialogContent sx={{ p: 2, bgcolor: '#0F172A', maxHeight: '60vh' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : activeInvestigations.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No active investigations. All clear!
            </Typography>
          </Box>
        ) : (
          activeInvestigations.map((inv) => {
            const matchingCase = casesList.find((c) => c.id === inv.alarmCaseId);
            return (
              <InvestigationRow
                key={inv.id}
                inv={inv}
                matchingCase={matchingCase}
                personnelList={personnelList}
              />
            );
          })
        )}
      </DialogContent>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <DialogActions sx={{ p: 2, bgcolor: '#111827' }}>
        <Button onClick={onClose} color="primary" variant="contained" sx={{ px: 3 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
