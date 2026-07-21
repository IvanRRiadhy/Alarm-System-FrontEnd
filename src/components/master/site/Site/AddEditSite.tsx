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
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  FormHelperText,
  Stack,
  InputAdornment,
} from '@mui/material';
import { IconPencil, IconPlus, IconMapPin } from '@tabler/icons-react';
import { toast } from 'react-hot-toast';
import React, { useEffect, useState } from 'react';
import CustomFormLabel from 'src/components/forms/theme-elements/CustomFormLabel';
import CustomTextField from 'src/components/forms/theme-elements/CustomTextField';
import { SiteType } from 'src/store/apps/crud/site';
import { defaultSiteForm } from 'src/store/apps/defaultForm';
import { useAddSite, useEditSite } from 'src/hooks/useSite';
import CustomAutocomplete from 'src/components/shared/CustomAutocomplete';
import { region as regionOptions } from 'src/types/crud/input';
import PhoneInput from 'src/components/shared/PhoneInput';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toastError } from 'src/utils/errors';
import { getConfig } from 'src/config';

interface FormType {
    type?: string;
    site?: SiteType;
}

type RegionOption = { id: string; name: string };

const mapRegionToTimezone = (regionName: string): string => {
  const normalized = regionName.toUpperCase().trim();
  
  const witaRegions = [
    'BALI',
    'NUSA TENGGARA BARAT',
    'NUSA TENGGARA TIMUR',
    'KALIMANTAN SELATAN',
    'KALIMANTAN TIMUR',
    'KALIMANTAN UTARA',
    'SULAWESI UTARA',
    'SULAWESI TENGAH',
    'SULAWESI SELATAN',
    'SULAWESI TENGGARA',
    'GORONTALO',
    'SULAWESI BARAT'
  ];

  const witRegions = [
    'MALUKU',
    'MALUKU UTARA',
    'PAPUA BARAT',
    'PAPUA SELATAN',
    'PAPUA TENGAH',
    'PAPUA',
    'PAPUA BARAT DAYA',
    'PAPUA PEGUNUNGAN'
  ];

  if (witaRegions.includes(normalized)) {
    return 'Asia/Makassar';
  } else if (witRegions.includes(normalized)) {
    return 'Asia/Jayapura';
  }
  
  return 'Asia/Jakarta';
};

const parsePhoneNumber = (fullNumber: string) => {
  if (!fullNumber) return { iso: 'ID', local: '' };
  
  const cleaned = fullNumber.replace(/^\+/, '');
  const countries = getCountries();
  for (const country of countries) {
    const code = getCountryCallingCode(country);
    if (cleaned.startsWith(code)) {
      const local = cleaned.substring(code.length);
      return { iso: country, local };
    }
  }
  return { iso: 'ID', local: cleaned };
};

const getDialCode = (iso: string) => {
  try {
    return getCountryCallingCode(iso as any);
  } catch {
    return '62';
  }
};

