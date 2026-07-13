import { BASE_URL } from 'src/utils/axios';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2 as Grid,
  IconButton,
  SelectChangeEvent,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  FormHelperText,
} from '@mui/material';
import { IconPencil, IconPlus } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import React from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { AppDispatch, RootState, useDispatch, useSelector } from 'src/store/Store';
import {
  addBuilding,
  BuildingType,
  editBuilding,
  fetchBuildingDT,
  fetchBuildings,
} from 'src/store/apps/crud/building';
import { defaultBuildingForm } from 'src/store/apps/defaultForm';
import { useAddBuilding, useEditBuilding } from 'src/hooks/useBuilding';
import { useSiteList, useSiteLookup } from 'src/hooks/useSite';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { useUploadCDN } from 'src/hooks/useCDN';
import { toastError } from 'src/utils/errors';

interface FormType {
  type?: string;
  building?: BuildingType;
  fixedSiteId?: string;
  trigger?: (onClick: () => void) => React.ReactNode;
}

const getCdnUrl = (url?: string | null) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://ble-cdn.tunnel.piranticerdasindonesia.com/${url}`;
};

const AddEditBuilding = ({ type, building, fixedSiteId, trigger }: FormType) => {
  const [open, setOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [image, setImage] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(building?.imageUrl || null);
  const [fromLocal, setFromLocal] = React.useState(false);
  const [formData, setFormData] = React.useState({
    ...defaultBuildingForm,
    ...building,
    ...(fixedSiteId ? { siteId: fixedSiteId } : {}),
  });
  const {data: siteResponse} = useSiteLookup();
  const siteData = siteResponse?.data || [];
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});
  const addMutation = useAddBuilding();
  const editMutation = useEditBuilding();
  const uploadMutation = useUploadCDN();

  const buildingFilter = useSelector((state: RootState) => state.buildingReducer.buildingFilter);
  const dispatch: AppDispatch = useDispatch();

  const handleClickOpen = async () => {
    setFormErrors({});
    if (type === 'edit') {
      if (!building?.id) {
        // You can optionally fetch the building detail here using the ID
        await dispatch(fetchBuildingDT(buildingFilter));
      }
      setFormData({ ...defaultBuildingForm, ...building });
      
      setPreview(building?.imageUrl || null);
    } else {
      setFormData({ ...defaultBuildingForm, ...(fixedSiteId ? { siteId: fixedSiteId } : {}) });
      setImage(null);
      setPreview(null);
    }

    // Simulate or wait for building data to finish preparing
    setTimeout(() => {
      setOpen(true);
    }, 100); // optional small delay for smoother UX
  };

  const handleClose = () => {
    setOpen(false);
    setImage(null);
    setPreview(building?.imageUrl || null);
    setFromLocal(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement> | SelectChangeEvent<string>,
  ) => {
    const { value, name, id } = e.target as
      | HTMLInputElement
      | { value: string; name: string; id?: string };
    setFormData((prev) => ({ ...prev, [id || name]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const maxSize = 10 * 1024 * 1024;
    if (file) {
      if (file.size > maxSize) {
        toast.error('File size exceeds 10MB. Please upload a smaller file.');
        return;
      } else if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        console.log(file);
        setImage(file);
        // console.log('Selected file:', file);
        setPreview(URL.createObjectURL(file)); // Preview selected image
        setFromLocal(true);
        // console.log(preview);
      } else {
        alert('Please select a valid image file (PNG, JPG, JPEG)');
      }
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) errors.name = 'Building name is required';
    if (!formData.siteId?.trim()) errors.siteId = 'Site is required';
    if (!image && !formData.imageUrl) errors.image = 'Building Image is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);

    let finalImageUrl = formData.imageUrl;

    // If there is a new image selected, upload to CDN first
    if (image) {
      const uploadData = new FormData();
      uploadData.append('file', image);

      try {
        const uploadRes = await uploadMutation.mutateAsync(uploadData);
        const uploaded = uploadRes?.collection?.data?.[0];
        if (!uploaded || !uploaded.fileUrl) {
          throw new Error('Invalid response from CDN upload');
        }
        finalImageUrl = uploaded.fileUrl;
      } catch (error) {
        console.error('CDN upload failed:', error);
        toastError(error, 'Failed to upload image.');
        setIsSaving(false);
        return; // Aborts saving, keeps dialog open
      }
    }

    // Construct FormData using the CDN URL string
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (['image', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'siteName'].includes(key)) {
        return;
      }

      if (key === 'imageUrl') {
        data.append('imageUrl', finalImageUrl || '');
        return;
      }

      if (value !== null && value !== undefined) {
        data.append(key, value.toString());
      }
    });

    try {
      if (type === 'add') {
        await addMutation.mutateAsync(data);
        toast.success('Building added successfully!');
      } else {
        await editMutation.mutateAsync(data);
        toast.success('Building updated successfully!');
      }
      handleClose();
    } catch (error) {
      console.error('Error saving building:', error);
      toastError(error, 'Failed to save building.');
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <>
      {trigger ? (
        trigger(handleClickOpen)
      ) : (
        <>
          {type === 'edit' && (
            <Tooltip title="Edit Building">
              <IconButton color="primary" size="small" onClick={handleClickOpen}>
                <IconPencil size={20} />
              </IconButton>
            </Tooltip>
          )}
          {type === 'add' && (
            <Tooltip title="Add Building">
              <Button
                variant="contained"
                color="primary"
                sx={{ p: 0.5, minWidth: 40, minHeight: 40 }}
                onClick={handleClickOpen}
              >
                <IconPlus size={20} />
              </Button>
            </Tooltip>
          )}
        </>
      )}
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle>
            <Typography component="div" variant="h4" mb={2} mt={2} fontWeight={700}>
              {type === 'add' ? 'Add Building' : 'Edit Building'}
            </Typography>
            <Divider />
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={5} mb={3}>
              <Grid size={{ lg: 6, md: 12, sm: 12 }}>
                <CustomFormLabel htmlFor="building-Name">Building Name</CustomFormLabel>
                <CustomTextField
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter Building Name"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                />
              </Grid>
              <Grid size={{ lg: 6, md: 12, sm: 12 }}>
                <CustomFormLabel htmlFor="site-select">Site</CustomFormLabel>
                <CustomAutocomplete
                  label="Select Site"
                  options={siteData}
                  value={siteData.find((s) => s.id === formData.siteId) || null}
                  onChange={(val) => setFormData((prev) => ({ ...prev, siteId: val?.id ?? '', siteName: val?.name ?? '' }))}
                  getOptionLabel={(o) => o.name}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  error={!!formErrors.siteId}
                  helperText={formErrors.siteId}
                  required
                />
              </Grid>
            </Grid>
            <Grid container spacing={5} mb={3}>
              <Grid size={{ lg: 6, md: 12, sm: 12 }}>
                <CustomFormLabel
                  htmlFor="building-image"
                  sx={formErrors.image ? { color: 'error.main' } : undefined}
                >
                  Building Image
                </CustomFormLabel>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleImageChange}
                  id="building-image"
                  style={{
                    border: formErrors.image ? '1px solid red' : undefined,
                    padding: '6px',
                    borderRadius: '4px',
                    width: '100%',
                    marginTop: '5px',
                  }}
                />
                {/* Show error manually */}
                {formErrors.image && <FormHelperText error>{formErrors.image}</FormHelperText>}
                {preview && (
                  <img
                    src={preview?.startsWith('blob:') ? preview : getCdnUrl(preview)}
                    alt="Building Preview"
                    style={{ width: '100%', marginTop: '10px', borderRadius: '5px' }}
                  />
                )}
              </Grid>
              <Grid size={{ lg: 6, md: 12, sm: 12 }}>
                <CustomFormLabel htmlFor="description">Description</CustomFormLabel>
                <CustomTextField
                  id="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  fullWidth
                  variant="outlined"
                  placeholder="Enter Building Description"
                  multiline
                  rows={4}
                  error={!!formErrors.description}
                  helperText={formErrors.description}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2 }}>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{ fontSize: '1rem', py: 1, px: 3 }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="contained"
              sx={{ fontSize: '1rem', py: 1, px: 3 }}
              disabled={isSaving}
            >
              {isSaving ? <CircularProgress size={20} color="inherit" /> : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>
      {isSaving && (
        <Dialog open={open} fullWidth maxWidth="sm">
          <DialogContent sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h1" mb={5}>
              Loading...{' '}
            </Typography>
            <CircularProgress size={50} color="primary" />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AddEditBuilding;
