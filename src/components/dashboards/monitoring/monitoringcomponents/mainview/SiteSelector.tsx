import React, { useState, useEffect } from 'react';
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
  IconStack2,
  IconMap,
} from '@tabler/icons-react';
import { useSiteList } from 'src/hooks/useSite';
import { useAllBuilding, useBuildingList } from 'src/hooks/useBuilding';
import { useAllFloors, useFloorList } from 'src/hooks/useFloor';
import { useAllFloorplans, useFloorplanList } from 'src/hooks/useFloorplan';
import { FloorplanType } from 'src/store/apps/crud/floorplan';

interface SiteSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectFloorplan?: (floorplan: FloorplanType) => void;
  selectedFloorplanId?: string;
}

const SiteSelector: React.FC<SiteSelectorProps> = ({ open, onClose, onSelectFloorplan, selectedFloorplanId }) => {
  const [expandedSites, setExpandedSites] = useState<Record<string, boolean>>({});
  const [expandedBuildings, setExpandedBuildings] = useState<Record<string, boolean>>({});
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Data using Hooks
  const { data: siteResponse } = useSiteList({ page: 1, limit: 100, sortBy: 'name', sortOrder: 'asc' });
  const sites = siteResponse?.data || [];

  const { data: buildingResponse} = useBuildingList();
  const buildingData = buildingResponse?.data || [];
  const { data: floorResponse } = useFloorList();
  const floorData = floorResponse?.data || [];
  const { data: floorplanResponse } = useFloorplanList();
  const floorplanData = floorplanResponse?.data || [];

  // Auto-expand path for the currently selected floorplan
  useEffect(() => {
    if (selectedFloorplanId && floorplanData.length > 0) {
      const currentFp = floorplanData.find((fp) => fp.id === selectedFloorplanId);
      if (currentFp) {
        setExpandedSites((prev) => ({ ...prev, [currentFp.siteId]: true }));
        setExpandedBuildings((prev) => ({ ...prev, [currentFp.buildingId]: true }));
        setExpandedFloors((prev) => ({ ...prev, [currentFp.floorId]: true }));
      }
    }
  }, [selectedFloorplanId, floorplanData]);

  // Auto-expand nodes on search query change
  useEffect(() => {
    if (searchQuery) {
      const matchedSites: Record<string, boolean> = {};
      const matchedBuildings: Record<string, boolean> = {};
      const matchedFloors: Record<string, boolean> = {};

      sites.forEach((s) => {
        matchedSites[s.id] = true;
      });
      buildingData.forEach((b) => {
        matchedBuildings[b.id] = true;
      });
      floorData.forEach((f) => {
        matchedFloors[f.id] = true;
      });

      setExpandedSites(matchedSites);
      setExpandedBuildings(matchedBuildings);
      setExpandedFloors(matchedFloors);
    }
  }, [searchQuery, sites, buildingData, floorData]);

  if (!open) return null;

  // Filter logic
  const query = searchQuery.toLowerCase();
  
  const getFilteredData = () => {
    if (!query) {
      return {
        sites,
        buildingData,
        floorData,
        floorplanData,
      };
    }

    // Match helper
    const matchesQuery = (name: string) => name.toLowerCase().includes(query);

    // Collect matched floorplanData and build parent maps
    const matchedFloorplans = floorplanData.filter((fp) => {
      if (matchesQuery(fp.name)) return true;
      
      const parentFloor = floorData.find((f) => f.id === fp.floorId);
      if (parentFloor && matchesQuery(parentFloor.name)) return true;

      const parentBuilding = buildingData.find((b) => b.id === fp.buildingId);
      if (parentBuilding && matchesQuery(parentBuilding.name)) return true;

      const parentSite = sites.find((s) => s.id === fp.siteId);
      if (parentSite && matchesQuery(parentSite.name)) return true;

      return false;
    });

    const matchedFloorIds = new Set(matchedFloorplans.map((fp) => fp.floorId));
    const matchedBuildingIds = new Set(matchedFloorplans.map((fp) => fp.buildingId));
    const matchedSiteIds = new Set(matchedFloorplans.map((fp) => fp.siteId));

    return {
      sites: sites.filter((s) => matchedSiteIds.has(s.id)),
      buildingData: buildingData.filter((b) => matchedBuildingIds.has(b.id)),
      floorData: floorData.filter((f) => matchedFloorIds.has(f.id)),
      floorplanData: matchedFloorplans,
    };
  };

  const filtered = getFilteredData();

  const handleToggleSite = (siteId: string) => {
    setExpandedSites((prev) => ({ ...prev, [siteId]: !prev[siteId] }));
  };

  const handleToggleBuilding = (buildingId: string) => {
    setExpandedBuildings((prev) => ({ ...prev, [buildingId]: !prev[buildingId] }));
  };

  const handleToggleFloor = (floorId: string) => {
    setExpandedFloors((prev) => ({ ...prev, [floorId]: !prev[floorId] }));
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
          placeholder="Cari site / gedung / lantai / layout"
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
          {filtered.sites.map((site) => {
            const isSiteExpanded = !!expandedSites[site.id];
            const siteBuildings = filtered.buildingData.filter((b) => b.siteId === site.id);

            return (
              <React.Fragment key={site.id}>
                {/* Site Node */}
                <ListItemButton
                  onClick={() => handleToggleSite(site.id)}
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.5,
                    mb: 0.25,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: '#64748B' }}>
                    {isSiteExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#3b82f6' }}>
                    <IconBuildingSkyscraper size={16} />
                  </Box>
                  <ListItemText
                    primary={site.name}
                    primaryTypographyProps={{
                      sx: { color: '#E2E8F0', fontSize: 12, fontWeight: 600 },
                    }}
                  />
                </ListItemButton>

                {/* Buildings Collapse */}
                <Collapse in={isSiteExpanded}>
                  <List disablePadding sx={{ pl: 2 }}>
                    {siteBuildings.map((building) => {
                      const isBuildingExpanded = !!expandedBuildings[building.id];
                      const buildingFloors = filtered.floorData.filter((f) => f.buildingId === building.id);

                      return (
                        <React.Fragment key={building.id}>
                          {/* Building Node */}
                          <ListItemButton
                            onClick={() => handleToggleBuilding(building.id)}
                            sx={{
                              px: 1,
                              py: 0.5,
                              borderRadius: 1.5,
                              mb: 0.25,
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: '#64748B' }}>
                              {isBuildingExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#22c55e' }}>
                              <IconBuilding size={15} />
                            </Box>
                            <ListItemText
                              primary={building.name}
                              primaryTypographyProps={{
                                sx: { color: '#CBD5E1', fontSize: 11.5, fontWeight: 550 },
                              }}
                            />
                          </ListItemButton>

                          {/* Floors Collapse */}
                          <Collapse in={isBuildingExpanded}>
                            <List disablePadding sx={{ pl: 2 }}>
                              {buildingFloors.map((floor) => {
                                const isFloorExpanded = !!expandedFloors[floor.id];
                                const floorplanDataList = filtered.floorplanData.filter((fp) => fp.floorId === floor.id);

                                return (
                                  <React.Fragment key={floor.id}>
                                    {/* Floor Node */}
                                    <ListItemButton
                                      onClick={() => handleToggleFloor(floor.id)}
                                      sx={{
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1.5,
                                        mb: 0.25,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5, color: '#64748B' }}>
                                        {isFloorExpanded ? <IconChevronDown size={13} /> : <IconChevronRight size={13} />}
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: '#f59e0b' }}>
                                        <IconStack2 size={14} />
                                      </Box>
                                      <ListItemText
                                        primary={floor.name}
                                        primaryTypographyProps={{
                                          sx: { color: '#94A3B8', fontSize: 11, fontWeight: 500 },
                                        }}
                                      />
                                    </ListItemButton>

                                    {/* Floorplans Collapse */}
                                    <Collapse in={isFloorExpanded}>
                                      <List disablePadding sx={{ pl: 2 }}>
                                        {floorplanDataList.map((fp) => {
                                          const isSelected = selectedFloorplanId === fp.id;

                                          return (
                                            <ListItemButton
                                              key={fp.id}
                                              onClick={() => onSelectFloorplan?.(fp)}
                                              selected={isSelected}
                                              sx={{
                                                px: 1.5,
                                                py: 0.4,
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
                                                <IconMap size={13} />
                                              </Box>
                                              <ListItemText
                                                primary={fp.name}
                                                primaryTypographyProps={{
                                                  sx: {
                                                    color: isSelected ? '#fff' : '#94A3B8',
                                                    fontSize: 11,
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
                          </Collapse>
                        </React.Fragment>
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
