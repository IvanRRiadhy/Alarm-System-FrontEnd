import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid2 as Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import { RootState, useDispatch, useSelector } from 'src/store/Store';
import { UpdateFilter, investigateType } from 'src/store/apps/report/investigate';
import { useInfiniteInvestigateList } from 'src/hooks/useInvestigate';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { format } from 'date-fns';

const timeRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'weekly', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'last_monthly', label: 'Last Month' },
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Date Range' },
];

const sortByOptions = [
  { value: 'triggeredAt', label: 'Triggered Date' },
  { value: 'caseNumber', label: 'Case Number' },
  { value: 'severity', label: 'Severity' },
];

const sortOrderOptions = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
];

const getSeverityColor = (severity?: string) => {
  const s = severity?.toLowerCase();
  if (s === 'critical') return { bg: 'rgba(234, 84, 85, 0.15)', text: '#ea5455' };
  if (s === 'high') return { bg: 'rgba(255, 159, 67, 0.15)', text: '#ff9f43' };
  if (s === 'medium') return { bg: 'rgba(0, 207, 232, 0.15)', text: '#00cfe8' };
  return { bg: 'rgba(40, 199, 111, 0.15)', text: '#28c76f' }; // low / default
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'postponed':
      return 'warning';
    case 'done':
    case 'resolved':
      return 'success';
    case 'in progress':
    case 'acknowledged':
      return 'info';
    case 'cancelled':
      return 'error';
    default:
      return 'error';
  }
};

