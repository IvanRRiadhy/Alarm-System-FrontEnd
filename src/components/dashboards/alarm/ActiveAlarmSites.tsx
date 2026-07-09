import React from 'react';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

type ActiveAlarmSitesProps = {
  activeAlarmsBySite?: any[];
};

const ActiveAlarmSites: React.FC<ActiveAlarmSitesProps> = ({ activeAlarmsBySite = [] }) => {
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
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          SITE DENGAN ALARM AKTIF
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                '& th': {
                  color: '#94A3B8',
                  fontWeight: 600,
                  fontSize: 12,
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  background: '#0F172A',
                },
              }}
            >
              <TableCell>SITE</TableCell>
              <TableCell>REGION</TableCell>
              <TableCell align="center">ALARM AKTIF</TableCell>
              <TableCell align="center">SEVERITY</TableCell>
              <TableCell align="center">STATUS</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {activeAlarmsBySite.map((row) => {
              const severityLower = (row.severity || '').toLowerCase();
              let chipBg = 'rgba(56,189,248,.15)';
              let chipColor = '#38BDF8';
              if (severityLower === 'critical' || severityLower === 'high') {
                chipBg = 'rgba(239,68,68,.15)';
                chipColor = '#EF4444';
              } else if (severityLower === 'medium') {
                chipBg = 'rgba(245,158,11,.15)';
                chipColor = '#F59E0B';
              }

              return (
                <TableRow
                  key={row.siteId || row.siteName}
                  hover
                  sx={{
                    transition: '.2s',

                    '&:hover': {
                      bgcolor: '#1E293B',
                    },

                    '& td': {
                      color: '#E2E8F0',
                      borderBottom: '1px solid rgba(255,255,255,.05)',
                      fontSize: 13,
                    },
                  }}
                >
                  <TableCell>{row.siteName}</TableCell>

                  <TableCell>{row.region}</TableCell>

                  <TableCell align="center">
                    {row.totalAlarms}
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={row.severity}
                      sx={{
                        bgcolor: chipBg,
                        color: chipColor,
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      color: '#EF4444 !important',
                      fontWeight: 600,
                    }}
                  >
                    {row.status}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ActiveAlarmSites;