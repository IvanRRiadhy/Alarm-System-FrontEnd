import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  Link,
  Typography,
} from '@mui/material';

import { IconBellRinging } from '@tabler/icons-react';

interface ActiveAlarmItem {
  id: number;
  title: string;
  site: string;
  region: string;
  time: string;
  severity: 'Critical' | 'High' | 'Low';
  caseNumber: string;
}

interface ActiveAlarmsProps {
  region: string;
}

// const alarmsData: ActiveAlarmItem[] = [
//   {
//     id: 1,
//     title: 'Pintu Utama Terbuka',
//     site: 'KCP Surabaya Diponegoro',
//     region: 'Jawa Timur',
//     time: '10:28',
//     severity: 'Critical',
//   },
//   {
//     id: 2,
//     title: 'Gerakan Terdeteksi',
//     site: 'KCP Medan Iskandar Muda',
//     region: 'Sumatera Utara',
//     time: '10:22',
//     severity: 'Critical',
//   },
//   {
//     id: 3,
//     title: 'Pintu Belakang Terbuka',
//     site: 'KCP Makassar Ratulangi',
//     region: 'Sulawesi Selatan',
//     time: '10:16',
//     severity: 'High',
//   },
//   {
//     id: 4,
//     title: 'Sensor Getar Aktif',
//     site: 'KCP Bandung Asia Afrika',
//     region: 'Jawa Barat',
//     time: '10:05',
//     severity: 'High',
//   },
//   {
//     id: 5,
//     title: 'Camera Offline',
//     site: 'KCP Semarang Pandanaran',
//     region: 'Jawa Tengah',
//     time: '09:57',
//     severity: 'Low',
//   },
//   {
//     id: 6,
//     title: 'Pintu Vault Terbuka',
//     site: 'KCP Jakarta Sudirman',
//     region: 'DKI Jakarta',
//     time: '09:41',
//     severity: 'Critical',
//   },
//   {
//     id: 7,
//     title: 'Motion Detected',
//     site: 'KCP Denpasar',
//     region: 'Bali',
//     time: '09:20',
//     severity: 'Low',
//   },
// ];

interface ActiveAlarmsProps {
  region: string;
  recentActiveAlarms?: any[];
}

const severityConfig = {
  Critical: {
    color: '#EF4444',
    bg: 'rgba(239,68,68,.15)',
    border: 'rgba(239,68,68,.35)',
  },
  High: {
    color: '#F59E0B',
    bg: 'rgba(245,158,11,.15)',
    border: 'rgba(245,158,11,.35)',
  },
  Medium: {
    color: '#3B82F6',
    bg: 'rgba(59,130,246,.15)',
    border: 'rgba(59,130,246,.35)',
  },
  Low: {
    color: '#38BDF8',
    bg: 'rgba(56,189,248,.15)',
    border: 'rgba(56,189,248,.35)',
  },
};

