import React, { useState } from 'react';
import {
  Dialog,
  Box,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useCreateAlarmInvestigation } from 'src/hooks/useAlarmInvestigation';
import { AlarmEvent } from 'src/store/apps/crud/alarmEvent';
import { alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { audioManager } from 'src/utils/audioManager';

interface AlarmPopupProps {
  alarm: AlarmEvent | null;
  onClose: () => void;
}

const AlarmPopup: React.FC<AlarmPopupProps> = ({ alarm, onClose }) => {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (alarm) {
      audioManager.playNotification('/alarm-sfx/alarm_triple.mp3');
    }
  }, [alarm]);

  const createMutation = useCreateAlarmInvestigation({
    AlarmCaseId: alarm?.alarmCaseId ? String(alarm.alarmCaseId) : '',
    note: 'Case investigation started.',
  });

  if (!alarm) return null;

  const handleInvestigate = async () => {
    if (!alarm.alarmCaseId) {
      toast.error('No case associated with this alarm.');
      return;
    }

    try {
      setIsSaving(true);
      await createMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['alarm-event-list'] });
      toast.success('Investigation started successfully!');
      onClose();
    } catch (error) {
      console.error('Error starting alarm investigation:', error);
      toast.error('Failed to start investigation.');
    } finally {
      setIsSaving(false);
    }
  };

  const priorityColor = '#991B1B'; // Critical color (dark red)

  // Place info: FloorplanName | FloorName | BuildingName | SiteName
  const placeInfo = [
    // alarm.floorplanName || alarm.floorplanId,
    alarm.floorName || alarm.floorId,
    alarm.buildingName || alarm.buildingId,
    alarm.siteName || alarm.siteId,
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <Dialog
      open={Boolean(alarm)}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          alignItems: 'stretch',
          justifyContent: 'center',
          p: 2,
        }}
      >
        {/* ========= MAIN ALARM PANEL ========= */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <Box
            ref={null}
            sx={{
              background: `linear-gradient(135deg, ${priorityColor}, #450a0a)`,
              color: 'white',
              borderRadius: 4,
              px: { xs: 4, sm: 6 },
              pt: 5,
              pb: 6,
              width: { xs: '90vw', sm: 480, md: 520 },
              textAlign: 'center',
              boxShadow: `0 12px 40px ${alpha(priorityColor, 0.6)}`,
              border: `1px solid ${alpha(priorityColor, 0.4)}`,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              minHeight: 380,
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <IconX size={20} />
            </IconButton>

            <Box>
              <Typography variant="h2" fontWeight="black" letterSpacing={2} mb={1} sx={{ fontSize: '1.8rem', color: '#ff8a8a' }}>
                CRITICAL ALARM
              </Typography>
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.15)', mb: 3 }} />

              <Typography variant="subtitle1" sx={{ color: '#fca5a5', fontWeight: 'bold', mb: 2, fontSize: '0.95rem' }}>
                📍 {placeInfo || 'Unknown Location'}
              </Typography>

              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1, fontSize: '1.25rem' }}>
                {alarm.deviceName || 'Unknown Device'} ({alarm.deviceType || 'Unknown Type'})
              </Typography>

              <Typography variant="body1" sx={{ color: '#e5e7eb', mb: 4, fontSize: '1.05rem', fontStyle: 'italic', px: 2 }}>
                "{alarm.message}"
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 'auto' }}>
              <Button
                variant="contained"
                onClick={handleInvestigate}
                disabled={isSaving}
                sx={{
                  backgroundColor: '#ffffff',
                  color: priorityColor,
                  fontWeight: 'bold',
                  fontSize: '1.05rem',
                  borderRadius: 30,
                  px: 6,
                  py: 1.5,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#f3f4f6',
                    boxShadow: '0 6px 20px rgba(255,255,255,0.4)',
                  },
                }}
              >
                {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Investigate'}
              </Button>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Dialog>
  );
};

export default AlarmPopup;
