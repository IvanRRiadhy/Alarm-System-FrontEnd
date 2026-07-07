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
  region: string;
};

const rows = [
  {
    site: 'KCP Surabaya Diponegoro',
    region: 'Jawa Timur',
    alarm: 3,
    severity: 'High',
    status: 'Alarm',
  },
  {
    site: 'KCP Medan Iskandar Muda',
    region: 'Sumatera Utara',
    alarm: 2,
    severity: 'High',
    status: 'Alarm',
  },
  {
    site: 'KCP Makassar Ratulangi',
    region: 'Sulawesi Selatan',
    alarm: 2,
    severity: 'Medium',
    status: 'Alarm',
  },
  {
    site: 'KCP Bandung Asia Afrika',
    region: 'Jawa Barat',
    alarm: 1,
    severity: 'Medium',
    status: 'Alarm',
  },
  {
    site: 'KCP Semarang Pandanaran',
    region: 'Jawa Tengah',
    alarm: 1,
    severity: 'High',
    status: 'Alarm',
  },
];

const ActiveAlarmSites: React.FC<ActiveAlarmSitesProps> = () => {
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
            {rows.map((row) => (
              <TableRow
                key={row.site}
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
                <TableCell>{row.site}</TableCell>

                <TableCell>{row.region}</TableCell>

                <TableCell align="center">
                  {row.alarm}
                </TableCell>

                <TableCell align="center">
                  <Chip
                    size="small"
                    label={row.severity}
                    sx={{
                      bgcolor:
                        row.severity === 'High'
                          ? 'rgba(239,68,68,.15)'
                          : 'rgba(245,158,11,.15)',

                      color:
                        row.severity === 'High'
                          ? '#EF4444'
                          : '#F59E0B',

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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ActiveAlarmSites;