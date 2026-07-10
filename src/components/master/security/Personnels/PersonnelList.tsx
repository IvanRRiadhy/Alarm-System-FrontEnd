
import { useInfinitePersonnelList, useDeletePersonnel } from 'src/hooks/usePersonnel';
import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  Typography,
  Skeleton,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Stack,
} from '@mui/material';
import { useSelector, useDispatch, RootState } from 'src/store/Store';
import { setSelectedPersonnel, UpdateFilter } from 'src/store/apps/crud/personnels';
import Scrollbar from 'src/components/custom-scroll/Scrollbar';
import PersonnelListItem from './PersonnelListItem';
import { defaultPersonnelFilter } from 'src/store/apps/defaultForm';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import { useInView } from 'react-intersection-observer';

const SKELETON_ROWS = 5;

const PersonnelList = () => {
  const dispatch = useDispatch();

  // 🔹 Redux filter and selected state
  const personnelFilter = useSelector((state: RootState) => state.personnelReducer.personnelFilter);
  const selectedPersonnel = useSelector((state: RootState) => state.personnelReducer.selectedPersonnel);

  // 🔹 React Query fetching
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfinitePersonnelList(personnelFilter, 50);

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteMutation = useDeletePersonnel();

  // 🔹 State for bulk select
  const [isManySelect, setIsManySelect] = useState(false);
  const [manySelectPersonnels, setManySelectPersonnels] = useState<PersonnelType[]>([]);
  const [isChecked, setIsChecked] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // 🔹 Derived personnels list
  const personnels = data?.pages.flatMap((page) => page.data) ?? [];
  const active = personnels?.find((personnel: PersonnelType) => personnel.id === selectedPersonnel?.id);
  // ---------------------------------------------------------------------------
  // ✅ Initialization on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Reset filter on mount (only once)
    dispatch(UpdateFilter({ ...defaultPersonnelFilter }));
  }, [dispatch]);

  // ---------------------------------------------------------------------------
  // ✅ Delete Handlers
  // ---------------------------------------------------------------------------
  const handleOpenDeleteDialog = () => setDeleteDialogOpen(true);
  const handleCloseDeleteDialog = () => setDeleteDialogOpen(false);

  const handleConfirmDelete = async () => {
    try {
      for (const personnel of manySelectPersonnels) {
        await deleteMutation.mutateAsync(personnel.id);
      }
      setManySelectPersonnels([]);
      setIsManySelect(false);
    } catch (err) {
      console.error('Error deleting personnels:', err);
    }
    handleCloseDeleteDialog();
  };

  // ---------------------------------------------------------------------------
  // ✅ Bulk selection
  // ---------------------------------------------------------------------------
  const handleSelectAll = () => {
    setIsChecked(!isChecked);
    setManySelectPersonnels(!isChecked ? personnels : []);
  };

  const handleCancelClick = () => {
    setIsManySelect(false);
    setManySelectPersonnels([]);
  };

  // ---------------------------------------------------------------------------
  // ✅ Render Skeleton Items
  // ---------------------------------------------------------------------------
  const renderSkeletonItems = (count: number) => (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <ListItemButton key={`skeleton-${idx}`} sx={{ mb: 1 }}>
          <ListItemAvatar>
            <Skeleton variant="circular" width={40} height={40} />
          </ListItemAvatar>
          <ListItemText>
            <Stack direction="row" gap="10px" alignItems="center">
              <Box mr="auto">
                <Skeleton variant="text" width={160} height={22} />
                <Skeleton variant="text" width={120} height={18} />
                <Skeleton variant="text" width={100} height={18} />
              </Box>
            </Stack>
          </ListItemText>
        </ListItemButton>
      ))}
    </>
  );

  // ---------------------------------------------------------------------------
  // ✅ UI Rendering
  // ---------------------------------------------------------------------------
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box
        display="flex"
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        sx={{ ml: 2 }}
      >
        {isManySelect ? (
          <>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{ minWidth: '80px', py: 0.5 }}
              onClick={handleCancelClick}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              size="small"
              sx={{ minWidth: '80px', py: 0.5 }}
              onClick={handleOpenDeleteDialog}
            >
              Delete
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="small"
            sx={{ minWidth: '80px', py: 0.5 }}
            onClick={() => setIsManySelect(true)}
          >
            Select
          </Button>
        )}
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {/* <Box
          sx={{
            height: { lg: 'calc(100vh - 220px)', md: '100vh' },
            maxHeight: '71vh',
            overflow: 'auto',
          }}
        > */}
          {isManySelect && (
            <Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ mr: 2 }}>
              <Typography variant="body2" fontWeight={100}>
                Select All
              </Typography>
              <Checkbox edge="end" checked={isChecked} onChange={handleSelectAll} />
            </Box>
          )}

          {isLoading
            ? renderSkeletonItems(SKELETON_ROWS)
            : personnels.map((personnel) => (
                <PersonnelListItem
                  key={personnel.id}
                  active={personnel === active}
                  personnel={personnel}
                  manySelect={isManySelect}
                  setManySelectPersonnels={setManySelectPersonnels}
                  manySelectPersonnels={manySelectPersonnels}
                  onPersonnelClick={() => {
                    dispatch(setSelectedPersonnel(personnel as any));
                  }}
                />
              ))}

          {isFetchingNextPage && renderSkeletonItems(3)}

          {hasNextPage && <div ref={ref} style={{ height: '20px' }} />}
          {/* </Box> */}
        </List>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete these personnels?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonnelList;
