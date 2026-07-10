import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  MenuItem,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomSelect from 'src/components/forms/theme-elements/CustomSelect';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import { useAddPersonnel, useEditPersonnel } from 'src/hooks/usePersonnel';
import { defaultPersonnelForm } from 'src/store/apps/defaultForm';
import { IconEdit, IconUpload, IconCamera, IconX, IconReload } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { useUploadCDN } from 'src/hooks/useCDN';
import { BASE_URL } from 'src/utils/axios';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { useSiteList } from 'src/hooks/useSite';
import { toastError } from 'src/utils/errors';

interface AddEditPersonnelProps {
  personnel?: PersonnelType;
  type: 'add' | 'edit';
}

const steps = ['Personnel Details', 'Photo'];

const AddEditPersonnel: React.FC<AddEditPersonnelProps> = ({ personnel, type }) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PersonnelType>(personnel || defaultPersonnelForm);

  const {data: siteResponse, isLoading} = useSiteList();
  const siteData = siteResponse?.data || [];

  // Photo states
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(personnel?.photoUrl ? `${BASE_URL}${personnel.photoUrl}` : null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const addMutation = useAddPersonnel();
  const editMutation = useEditPersonnel();
  const uploadMutation = useUploadCDN();

  const handleOpen = () => {
    setFormData(personnel || defaultPersonnelForm);
    setPreview(personnel?.photoUrl ? `${BASE_URL}${personnel.photoUrl}` : null);
    setImage(null);
    setActiveStep(0);
    setOpen(true);
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = () => {
    stopCamera();
    setOpen(false);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate step 1 if needed
      setActiveStep(1);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    stopCamera();
    setIsCameraOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  // --- Photo Logic ---
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        setImage(file);
        setPreview(URL.createObjectURL(file));
        setIsCameraOpen(false);
        stopCamera();
      } else {
        toast.error('Please select a valid image file (PNG/JPG)');
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      toast.error('Could not access camera. Please allow camera permissions.');
      console.error(err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
            setImage(file);
            setPreview(URL.createObjectURL(file));
            stopCamera();
            setIsCameraOpen(false);
          }
        }, 'image/jpeg');
      }
    }
  };

  // --- Submit Logic ---
  const handleSubmit = async () => {
    setIsSaving(true);
    let finalPhotoUrl = formData.photoUrl || '';

    // Upload image to CDN if a new image was selected/captured
    if (image) {
      const uploadData = new FormData();
      uploadData.append('file', image);

      try {
        const uploadRes = await uploadMutation.mutateAsync(uploadData);
        const uploaded = uploadRes?.collection?.data?.[0];
        if (!uploaded || !uploaded.fileUrl) {
          throw new Error('Invalid response from CDN upload');
        }
        finalPhotoUrl = uploaded.fileUrl;
      } catch (err) {
        console.error('CDN upload failed:', err);
        toast.error('Failed to upload image.');
        setIsSaving(false);
        return; // Stop saving if upload fails
      }
    }

    const payload = {
      ...formData,
      photoUrl: finalPhotoUrl,
    };

    try {
      if (type === 'add') {
        await addMutation.mutateAsync(payload);
        toast.success('Personnel added successfully');
      } else {
        await editMutation.mutateAsync(payload);
        toast.success('Personnel updated successfully');
      }
      handleClose();
    } catch (error) {
      toastError(error, 'Failed to save personnel');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {type === 'add' ? (
        <Button variant="contained" color="primary" onClick={handleOpen}>
          Add Personnel
        </Button>
      ) : (
        <Button onClick={handleOpen} size="small" variant="outlined" startIcon={<IconEdit size="18" />}>
          Edit
        </Button>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            {type === 'add' ? 'Add Personnel' : 'Edit Personnel'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '400px' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Name</CustomFormLabel>
                <CustomTextField
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Employee Code</CustomFormLabel>
                <CustomTextField
                  name="employeeCode"
                  value={formData.employeeCode}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Gender</CustomFormLabel>
                <CustomSelect name="gender" value={formData.gender} onChange={handleChange} fullWidth>
                  <MenuItem value="" disabled>Select Gender</MenuItem>
                  <MenuItem value="RatherNotSay">Rather Not Say</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </CustomSelect>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Email</CustomFormLabel>
                <CustomTextField
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Phone</CustomFormLabel>
                <CustomTextField
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Department</CustomFormLabel>
                <CustomTextField
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Position</CustomFormLabel>
                <CustomTextField
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>City</CustomFormLabel>
                <CustomTextField name="city" value={formData.city} onChange={handleChange} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Postal Code</CustomFormLabel>
                <CustomTextField
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
              {/* <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel>Is Active</CustomFormLabel>
                <CustomSelect
                  name="isActive"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e: any) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.value === 'true' }))
                  }
                  fullWidth
                >
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </CustomSelect>
              </Grid> */}
              <Grid size={{ lg: 6, md: 12, sm: 12 }}>
                              <CustomFormLabel htmlFor="site-select">Site</CustomFormLabel>
                              <CustomAutocomplete
                                label="Select Site"
                                options={siteData}
                                value={siteData.find((s) => s.id === formData.siteId) || null}
                                onChange={(val) => setFormData((prev) => ({ ...prev, siteId: val?.id ?? '' }))}
                                getOptionLabel={(o) => o.name}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                // error={!!formErrors.siteId}
                                // helperText={formErrors.siteId}
                                required
                                loading={isLoading}
                              />
                            </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomFormLabel>Address</CustomFormLabel>
                <CustomTextField
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6" mb={2}>
                Upload or Capture Photo
              </Typography>
              
              {!isCameraOpen && !preview && (
                <Box display="flex" gap={2} mb={3}>
                  <Button
                    variant="outlined"
                    startIcon={<IconUpload />}
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/png, image/jpeg, image/jpg"
                    style={{ display: 'none' }}
                    onChange={handleImageChange}
                  />
                  <Button variant="outlined" startIcon={<IconCamera />} onClick={startCamera}>
                    Use Camera
                  </Button>
                </Box>
              )}

              {isCameraOpen && (
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 400,
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: 3,
                      backgroundColor: '#000',
                    }}
                  >
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </Box>
                  <Box display="flex" gap={2} mt={2}>
                    <Button variant="contained" color="error" onClick={() => { setIsCameraOpen(false); stopCamera(); }}>
                      Cancel
                    </Button>
                    <Button variant="contained" color="primary" startIcon={<IconCamera />} onClick={capturePhoto}>
                      Capture
                    </Button>
                  </Box>
                </Box>
              )}

              {preview && !isCameraOpen && (
                <Box display="flex" flexDirection="column" alignItems="center">
                  <Box position="relative" display="inline-block">
                    <img
                      src={preview}
                      alt="Personnel"
                      style={{
                        width: '200px',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '16px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        border: '4px solid #fff',
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => {
                        setImage(null);
                        setPreview(null);
                      }}
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        backgroundColor: 'error.main',
                        color: 'white',
                        '&:hover': { backgroundColor: 'error.dark' },
                      }}
                    >
                      <IconX size={18} />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="textSecondary" mt={2}>
                    {image ? 'New image selected' : 'Current database image'}
                  </Typography>
                  <Box display="flex" gap={2} mt={2}>
                    <Button
                      variant="text"
                      startIcon={<IconReload size={18} />}
                      onClick={() => document.getElementById('photo-upload-replace')?.click()}
                    >
                      Change Image
                    </Button>
                    <input
                      type="file"
                      id="photo-upload-replace"
                      accept="image/png, image/jpeg, image/jpg"
                      style={{ display: 'none' }}
                      onChange={handleImageChange}
                    />
                    <Button variant="text" startIcon={<IconCamera size={18} />} onClick={() => { setImage(null); setPreview(null); startCamera(); }}>
                      Retake Photo
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: 'space-between' }}>
          <Button onClick={handleClose} color="inherit" variant="outlined" disabled={isSaving}>
            Cancel
          </Button>
          <Box display="flex" gap={1}>
            {activeStep === 1 && (
              <Button onClick={handleBack} variant="outlined" disabled={isSaving}>
                Back
              </Button>
            )}
            {activeStep === 0 ? (
              <Button onClick={handleNext} variant="contained" color="primary">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSaving || isCameraOpen}>
                {isSaving ? <CircularProgress size={24} color="inherit" /> : type === 'add' ? 'Save' : 'Update'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AddEditPersonnel;
