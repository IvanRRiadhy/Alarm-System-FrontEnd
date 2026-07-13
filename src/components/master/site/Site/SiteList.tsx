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
import { IconTrash, IconChevronDown, IconChevronRight, IconPlus, IconExternalLink, IconDownload } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router';
import { RootState, AppDispatch, useSelector, useDispatch } from 'src/store/Store';
import toast from 'react-hot-toast';
import {
  SiteType,
  UpdateFilter,
} from 'src/store/apps/crud/site';
import { defaultSiteFilter } from 'src/store/apps/defaultForm';
import { useDeleteSite, useSiteList } from 'src/hooks/useSite';
import AddEditSite from './AddEditSite';
import { toastError } from 'src/utils/errors';
import { BuildingType, SelectBuilding } from 'src/store/apps/crud/building';
import { useAllBuilding, useBuildingList, useDeleteBuilding } from 'src/hooks/useBuilding';
import AddEditBuilding from 'src/components/master/site/Building/AddEditBuilding';

const columns = [
  { label: 'Site Name', field: 'name', sortAble: true },
  { label: 'Site Code', field: 'code', sortAble: true },
  { label: 'Site Address', field: 'address', sortAble: false },
  { label: 'Site Phone Number', field: 'phone', sortAble: false },
];

const BuildingTable = ({
  buildings,
  onDeleteClick,
}: {
  buildings: BuildingType[];
  onDeleteClick: (building: BuildingType) => void;
}) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600, width: 80 }}>No</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Building Name</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600, width: 120 }}>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {buildings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3}>
              <Typography variant="body2" color="text.secondary">
                No buildings registered for this site.
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          buildings.map((building, i) => (
            <TableRow key={building.id}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>{building.name}</TableCell>
              <TableCell align="right">
                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={1}>
                  <AddEditBuilding type="edit" building={building} fixedSiteId={building.siteId} />
                  <Tooltip title="View Building" arrow>
                    <IconButton
                      color="primary"
                      size="small"
                      onClick={() => {
                        dispatch(SelectBuilding(building.id));
                        navigate('/master/site/building', { state: { expandBuildingId: building.id, buildingName: building.name } });
                      }}
                    >
                      <IconExternalLink size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Building" arrow>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => onDeleteClick(building)}
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

const SiteAccordionContent = ({
  buildings,
  siteId,
  onDeleteClick,
}: {
  buildings: BuildingType[];
  siteId: string;
  onDeleteClick: (building: BuildingType) => void;
}) => {
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', my: 1 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="subtitle1" fontWeight={700}>
          Buildings
        </Typography>
        <AddEditBuilding
          type="add"
          fixedSiteId={siteId}
          trigger={(onClick) => (
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<IconPlus size={16} />}
              onClick={onClick}
            >
              Add Building
            </Button>
          )}
        />
      </Box>
      <BuildingTable buildings={buildings} onDeleteClick={onDeleteClick} />
    </Paper>
  );
};

const SKELETON_ROWS = 5;

