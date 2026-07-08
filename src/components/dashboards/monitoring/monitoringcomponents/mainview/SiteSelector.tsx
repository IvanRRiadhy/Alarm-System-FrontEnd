import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import {
  IconX,
  IconSearch,
  IconChevronDown,
  IconChevronRight,
  IconBuilding,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';

interface SiteSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectFloor?: (site: string, floor: string) => void;
}

interface SiteData {
  name: string;
  floors: string[];
}

const sites: SiteData[] = [
  {
    name: 'KCP Surabaya Diponegoro',
    floors: ['Lantai 1', 'Lantai 2', 'Basement'],
  },
  {
    name: 'KCP Medan Iskandar Muda',
    floors: ['Lantai 1', 'Lantai 2'],
  },
  {
    name: 'KCP Makassar Ratulangi',
    floors: ['Lantai 1'],
  },
  {
    name: 'KCP Bandung Asia Afrika',
    floors: ['Lantai 1', 'Lantai 2'],
  },
  {
    name: 'KCP Semarang Pandanaran',
    floors: ['Lantai 1'],
  },
];

const SiteSelector: React.FC<SiteSelectorProps> = ({ open, onClose, onSelectFloor }) => {
  const [expandedSite, setExpandedSite] = useState<string>('KCP Surabaya Diponegoro');
  const [selectedFloor, setSelectedFloor] = useState<string>('KCP Surabaya Diponegoro|Lantai 1');
  const [searchQuery, setSearchQuery] = useState('');

  if (!open) return null;

  const filteredSites = searchQuery
    ? sites.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.floors.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sites;

  const handleToggleSite = (siteName: string) => {
    setExpandedSite((prev) => (prev === siteName ? '' : siteName));
  };

  const handleSelectFloor = (siteName: string, floor: string) => {
    setSelectedFloor(`${siteName}|${floor}`);
    onSelectFloor?.(siteName, floor);
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 280,
        height: '100%',
        bgcolor: '#111827',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Typography
          sx={{
            color: '#F8FAFC',
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: '0.5px',
          }}
        >
          PILIH TAMPILAN
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <IconX size={18} />
        </IconButton>
      </Box>

      {/* Search */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Cari site / lantai"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size={16} color="#64748B" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#0F172A',
              color: '#F8FAFC',
              fontSize: 13,
              borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              '&.Mui-focused fieldset': { borderColor: '#2563EB' },
            },
            '& .MuiInputBase-input::placeholder': { color: '#64748B', opacity: 1 },
          }}
        />
      </Box>

      {/* Site Tree */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: '#334155', borderRadius: 10 },
        }}
      >
        <List disablePadding>
          {filteredSites.map((site) => {
            const isExpanded = expandedSite === site.name;

            return (
              <React.Fragment key={site.name}>
                <ListItemButton
                  onClick={() => handleToggleSite(site.name)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 1.5,
                    mb: 0.25,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#64748B' }}>
                    {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#94A3B8' }}>
                    <IconBuildingSkyscraper size={16} />
                  </Box>
                  <ListItemText
                    primary={site.name}
                    primaryTypographyProps={{
                      sx: { color: '#E2E8F0', fontSize: 12, fontWeight: 600 },
                    }}
                  />
                </ListItemButton>

                <Collapse in={isExpanded}>
                  <List disablePadding sx={{ pl: 3 }}>
                    {site.floors.map((floor) => {
                      const floorKey = `${site.name}|${floor}`;
                      const isSelected = selectedFloor === floorKey;

                      return (
                        <ListItemButton
                          key={floor}
                          onClick={() => handleSelectFloor(site.name, floor)}
                          selected={isSelected}
                          sx={{
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1.5,
                            mb: 0.25,
                            bgcolor: isSelected ? '#2563EB' : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected ? '#2563EB' : 'rgba(255,255,255,0.04)',
                            },
                            '&.Mui-selected': {
                              bgcolor: '#2563EB',
                              '&:hover': { bgcolor: '#1d4ed8' },
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              mr: 1,
                              color: isSelected ? '#fff' : '#64748B',
                            }}
                          >
                            <IconBuilding size={14} />
                          </Box>
                          <ListItemText
                            primary={floor}
                            primaryTypographyProps={{
                              sx: {
                                color: isSelected ? '#fff' : '#94A3B8',
                                fontSize: 12,
                                fontWeight: isSelected ? 600 : 400,
                              },
                            }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          })}
        </List>
      </Box>
    </Box>
  );
};

export default SiteSelector;
