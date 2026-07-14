import React, { useState, useEffect } from 'react';
import {
  Dialog,
  Box,
  Button,
  Typography,
  MenuItem,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useCreateAlarmInvestigation } from 'src/hooks/useAlarmInvestigation';
import { usePersonnelLookup } from 'src/hooks/usePersonnel';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { AlarmEvent } from 'src/store/apps/crud/alarmEvent';
import { alpha, useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface AlarmPopupProps {
  alarm: AlarmEvent | null;
  onClose: () => void;
}

const AlarmPopup: React.FC<AlarmPopupProps> = ({ alarm, onClose }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [showInvestigatePanel, setShowInvestigatePanel] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    personnelId: '',
    note: '',
  });

  const { data: personnelResponse } = usePersonnelLookup({
    page: 1,
    limit: 100,
    sortBy: 'name',
    sortOrder: 'asc',
    search: '',
  });
  const personnelList = personnelResponse?.data || [];

  const createMutation = useCreateAlarmInvestigation({
    alarmEventId: alarm?.id ? String(alarm.id) : '',
    personnelId: formData.personnelId,
    note: formData.note,
  });

  useEffect(() => {
    if (alarm) {
      setShowInvestigatePanel(false);
      setFormData({
        personnelId: '',
        note: '',
      });
    }
  }, [alarm]);

  if (!alarm) return null;

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
      toast.error('Please select personnel.');
      return;
    }

    try {
      setIsSaving(true);
      await createMutation.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ['alarm-event-list'] });
      toast.success('Investigation created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating alarm investigation:', error);
      toast.error('Failed to create investigation.');
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
                onClick={() => setShowInvestigatePanel((prev) => !prev)}
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
                Investigate
              </Button>
            </Box>
          </Box>
        </motion.div>

        {/* ========= INVESTIGATE PANEL (RIGHT) ========= */}
        <AnimatePresence>
          {showInvestigatePanel && (
            <motion.div
              initial={{ opacity: 0, x: -30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -30, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <Box
                sx={{
                  background: '#1e293b',
                  color: 'white',
                  borderRadius: 4,
                  p: 4,
                  width: { xs: '90vw', sm: 400 },
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  minHeight: 380,
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Assign Investigation
                  </Typography>
                  <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                  {/* Personnel Select */}
                  <Box sx={{ mb: 3 }}>
                    <CustomFormLabel htmlFor="personnelId" sx={{ color: '#94a3b8' }}>
                      Assign Personnel
                    </CustomFormLabel>
                    <CustomTextField
                      id="personnelId"
                      name="personnelId"
                      select
                      fullWidth
                      value={formData.personnelId}
                      onChange={handleInputChange}
                      slotProps={{
                        select: {
                          MenuProps: {
                            PaperProps: {
                              sx: {
                                bgcolor: '#1e293b',
                                color: 'white',
                                '& .MuiMenuItem-root': {
                                  '&:hover': { bgcolor: '#334155' },
                                  '&.Mui-selected': { bgcolor: '#0284c7' },
                                },
                              },
                            },
                          },
                        },
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                          '&:hover fieldset': { borderColor: '#38bdf8' },
                          '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                        },
                      }}
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

                  {/* Notes */}
                  <Box sx={{ mb: 3 }}>
                    <CustomFormLabel htmlFor="note" sx={{ color: '#94a3b8' }}>
                      Notes
                    </CustomFormLabel>
                    <CustomTextField
                      id="note"
                      name="note"
                      multiline
                      rows={3}
                      fullWidth
                      placeholder="Enter investigation details/notes..."
                      value={formData.note}
                      onChange={handleInputChange}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                          '&:hover fieldset': { borderColor: '#38bdf8' },
                          '&.Mui-focused fieldset': { borderColor: '#38bdf8' },
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setShowInvestigatePanel(false)}
                    disabled={isSaving}
                    sx={{
                      color: '#94a3b8',
                      borderColor: '#475569',
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: 'rgba(255,255,255,0.05)',
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSave}
                    disabled={isSaving}
                    sx={{
                      bgcolor: '#0284c7',
                      color: 'white',
                      textTransform: 'none',
                      fontWeight: 'bold',
                      '&:hover': {
                        bgcolor: '#0369a1',
                      },
                    }}
                  >
                    {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Submit'}
                  </Button>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Dialog>
  );
};

export default AlarmPopup;