const pinMarkerIcon = L.divIcon({
  html: `
    <div style="
      background-color: #ef4444; 
      width: 24px; 
      height: 24px; 
      border-radius: 50% 50% 50% 0; 
      transform: rotate(-45deg); 
      border: 2.5px solid #ffffff; 
      box-shadow: 0 0 6px rgba(0,0,0,0.4);
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <div style="
        background-color: #ffffff; 
        width: 8px; 
        height: 8px; 
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

// Component to handle map click events
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to handle map controller panning
const MapController = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    setTimeout(() => {
      map.invalidateSize();
    }, 150);
  }, [center, zoom, map]);
  return null;
};

const AddEditSite = ({type, site}: FormType) => {
    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    try {
      const config = getConfig();
      if (config.MAP_TILE_URL) {
        tileUrl = config.MAP_TILE_URL;
      }
    } catch (e) {
      // Config not loaded yet
    }

    const [open, setOpen] = React.useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        ...defaultSiteForm,
        ...site,
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [countryCode, setCountryCode] = useState('ID');
    const [localPhone, setLocalPhone] = useState('');
    const [isLocating, setIsLocating] = useState(false);

    const addMutation = useAddSite();
    const editMutation = useEditSite();

    // 🧭 Open/close dialog
    const handleClickOpen = () => {
      setFormErrors({});
      if (type === 'edit' && site) {
        const parsed = parsePhoneNumber(site.phone || '');
        setCountryCode(parsed.iso);
        setLocalPhone(parsed.local);
        setFormData({ 
          ...defaultSiteForm, 
          ...site,
        });
      } else {
        setCountryCode('ID');
        setLocalPhone('');
        setFormData({ 
          ...defaultSiteForm,
        });
      }
      setOpen(true);
    };

    const handleClose = () => setOpen(false);

    // 🧩 Validation
    const validateForm = (): boolean => {
      const errors: Record<string, string> = {};
      if (!formData.name?.trim()) errors.name = 'Site name is required';
      if (!formData.code?.trim()) errors.code = 'Code is required';
      if (!formData.region) errors.region = 'Region is required';
    //   if (!localPhone?.trim()) errors.phone = 'Phone number is required';
    //   if (!formData.address?.trim()) errors.address = 'Address is required';
      
      // Ensure lat and lng are valid numbers
    //   if (formData.latitude === undefined || formData.latitude === null || isNaN(formData.latitude)) {
    //     errors.latitude = 'Latitude must be a valid number';
    //   }
    //   if (formData.longitude === undefined || formData.longitude === null || isNaN(formData.longitude)) {
    //     errors.longitude = 'Longitude must be a valid number';
    //   }

      setFormErrors(errors);    
      return Object.keys(errors).length === 0;
    };
  
    // 💾 Save handler
    const handleSave = async () => {
      console.log("SOmething")
      if (!validateForm()) {
        toast.error('Please fill in all required fields.');
        return;
      }
  
      try {
        setIsSaving(true);
  
        const payload = {
          id: formData.id,
          name: formData.name,
          code: formData.code,
          region: formData.region,
          address: formData.address,
          phone: localPhone ? `+${getDialCode(countryCode)}${localPhone}` : '',
          timezone: formData.timezone,
          longitude: Number(formData.longitude),
          latitude: Number(formData.latitude)
        };
  
        if (type === 'add') {
          await addMutation.mutateAsync(payload);
          toast.success('Site added successfully!');
        } else {
          await editMutation.mutateAsync(payload);
          toast.success('Site updated successfully!');
        }
  
        handleClose();
      } catch (error) {
        console.error('Error saving site:', error);
        toastError(error, 'Saving data unsuccessful.');
      } finally {
        setIsSaving(false);
      }
    };

    // 🧠 Handle input changes
    const handleInputChange = (
      e:
        | React.ChangeEvent<HTMLInputElement>
        | { target: { id?: string; name?: string; value: string } },
    ) => {
      const { id, name, value } = e.target;
      const key = (id || name) as keyof typeof formData;
      if (!key) return;
  
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { id, name, value } = e.target;
      const key = (id || name) as keyof typeof formData;
      if (!key) return;

      const numVal = value === '' ? 0 : parseFloat(value);
      setFormData((prev) => ({
        ...prev,
        [key]: isNaN(numVal) ? 0 : numVal,
      }));
    };

    // Locate address on map using Nominatim API
    const locateAddress = async () => {
      if (!formData.address?.trim()) {
        toast.error('Please enter an address to locate first.');
        return;
      }
      try {
        setIsLocating(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            formData.address
          )}`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          setFormData((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
          }));
          toast.success('Location pinpointed on map!');
        } else {
          toast.error('Could not find coordinates for this address.');
        }
      } catch (error) {
        console.error('Locate error:', error);
        toastError(error, 'Error finding coordinates.');
      } finally {
        setIsLocating(false);
      }
    };

    // Determine Map Center and Zoom
    const mapHasLocation = formData.latitude !== 0 || formData.longitude !== 0;
    const mapCenter: [number, number] = mapHasLocation
      ? [formData.latitude, formData.longitude]
      : [-2.5, 118.0];
    const mapZoom = mapHasLocation ? 15 : 5;

    return (
        <>
            {type === 'edit' && (
                <Tooltip title="Edit Site">
                  <IconButton color="primary" size="small" onClick={handleClickOpen}>
                    <IconPencil size={20} />
                  </IconButton>
                </Tooltip>
            )}
            {type === 'add' && (
                <Tooltip title="Add Site">
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

            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>
                    <Typography component="div" variant="h4" my={2} fontWeight={700}>
                        {type === 'add' ? 'Add Site' : 'Edit Site'}
                    </Typography>
                    <Divider />
                </DialogTitle>
                
                <DialogContent>
                    <Grid container spacing={3} mt={1}>
                        {/* Site Code */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="code">Site Code</CustomFormLabel>
                            <CustomTextField
                                id="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Site Code"
                                error={!!formErrors.code}
                                helperText={formErrors.code}
                                required
                            />
                        </Grid>

                        {/* Site Name */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="name">Site Name</CustomFormLabel>
                            <CustomTextField
                                id="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Enter Site Name"
                                error={!!formErrors.name}
                                helperText={formErrors.name}
                                required
                            />
                        </Grid>

                        {/* Region CustomAutocomplete */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="region">Region</CustomFormLabel>
                            <CustomAutocomplete<RegionOption>
                                multiple={false}
                                label="Region"
                                options={regionOptions}
                                value={regionOptions.find((r) => r.name === formData.region) || null}
                                onChange={(val) => {
                                    const timezone = val ? mapRegionToTimezone(val.name) : 'Asia/Jakarta';
                                    setFormData((prev) => ({ 
                                        ...prev, 
                                        region: val?.name ?? '',
                                        timezone
                                    }));
                                    setFormErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.region;
                                        return next;
                                    });
                                }}
                                getOptionLabel={(o) => o?.name ?? ''}
                                isOptionEqualToValue={(opt, val) => opt.id === val.id}
                                required
                                error={!!formErrors.region}
                                helperText={formErrors.region}
                            />
                        </Grid>

                        {/* Timezone (Auto-assigned) */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="timezone">Timezone</CustomFormLabel>
                            <CustomTextField
                                id="timezone"
                                value={formData.timezone}
                                fullWidth
                                variant="outlined"
                                disabled
                                helperText="Auto-assigned based on region"
                            />
                        </Grid>

                        {/* Phone Input */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <PhoneInput
                                value={localPhone}
                                onChange={(val) => {
                                    setLocalPhone(val);
                                    setFormErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.phone;
                                        return next;
                                    });
                                }}
                                countryCode={countryCode}
                                onCountryCodeChange={setCountryCode}
                                error={!!formErrors.phone}
                                helperText={formErrors.phone}
                            />
                        </Grid>

                        {/* Address Input */}
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <CustomFormLabel htmlFor="address">Address</CustomFormLabel>
                            <CustomTextField
                                id="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={1}
                                variant="outlined"
                                placeholder="Enter Address"
                                error={!!formErrors.address}
                                helperText={formErrors.address}
                                required
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton 
                                                    onClick={locateAddress} 
                                                    disabled={isLocating}
                                                    color="primary"
                                                    size="small"
                                                    title="Locate coordinates from address"
                                                >
                                                    {isLocating ? <CircularProgress size={20} /> : <IconMapPin size={20} />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }
                                }}
                            />
                        </Grid>

                        {/* Coordinates */}
                        <Grid size={{ xs: 6, sm: 6 }}>
                            <CustomFormLabel htmlFor="latitude">Latitude</CustomFormLabel>
                            <CustomTextField
                                id="latitude"
                                type="number"
                                value={formData.latitude}
                                onChange={handleNumberInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Latitude"
                                error={!!formErrors.latitude}
                                helperText={formErrors.latitude}
                                slotProps={{
                                    htmlInput: { step: "any" }
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 6 }}>
                            <CustomFormLabel htmlFor="longitude">Longitude</CustomFormLabel>
                            <CustomTextField
                                id="longitude"
                                type="number"
                                value={formData.longitude}
                                onChange={handleNumberInputChange}
                                fullWidth
                                variant="outlined"
                                placeholder="Longitude"
                                error={!!formErrors.longitude}
                                helperText={formErrors.longitude}
                                slotProps={{
                                    htmlInput: { step: "any" }
                                }}
                            />
                        </Grid>

                        {/* Map Pinpoint */}
                        <Grid size={12}>
                            <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1}>
                                Pinpoint Location (Click map to adjust coordinates)
                            </Typography>
                            <Box 
                                sx={{ 
                                    height: 250, 
                                    width: '100%', 
                                    borderRadius: 2, 
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0,0,0,0.12)' 
                                }}
                            >
                                {open && (
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={mapZoom}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                            url={tileUrl}
                                        />
                                        <MapController center={mapCenter} zoom={mapZoom} />
                                        <MapClickHandler 
                                            onMapClick={(lat, lng) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: Number(lat.toFixed(6)),
                                                    longitude: Number(lng.toFixed(6))
                                                }));
                                            }} 
                                        />
                                        {mapHasLocation && (
                                            <Marker 
                                                position={[formData.latitude, formData.longitude]} 
                                                icon={pinMarkerIcon}
                                            />
                                        )}
                                    </MapContainer>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ display: 'flex', justifyContent: 'space-between', px: 3, pb: 2 }}>
                    <Button onClick={handleClose} variant="outlined" sx={{ fontSize: '1rem', py: 1, px: 3 }}>
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
        </>
    );
};

export default AddEditSite;