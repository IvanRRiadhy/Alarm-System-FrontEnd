import React, { useState, useMemo, useRef } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  TextField, 
  InputAdornment, 
  Divider,
  InputBase,
  useTheme 
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconSearch } from '@tabler/icons-react';
import { getCountries, getCountryCallingCode } from 'libphonenumber-js';

interface Country {
  name: string;
  flag: string;
  code: string; // dialing prefix e.g. "62"
  iso: string;  // ISO code e.g. "ID"
}

// Generate the countries list dynamically using libphonenumber-js and Intl
const getFlagEmoji = (countryCode: string) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

const countriesList: Country[] = getCountries()
  .map((code): Country | null => {
    try {
      const name = displayNames.of(code) || code;
      const dialCode = getCountryCallingCode(code);
      const flag = getFlagEmoji(code);
      return {
        name,
        flag,
        code: dialCode,
        iso: code,
      };
    } catch {
      return null;
    }
  })
  .filter((c): c is Country => c !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  countryCode: string; // Stores ISO code, e.g. "ID"
  onCountryCodeChange: (code: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode,
  onCountryCodeChange,
  error = false,
  helperText,
  disabled = false,
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Anchoring dropdown state to the outer container instead of just flag button
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  
  // Search query inside menu
  const [searchQuery, setSearchQuery] = useState('');
  
  // Focus states for input box borders
  const [isFocused, setIsFocused] = useState(false);

  // Find active country using the ISO code
  const activeCountry = useMemo(() => {
    return countriesList.find(c => c.iso === countryCode) || countriesList.find(c => c.iso === 'ID') || countriesList[0];
  }, [countryCode]);

  // Filter countries list
  const filteredCountries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return countriesList;
    return countriesList.filter(
      c => c.name.toLowerCase().includes(query) || c.code.includes(query) || c.iso.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleOpenMenu = () => {
    setAnchorEl(containerRef.current);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSearchQuery('');
  };

  const handleSelectCountry = (iso: string) => {
    onCountryCodeChange(iso);
    handleCloseMenu();
  };

  // Auto-format function (spacing every 3 characters)
  const formatDisplayValue = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    const match = cleaned.match(/.{1,3}/g);
    return match ? match.join(' ') : cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length <= 15) { // standard max limit for phone number length
      onChange(raw);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, width: '100%' }}>
      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', ml: 0.25 }}>
        Phone number
      </Typography>

      {/* Unified Input border box */}
      <Box
        ref={containerRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid',
          borderColor: error 
            ? 'error.main' 
            : (isFocused || openMenu ? 'primary.main' : 'divider'),
          borderRadius: 2.5,
          bgcolor: disabled ? 'action.hover' : 'background.paper',
          opacity: disabled ? 0.75 : 1,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: error 
            ? `0 0 0 4px ${alpha(theme.palette.error.main, 0.12)}` 
            : (isFocused || openMenu ? `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}` : 'none'),
          p: '4px 6px',
          height: 44,
          boxSizing: 'border-box',
          '&:hover': {
            borderColor: error 
              ? 'error.main' 
              : (isFocused || openMenu ? 'primary.main' : (disabled ? 'divider' : 'text.secondary')),
          },
        }}
      >
        {/* Country Flag Button */}
        <IconButton
          onClick={handleOpenMenu}
          disabled={disabled}
          sx={{
            borderRadius: 2,
            px: 1,
            py: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25,
            color: 'text.primary',
            '&:hover': {
              bgcolor: 'action.hover',
            },
          }}
          aria-haspopup="true"
          aria-expanded={openMenu ? 'true' : undefined}
        >
          <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
            {activeCountry.flag}
          </Typography>
          <Typography sx={{ fontSize: '0.65rem', ml: 0.5, opacity: 0.7 }}>
            {openMenu ? '▲' : '▼'}
          </Typography>
        </IconButton>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />

        {/* Local Number Entry using InputBase for exact mockup alignment */}
        <InputBase
          fullWidth
          disabled={disabled}
          value={formatDisplayValue(value)}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          startAdornment={
            <InputAdornment position="start" sx={{ mr: 0.5 }}>
              <Typography sx={{ fontWeight: 400, color: 'text.secondary', fontSize: '0.875rem' }}>
                +{activeCountry.code}
              </Typography>
            </InputAdornment>
          }
          sx={{
            ml: 0.5,
            flex: 1,
            fontSize: '0.875rem',
            '& input': {
              padding: '6px 0',
              fontWeight: 500,
            }
          }}
        />
      </Box>

      {/* Helper text display */}
      {helperText && (
        <Typography 
          variant="caption" 
          sx={{ 
            ml: 0.5, 
            mt: 0.25,
            fontWeight: 700, 
            color: error ? 'error.main' : 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.7rem'
          }}
        >
          {helperText}
        </Typography>
      )}

      {/* Country selection menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={handleCloseMenu}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              borderRadius: 1, // User changed from 2.5 to 1
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              width: containerRef.current ? containerRef.current.offsetWidth : 'auto',
              bgcolor: theme.palette.mode === 'light' ? '#ffffff' : '#0f172a',
              overflow: 'hidden',
              '& .MuiMenu-list': {
                paddingTop: 0,
                paddingBottom: 0,
              },
            },
          },
        }}
      >
        {/* Search header inside menu */}
        <Box sx={{ p: 1.5, pb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search for country"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconSearch size={16} />
                  </InputAdornment>
                ),
                sx: { 
                  fontSize: '0.85rem', 
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'divider',
                  }
                },
              },
            }}
          />
        </Box>

        <Divider sx={{ my: 0.5 }} />

        {/* Scrollable list */}
        <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
          {filteredCountries.length === 0 ? (
            <Box sx={{ py: 2, px: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No countries found
              </Typography>
            </Box>
          ) : (
            filteredCountries.map((c) => (
              <MenuItem
                key={`${c.iso}-${c.code}`}
                onClick={() => handleSelectCountry(c.iso)}
                selected={c.iso === countryCode}
                sx={{
                  py: 1,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  fontSize: '0.875rem',
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', lineHeight: 1 }}>
                  {c.flag}
                </Typography>
                <Typography sx={{ flexGrow: 1, fontWeight: 500, fontSize: '0.875rem' }}>
                  {c.name} (+{c.code})
                </Typography>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>
    </Box>
  );
};

export default PhoneInput;