const ActiveAlarms: React.FC<ActiveAlarmsProps> = ({ region, recentActiveAlarms = [] }) => {

  const [selectedSeverity, setSelectedSeverity] = useState<
    'All' | 'Critical' | 'High' | 'Medium' | 'Low'
  >('All');

  const mappedAlarms = useMemo(() => {
    return recentActiveAlarms.map((x) => {
      let timeStr = '';
      try {
        if (x.timestamp) {
          const date = new Date(x.timestamp);
          timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        }
      } catch (e) {
        console.error(e);
      }
      // Normalize severity to Capitalized (Critical, High, Medium, Low)
      let sev = 'Low';
      if (x.severity) {
        const s = x.severity.charAt(0).toUpperCase() + x.severity.slice(1).toLowerCase();
        if (['Critical', 'High', 'Medium', 'Low'].includes(s)) {
          sev = s;
        }
      }
      return {
        id: x.deviceId || Math.random().toString(),
        title: x.message || x.deviceName || 'Alarm',
        site: x.siteName || '',
        region: x.region || '',
        time: timeStr,
        severity: sev as 'Critical' | 'High' | 'Medium' | 'Low',
      };
    });
  }, [recentActiveAlarms]);

  const summary = useMemo(() => ({
    Critical: mappedAlarms.filter(x => x.severity === 'Critical').length,
    High: mappedAlarms.filter(x => x.severity === 'High').length,
    Medium: mappedAlarms.filter(x => x.severity === 'Medium').length,
    Low: mappedAlarms.filter(x => x.severity === 'Low').length,
  }), [mappedAlarms]);

  const displayedAlarms = useMemo(() => {
    if (selectedSeverity === 'All') return mappedAlarms;

    return mappedAlarms.filter(
      x => x.severity === selectedSeverity
    );
  }, [selectedSeverity, mappedAlarms]);

  return (

    <Card
      sx={{

        background: "#122033",

        border: "1px solid #1e293b",

        borderRadius: 3,

        height: "100%",
        

        display: "flex",

        flexDirection: "column",

        p: 2.5,

      }}

    >

      <Box

        display="flex"

        justifyContent="space-between"

        alignItems="center"

        mb={2}

      >

        <Typography

          sx={{

            color: "white",

            fontWeight: 700,

            fontSize: 15,

          }}

        >

          ALARM AKTIF TERKINI

        </Typography>

        <Link

          underline="none"

          href="#"

          sx={{

            fontWeight: 600,

            fontSize: 12,

          }}

        >

          Lihat Semua

        </Link>

      </Box>

      <Box

        display="grid"

        gridTemplateColumns="repeat(4,1fr)"

        gap={1.2}

        mb={2}

      >

        {(
          [
            'Critical',
            'High',
            'Medium',
            'Low',
          ] as const
        ).map((severity) => {

          const cfg = severityConfig[severity];

          const active = selectedSeverity === severity;

          return (

            <Box

              key={severity}

              onClick={() => setSelectedSeverity(selectedSeverity === severity ? 'All' : severity)}

              sx={{

                cursor: "pointer",

                borderRadius: 2,

                p: 1.2,

                transition: ".25s",

                border: `1px solid ${active
                    ? cfg.border
                    : "#1E293B"
                  }`,

                background: active
                  ? cfg.bg
                  : "#0D1726",

                textAlign: "center",

                "&:hover": {

                  borderColor: cfg.border,

                  transform: "translateY(-2px)",

                },

              }}

            >

              <Box

                display="flex"

                justifyContent="center"

                alignItems="center"

                gap={1}

              >

                <Box

                  sx={{

                    width: 10,

                    height: 10,

                    borderRadius: "50%",

                    background: cfg.color,

                    boxShadow: `0 0 10px ${cfg.color}`,

                  }}

                >

                </Box>

                <Typography

                  sx={{

                    color: "white",

                    fontWeight: 700,

                    fontSize: 22,

                    lineHeight: 1,

                  }}

                >

                  {summary[severity]}

                </Typography>

              </Box>

              <Typography

                sx={{

                  color: "#94A3B8",

                  fontSize: 12,

                  mt: .5,

                }}

              >

                {severity}

              </Typography>

            </Box>

          );

        })}

      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 0.5,
          maxHeight: "350px",
          '&::-webkit-scrollbar': {
            width: '5px',
          },

          '&::-webkit-scrollbar-track': {
            background: '#0D1726',
            borderRadius: '8px',
          },

          '&::-webkit-scrollbar-thumb': {
            background: '#334155',
            borderRadius: '8px',
          },

          '&::-webkit-scrollbar-thumb:hover': {
            background: '#475569',
          },
        }}
      >
        {displayedAlarms.length === 0 ? (
          <Box
            sx={{
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            <IconBellRinging
              size={42}
              color="#475569"
            />

            <Typography
              sx={{
                color: '#94A3B8',
                fontSize: 13,
              }}
            >
              Tidak ada alarm
            </Typography>
          </Box>
        ) : (
          displayedAlarms.map((alarm) => {
            const cfg = severityConfig[alarm.severity];

            return (
              <Box
                key={alarm.id}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',

                  mb: 1.2,

                  p: 1.5,

                  borderRadius: 2,

                  background: '#0D1726',

                  border: `1px solid ${cfg.border}`,

                  transition: '.25s',

                  '&:hover': {
                    transform: 'translateX(3px)',
                    borderColor: cfg.color,
                    background: '#111C2E',
                  },
                }}
              >
                {/* LEFT */}

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                >
                  <Box
                    sx={{
                      width: 38,
                      height: 38,

                      borderRadius: '50%',

                      background: cfg.bg,

                      display: 'flex',

                      alignItems: 'center',

                      justifyContent: 'center',

                      color: cfg.color,

                      animation:
                        alarm.severity === 'Critical'
                          ? 'alarmPulse 1.3s infinite'
                          : 'none',

                      '@keyframes alarmPulse': {
                        '0%': {
                          transform: 'scale(1)',
                        },

                        '50%': {
                          transform: 'scale(1.12)',
                        },

                        '100%': {
                          transform: 'scale(1)',
                        },
                      },
                    }}
                  >
                    <IconBellRinging size={18} />
                  </Box>

                  <Box>
                    <Typography
                      sx={{
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: 13,
                      }}
                    >
                      {alarm.title}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#94A3B8',
                        fontSize: 11,
                      }}
                    >
                      {alarm.site}
                    </Typography>

                    <Typography
                      sx={{
                        color: '#64748B',
                        fontSize: 10,
                        mt: .3,
                      }}
                    >
                      {alarm.region}
                    </Typography>
                  </Box>
                </Box>

                {/* RIGHT */}

                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="flex-end"
                  gap={0.8}
                >
                  <Typography
                    sx={{
                      color: '#CBD5E1',
                      fontSize: 11,
                    }}
                  >
                    {alarm.time}
                  </Typography>

                  <Box
                    sx={{
                      px: 1,

                      py: .4,

                      borderRadius: 5,

                      fontWeight: 700,

                      fontSize: 10,

                      color: cfg.color,

                      background: cfg.bg,

                      border: `1px solid ${cfg.border}`,
                    }}
                  >
                    {alarm.severity}
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

    </Card>
  );
};

export default ActiveAlarms;
