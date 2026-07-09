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
import { IconTrash, IconChevronDown, IconChevronRight, IconPlus, IconExternalLink } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import { floorType, SetSelectedFloor, UpdateFilter as UpdateFloorFilter } from 'src/store/apps/crud/floor';
import AddEditFloor from 'src/components/master/site/Floor/AddEditFloor';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import {
  BuildingType,
  fetchBuildingDT,
  deleteBuilding,
  UpdateFilter,
} from 'src/store/apps/crud/building';
import AddEditBuilding from './AddEditBuilding';
import { defaultBuildingFilter } from 'src/store/apps/defaultForm';
import toast from 'react-hot-toast';
import { useBuildingList, useDeleteBuilding } from 'src/hooks/useBuilding';
import { useAllFloors, useFloorList, useDeleteFloor } from 'src/hooks/useFloor';

const columns = [
  { label: 'Building Name', field: 'name', sortAble: true },
  { label: 'Building Tag', field: 'tag', sortAble: false },
  { label: 'Building Image', field: '', sortAble: false },
];

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const SKELETON_ROWS = 5;

const FloorTable = ({
  floors,
  onDeleteClick,
}: {
  floors: floorType[];
  onDeleteClick: (floor: floorType) => void;
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  return (
  <Table size="small">
    <TableHead>
      <TableRow>
        <TableCell sx={{ fontWeight: 600, width: 80 }}>No</TableCell>
        <TableCell sx={{ fontWeight: 600 }}>Floor Name</TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {floors.length === 0 ? (
        <TableRow>
          <TableCell colSpan={3}>
            <Typography variant="body2" color="text.secondary">
              No floors registered for this building.
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        floors.map((floor, i) => (
          <TableRow key={floor.id}>
            <TableCell>{i + 1}</TableCell>
            <TableCell>{floor.name}</TableCell>
            <TableCell align="right">
              <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
                <AddEditFloor type="edit" floor={floor} fixedBuildingId={floor.buildingId} />
                <Tooltip title="View Floor" arrow>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() => {
                      dispatch(SetSelectedFloor(floor));
                      navigate('/master/floor', { state: { expandFloorId: floor.id, floorName: floor.name } });
                    }}
                  >
                    <IconExternalLink size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Floor" arrow>
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => onDeleteClick(floor)}
                  >
                    <IconTrash size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
  );
};

const BuildingAccordionContent = ({
  floors,
  buildingId,
  onDeleteClick,
}: {
  floors: floorType[];
  buildingId: string;
  onDeleteClick: (floor: floorType) => void;
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', my: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Floors
        </Typography>
        <AddEditFloor
          type="add"
          fixedBuildingId={buildingId}
          trigger={(onClick) => (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<IconPlus size={16} />}
              onClick={onClick}
            >
              Add Floor
            </Button>
          )}
        />
      </Box>
      <FloorTable floors={floors} onDeleteClick={onDeleteClick} />
    </Paper>
  );
};

const BuildingList = () => {
  const dispatch: AppDispatch = useDispatch();
  const location = useLocation();
  const isChildShown = useSelector((state: RootState) => state.customizer.isChildShown);
  const buildingFilter = useSelector((state: RootState) => state.buildingReducer.buildingFilter);

  useEffect(() => {
    const initialFilter = location.state?.buildingName
      ? { ...defaultBuildingFilter, SearchValue: location.state.buildingName }
      : defaultBuildingFilter;

    dispatch(UpdateFilter(initialFilter));
  }, [dispatch, location.state?.buildingName]);

  const { data, isLoading: queryLoading } = useBuildingList(buildingFilter);
  console.log("Dataaa", data)
  const { data: floorResponse, isLoading: floorLoading } = useFloorList();
  const floorData = floorResponse?.data || [];
  const buildingData = data?.data || [];
  const buildingTotalCount = data?.meta?.totalItems || 0;
  const buildingFilteredCount = data?.meta?.totalItems || 0;
  // Pagination State
  const {buildingMeta} = useSelector((state: RootState) => state.buildingReducer)
  const page = buildingFilter.page;
  const rowsPerPage = buildingFilter.limit;
  const orderBy = buildingFilter.sortBy;
  const order = buildingFilter.sortOrder;

  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);

  const toggleExpand = (buildingId: string) => {
    setExpandedBuildingId((prev) => (prev === buildingId ? null : buildingId));
  };

  // Delete Floor Dialog State
  const [deleteFloorDialogOpen, setDeleteFloorDialogOpen] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState<floorType | null>(null);
  const deleteFloorMutation = useDeleteFloor();

  const handleOpenDeleteFloorDialog = (floor: floorType) => {
    setSelectedFloor(floor);
    setDeleteFloorDialogOpen(true);
  };

  const handleCloseDeleteFloorDialog = () => {
    setDeleteFloorDialogOpen(false);
    setSelectedFloor(null);
  };

  const handleConfirmDeleteFloor = async () => {
    if (selectedFloor) {
      try {
        await deleteFloorMutation.mutateAsync(selectedFloor.id);
        toast.success('Floor deleted successfully');
      } catch (error) {
        toast.error('Delete failed');
        console.error(error);
      }
    }
    handleCloseDeleteFloorDialog();
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch(UpdateFilter({page: newPage + 1}));
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = parseInt(event.target.value, 10);
    dispatch(UpdateFilter({ limit: newLength, page: 1 }));
  };
  const handleSort = (column: string) => {
    const isAsc = buildingFilter.sortBy === column && buildingFilter.sortOrder === 'asc';
    const isDesc = buildingFilter.sortBy === column && buildingFilter.sortOrder === 'desc';

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

  // useEffect(() => {
  //   dispatch(UpdateFilter(defaultBuildingFilter));
  // }, [dispatch]);

  // useEffect(() => {
  //   try {
  //     dispatch(fetchBuildingDT(buildingFilter));
  //   } catch (error) {
  //     console.error('Error fetching building data:', error);
  //   }
  // }, [buildingFilter, dispatch]);

  //Delete Pop-up
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
  const deleteMutation = useDeleteBuilding();
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (building: BuildingType) => {
    setSelectedBuilding(building);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedBuilding(null);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (selectedBuilding) {
      try {
        await deleteMutation.mutateAsync(selectedBuilding.id);
        toast.success('Data Deleted');
      } catch (error) {
        toast.error('Delete failed');
        console.error(error);
      }
    }
    handleCloseDeleteDialog();
  };

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
                  {queryLoading
                    ? renderSkeletonRows(rowsPerPage || SKELETON_ROWS)
                    : buildingData.map((building, index) => {
                        const isOpen = expandedBuildingId === building.id;
                        const buildingFloors = (floorData || []).filter(
                          (f) => f.buildingId === building.id,
                        );
                        console.log("Image", getCdnUrl(building.imageUrl), building)
                        // console.log("BUilding", building)
                        return (
                          <React.Fragment key={building.id || index}>
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
                              <TableCell>{building.name}</TableCell>
                              <TableCell>{building.siteName}</TableCell>
                              <TableCell>
                                {building.imageUrl ? (
                                  <img
                                    src={getCdnUrl(building.imageUrl)}
                                    alt="Building"
                                    style={{ width: 80, height: 80, objectFit: 'cover' }}
                                  />
                                ) : (
                                  'No Image'
                                )}
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
                                  <AddEditBuilding type="edit" building={building} />
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleOpenDeleteDialog(building)}
                                  >
                                    <IconTrash size={20} />
                                  </IconButton>

                                  {isChildShown && (
                                      <Tooltip title={isOpen ? 'Hide Floors' : 'Show Floors'} arrow>
                                          <IconButton size="small" onClick={() => toggleExpand(building.id)}>
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
                                      <BuildingAccordionContent
                                        floors={buildingFloors}
                                        buildingId={building.id}
                                        onDeleteClick={handleOpenDeleteFloorDialog}
                                      />
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
              count={buildingFilteredCount}
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
            Are you sure you want to delete the building <strong>{selectedBuilding?.name}</strong>?
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
      <Dialog open={deleteFloorDialogOpen} onClose={handleCloseDeleteFloorDialog}>
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
      </Dialog>
    </Grid>
  );
};

export default BuildingList;
