import React, { lazy, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
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
} from '@mui/material';
import BlankCard from 'src/components/shared/BlankCard';
import { IconEye, IconTrash, IconExternalLink } from '@tabler/icons-react';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import {
  FloorplanType,
  SelectFloorplan,
  UpdateFilter,
  deleteFloorplan,
  fetchFloorplanDT,
} from 'src/store/apps/crud/floorplan';
import { useFloorplanList, useDeleteFloorplan } from 'src/hooks/useFloorplan';
// import { useTranslation } from 'react-i18next';
import { defaultFloorplanFilter } from 'src/store/apps/defaultForm';
import toast from 'react-hot-toast';
import { BuildingType, fetchBuildings } from 'src/store/apps/crud/building';
import { fetchFloors } from 'src/store/apps/crud/floor';
import { fetchEngines } from 'src/store/apps/crud/engine';
const columns = [
  { label: 'Floorplan Name', field: 'name', sortAble: true },
  { label: 'Floor Name', field: 'floorName', sortAble: true },
  { label: 'Building Name', field: 'buildingName', sortAble: true },
  { label: 'Site Name', field: 'siteName', sortAble: true },
  { label: 'Floorplan Image', field: '', sortAble: false },
  { label: 'Floorplan Dimension (meter)', field: '', sortAble: false },
];
const AddEditFloorplan = lazy(() => import('./AddEditFloorplan'));

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const SKELETON_ROWS = 5;