const SiteList = () => {
    const dispatch: AppDispatch = useDispatch();
      const location = useLocation();
      const isChildShown = useSelector((state: RootState) => state.customizer.isChildShown);
      const siteFilter = useSelector((state: RootState) => state.siteReducer.siteFilter);

        useEffect(() => {
          const initialFilter = location.state?.siteName
            ? { ...defaultSiteFilter, SearchValue: location.state.siteName }
            : defaultSiteFilter;
      
          dispatch(UpdateFilter(initialFilter));
        }, [dispatch, location.state?.siteName]);

        const {data, isLoading, isError} = useSiteList(siteFilter);
        const siteData = data?.data || [];
        const siteFilteredCount = data?.meta?.totalItems || 0;
        const siteTotalCount = data?.meta?.totalItems || 0; 
        
        const { data: buildingResponse } = useBuildingList();
        const buildingData = buildingResponse?.data || []; 

          // Pagination State
          const {siteMeta} = useSelector((state: RootState) => state.siteReducer)
        const page = siteFilter.page;
        const rowsPerPage = siteFilter.limit;
        const havePrev = siteMeta.hasPreviousPage;
        const haveNext = siteMeta.hasNextPage;
        const orderBy = siteFilter.sortBy;
        const order = siteFilter.sortOrder;

          const handleChangePage = (_: unknown, newPage: number) => {
            console.log("New Page : ", newPage);
            dispatch(UpdateFilter({page: newPage + 1}));
          };
          const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
            const newLength = parseInt(event.target.value, 10);
            dispatch(UpdateFilter({ limit: newLength, page: 1 }));
          };
          const handleSort = (column: string) => {
            const isAsc = siteFilter.sortBy === column && siteFilter.sortOrder === 'asc';
            const isDesc = siteFilter.sortBy === column && siteFilter.sortOrder === 'desc';
        
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



 
  //Delete Pop-up
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<SiteType | null>(null);
  const deleteMutation = useDeleteSite();

    // Open delete confirmation dialog
    const handleOpenDeleteDialog = (site: SiteType) => {
      setSelectedSite(site);
      setDeleteDialogOpen(true);
    };
  
    // Close delete confirmation dialog
    const handleCloseDeleteDialog = () => {
      setDeleteDialogOpen(false);
      setSelectedSite(null);
    };
  
    // Confirm delete action
    const handleConfirmDelete = async () => {
      if (selectedSite) {
        try {
          await deleteMutation.mutateAsync(selectedSite.id);
          toast.success('Data Deleted');
        } catch (error) {
          toastError(error, 'Delete failed');
          console.error(error);
        }
      }
      handleCloseDeleteDialog();
    };

    // Delete Building Dialog State
    const [deleteBuildingDialogOpen, setDeleteBuildingDialogOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(null);
    const deleteBuildingMutation = useDeleteBuilding();

    const handleOpenDeleteBuildingDialog = (building: BuildingType) => {
      setSelectedBuilding(building);
      setDeleteBuildingDialogOpen(true);
    };

    const handleCloseDeleteBuildingDialog = () => {
      setDeleteBuildingDialogOpen(false);
      setSelectedBuilding(null);
    };

    const handleConfirmDeleteBuilding = async () => {
      if (selectedBuilding) {
        try {
          await deleteBuildingMutation.mutateAsync(selectedBuilding.id);
          toast.success('Building deleted successfully');
        } catch (error) {
          toastError(error, 'Delete failed');
          console.error(error);
        }
      }
      handleCloseDeleteBuildingDialog();
    };

    console.log("Data", data)
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
                    : siteData.map((site, index) => {
                        const isOpen = expandedSiteId === site.id;
                        const siteBuildings = (buildingData || []).filter(
                          (b) => b.siteId === site.id,
                        );
                        return (
                          <React.Fragment key={site.id || index}>
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
                              <TableCell>{site.name}</TableCell>
                              <TableCell>{site.code}</TableCell>
                              <TableCell>
                                {site.address}
                              </TableCell>
                              <TableCell>
                                {site.phone}
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
                                  <AddEditSite type="edit" site={site} />
                                  <IconButton
                                    color="error"
                                    size="small"
                                    onClick={() => handleOpenDeleteDialog(site)}
                                  >
                                    <IconTrash size={20} />
                                  </IconButton>
                                  {/* <Tooltip title="Export Configuration" arrow>
                                    <IconButton
                                      color="primary"
                                      size="small"
                                    //   onClick={() => handleExport(site)}
                                      disabled={exportingId !== null}
                                    >
                                      {exportingId === site.id ? (
                                        <CircularProgress size={20} color="inherit" />
                                      ) : (
                                        <IconDownload size={20} />
                                      )}
                                    </IconButton>
                                  </Tooltip> */}
                                  {isChildShown && (
                                      <Tooltip title={isOpen ? 'Hide Buildings' : 'Show Buildings'} arrow>
                                          <IconButton size="small" onClick={() => toggleExpand(site.id)}>
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
                                <TableCell colSpan={6} sx={{ p: 0, borderBottom: 0 }}>
                                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <Box pl={6} pr={2} pb={2}>
                                      <SiteAccordionContent
                                        buildings={siteBuildings}
                                        siteId={site.id}
                                        onDeleteClick={handleOpenDeleteBuildingDialog}
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
              count={siteFilteredCount}
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
            Are you sure you want to delete the building <strong>{selectedSite?.name}</strong>?
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
      {/* Delete Building Confirmation Dialog */}
      <Dialog open={deleteBuildingDialogOpen} onClose={handleCloseDeleteBuildingDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the building <strong>{selectedBuilding?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteBuildingDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteBuilding}
            color={deleteBuildingMutation.isPending ? 'primary' : 'error'}
            disabled={deleteBuildingMutation.isPending}
            startIcon={deleteBuildingMutation.isPending ? <CircularProgress size={20} /> : null}
          >
            {deleteBuildingMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
        )
}

export default SiteList;