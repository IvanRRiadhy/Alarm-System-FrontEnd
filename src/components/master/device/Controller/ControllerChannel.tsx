import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Box,
  Grid2 as Grid,
  Divider,
  CircularProgress,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { controllerType } from 'src/store/apps/crud/controller';
import { useDeviceList, useEditDevice } from 'src/hooks/useDevice';
import { useChannel, useUpdateChannel } from 'src/hooks/useChannel';
import { channelType } from 'src/store/apps/crud/channel';
import { deviceType } from 'src/store/apps/crud/devices';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import siwiImage from 'src/assets/images/products/Siwi-nobg.png';

interface ControllerChannelProps {
  open: boolean;
  onClose: () => void;
  controller: controllerType | null;
}

const ControllerChannel = ({ open, onClose, controller }: ControllerChannelProps) => {
  const queryClient = useQueryClient();
  const editDevice = useEditDevice();
  const updateChannel = useUpdateChannel();

  const [selectedChannel, setSelectedChannel] = React.useState<channelType | null>(null);
  const [channelSelectionSource, setChannelSelectionSource] = React.useState<'clicked' | 'automatic' | null>(null);
  const [selectedDevice, setSelectedDevice] = React.useState<deviceType | null>(null);
  const [deviceSelectionSource, setDeviceSelectionSource] = React.useState<'clicked' | 'automatic' | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [unassignConfirmOpen, setUnassignConfirmOpen] = React.useState(false);

  const handleUnassign = async () => {
    if (!selectedDevice) return;
    try {
      await editDevice.mutateAsync({
        id: selectedDevice.id,
        channelId: null,
      });
      // Invalidate queries so that updates show up immediately
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.invalidateQueries({ queryKey: ["device-list"] });
      
      toast.success(`Successfully unassigned ${selectedDevice.name}`);
      
      // Reset selection
      setSelectedChannel(null);
      setChannelSelectionSource(null);
      setSelectedDevice(null);
      setDeviceSelectionSource(null);
      setUnassignConfirmOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to unassign device');
      setUnassignConfirmOpen(false);
    }
  };

  const [channelNameInput, setChannelNameInput] = React.useState('');
  const [channelEnabledInput, setChannelEnabledInput] = React.useState(true);

  React.useEffect(() => {
    if (selectedChannel) {
      setChannelNameInput(selectedChannel.name || '');
      setChannelEnabledInput(selectedChannel.isEnabled ?? false);
    } else {
      setChannelNameInput('');
      setChannelEnabledInput(true);
    }
  }, [selectedChannel]);

  const handleUpdateChannel = async () => {
    if (!selectedChannel) return;
    try {
      await updateChannel.mutateAsync({
        id: selectedChannel.id,
        name: channelNameInput,
        isEnabled: channelEnabledInput,
      });
      toast.success('Successfully updated channel settings');
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to update channel');
    }
  };

  const { data: deviceResponse, isLoading: isLoadingDevices } = useDeviceList({page: 1, limit: 100, sortBy: 'status', sortOrder: 'asc'});
  const devices = (deviceResponse?.data || []).filter((d) => d.deviceType !== 'CctvCamera');

  const { data: channelResponse, isLoading: isLoadingChannels } = useChannel({
    page: 1,
    limit: 100,
    sortBy: 'channelNo',
    sortOrder: 'asc',
    controllerId: controller?.id || null,
  });

  const channels = channelResponse?.data || [];
  const channelCount = channels.length;

  const inputChannels = channels.filter((c) => c.type === 'Input');
  const outputChannels = channels.filter((c) => c.type === 'Output');
  const inputDevices = devices.filter((d) => d.deviceIO === 'Input');
  const outputDevices = devices.filter((d) => d.deviceIO === 'Output');

  const deviceOccupyingChannel = selectedChannel 
    ? devices.find((d) => d.channelId === selectedChannel.id)
    : null;
  const isChannelOccupiedByOther = !!(deviceOccupyingChannel && deviceOccupyingChannel.id !== selectedDevice?.id);
  const isChannelDisabled = (channel: channelType) => {
    if (selectedDevice) {
      return (selectedDevice.deviceIO === 'Input' && channel.type === 'Output') ||
             (selectedDevice.deviceIO === 'Output' && channel.type === 'Input');
    }
    return false;
  };

  const isDeviceDisabled = (device: deviceType) => {
    if (selectedChannel) {
      return (selectedChannel.type === 'Input' && device.deviceIO === 'Output') ||
             (selectedChannel.type === 'Output' && device.deviceIO === 'Input');
    }
    return false;
  };

  const handleChannelClick = (channel: channelType) => {
    if (isChannelDisabled(channel)) return;

    // Clear mismatching device selection (e.g. changing channel from output to input)
    if (selectedDevice && selectedDevice.deviceIO !== channel.type) {
      setSelectedDevice(null);
      setDeviceSelectionSource(null);
    }

    setSelectedChannel(channel);
    setChannelSelectionSource('clicked');
    
    // Only autoselect/link if the device wasn't clicked
    if (deviceSelectionSource !== 'clicked') {
      const linkedDevice = devices.find((d) => d.channelId === channel.id);
      if (linkedDevice) {
        setSelectedDevice(linkedDevice);
        setDeviceSelectionSource('automatic');
        setTimeout(() => {
          const deviceEl = document.getElementById(`device-card-${linkedDevice.id}`);
          if (deviceEl) {
            deviceEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 50);
      } else {
        setSelectedDevice(null);
        setDeviceSelectionSource(null);
      }
    }
  };

  const handleDeviceClick = (device: deviceType) => {
    if (isDeviceDisabled(device)) return;

    // Clear mismatching channel selection
    if (selectedChannel && selectedChannel.type !== device.deviceIO) {
      setSelectedChannel(null);
      setChannelSelectionSource(null);
    }

    setSelectedDevice(device);
    setDeviceSelectionSource('clicked');
    
    // Only autoselect/link if the channel wasn't clicked
    if (channelSelectionSource !== 'clicked') {
      if (device.channelId) {
        const linkedChannel = channels.find((c) => c.id === device.channelId);
        if (linkedChannel) {
          setSelectedChannel(linkedChannel);
          setChannelSelectionSource('automatic');
          setTimeout(() => {
            const channelEl = document.getElementById(`channel-box-${linkedChannel.id}`);
            if (channelEl) {
              channelEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);
        } else {
          setSelectedChannel(null);
          setChannelSelectionSource(null);
        }
      } else {
        setSelectedChannel(null);
        setChannelSelectionSource(null);
      }
    }
  };

  const handleAssign = async () => {
    if (!selectedChannel || !selectedDevice) return;
    try {
      await editDevice.mutateAsync({
        id: selectedDevice.id,
        channelId: selectedChannel.id,
      });
      // Invalidate queries so that updates show up immediately
      await queryClient.invalidateQueries({ queryKey: ["channels"] });
      await queryClient.invalidateQueries({ queryKey: ["device-list"] });
      
      toast.success(`Successfully assigned ${selectedDevice.name} to ${selectedChannel.name}`);
      
      // Reset selection
      setSelectedChannel(null);
      setChannelSelectionSource(null);
      setSelectedDevice(null);
      setDeviceSelectionSource(null);
      setConfirmOpen(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Failed to assign device to channel');
      setConfirmOpen(false);
    }
  };

  // Calculate layout to fit up to 5 columns per row, with equal columns per row
  const getGridLayout = (count: number) => {
    if (count <= 5) {
      return { cols: count || 1, rows: 1 };
    }
    
    // Check perfect divisors from 5 down to 2
    for (let c = 5; c >= 2; c--) {
      if (count % c === 0) {
        return { cols: c, rows: count / c };
      }
    }
    
    // Fallback: choose the column count that minimizes empty slots in the last row
    let cols = 5;
    let rows = Math.ceil(count / 5);
    let minEmpty = Infinity;
    for (let c = 5; c >= 2; c--) {
      const r = Math.ceil(count / c);
      const empty = (r * c) - count;
      if (empty < minEmpty) {
        minEmpty = empty;
        cols = c;
        rows = r;
      }
    }
    return { cols, rows };
  };

  // const { cols, rows } = getGridLayout(channelCount);

  const renderChannelBox = (channel: channelType) => {
    let color = '#28c76f'; // Green
    let bgColor = 'rgba(40, 199, 111, 0.18)';
    let hoverBgColor = 'rgba(40, 199, 111, 0.35)';
    let shadowColor = 'rgba(40, 199, 111, 0.15)';
    let hoverShadowColor = 'rgba(40, 199, 111, 0.3)';
    if (channel.isEnabled === false) {
      color = '#ea5455'; // Red
      bgColor = 'rgba(234, 84, 85, 0.18)';
      hoverBgColor = 'rgba(234, 84, 85, 0.35)';
      shadowColor = 'rgba(234, 84, 85, 0.15)';
      hoverShadowColor = 'rgba(234, 84, 85, 0.3)';
    } else if (channel.isUsed === false) {
      color = '#82868b'; // Grey
      bgColor = 'rgba(130, 134, 139, 0.18)';
      hoverBgColor = 'rgba(130, 134, 139, 0.35)';
      shadowColor = 'rgba(130, 134, 139, 0.15)';
      hoverShadowColor = 'rgba(130, 134, 139, 0.3)';
    }

    const isSelected = selectedChannel?.id === channel.id;
    const disabled = isChannelDisabled(channel);

    return (
      <Box 
        id={`channel-box-${channel.id}`}
        key={channel.id} 
        onClick={() => handleChannelClick(channel)}
        sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: bgColor,
          opacity: disabled ? 0.35 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          filter: disabled ? 'brightness(0.6)' : 'none',
          border: isSelected 
            ? (channelSelectionSource === 'clicked' ? '3px solid #7367f0' : '3px dashed #7367f0') 
            : `2px solid ${color}`,
          borderRadius: '12px',
          width: '100%',
          p: 1.5,
          aspectRatio: '1/1',
          boxShadow: isSelected ? '0 0 12px 3px rgba(115, 103, 240, 0.4)' : `0 8px 32px ${shadowColor}`,
          backdropFilter: 'blur(3px)',
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          transform: isSelected ? 'scale(1.08)' : 'none',
          '&:hover': {
            bgcolor: hoverBgColor,
            transform: 'scale(1.08)',
            boxShadow: isSelected ? '0 0 12px 3px rgba(115, 103, 240, 0.5)' : `0 8px 32px ${hoverShadowColor}`,
          }
        }}
      >
        <Typography variant="h6" sx={{ color: color, fontWeight: 800, fontSize: { xs: '14px', sm: '18px' }, textShadow: `0 2px 4px ${shadowColor}` }}>
          {channel.channelNo}
        </Typography>
        <Typography variant="caption" sx={{ color: color, fontSize: { xs: '7px', sm: '9px' }, fontWeight: 700, textTransform: 'uppercase' }}>
          {channel.type || 'Channel'}
        </Typography>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="div" variant="h4" fontWeight={700}>
          Assign Channel - {controller?.name || 'Controller'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent>
        <Grid container spacing={3}>
          {/* Left Column (3 of 12) - Input Devices list */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderRight: { md: '1px solid rgba(0, 0, 0, 0.08)' },
                pr: { md: 2 }
              }}
            >
              <Typography variant="h5" fontWeight={700} mb={2}>
                Input Devices
              </Typography>
              <Box sx={{ flexGrow: 1, maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
                {isLoadingDevices ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={30} />
                  </Box>
                ) : inputDevices.length === 0 ? (
                  <Typography color="text.secondary">No input devices available</Typography>
                ) : (
                  inputDevices.map((device: any) => {
                    const isSelected = selectedDevice?.id === device.id;
                    const disabled = isDeviceDisabled(device);
                    return (
                      <Box 
                        id={`device-card-${device.id}`}
                        key={device.id} 
                        onClick={() => handleDeviceClick(device)}
                        sx={{ 
                          p: 2, 
                          mb: 1.5, 
                          borderRadius: 2, 
                          opacity: disabled ? 0.35 : 1,
                          pointerEvents: disabled ? 'none' : 'auto',
                          filter: disabled ? 'brightness(0.6)' : 'none', 
                          border: isSelected 
                            ? (deviceSelectionSource === 'clicked' ? '2px solid #7367f0' : '2px dashed #7367f0') 
                            : '1px solid rgba(0, 0, 0, 0.08)',
                          bgcolor: isSelected ? 'rgba(115, 103, 240, 0.04)' : 'background.paper',
                          boxShadow: isSelected ? '0 4px 12px rgba(115, 103, 240, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            borderColor: isSelected ? '#7367f0' : 'primary.light'
                          }
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {device.name}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            SN: {device.serialNumber || 'N/A'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.2, 
                              borderRadius: 1, 
                              fontSize: '9px',
                              fontWeight: 700,
                              bgcolor: 'primary.light', 
                              color: 'primary.main' 
                            }}
                          >
                            {device.deviceType}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.2, 
                              borderRadius: 1, 
                              fontSize: '9px',
                              fontWeight: 700,
                              bgcolor: device.channelId ? 'success.light' : 'grey.200', 
                              color: device.channelId ? 'success.main' : 'text.secondary' 
                            }}
                          >
                            {device.channelId ? 'Assigned' : 'Unassigned'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Grid>

          {/* Middle Column (6 of 12) - Channels */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box 
              sx={{ 
                width: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                gap: 3,
                p: 3,
                borderRadius: 3, 
                border: '1px solid rgba(0, 0, 0, 0.08)',
                bgcolor: 'rgba(0, 0, 0, 0.02)',
                minHeight: '450px'
              }}
            >
              {/* Input Channels Section */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5} color="text.secondary">
                  INPUT CHANNELS
                </Typography>
                {isLoadingChannels ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={30} />
                  </Box>
                ) : inputChannels.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No input channels configured</Typography>
                ) : (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                    gap: 2 
                  }}>
                    {inputChannels.map((channel) => renderChannelBox(channel))}
                  </Box>
                )}
              </Box>

              <Divider />

              {/* Output Channels Section */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5} color="text.secondary">
                  OUTPUT CHANNELS
                </Typography>
                {isLoadingChannels ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={30} />
                  </Box>
                ) : outputChannels.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No output channels configured</Typography>
                ) : (
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', 
                    gap: 2 
                  }}>
                    {outputChannels.map((channel) => renderChannelBox(channel))}
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>

          {/* Right Column (3 of 12) - Output Devices list */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                borderLeft: { md: '1px solid rgba(0, 0, 0, 0.08)' },
                pl: { md: 2 }
              }}
            >
              <Typography variant="h5" fontWeight={700} mb={2}>
                Output Devices
              </Typography>
              <Box sx={{ flexGrow: 1, maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
                {isLoadingDevices ? (
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={30} />
                  </Box>
                ) : outputDevices.length === 0 ? (
                  <Typography color="text.secondary">No output devices available</Typography>
                ) : (
                  outputDevices.map((device: any) => {
                    const isSelected = selectedDevice?.id === device.id;
                    const disabled = isDeviceDisabled(device);
                    return (
                      <Box 
                        id={`device-card-${device.id}`}
                        key={device.id} 
                        onClick={() => handleDeviceClick(device)}
                        sx={{ 
                          p: 2, 
                          mb: 1.5, 
                          borderRadius: 2, 
                          opacity: disabled ? 0.35 : 1,
                          pointerEvents: disabled ? 'none' : 'auto',
                          filter: disabled ? 'brightness(0.6)' : 'none', 
                          border: isSelected 
                            ? (deviceSelectionSource === 'clicked' ? '2px solid #7367f0' : '2px dashed #7367f0') 
                            : '1px solid rgba(0, 0, 0, 0.08)',
                          bgcolor: isSelected ? 'rgba(115, 103, 240, 0.04)' : 'background.paper',
                          boxShadow: isSelected ? '0 4px 12px rgba(115, 103, 240, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.02)',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                            borderColor: isSelected ? '#7367f0' : 'primary.light'
                          }
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
                          {device.name}
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={1} mt={0.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            SN: {device.serialNumber || 'N/A'}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.2, 
                              borderRadius: 1, 
                              fontSize: '9px',
                              fontWeight: 700,
                              bgcolor: 'primary.light', 
                              color: 'primary.main' 
                            }}
                          >
                            {device.deviceType}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              px: 1, 
                              py: 0.2, 
                              borderRadius: 1, 
                              fontSize: '9px',
                              fontWeight: 700,
                              bgcolor: device.channelId ? 'success.light' : 'grey.200', 
                              color: device.channelId ? 'success.main' : 'text.secondary' 
                            }}
                          >
                            {device.channelId ? 'Assigned' : 'Unassigned'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>


        {/* Assignment Panel Section */}
        <Box sx={{ mt: 4, p: 2.5, borderRadius: 3, border: '1px solid rgba(0, 0, 0, 0.08)', bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
          <Typography variant="h5" fontWeight={700} mb={2}>
            Assignment Panel
          </Typography>

          {isChannelOccupiedByOther && (
            <Typography variant="body2" color="error.main" sx={{ mb: 2, bgcolor: 'error.light', p: 1.5, borderRadius: 1.5, fontWeight: 700 }}>
              ⚠️ Channel "{selectedChannel?.name}" is already assigned to "{deviceOccupyingChannel?.name}". 
              Please select "{deviceOccupyingChannel?.name}" and click "Unassign" first.
            </Typography>
          )}

          <Grid container spacing={2} alignItems="center">
            {/* Selected Channel Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid rgba(0,0,0,0.06)', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  SELECTED CHANNEL
                </Typography>
                {selectedChannel ? (
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <TextField
                      label="Channel Name"
                      size="small"
                      value={channelNameInput}
                      onChange={(e) => setChannelNameInput(e.target.value)}
                      fullWidth
                    />
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <FormControlLabel
                        control={
                          <Switch
                            checked={channelEnabledInput}
                            onChange={(e) => setChannelEnabledInput(e.target.checked)}
                            color="success"
                          />
                        }
                        label={channelEnabledInput ? "Enabled" : "Disabled"}
                      />
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleUpdateChannel}
                        disabled={updateChannel.isPending}
                        sx={{ py: 0.5, px: 2, fontWeight: 700 }}
                      >
                        {updateChannel.isPending ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Click a channel box above to select
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Connection Arrow */}
            <Grid size={{ xs: 12, md: 2 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography 
                variant="h4" 
                fontWeight={700}
                sx={{ 
                  color: selectedChannel && selectedDevice ? 'primary.main' : 'text.disabled',
                  transform: { xs: 'rotate(90deg)', md: 'none' }
                }}
              >
                →
              </Typography>
            </Grid>

            {/* Selected Device Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper', border: '1px solid rgba(0,0,0,0.06)', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  SELECTED DEVICE
                </Typography>
                {selectedDevice ? (
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} color="primary.main">
                      {selectedDevice.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      SN: {selectedDevice.serialNumber || 'N/A'} | Type: {selectedDevice.deviceType}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    Click a device from the list to select
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          {/* Actions inside panel */}
          <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            
            {(selectedChannel || selectedDevice) && (
              <Button 
                variant="text" 
                color="inherit" 
                onClick={() => {
                  setSelectedChannel(null);
                  setChannelSelectionSource(null);
                  setSelectedDevice(null);
                  setDeviceSelectionSource(null);
                }}
              >
                Clear Selection
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              disabled={!selectedChannel || !selectedDevice || isChannelOccupiedByOther || editDevice.isPending}
              onClick={() => setConfirmOpen(true)}
              sx={{ px: 4, fontWeight: 700 }}
            >
              {editDevice.isPending ? 'Assigning...' : 'Assign'}
            </Button>
            {selectedDevice?.channelId && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={() => setUnassignConfirmOpen(true)}
                disabled={editDevice.isPending}
                sx={{ fontWeight: 700 }}
              >
                Unassign Device
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmOpen} 
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Assignment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" mb={2}>
            Are you sure you want to assign device <strong>{selectedDevice?.name}</strong> to channel <strong>{selectedChannel?.name}</strong>?
          </Typography>
          {selectedDevice?.channelId && (
            <Typography variant="body2" color="error.main" sx={{ bgcolor: 'error.light', p: 1.5, borderRadius: 1.5, fontWeight: 500 }}>
              ⚠️ Warning: This device is currently assigned to another channel. Assigning it here will move it from its previous channel.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setConfirmOpen(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            color="primary" 
            variant="contained" 
            disabled={editDevice.isPending}
            sx={{ fontWeight: 700 }}
          >
            {editDevice.isPending ? 'Assigning...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unassign Confirmation Dialog */}
      <Dialog 
        open={unassignConfirmOpen} 
        onClose={() => setUnassignConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Unassignment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to unassign device <strong>{selectedDevice?.name}</strong> from its current channel?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setUnassignConfirmOpen(false)} color="inherit" variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={handleUnassign} 
            color="error" 
            variant="contained" 
            disabled={editDevice.isPending}
            sx={{ fontWeight: 700 }}
          >
            {editDevice.isPending ? 'Unassigning...' : 'Confirm Unassign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default ControllerChannel;
