import { BASE_URL } from 'src/utils/axios';
import React, { useEffect, useState } from 'react';
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
  Collapse,
  Tooltip,
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconTrash, IconChevronDown, IconChevronRight, IconMap } from '@tabler/icons-react';
import { useLocation } from 'react-router';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import toast from 'react-hot-toast';
import { toastError } from 'src/utils/errors';
import { UpdateFilter } from 'src/store/apps/crud/devices';
import { defaultDeviceFilter } from 'src/store/apps/defaultForm';
import { useDeviceList, useDeleteDevice } from 'src/hooks/useDevice';
import { deviceType } from 'src/store/apps/crud/devices';
import { useAlarmRuleList, useDeleteAlarmRule } from 'src/hooks/useAlarmRule';
import { AlarmRuleDataType } from 'src/store/apps/crud/alarmRule';
import AddEditAlarmRule from './AddEditAlarmRule';
// import AddEditDevices from './AddEditDevices';
// import MapDeviceDialog from './MapDeviceDialog';

const columns = [
  { label: 'Rule Name', field: 'name', sortAble: true },
  { label: 'Number of Input Devices', field: 'inputs', sortAble: false },
  { label: 'Number of Output Devices', field: 'outputs', sortAble: false },
  { label: 'Schedule Template', field: 'scheduleTemplate', sortAble: true },
];

const SKELETON_ROWS = 5;

