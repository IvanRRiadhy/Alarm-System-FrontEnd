import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid2 as Grid,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  CircularProgress,
} from '@mui/material';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import { userType, userRegistrationType } from 'src/store/apps/crud/users';
import { useRegisterUser, useEditUser } from 'src/hooks/useUser';
import { IconEdit, IconUpload, IconCamera, IconX, IconReload, IconPlus } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { useUploadCDN } from 'src/hooks/useCDN';
import { BASE_URL } from 'src/utils/axios';
import { toastError } from 'src/utils/errors';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { useSiteLookup } from 'src/hooks/useSite';
import { SiteType } from 'src/store/apps/crud/site';

interface AddEditUserProps {
  user?: userType;
  type: 'add' | 'edit';
}

const steps = ['User Details', 'Profile Picture (Optional)'];

const defaultUserForm: userRegistrationType = {
  username: '',
  password: '',
  email: '',
  fullName: '',
  profilePicture: '',
  siteIds: [],
};

const AddEditUser: React.FC<AddEditUserProps> = ({ user, type }) => {
  const [open, setOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  const getInitialFormData = (): userRegistrationType => {
    if (type === 'edit' && user) {
      return {
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // blank by default on edit
        profilePicture: user.profilePicture || '',
        siteIds: user.siteIds || [],
      };
    }
    return { ...defaultUserForm };
  };

  const [formData, setFormData] = useState<userRegistrationType>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Photo states
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    user?.profilePicture ? `${user.profilePicture}` : null
  );
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const registerMutation = useRegisterUser();
  const editMutation = useEditUser();
  const uploadMutation = useUploadCDN();
  const { data: siteLookupResponse, isLoading: isLoadingSites } = useSiteLookup();
  const sites = siteLookupResponse?.data || [];

  const handleOpen = () => {
    setFormData(getInitialFormData());
    setPreview(user?.profilePicture ? `${user.profilePicture}` : null);
    setImage(null);
    setFormErrors({});
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

  const validateStep0 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.username?.trim()) {
      errors.username = 'Username is required';
    }
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if(!formData.email?.trim()) {
      errors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }
    }
    if (type === 'add' && !formData.password?.trim()) {
      errors.password = 'Password is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (validateStep0()) {
        setActiveStep(1);
      } else {
        toast.error('Please fill in all required fields.');
      }
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    stopCamera();
    setIsCameraOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
    if (!validateStep0()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setIsSaving(true);
    let finalProfilePicture = formData.profilePicture || '';

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
        finalProfilePicture = uploaded.fileUrl;
      } catch (err) {
        console.error('CDN upload failed:', err);
        toast.error('Failed to upload image.');
        setIsSaving(false);
        return; // Stop saving if upload fails
      }
    }

    // Prepare payload. Omit password on edit if it's empty
    const payload: userRegistrationType = {
      username: formData.username,
      fullName: formData.fullName,
      email: formData.email,
      profilePicture: finalProfilePicture,
      siteIds: formData.siteIds || [],
    } as any;

    if (type === 'add' || formData.password) {
      payload.password = formData.password;
    }

    try {
      if (type === 'add') {
        await registerMutation.mutateAsync(payload);
        toast.success('User registered successfully');
      } else {
        if (user?.id) {
          await editMutation.mutateAsync({ payload, id: user.id });
          toast.success('User updated successfully');
        } else {
          throw new Error('Missing User ID');
        }
      }
      handleClose();
    } catch (error) {
      toastError(error, 'Failed to save user');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {type === 'add' ? (
        <Button variant="contained" color="primary" onClick={handleOpen} startIcon={<IconPlus size="18" />}>
          Add User
        </Button>
      ) : (
        <IconButton color="primary" size="small" onClick={handleOpen}>
          <IconEdit size="20" />
        </IconButton>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            {type === 'add' ? 'Add User' : 'Edit User'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ minHeight: '350px' }}>
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
                <CustomFormLabel htmlFor="username">Username</CustomFormLabel>
                <CustomTextField
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  error={!!formErrors.username}
                  helperText={formErrors.username}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel htmlFor="fullName">Full Name</CustomFormLabel>
                <CustomTextField
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel htmlFor="email">Email</CustomFormLabel>
                <CustomTextField
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.fullName}
                  helperText={formErrors.fullName}
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomFormLabel htmlFor="password">
                  Password {type === 'edit' && '(Leave blank to keep unchanged)'}
                </CustomFormLabel>
                <CustomTextField
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  fullWidth
                  required={type === 'add'}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <CustomFormLabel htmlFor="siteIds">Accessible Sites</CustomFormLabel>
                <CustomAutocomplete<SiteType>
                  multiple
                  id="siteIds"
                  placeholder="Select Sites"
                  options={sites}
                  loading={isLoadingSites}
                  value={sites.filter((s) => formData.siteIds?.includes(s.id))}
                  onChange={(selectedSites) => {
                    setFormData((prev) => ({
                      ...prev,
                      siteIds: selectedSites.map((s) => s.id),
                    }));
                  }}
                  getOptionLabel={(option) => option.name}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  filterSelectedOptions
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6" mb={2}>
                Upload or Capture Profile Picture (Optional)
              </Typography>
              
              {!isCameraOpen && !preview && (
                <Box display="flex" gap={2} mb={3}>
                  <Button
                    variant="outlined"
                    startIcon={<IconUpload />}
                    onClick={() => document.getElementById('profile-pic-upload')?.click()}
                  >
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    id="profile-pic-upload"
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
                      alt="Profile Preview"
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
                        setFormData((prev) => ({ ...prev, profilePicture: '' }));
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
                      onClick={() => document.getElementById('profile-pic-upload-replace')?.click()}
                    >
                      Change Image
                    </Button>
                    <input
                      type="file"
                      id="profile-pic-upload-replace"
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

export default AddEditUser;