const InvestigateList = () => {
  const dispatch = useDispatch();
  const investigateFilter = useSelector((state: RootState) => state.InvestigateReducer.investigateFilter);

  const [selectedItem, setSelectedItem] = useState<investigateType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleItemClick = (item: investigateType) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedItem(null);
  };

  // local controls for search and sorting
  const [searchValue, setSearchValue] = useState(investigateFilter.search || '');
  const [selectedTimeRange, setSelectedTimeRange] = useState(investigateFilter.timeRange || 'all');
  const [customStartDate, setCustomStartDate] = useState(investigateFilter.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(investigateFilter.endDate || '');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== investigateFilter.search) {
        dispatch(UpdateFilter({ search: searchValue || undefined }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue, investigateFilter.search, dispatch]);

  const limit = 12;
  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteInvestigateList(investigateFilter, limit);

  const listItems = data?.pages.flatMap((page) => page.data) || [];
  const totalItems = data?.pages[0]?.meta?.totalItems || 0;
  const loadedCount = listItems.length;

  const handleTimeRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedTimeRange(value);
    if (value === 'custom') {
      // Don't apply filter until start/end dates are chosen
      dispatch(UpdateFilter({ timeRange: undefined }));
    } else {
      setCustomStartDate('');
      setCustomEndDate('');
      dispatch(
        UpdateFilter({
          timeRange: value === 'all' ? undefined : (value as any),
          startDate: undefined,
          endDate: undefined,
        })
      );
    }
  };
 
  const handleCustomDateChange = (type: 'start' | 'end', val: string) => {
    if (type === 'start') {
      setCustomStartDate(val);
      dispatch(UpdateFilter({ startDate: val || undefined }));
    } else {
      setCustomEndDate(val);
      dispatch(UpdateFilter({ endDate: val || undefined }));
    }
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(UpdateFilter({ sortBy: e.target.value }));
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(UpdateFilter({ sortOrder: e.target.value }));
  };

  const formatDateString = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, height: '100%', overflow: 'hidden' }}>
      {/* Top Header Card containing Time filter, Sort, and Search */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            {/* Time Filter */}
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel sx={{ mt: 0 }}>Filter by time :</CustomFormLabel>
              <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
                <CustomTextField
                  select
                  fullWidth
                  value={selectedTimeRange}
                  onChange={handleTimeRangeChange}
                >
                  {timeRangeOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>

                {selectedTimeRange === 'custom' && (
                  <Stack direction="row" gap={1} width="100%">
                    <TextField
                      type="date"
                      value={customStartDate}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      size="small"
                      placeholder="Start"
                    />
                    <TextField
                      type="date"
                      value={customEndDate}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      size="small"
                      placeholder="End"
                    />
                  </Stack>
                )}
              </Stack>
            </Grid>

            {/* Sort Controls */}
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel sx={{ mt: 0 }}>Sort By :</CustomFormLabel>
              <Stack direction="row" gap={2}>
                <CustomTextField
                  select
                  fullWidth
                  value={investigateFilter.sortBy || 'triggeredAt'}
                  onChange={handleSortByChange}
                >
                  {sortByOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
                <CustomTextField
                  select
                  fullWidth
                  value={investigateFilter.sortOrder || 'desc'}
                  onChange={handleSortOrderChange}
                >
                  {sortOrderOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </CustomTextField>
              </Stack>
            </Grid>

            {/* Search Input */}
            <Grid size={{ xs: 12, md: 4 }}>
              <CustomFormLabel sx={{ mt: 0 }}>Search :</CustomFormLabel>
              <CustomTextField
                fullWidth
                placeholder="Search case number, device, area..."
                value={searchValue}
                onChange={(e: any) => setSearchValue(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Grid Card display of cases */}
      <Scrollbar sx={{ flexGrow: 1, height: '100%', pr: 1, pb: 2 }}>
        {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : listItems.length === 0 ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">No alarm cases found.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {listItems.map((item) => {
              const sev = getSeverityColor(item.severity);
              return (
                <Grid key={item.caseId} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                      }
                    }} 
                    variant="outlined"
                    onClick={() => handleItemClick(item)}
                  >
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                          {item.caseNumber}
                        </Typography>
                        <Chip
                          label={item.severity}
                          size="small"
                          sx={{
                            backgroundColor: sev.bg,
                            color: sev.text,
                            fontWeight: 700,
                            borderRadius: '6px',
                          }}
                        />
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Location:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.siteName} - {item.buildingName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.floorName} - {item.areaName}
                        </Typography>
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Device:
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {item.deviceName}
                        </Typography>
                        <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                          Type: {item.deviceType}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 'auto', pt: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Timeline:
                        </Typography>
                        <Typography variant="caption" display="block" fontWeight={500}>
                          Triggered: {formatDateString(item.triggeredAt)}
                        </Typography>
                        <Typography variant="caption" display="block" fontWeight={500} color="text.secondary">
                          Cleared: {item.clearedAt ? formatDateString(item.clearedAt) : 'Still Active'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination and Load More Footer */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {loadedCount} of {totalItems} Loaded
            </Typography>

            {hasNextPage && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                startIcon={isFetchingNextPage ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {isFetchingNextPage ? 'Loading more...' : 'Load More'}
              </Button>
            )}
          </Box>
        </>
      )}
      </Scrollbar>

      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: '#111827',
            color: '#F8FAFC',
            border: '1px solid rgba(255,255,255,0.08)',
          }
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            Case Detail: {selectedItem?.caseNumber}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'text.secondary' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
        <DialogContent sx={{ p: 3, bgcolor: '#0F172A' }}>
          {selectedItem && (
            <Grid container spacing={3}>
              {/* Section 1: Overview */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                    Case Overview
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Case ID
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
                      {selectedItem.caseId}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 1.5 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Severity</Typography>
                      <Chip 
                        label={selectedItem.severity} 
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(selectedItem.severity).bg,
                          color: getSeverityColor(selectedItem.severity).text,
                          fontWeight: 700,
                          borderRadius: '6px',
                          mt: 0.5
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
                      <Chip 
                        label={selectedItem.investigationStatus || 'Pending'} 
                        size="small"
                        color={getStatusColor(selectedItem.investigationStatus || '') as any}
                        sx={{ fontWeight: 700, borderRadius: '6px', mt: 0.5 }}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                        Triggered At
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDateString(selectedItem.triggeredAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                        Cleared At
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedItem.clearedAt ? formatDateString(selectedItem.clearedAt) : 'Still Active'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>

              {/* Section 2: Location */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                    Location Information
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Site / Region
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.siteName} (Region: {selectedItem.siteRegion || 'N/A'})
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Building
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.buildingName}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Floor
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.floorName} ({selectedItem.floorplanName || 'No Floorplan'})
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Area
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.areaName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Section 3: Device & Controller */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                    Device & Controller
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Device Name
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.deviceName}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Device Type
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.deviceType}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Controller Name
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.controllerName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Section 4: Personnel */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2, height: '100%' }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                    Personnel & Dispatches
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                      Investigator
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {selectedItem.personnelName ? `${selectedItem.personnelName}` : 'Unassigned'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500, mb: 0.5 }}>
                      Dispatched Personnel
                    </Typography>
                    {selectedItem.dispatchedPersonnelNames && selectedItem.dispatchedPersonnelNames.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        {selectedItem.dispatchedPersonnelNames.map((name, index) => (
                          <Chip 
                            key={index} 
                            label={name} 
                            size="small" 
                            variant="outlined" 
                            sx={{ color: '#F8FAFC', borderColor: 'rgba(255,255,255,0.2)' }}
                            // title={`ID: ${selectedItem.dispatchedPersonnelIds?.[index] || 'N/A'}`} 
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        No secondary personnel dispatched.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Section 5: Timeline & Logs */}
              <Grid size={12}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                    Investigation Timeline Logs
                  </Typography>
                  <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Dispatched At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.dispatchedAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Accepted At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.acceptedAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Arrived At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.arrivedAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Postponed At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.postponedAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Postponed Until</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.postponedUntil)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>No Action At (False Alarm)</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.noActionAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Done Investigated At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.doneInvestigatedAt)}</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>Done At</Typography>
                        <Typography variant="body2" fontWeight={600}>{formatDateString(selectedItem.doneAt)}</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Section 6: Results / Notes */}
              {(selectedItem.investigationResult || selectedItem.investigationNote) && (
                <Grid size={12}>
                  <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="primary.main">
                      Investigation Findings
                    </Typography>
                    <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.05)' }} />
                    {selectedItem.investigationResult && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                          Result / Findings
                        </Typography>
                        <Box sx={{ p: 1.5, mt: 0.5, bgcolor: '#1E293B', borderRadius: 1, borderLeft: '4px solid #10B981' }}>
                          <Typography variant="body2">{selectedItem.investigationResult}</Typography>
                        </Box>
                      </Box>
                    )}
                    {selectedItem.investigationNote && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 500 }}>
                          Notes
                        </Typography>
                        <Box sx={{ p: 1.5, mt: 0.5, bgcolor: '#1E293B', borderRadius: 1, borderLeft: '4px solid #0EA5E9' }}>
                          <Typography variant="body2">{selectedItem.investigationNote}</Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: '#111827', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <Button onClick={handleCloseDialog} color="primary" variant="contained" sx={{ px: 4 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvestigateList;
