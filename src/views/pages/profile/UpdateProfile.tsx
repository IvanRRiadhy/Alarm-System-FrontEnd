import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  CardContent,
  Grid2 as Grid,
  Typography,
  Avatar,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import Breadcrumb from 'src/layouts/full/shared/breadcrumb/Breadcrumb';
import ParentCard from 'src/components/shared/ParentCard';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import { useUserProfile, useUpdateProfile } from 'src/hooks/useUser';
import { useUploadCDN } from 'src/hooks/useCDN';
import { userUpdateProfilePayload } from 'src/store/apps/crud/users';
import { IconEye, IconEyeOff, IconUpload, IconTrash, IconUser, IconMail, IconLock } from '@tabler/icons-react';
import toast from 'react-hot-toast';
import { toastError } from 'src/utils/errors';
import { useNavigate } from 'react-router';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Update Profile',
  },
];

const UpdateProfile = () => {
  const navigate = useNavigate();
  const { data: profileData, isLoading: isLoadingProfile } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();
  const uploadCDNMutation = useUploadCDN();

  const [formData, setFormData] = useState<userUpdateProfilePayload>({
    fullName: '',
    username: '',
    email: '',
    profilePicture: '',
    currentPassword: '',
    password: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Populate initial values when profileData is fetched
  useEffect(() => {
    if (profileData) {
      setFormData((prev) => ({
        ...prev,
        fullName: profileData.fullName || '',
        username: profileData.username || '',
        email: profileData.email || '',
        profilePicture: profileData.profilePicture || '',
      }));
      setPreviewUrl(profileData.profilePicture || '');
    }
  }, [profileData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePicture = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData((prev) => ({ ...prev, profilePicture: '' }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSaving(true);
      let pictureUrl = formData.profilePicture;

      // Upload image to CDN if a new file was selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        const uploadRes = await uploadCDNMutation.mutateAsync(uploadData);
        pictureUrl = uploadRes?.collection?.data?.[0]?.fileUrl || uploadRes?.url || uploadRes?.data?.url || pictureUrl;
      }

      const payload: userUpdateProfilePayload = {
        ...formData,
        profilePicture: pictureUrl,
      };

      await updateProfileMutation.mutateAsync(payload);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toastError(error, 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <PageContainer title="Update Profile" description="Update your account details">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Update Profile" description="Update profile information and password">
      <Breadcrumb title="Update Profile" />

      <Grid container spacing={3}>
        {/* Profile Picture Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ParentCard title="Profile Picture">
            <Box display="flex" flexDirection="column" alignItems="center" p={2}>
              <Avatar
                src={previewUrl || undefined}
                sx={{
                  width: 140,
                  height: 140,
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  fontSize: 48,
                  mb: 3,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                {!previewUrl && (formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U')}
              </Avatar>

              <Typography variant="body2" color="textSecondary" align="center" mb={2}>
                Allowed JPG, PNG or GIF. Max size of 5MB
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button variant="contained" component="label" startIcon={<IconUpload size={18} />}>
                  Upload Photo
                  <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                </Button>
                {previewUrl && (
                  <Button variant="outlined" color="error" onClick={handleRemovePicture} startIcon={<IconTrash size={18} />}>
                    Remove
                  </Button>
                )}
              </Stack>
            </Box>
          </ParentCard>
        </Grid>

        {/* User Details Form Card */}
        <Grid size={{ xs: 12, md: 8 }}>
          <ParentCard title="Account Details">
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="fullName" sx={{ mt: 0 }}>
                    Full Name
                  </CustomFormLabel>
                  <CustomTextField
                    id="fullName"
                    variant="outlined"
                    fullWidth
                    value={formData.fullName}
                    onChange={(e: any) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    error={!!formErrors.fullName}
                    helperText={formErrors.fullName}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconUser size={20} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="username" sx={{ mt: 0 }}>
                    Username
                  </CustomFormLabel>
                  <CustomTextField
                    id="username"
                    variant="outlined"
                    fullWidth
                    value={formData.username}
                    onChange={(e: any) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                    error={!!formErrors.username}
                    helperText={formErrors.username}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconUser size={20} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <CustomFormLabel htmlFor="email" sx={{ mt: 0 }}>
                    Email Address
                  </CustomFormLabel>
                  <CustomTextField
                    id="email"
                    type="email"
                    variant="outlined"
                    fullWidth
                    value={formData.email}
                    onChange={(e: any) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconMail size={20} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="h6" fontWeight={600} mt={1}>
                    Change Password (Optional)
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="currentPassword" sx={{ mt: 0 }}>
                    Current Password
                  </CustomFormLabel>
                  <CustomTextField
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={(e: any) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconLock size={20} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowCurrentPassword((prev) => !prev)} edge="end">
                              {showCurrentPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <CustomFormLabel htmlFor="password" sx={{ mt: 0 }}>
                    New Password
                  </CustomFormLabel>
                  <CustomTextField
                    id="password"
                    type={showNewPassword ? 'text' : 'password'}
                    variant="outlined"
                    fullWidth
                    placeholder="Enter new password"
                    value={formData.password}
                    onChange={(e: any) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IconLock size={20} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowNewPassword((prev) => !prev)} edge="end">
                              {showNewPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>
              </Grid>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button variant="outlined" color="secondary" onClick={() => navigate(-1)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button variant="contained" color="primary" type="submit" disabled={isSaving}>
                  {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
                </Button>
              </Stack>
            </Box>
          </ParentCard>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default UpdateProfile;
