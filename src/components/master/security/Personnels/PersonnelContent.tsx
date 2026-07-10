import { useState } from 'react';
import { BASE_URL } from 'src/utils/axios';
import { createPortal } from 'react-dom';
import { useSelector, useDispatch, RootState } from 'src/store/Store';
import {
  Box,
  Button,
  Typography,
  Avatar,
  Divider,
  IconButton,
  Stack,
  Grid2 as Grid,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import { PersonnelType, setSelectedPersonnel } from 'src/store/apps/crud/personnels';
import { IconTrash, IconX } from '@tabler/icons-react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import toast from 'react-hot-toast';
import { useDeletePersonnel } from 'src/hooks/usePersonnel';
import AddEditPersonnel from './AddEditPersonnel';
import { toastError } from 'src/utils/errors';

const PersonnelContent = () => {
    const dispatch = useDispatch();
  
  const selectedPersonnel = useSelector(
    (state: RootState) => state.personnelReducer.selectedPersonnel
  );
    
  const { mutateAsync: deleteMutation } = useDeletePersonnel();
  
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [personnelToDelete, setPersonnelToDelete] = useState<PersonnelType | null>(null);

  // Close active personnel view
  const handleCloseView = () => {
    dispatch(setSelectedPersonnel(null as any));
  };

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (mem: PersonnelType) => {
    setPersonnelToDelete(mem);
    setDeleteDialogOpen(true);
  };

  // Close delete confirmation dialog
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setPersonnelToDelete(null);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    if (personnelToDelete) {
      setLoading(true);
      try {
        await deleteMutation(personnelToDelete.id);
        toast.success('Personnel deleted successfully');
        if (selectedPersonnel?.id === personnelToDelete.id) {
          handleCloseView();
        }
      } catch (error) {
        console.error('Error deleting personnel:', error);
        toastError(error, 'Delete Data Unsuccessful');
      } finally {
        setLoading(false);
        handleCloseDeleteDialog();
      }
    }
  };

  return (
    <>
      {selectedPersonnel && !Array.isArray(selectedPersonnel) ? (
        <>
          {/* Header Part */}
          <Box
            p={3}
            py={2}
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              background: !selectedPersonnel.isActive
                ? 'linear-gradient(90deg, #e53935 0%, #ef5350 100%)' // vivid red for inactive
                : 'linear-gradient(90deg, #1e88e5 0%, #42a5f5 100%)', // vivid blue for active
              borderRadius: '8px',
              boxShadow: 3,
            }}
          >
            {/* Left Section */}
            <Typography
              variant="h5"
              fontWeight={700}
              color="#fff"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              Personnel Details
              {!selectedPersonnel.isActive && (
                <Typography
                  variant="caption"
                  sx={{
                    backgroundColor: 'rgba(0,0,0,0.25)',
                    color: '#fff',
                    borderRadius: 1,
                    px: 1,
                    py: 0.25,
                    fontWeight: 600,
                  }}
                >
                  INACTIVE
                </Typography>
              )}
            </Typography>

            {/* Right Section */}
            <Stack direction="row" alignItems="center" spacing={1.2}>
              {/* Edit */}
              <Tooltip title="Edit Personnel">
                <Box display="inline-block">
                  <AddEditPersonnel personnel={selectedPersonnel} type="edit" />
                </Box>
              </Tooltip>

              {/* Delete */}
              <Tooltip title="Delete Personnel">
                <IconButton
                  onClick={() => handleOpenDeleteDialog(selectedPersonnel)}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease',
                    '& svg': {
                      color: '#fff',
                      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.35)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <IconTrash size="18" stroke={1.6} />
                </IconButton>
              </Tooltip>

              {/* Close */}
              <Tooltip title="Close">
                <IconButton
                  onClick={handleCloseView}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(0,0,0,0.15)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease',
                    '& svg': {
                      color: '#fff',
                      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.5))',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.35)',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <IconX size="18" stroke={1.6} />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          <Divider />
          {/* Main Content Area */}
          <Box
            sx={{
              overflow: 'auto',
              height: { lg: 'calc(100vh - 220px)', md: '100vh' },
              maxHeight: '800px',
            }}
            p={5}
          >
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              mb={5}
            >
              <Avatar
                alt={selectedPersonnel.name}
                src={selectedPersonnel.photoUrl ? `${selectedPersonnel.photoUrl}` : undefined}
                sx={{ width: 160, height: 160, mb: 2 }}
              />
              <Typography variant="h4" fontWeight={800}>
                {selectedPersonnel.name}
              </Typography>
              <Typography variant="subtitle1" color="textSecondary" mt={1}>
                {selectedPersonnel.position} • {selectedPersonnel.department}
              </Typography>
            </Box>

            <Grid container spacing={5} mb={3}>
              <Grid size={{ lg: 6, md: 12, sm: 12 }} display="flex" flexDirection="column">
                <CustomFormLabel>Employee Code</CustomFormLabel>
                <Typography>{selectedPersonnel.employeeCode || '-'}</Typography>

                <CustomFormLabel>Email</CustomFormLabel>
                <Typography>{selectedPersonnel.email || '-'}</Typography>

                <CustomFormLabel>Phone</CustomFormLabel>
                <Typography>{selectedPersonnel.phone || '-'}</Typography>
                
                <CustomFormLabel>Gender</CustomFormLabel>
                <Typography>{selectedPersonnel.gender || '-'}</Typography>
              </Grid>

              <Grid size={{ lg: 6, md: 12, sm: 12 }} display="flex" flexDirection="column">
                <CustomFormLabel>City</CustomFormLabel>
                <Typography>{selectedPersonnel.city || '-'}</Typography>

                <CustomFormLabel>Postal Code</CustomFormLabel>
                <Typography>{selectedPersonnel.postalCode || '-'}</Typography>

                <CustomFormLabel>Address</CustomFormLabel>
                <Typography>{selectedPersonnel.address || '-'}</Typography>
                
                <CustomFormLabel>Site Location</CustomFormLabel>
                <Typography>{selectedPersonnel.siteName || '-'}</Typography>
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        <Box p={3} height="50vh" display={'flex'} justifyContent="center" alignItems={'center'}>
          <Box>
            <Typography variant="h4">Please Select a Personnel</Typography>
            <br />
          </Box>
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete personnel <strong>{personnelToDelete?.name}</strong>?
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

      {/* Loading Backdrop */}
      {loading &&
        createPortal(
          <Backdrop
            open={loading}
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <CircularProgress color="inherit" />
          </Backdrop>,
          document.body,
        )}
    </>
  );
};

export default PersonnelContent;