const AlarmRuleList = () => {
    const dispatch: AppDispatch = useDispatch();
    const location = useLocation();
    const isChildShown = useSelector((state: RootState) => state.customizer.isChildShown);
    const alarmRuleFilter = useSelector((state: RootState) => state.alarmRuleReducer.alarmRuleFilter);

    useEffect(() => {
      const initialFilter = location.state?.deviceName
        ? { ...defaultDeviceFilter, SearchValue: location.state.deviceName }
        : defaultDeviceFilter;
  
      dispatch(UpdateFilter(initialFilter));
    }, [dispatch, location.state?.deviceName]);

    const { data, isLoading } = useAlarmRuleList(alarmRuleFilter);
    const alarmRuleData = data?.data || [];
    const alarmRuleFilteredCount = data?.meta?.totalItems || 0;

    // Pagination State
    const { alarmRuleMeta } = useSelector((state: RootState) => state.alarmRuleReducer);
    const page = alarmRuleMeta.page;
    const rowsPerPage = alarmRuleMeta.limit;
    const orderBy = alarmRuleFilter.sortBy;
    const order = alarmRuleFilter.sortOrder;

    const handleChangePage = (_: unknown, newPage: number) => {
      dispatch(UpdateFilter({ page: newPage + 1 }));
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newLength = parseInt(event.target.value, 10);
      dispatch(UpdateFilter({ limit: newLength, page: 1 }));
    };

    const handleSort = (column: string) => {
      const isAsc = alarmRuleFilter.sortBy === column && alarmRuleFilter.sortOrder === 'asc';
      const isDesc = alarmRuleFilter.sortBy === column && alarmRuleFilter.sortOrder === 'desc';
  
      if (isDesc) {
        dispatch(
          UpdateFilter({
            sortBy: 'UpdatedAt',
            sortOrder: 'desc',
            page: 1,
          }),
        );
      } else {
        dispatch(
          UpdateFilter({
            sortBy: column,
            sortOrder: isAsc ? 'desc' : 'asc',
            page: 1,
          }),
        );
      }
    };

    const [expandedSiteId, setExpandedSiteId] = useState<string | null>(null);

    const toggleExpand = (siteId: string) => {
      setExpandedSiteId((prev) => (prev === siteId ? null : siteId));
    };

    // Delete Pop-up
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedAlarmRule, setSelectedAlarmRule] = useState<AlarmRuleDataType | null>(null);
    const [mappingDevice, setMappingDevice] = useState<deviceType | null>(null);
    const deleteMutation = useDeleteAlarmRule();

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (alarmRule: AlarmRuleDataType) => {
      setSelectedAlarmRule(alarmRule);
      setDeleteDialogOpen(true);
    };
  
    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
      setDeleteDialogOpen(false);
      setSelectedAlarmRule(null);
    };
  
    // Confirm delete action
    const handleConfirmDelete = async () => {
      if (selectedAlarmRule) {
        try {
          await deleteMutation.mutateAsync(selectedAlarmRule.id);
          toast.success('Data Deleted');
        } catch (error) {
          toastError(error, 'Delete failed');
          console.error(error);
        }
      }
      handleCloseDeleteDialog();
    };

    const renderSkeletonRows = (rows: number) => (
      <>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRow key={`skeleton-${i}`}>
            <TableCell
              sx={{
                position: 'sticky',
                left: 0,
                backgroundColor: 'background.paper',
                zIndex: 1,
                width: 35,
                minWidth: 35,
                maxWidth: 35,
              }}
            >
              <Skeleton variant="text" width={18} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width={220} height={22} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width={120} height={22} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width={100} height={22} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width={80} height={22} />
            </TableCell>
            <TableCell>
              <Skeleton variant="text" width={80} height={22} />
            </TableCell>
            <TableCell
              sx={{
                position: 'sticky',
                right: 0,
                backgroundColor: 'background.paper',
                zIndex: 2,
                width: 150,
                minWidth: 150,
                maxWidth: 150,
              }}
            >
              <Box display="flex" gap={1}>
                <Skeleton variant="rounded" width={90} height={32} />
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
              <TableContainer
                sx={{
                  maxHeight: '58vh',
                }}
              >
                <Table stickyHeader aria-label="simple-table" sx={{ whiteSpace: 'nowrap' }}>
                  <TableHead>
                    <TableRow>
                      {/* Left Sticky Empty Column */}
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 2,
                          width: 35, // Fixed width
                          minWidth: 35,
                          maxWidth: 35,
                        }}
                      >
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
                      {/* Right Sticky Empty Column */}
                      <TableCell
                        sx={{
                          position: 'sticky',
                          right: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 2,
                          width: 180, // Fixed width
                          minWidth: 180,
                          maxWidth: 180,
                        }}
                      >
                        <Typography variant="h6"> Actions </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading
                      ? renderSkeletonRows(rowsPerPage || SKELETON_ROWS)
                      : alarmRuleData.map((alarmRule, index) => {
                          const isOpen = expandedSiteId === alarmRule.id;
                          return (
                            <React.Fragment key={alarmRule.id || index}>
                              <TableRow hover>
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: 'background.paper',
                                    zIndex: 1,
                                    width: 35, // Fixed width
                                    minWidth: 35,
                                    maxWidth: 35,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {index + 1 + (page - 1) * rowsPerPage}
                                </TableCell>
                                <TableCell>{alarmRule.name}</TableCell>
                                <TableCell>{alarmRule.inputs.length}</TableCell>
                                <TableCell>{alarmRule.outputs.length}</TableCell>
                                <TableCell>{alarmRule.scheduleTemplateName}</TableCell>
                                {/* <TableCell>{alarmRule.alarmMode}</TableCell> */}
                                <TableCell
                                  sx={{
                                    position: 'sticky',
                                    right: 0,
                                    backgroundColor: 'background.paper',
                                    zIndex: 1,
                                    width: 180, // Fixed width
                                    minWidth: 180,
                                    maxWidth: 180,
                                  }}
                                >
                                   <Box display="flex" alignItems="center" gap={1}>
                                    
                                    <AddEditAlarmRule type="edit" alarmRule={alarmRule} />
                                    <IconButton
                                      color="error"
                                      size="small"
                                      onClick={() => handleOpenDeleteDialog(alarmRule)}
                                    >
                                      <IconTrash size={20} />
                                    </IconButton>
                                   </Box>
                                </TableCell>
                              </TableRow>
                            </React.Fragment>
                          );
                        })}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Pagination */}
              <TablePagination
                component="div"
                count={alarmRuleFilteredCount}
                page={page - 1}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                rowsPerPageOptions={[5, 10, 25]}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </BlankCard>
          </Box>
        </Grid>
        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the device <strong>{selectedAlarmRule?.name}</strong>?
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
}

export default AlarmRuleList;