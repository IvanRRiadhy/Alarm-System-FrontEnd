import React from 'react';
import {
  Box,
  Chip,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';

import SensorsRoundedIcon from '@mui/icons-material/SensorsRounded';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import DoorFrontRoundedIcon from '@mui/icons-material/DoorFrontRounded';
import SmokeFreeRoundedIcon from '@mui/icons-material/SmokeFreeRounded';

const markers = [
  {
    top: '22%',
    left: '25%',
    color: '#EF4444',
    icon: <DoorFrontRoundedIcon fontSize="small" />,
  },
  {
    top: '42%',
    left: '60%',
    color: '#22C55E',
    icon: <CameraAltRoundedIcon fontSize="small" />,
  },
  {
    top: '65%',
    left: '35%',
    color: '#F59E0B',
    icon: <SensorsRoundedIcon fontSize="small" />,
  },
  {
    top: '30%',
    left: '78%',
    color: '#3B82F6',
    icon: <SmokeFreeRoundedIcon fontSize="small" />,
  },
];

const legend = [
  {
    label: 'Door',
    color: '#EF4444',
  },
  {
    label: 'Camera',
    color: '#22C55E',
  },
  {
    label: 'Motion',
    color: '#F59E0B',
  },
  {
    label: 'Smoke',
    color: '#3B82F6',
  },
];

const FloorPlan = () => {
  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: '100%',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          FLOORPLAN
        </Typography>

        <FormControl size="small">
          <Select
            defaultValue="Site A"
            sx={{
              minWidth: 140,
              color: '#fff',
              bgcolor: '#0F172A',

              '.MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255,255,255,.15)',
              },

              '.MuiSvgIcon-root': {
                color: '#fff',
              },
            }}
          >
            <MenuItem value="Site A">Site A</MenuItem>
            <MenuItem value="Site B">Site B</MenuItem>
            <MenuItem value="Site C">Site C</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Floorplan */}
      <Box
        sx={{
          p: 2,
        }}
      >
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,.08)',
          }}
        >
          <img
            src="https://placehold.co/700x400/1e293b/94a3b8?text=Floor+Plan"
            alt="Floor Plan"
            style={{
              width: '100%',
              display: 'block',
            }}
          />

          {markers.map((marker, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                top: marker.top,
                left: marker.left,
                width: 34,
                height: 34,
                borderRadius: '50%',
                bgcolor: marker.color,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translate(-50%, -50%)',
                boxShadow: `0 0 12px ${marker.color}`,
                cursor: 'pointer',

                '&:hover': {
                  transform: 'translate(-50%, -50%) scale(1.15)',
                },
              }}
            >
              {marker.icon}
            </Box>
          ))}
        </Box>

        {/* Legend */}
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          mt={2}
        >
          {legend.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              size="small"
              sx={{
                bgcolor: `${item.color}20`,
                color: item.color,
                border: `1px solid ${item.color}40`,
              }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

export default FloorPlan;