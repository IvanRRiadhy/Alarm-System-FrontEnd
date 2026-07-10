import React, { useState } from 'react';
import {
  Box,
  Grid2 as Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TableSortLabel,
  Skeleton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconTrash, IconPencil } from '@tabler/icons-react';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import toast from 'react-hot-toast';
import {
  ScheduleDataType,
  UpdateScheduleFilter,
  SelectedSchedule,
} from 'src/store/apps/crud/schedule';
import { useDeleteSchedule, useScheduleList } from 'src/hooks/useSchedule';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import { useNavigate } from 'react-router';
import { toastError } from 'src/utils/errors';

const columns = [
  { label: 'Schedule Name', field: 'name', sortAble: true },
  { label: 'Site Name', field: 'siteId', sortAble: true },
  { label: 'Status', field: 'isActive', sortAble: true },
];

const SKELETON_ROWS = 5;

const ScheduleList: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const scheduleFilter = useSelector((state: RootState) => state.scheduleReducer.scheduleFilter);

  const { data, isLoading } = useScheduleList(scheduleFilter);
  const { data: siteRes } = useSiteLookup();
  const deleteMutation = useDeleteSchedule();

  const scheduleData = data?.data || [];
  const scheduleFilteredCount = data?.meta?.totalItems || 0;
  const sites = siteRes?.data || [];

  // Pagination & Sorting State
  const page = scheduleFilter.page;
  const rowsPerPage = scheduleFilter.limit;
  const orderBy = scheduleFilter.sortBy;
  const order = scheduleFilter.sortOrder;

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [targetSchedule, setTargetSchedule] = useState<ScheduleDataType | null>(null);

  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch(UpdateScheduleFilter({ ...scheduleFilter, page: newPage + 1 }));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = parseInt(event.target.value, 10);
    dispatch(UpdateScheduleFilter({ ...scheduleFilter, limit: newLength, page: 1 }));
  };

  const handleSort = (column: string) => {
    const isAsc = scheduleFilter.sortBy === column && scheduleFilter.sortOrder === 'asc';
    const isDesc = scheduleFilter.sortBy === column && scheduleFilter.sortOrder === 'desc';

    if (isDesc) {
      dispatch(
        UpdateScheduleFilter({
          ...scheduleFilter,
          sortBy: 'UpdatedAt',
          sortOrder: 'desc',
          page: 1,
        })
      );
    } else {
      dispatch(
        UpdateScheduleFilter({
          ...scheduleFilter,
          sortBy: column,
          sortOrder: isAsc ? 'desc' : 'asc',
          page: 1,
        })
      );
    }
  };

  const handleEdit = (schedule: ScheduleDataType) => {
    dispatch(SelectedSchedule(schedule));
    navigate('/master/schedule/edit');
  };

  const handleOpenDeleteDialog = (schedule: ScheduleDataType) => {
    setTargetSchedule(schedule);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTargetSchedule(null);
  };

  const handleConfirmDelete = async () => {
    if (targetSchedule) {
      try {
        await deleteMutation.mutateAsync(targetSchedule.id);
        toast.success('Schedule deleted successfully');
      } catch (error) {
        toastError(error, 'Failed to delete schedule');
        console.error(error);
      }
    }
    handleCloseDeleteDialog();
  };

  const getSiteName = (siteId: string) => {
    const site = sites.find((s) => s.id === siteId);
    return site ? site.name : 'Unknown Site';
  };

  const renderSkeletonRows = (rows: number) => (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          <TableCell sx={{ width: 35, minWidth: 35, maxWidth: 35 }}>
            <Skeleton variant="text" width={18} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={220} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={180} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={80} height={22} />
          </TableCell>
          <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>
            <Box display="flex" gap={1}>
              <Skeleton variant="rounded" width={70} height={32} />
            </Box>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Grid container spacing={3}>
      <Grid size={12}>
        <Box sx={{ overflow: 'auto', maxWidth: '100%' }}>
          <BlankCard>
            <TableContainer sx={{ maxHeight: '58vh' }}>
              <Table stickyHeader sx={{ whiteSpace: 'nowrap' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 35, minWidth: 35, maxWidth: 35 }}>
                      <Typography variant="h6"></Typography>
                    </TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.label}>
                        {col.sortAble && col.field ? (
                          <TableSortLabel
                            active={orderBy === col.field}
                            direction={orderBy === col.field ? order : 'asc'}
                            onClick={() => handleSort(col.field)}
                          >
                            <Typography variant="h6">{col.label}</Typography>
                          </TableSortLabel>
                        ) : (
                          <Typography variant="h6">{col.label}</Typography>
                        )}
                      </TableCell>
                    ))}
                    <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                      <Typography variant="h6">Actions</Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isLoading
                    ? renderSkeletonRows(rowsPerPage || SKELETON_ROWS)
                    : scheduleData.map((schedule, index) => (
                        <TableRow key={schedule.id || index} hover>
                          <TableCell sx={{ width: 35, minWidth: 35, maxWidth: 35 }}>
                            {index + 1 + (page - 1) * rowsPerPage}
                          </TableCell>
                          <TableCell>{schedule.name}</TableCell>
                          <TableCell>{getSiteName(schedule.siteId)}</TableCell>
                          <TableCell>{schedule.isActive ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Tooltip title="Edit" arrow>
                                <IconButton color="primary" size="small" onClick={() => handleEdit(schedule)}>
                                  <IconPencil size={20} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete" arrow>
                                <IconButton color="error" size="small" onClick={() => handleOpenDeleteDialog(schedule)}>
                                  <IconTrash size={20} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={scheduleFilteredCount}
              page={page - 1}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
              rowsPerPageOptions={[5, 10, 25]}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </BlankCard>
        </Box>
      </Grid>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the schedule <strong>{targetSchedule?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color={deleteMutation.isPending ? 'primary' : 'error'}
            disabled={deleteMutation.isPending}
            startIcon={deleteMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ScheduleList;
