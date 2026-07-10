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
  Paper,
  Tooltip,
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconTrash, IconChevronDown, IconChevronRight, IconPlus, IconExternalLink, IconDownload, IconExchange } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import toast from 'react-hot-toast';
import { UpdateFilter } from 'src/store/apps/crud/controller';
import { defaultControllerFilter } from 'src/store/apps/defaultForm';
import { useControllerList, useDeleteController } from 'src/hooks/useController';
import { controllerType } from 'src/store/apps/crud/controller';
import AddEditController from './AddEditController';
import ControllerChannel from './ControllerChannel';
import { toastError } from 'src/utils/errors';

const columns = [
  { label: 'Controller Name', field: 'name', sortAble: true },
  { label: 'IP Address', field: 'ipAddress', sortAble: true },
  { label: 'MAC Address', field: 'macAddress', sortAble: true },
  { label: 'Port', field: 'port', sortAble: true },
  { label: 'Status', field: 'status', sortAble: true },
];

const SKELETON_ROWS = 5;

const ControllerList = () => {
    const dispatch: AppDispatch = useDispatch();
      const location = useLocation();
      const isChildShown = useSelector((state: RootState) => state.customizer.isChildShown);
      const controllerFilter = useSelector((state: RootState) => state.ControllerReducer.controllerFilter);

        useEffect(() => {
          const initialFilter = location.state?.controllerName
            ? { ...defaultControllerFilter, SearchValue: location.state.controllerName }
            : defaultControllerFilter;
      
          dispatch(UpdateFilter(initialFilter));
        }, [dispatch, location.state?.controllerName]);

        const {data, isLoading, isError} = useControllerList(controllerFilter);
        const controllerData = data?.data || [];
        const controllerFilteredCount = data?.meta?.totalItems || 0;
        const controllerTotalCount = data?.meta?.totalItems || 0; 

          // Pagination State
          const {controllerMeta} = useSelector((state: RootState) => state.ControllerReducer)
        const page = controllerMeta.page;
        const rowsPerPage = controllerMeta.limit;
        const havePrev = controllerMeta.hasPreviousPage;
        const haveNext = controllerMeta.hasNextPage;
        const orderBy = controllerFilter.sortBy;
        const order = controllerFilter.sortOrder;

          const handleChangePage = (_: unknown, newPage: number) => {
            dispatch(UpdateFilter({page: newPage}));
          };
          const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newLength = parseInt(event.target.value, 10);
            dispatch(UpdateFilter({ limit: newLength, page: 1 }));
          };
          const handleSort = (column: string) => {
            const isAsc = controllerFilter.sortBy === column && controllerFilter.sortOrder === 'asc';
            const isDesc = controllerFilter.sortBy === column && controllerFilter.sortOrder === 'desc';
        
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



 
  // Channel Assign Dialog State
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [selectedControllerForChannel, setSelectedControllerForChannel] = useState<controllerType | null>(null);

  const handleOpenChannelDialog = (controller: controllerType) => {
    setSelectedControllerForChannel(controller);
    setChannelDialogOpen(true);
  };

  const handleCloseChannelDialog = () => {
    setChannelDialogOpen(false);
    setSelectedControllerForChannel(null);
  };

  //Delete Pop-up
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedController, setSelectedController] = useState<controllerType | null>(null);
  const deleteMutation = useDeleteController();

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (controller: controllerType) => {
      setSelectedController(controller);
      setDeleteDialogOpen(true);
    };
  
    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
      setDeleteDialogOpen(false);
      setSelectedController(null);
    };
  
    // Confirm delete action
    const handleConfirmDelete = async () => {
      if (selectedController) {
        try {
          await deleteMutation.mutateAsync(selectedController.id);
          toast.success('Data Deleted');
        } catch (error) {
          toastError(error, 'Delete failed');
          console.error(error);
        }
      }
      handleCloseDeleteDialog();
    };