const FloorplanList = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const buildingData: BuildingType[] = useSelector(
    (state: RootState) => state.buildingReducer.buildingAll,
  );
  // const floorplanTotalCount = useSelector(
  //   (state: RootState) => state.floorplanReducer.floorplanTotalCount,
  // );
  // const floorplanFilteredCount = useSelector(
  //   (state: RootState) => state.floorplanReducer.floorplanFilteredCount,
  // );
  const floorplanFilter = useSelector((state: RootState) => state.floorplanReducer.floorplanFilter);
  // const {
  //   data: floorplanData = [],
  //   isLoading: queryLoading,
  //   isFetching,
  // } = useFloorplanList(floorplanFilter);

  const { data, isLoading: queryLoading } = useFloorplanList(floorplanFilter);
  const floorplanData = data?.data || [];
  // const floorplanTotalCount = data?.recordsTotal || 0;
  const floorplanFilteredCount = data?.meta?.totalItems || 0;
  // const { t } = useTranslation();
  const isLoading = useSelector((state: RootState) => state.floorplanReducer.isLoading);
  const hasLoaded = useSelector((state: RootState) => state.floorplanReducer.hasLoaded);
  // Pagination State
  const page = floorplanFilter.page
  const rowsPerPage = floorplanFilter.limit;
  const orderBy = floorplanFilter.sortBy;
  const order = floorplanFilter.sortOrder;

  const handleChangePage = (_: unknown, newPage: number) => {
    dispatch(UpdateFilter({ page: newPage }));
  };
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newLength = parseInt(event.target.value, 10);
    dispatch(UpdateFilter({ limit: newLength, page: 1 }));
  };
  const handleSort = (column: string) => {
    const isAsc = floorplanFilter.sortBy === column && floorplanFilter.sortOrder === 'asc';
    const isDesc = floorplanFilter.sortBy === column && floorplanFilter.sortOrder === 'desc';

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
  //   console.log("Floorplan Data:", floorplanData);
  // }, [floorplanData]);

  // useEffect(() => {
  //   dispatch(UpdateFilter(defaultFloorplanFilter));
  //   setLoading(true);

  //   Promise.all([
  //     dispatch(fetchFloorplanDT(defaultFloorplanFilter)).finally(() => {
  //       requestIdleCallback(() => {
  //         dispatch(fetchEngines());
  //       });
  //     }),
  //     dispatch(fetchBuildings()),
  //     dispatch(fetchFloors()),
  //   ]).finally(() => setLoading(false));
  // }, [dispatch]);

  useEffect(() => {
    Promise.all([
      dispatch(fetchBuildings()),
      dispatch(fetchFloors()),
      dispatch(fetchEngines())
    ]);

    const initialFilter = location.state?.floorplanName
      ? { ...defaultFloorplanFilter, SearchValue: location.state.floorplanName }
      : defaultFloorplanFilter;

    dispatch(UpdateFilter(initialFilter));
  }, [dispatch]);

  useEffect(() => {
    console.log("Floorplan Data:", floorplanData);
  }, [floorplanData]);


  // useEffect(() => {
  //   const prevFilter = prevFilterRef.current;
  //   const isStartorLengthChanged =
  //     prevFilter.Start !== floorplanFilter.Start || prevFilter.limit !== floorplanFilter.limit;
  //   if (isStartorLengthChanged) {
  //     setLoading(true);
  //   }
  //   dispatch(fetchFloorplanDT(floorplanFilter)).finally(() => {
  //     if (isStartorLengthChanged) {
  //       setTimeout(() => {
  //         setLoading(false);
  //       }, 500);
  //     }
  //   });
  //   console.log('floorplan: ', floorplanData);
  //   prevFilterRef.current = floorplanFilter;
  // }, [floorplanFilter, dispatch]);

  //Delete Pop-up
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFloorplan, setSelectedFloorplan] = useState<FloorplanType | null>(null);
  const deleteMutation = useDeleteFloorplan();
  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (floorplan: FloorplanType) => {
    setSelectedFloorplan(floorplan);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedFloorplan(null);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (selectedFloorplan) {
      //   setLoading(true);
      //   try {
      //     const result = await dispatch(deleteFloorplan(selectedFloorplan.id));
      //     if (result && result.type && result.type.endsWith('/fulfilled')) {
      //       await dispatch(fetchFloorplanDT(floorplanFilter));
      //       toast.success('Data Deleted');
      //     }
      //   } catch (error) {
      //     toast.error('Delete Data Unsuccessful');
      //     console.error('Error deleting floorplan:', error);
      //   }
      //   setTimeout(() => {
      //     setLoading(false);
      //   }, 1000);
      try {
        await deleteMutation.mutateAsync(selectedFloorplan.id);
        toast.success('Data Deleted');
      } catch (error) {
        toast.error('Delete failed');
        console.error(error);
      }
    }
    handleCloseDeleteDialog();
  };
  const getbuildingName = (buildingId: string) => {
    const building = buildingData.find((b) => b.id === buildingId);
    return building ? building.name : 'Unknown Building';
  };

  const handleOverviewClick = (floorplanToEdit: FloorplanType) => {
    dispatch(SelectFloorplan(floorplanToEdit));
    navigate('/master/floorplan/overview');
  };

  const renderSkeletonRows = (rows: number) => (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {/* sticky index */}
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
            <Skeleton variant="text" width={180} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={160} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={120} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={60} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={140} height={22} />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" width={120} height={22} />
          </TableCell>
          {/* right actions */}
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
              {/* <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} /> */}
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
            <TableContainer sx={{
              maxHeight: '55vh',
            }}>
              <Table stickyHeader aria-label="simple table" sx={{ whiteSpace: 'nowrap' }}>
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
                        width: 150, // Fixed width
                        minWidth: 150,
                        maxWidth: 150,
                      }}
                    >
                      <Typography variant="h6"> Actions </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {queryLoading
                    ? renderSkeletonRows(rowsPerPage || SKELETON_ROWS)
                    : floorplanData.map((floorplan: FloorplanType, index: number) => (
                      <TableRow key={index}>
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
                          {index + 1 + page * rowsPerPage}
                        </TableCell>
                        <TableCell>{floorplan.name}</TableCell>
                        <TableCell>
                          {floorplan.floorName ? (
                            <Box
                              component="span"
                              onClick={() => navigate('/master/site/floor', { state: { floorName: floorplan.floorName } })}
                              sx={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'primary.main',
                                fontWeight: 500,
                                position: 'relative',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.dark',
                                },
                              }}
                            >
                              <IconExternalLink size={14} style={{ flexShrink: 0 }} />
                              <span>{floorplan.floorName}</span>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {floorplan.buildingName ? (
                            <Box
                              component="span"
                              onClick={() => navigate('/master/site/building', { state: { buildingName: floorplan.buildingName } })}
                              sx={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'primary.main',
                                fontWeight: 500,
                                position: 'relative',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.dark',
                                },
                              }}
                            >
                              <IconExternalLink size={14} style={{ flexShrink: 0 }} />
                              <span>{floorplan.buildingName}</span>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {floorplan.siteName ? (
                            <Box
                              component="span"
                              onClick={() => navigate('/master/site/site', { state: { siteName: floorplan.siteName } })}
                              sx={{
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'primary.main',
                                fontWeight: 500,
                                position: 'relative',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  color: 'primary.dark',
                                },
                              }}
                            >
                              <IconExternalLink size={14} style={{ flexShrink: 0 }} />
                              <span>{floorplan.siteName}</span>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {floorplan.imageUrl ? (
                            <img
                              src={getCdnUrl(floorplan.imageUrl)}
                              alt="Floor"
                              loading="lazy"
                              style={{ width: 80, height: 80, objectFit: 'cover' }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </TableCell>
                        <TableCell>{`(${floorplan.floorX}, ${floorplan.floorY})`}</TableCell>

                        {/* <TableCell>{floorplan.engine?.name}</TableCell> */}
                        <TableCell
                          sx={{
                            position: 'sticky',
                            right: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 1,
                            gap: 1,
                            alignItems: 'center',
                            width: 150, // Fixed width
                            minWidth: 150,
                            maxWidth: 150,
                          }}
                        >
                          <AddEditFloorplan type="edit" floorplan={floorplan} />
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOverviewClick(floorplan)}
                          >
                            <IconEye size={20} />
                          </IconButton>
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(floorplan)}
                          >
                            <IconTrash size={20} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={floorplanFilteredCount}
              rowsPerPage={rowsPerPage}
              page={page - 1}
              onPageChange={handleChangePage}
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
            Are you sure you want to delete the floor <strong>{selectedFloorplan?.name}</strong>?
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

export default FloorplanList;
