import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  MenuItem,
  IconButton,
} from '@mui/material';
import { IconCamera, IconInfoCircle, IconX } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { useCreateAlarmInvestigation } from 'src/hooks/useAlarmInvestigation';
import { usePersonnelLookup } from 'src/hooks/usePersonnel';

interface EventDetailProps {
  selectedLog: any;
}

const severityColors: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F59E0B',
  Low: '#3B82F6',
};

const EventDetail: React.FC<EventDetailProps> = ({ selectedLog }) => {
  // Format today's date: e.g. "Selasa, 6 Mei 2025"
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    personnelId: '',
    note: '',
  });

  const { data: personnelResponse } = usePersonnelLookup({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc', search: '' });
  const personnelList = personnelResponse?.data || [];

  const createMutation = useCreateAlarmInvestigation({
    alarmEventId: selectedLog?.id ? String(selectedLog.id) : '',
    personnelId: formData.personnelId,
    note: formData.note,
  });

  const queryClient = useQueryClient();

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
  const severityColor = severityColors[severity] || '#3B82F6';

  const details = [
    { label: 'Lokasi', value: selectedLog.site || 'KCP Surabaya Diponegoro' },
    { label: 'Lantai', value: selectedLog.floorplanName || 'Lantai 1' },
    { label: 'Zona', value: selectedLog.area || 'Zona 1' },
    { label: 'Device', value: selectedLog.deviceName || 'Unknown Device' },
    { label: 'Deskripsi', value: selectedLog.description || selectedLog.message || 'Tidak ada deskripsi' },
  ];

  const handleOpen = () => {
    setFormData({
      personnelId: '',
      note: '',
    });
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

  const handleSave = async () => {
    if (!formData.personnelId) {
      toast.error('Please select a personnel.');
      return;
    }

    try {
      setIsSaving(true);
      await createMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['alarm-event-list'] });
      toast.success('Event acknowledged and investigation created successfully!');
      handleClose();
    } catch (error) {
      console.error('Error creating alarm investigation:', error);
      toast.error('Failed to acknowledge event.');
    } finally {
      setIsSaving(false);
    }
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

        {/* Event Thumbnail */}
        <Box
          sx={{
            bgcolor: '#0a0e1a',
            borderRadius: 1.5,
            overflow: 'hidden',
            minHeight: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.04)',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
              opacity: 0.7,
            }}
          />
          <IconCamera size={24} color="#334155" style={{ position: 'relative', zIndex: 1 }} />
        </Box>
      </Box>

      {/* Acknowledge Button */}
      {selectedLog.statusAlarm?.toLowerCase() !== 'on' && selectedLog.statusAlarm?.toLowerCase() !== 'active' && (
        <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleOpen}
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
            Acknowledge
          </Button>
        </Box>
      )}

      {/* Acknowledge Event / Create Investigation Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Acknowledge Event
          </Typography>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Personnel Select */}
            <Box>
              <CustomFormLabel htmlFor="personnelId">Assign Personnel</CustomFormLabel>
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
                {personnelList.map((p: any) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Box>

            {/* Notes input */}
            <Box>
              <CustomFormLabel htmlFor="note">Notes</CustomFormLabel>
              <CustomTextField
                id="note"
                name="note"
                multiline
                rows={3}
                fullWidth
                placeholder="Enter notes for this investigation..."
                value={formData.note}
                onChange={handleInputChange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button variant="outlined" color="error" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetail;