//   const exportMutation = useExportSiteConfig();
  const [exportingId, setExportingId] = useState<string | null>(null);

          const renderSkeletonRows = (rows: number) => (
            <>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {/* sticky index cell */}
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
                  {/* Building Name */}
                  <TableCell>
                    <Skeleton variant="text" width={220} height={22} />
                  </TableCell>
                  {/* Building Tag */}
                  <TableCell>
                    <Skeleton variant="text" width={220} height={22} />
                  </TableCell>
                  {/* Building Image */}
                  <TableCell>
                    <Skeleton variant="rectangular" width={80} height={60} />
                  </TableCell>
                  {/* Actions (right sticky) */}
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
                      {/* <Skeleton variant="circular" width={32} height={32} /> */}
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
                    : controllerData.map((controller, index) => {
                        const isOpen = expandedSiteId === controller.id;
                        // const buildingFloors = (floorData || []).filter(
                        //   (f) => f.buildingId === building.id,
                        // );
                        return (
                          <React.Fragment key={controller.id || index}>
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
                              <TableCell>{controller.name}</TableCell>
                              <TableCell>{controller.ipAddress}</TableCell>
                              <TableCell>
                                {controller.macAddress}
                              </TableCell>
                              <TableCell>
                                {controller.port}
                              </TableCell>
                              <TableCell>
                                {controller.status}
                              </TableCell>
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
                                  <AddEditController type="edit" controller={controller} />
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleOpenDeleteDialog(controller)}
                                  >
                                    <IconTrash size={20} />
                                  </IconButton>
                                  <Tooltip title="Assign Channel" arrow>
                                    <IconButton
                                      color="primary"
                                      size="small"
                                      onClick={() => handleOpenChannelDialog(controller)}
                                    >
                                      <IconExchange />
                                    </IconButton>
                                  </Tooltip>
                                  {/* <Tooltip title="Export Configuration" arrow>
                                    <IconButton
                                      color="primary"
                                      size="small"
                                    //   onClick={() => handleExport(controller)}
                                      disabled={exportingId !== null}
                                    >
                                      {exportingId === controller.id ? (
                                        <CircularProgress size={20} color="inherit" />
                                      ) : (
                                        <IconDownload size={20} />
                                      )}
                                    </IconButton>
                                  </Tooltip> */}
                                  {isChildShown && (
                                      <Tooltip title={isOpen ? 'Hide Floors' : 'Show Floors'} arrow>
                                          <IconButton size="small" onClick={() => toggleExpand(controller.id)}>
                                            {isOpen ? <IconChevronDown size={20} /> : <IconChevronRight size={20} />}
                                          </IconButton>
                                        </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                            {/* ACCORDION ROW */}
                            {isChildShown && (
                              <TableRow>
                                <TableCell colSpan={5} sx={{ p: 0, borderBottom: 0 }}>
                                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <Box pl={6} pr={2} pb={2}>
                                      {/* <BuildingAccordionContent
                                        floors={buildingFloors}
                                        buildingId={building.id}
                                        onDeleteClick={handleOpenDeleteFloorDialog}
                                      /> */}
                                    </Box>
                                  </Collapse>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination */}
            <TablePagination
              component="div"
              count={controllerFilteredCount}
              page={page-1}
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
            Are you sure you want to delete the building <strong>{selectedController?.name}</strong>?
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
      {/* Delete Floor Confirmation Dialog */}
      {/* <Dialog open={deleteFloorDialogOpen} onClose={handleCloseDeleteFloorDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the floor <strong>{selectedFloor?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteFloorDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteFloor}
            color={deleteFloorMutation.isPending ? 'primary' : 'error'}
            disabled={deleteFloorMutation.isPending}
            startIcon={deleteFloorMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {deleteFloorMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog> */}
      <ControllerChannel
        open={channelDialogOpen}
        onClose={handleCloseChannelDialog}
        controller={selectedControllerForChannel}
      />
    </Grid>
        )
}

export default ControllerList;