import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Divider,
} from '@mui/material';
import { IconCamera, IconInfoCircle } from '@tabler/icons-react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useCreateAlarmInvestigation } from 'src/hooks/useAlarmInvestigation';

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

  const [isSaving, setIsSaving] = useState(false);

  const createMutation = useCreateAlarmInvestigation({
    AlarmCaseId: selectedLog?.alarmCaseId ? String(selectedLog.alarmCaseId) : '',
    note: 'Case investigation started.',
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
  const severityColor = severityColors[severity] || '#EAB308';

  const details = [
    { label: 'Lokasi', value: selectedLog.site || 'Unknown Site' },
    { label: 'Lantai', value: selectedLog.floorplanName || 'Unknown Floorplan' },
    { label: 'Zona', value: selectedLog.area || 'Unknown Area' },
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
        {/* <Box
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
        </Box> */}
      </Box>

      {/* Investigate Button */}
      {selectedLog.alarmCaseId && selectedLog.statusAlarm?.toLowerCase() !== 'on' && selectedLog.statusAlarm?.toLowerCase() !== 'active' && (
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
      )}
    </Box>
  );
};

export default EventDetail;

