import React from 'react';
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
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useControllerList, useChangeStatusController } from 'src/hooks/useController';
import { controllerType } from 'src/store/apps/crud/controller';
import toast from 'react-hot-toast';
import { toastError } from 'src/utils/errors';

interface ControllerControlDialogProps {
  open: boolean;
  onClose: () => void;
}

const getStatusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'online') return 'success';
  if (s === 'offline') return 'error';
  return 'warning';
};

const ControllerRow = ({
  controller,
  onChangeStatus,
  isPending,
}: {
  controller: controllerType;
  onChangeStatus: (id: string, mode: string) => void;
  isPending: boolean;
}) => {
  return (
    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#1E293B', borderColor: 'rgba(255,255,255,0.06)' }}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" color="primary.main">
              {controller.name}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Site: {controller.siteName || 'N/A'} • IP: {controller.ipAddress}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              MAC: {controller.macAddress}
            </Typography>
          </Box>
          <Stack spacing={1} alignItems="flex-end">
            <Chip 
              label={controller.status || 'Offline'} 
              size="small" 
              color={getStatusColor(controller.status) as any} 
              sx={{ fontWeight: 700, textTransform: 'capitalize' }} 
            />
            <Chip
              label={controller.alarmMode || 'Disarmed'}
              size="small"
              color={
                controller.alarmMode === 'Disarmed'
                  ? 'success'
                  : controller.alarmMode === 'Acknowledge'
                  ? 'info'
                  : 'warning'
              }
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

        <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
          {['Disarmed', 'ArmedStay', 'ArmedAway', 'Acknowledge'].map((mode) => (
            <Button
              key={mode}
              variant={controller.alarmMode === mode ? 'contained' : 'outlined'}
              size="small"
              color={
                mode === 'Disarmed'
                  ? 'success'
                  : mode === 'Acknowledge'
                  ? 'info'
                  : 'warning'
              }
              onClick={() => onChangeStatus(controller.id, mode)}
              disabled={controller.alarmMode === mode || isPending}
              sx={{
                fontSize: '0.75rem',
                py: 0.5,
                px: 1.5,
                textTransform: 'none',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              {mode}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

export const ControllerControlDialog = ({ open, onClose }: ControllerControlDialogProps) => {
  const { data: controllersResponse, isLoading } = useControllerList({ page: 1, limit: 100 });
  const controllers = controllersResponse?.data || [];

  const changeStatusMutation = useChangeStatusController();

  const handleChangeStatus = async (id: string, alarmMode: string) => {
    try {
      await changeStatusMutation.mutateAsync({ id, alarmMode });
      toast.success('Alarm Mode Updated');
    } catch (error) {
      toastError(error, 'Update failed');
      console.error(error);
    }
  };

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
          Quick Controller Control
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
        ) : controllers.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No controllers registered.
            </Typography>
          </Box>
        ) : (
          controllers.map((controller) => (
            <ControllerRow
              key={controller.id}
              controller={controller}
              onChangeStatus={handleChangeStatus}
              isPending={changeStatusMutation.isPending}
            />
          ))
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
