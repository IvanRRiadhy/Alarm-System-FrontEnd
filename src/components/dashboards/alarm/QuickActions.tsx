import React, { useState } from 'react';
import {
  Box,
  Grid2 as Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import DeveloperBoardRoundedIcon from '@mui/icons-material/DeveloperBoardRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { AcknowledgeDialog } from './QuickActionsComponent/Acknowledge';
import { ControllerControlDialog } from './QuickActionsComponent/ControllerControl';

const actions = [
  {
    title: 'Investigate',
    icon: <SearchRoundedIcon fontSize="large" />,
    color: '#3B82F6',
  },
  {
    title: 'Monitoring',
    icon: <DesktopWindowsRoundedIcon fontSize="large" />,
    color: '#22C55E',
  },
  {
    title: 'Refresh Data',
    icon: <RefreshRoundedIcon fontSize="large" />,
    color: '#F59E0B',
  },
  {
    title: 'Live Camera',
    icon: <VideocamRoundedIcon fontSize="large" />,
    color: '#EF4444',
  },
  {
    title: 'Controller Control',
    icon: <DeveloperBoardRoundedIcon fontSize="large" />,
    color: '#8B5CF6',
  },
  {
    title: 'Acknowledge',
    icon: <NotificationsActiveRoundedIcon fontSize="large" />,
    color: '#06B6D4',
  },
];

const QuickAccess = () => {
  const navigate = useNavigate();
  const [ackDialogOpen, setAckDialogOpen] = useState(false);
  const [ctrlDialogOpen, setCtrlDialogOpen] = useState(false);

  const handleActionClick = (title: string) => {
    if (title === 'Investigate') {
      navigate('/report/investigate');
    } else if (title === 'Monitoring') {
      navigate('/dashboards/monitoring');
    } else if (title === 'Controller Control') {
      setCtrlDialogOpen(true);
    } else if (title === 'Acknowledge') {
      setAckDialogOpen(true);
    }
  };

  return (
    <Paper
      sx={{
        bgcolor: '#111827',
        borderRadius: 3,
        border: '1px solid rgba(255,255,255,.08)',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <Typography
          sx={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          QUICK ACCESS
        </Typography>
      </Box>

      <Grid
        container
        spacing={2}
        sx={{
          p: 2,
          flex: 1,
          alignContent: 'center',
        }}
      >
        {actions.map((item) => (
          <Grid
            key={item.title}
            size={4}
          >
            <Paper
              elevation={0}
              onClick={() => handleActionClick(item.title)}
              sx={{
                bgcolor: '#0F172A',
                border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 3,
                p: 1.5,
                cursor: 'pointer',
                transition: '.2s',

                '&:hover': {
                  bgcolor: '#172554',
                  transform: 'translateY(-3px)',
                },
              }}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={1.5}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: 2,
                    bgcolor: `${item.color}20`,
                    color: item.color,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {item.icon}
                </Box>

                <Typography
                  sx={{
                    color: '#E2E8F0',
                    fontWeight: 600,
                    fontSize: 10,
                    textAlign: 'center',
                  }}
                >
                  {item.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <AcknowledgeDialog
        open={ackDialogOpen}
        onClose={() => setAckDialogOpen(false)}
      />
      <ControllerControlDialog
        open={ctrlDialogOpen}
        onClose={() => setCtrlDialogOpen(false)}
      />
    </Paper>
  );
};

export default QuickAccess;