import React from 'react';
import { Box, Card, Typography, Link } from '@mui/material';
import { IconBellRinging } from '@tabler/icons-react';

interface ActiveAlarmItem {
  id: number;
  title: string;
  site: string;
  region: string;
  time: string;
  severity: 'High' | 'Medium' | 'Low';
}

const alarmsData: ActiveAlarmItem[] = [
  {
    id: 1,
    title: 'Pintu Utama Terbuka',
    site: 'KCP Surabaya Diponegoro',
    region: 'Jawa Timur',
    time: '10:28',
    severity: 'High',
  },
  {
    id: 2,
    title: 'Gerakan Terdeteksi',
    site: 'KCP Medan Iskandar Muda',
    region: 'Sumatera Utara',
    time: '10:21',
    severity: 'High',
  },
  {
    id: 3,
    title: 'Pintu Belakang Terbuka',
    site: 'KCP Makassar Ratulangi',
    region: 'Sulawesi Selatan',
    time: '10:15',
    severity: 'Medium',
  },
  {
    id: 4,
    title: 'Sensor Getar Aktif',
    site: 'KCP Bandung Asia Afrika',
    region: 'Jawa Barat',
    time: '10:07',
    severity: 'Medium',
  },
  {
    id: 5,
    title: 'Pintu Server Room Terbuka',
    site: 'KCP Semarang Pandanaran',
    region: 'Jawa Tengah',
    time: '09:58',
    severity: 'High',
  },
];

interface ActiveAlarmsProps {
  region: string;
}

const ActiveAlarms: React.FC<ActiveAlarmsProps> = ({ region }) => {
  const filteredAlarms = region === 'Semua Region' ? alarmsData : alarmsData.filter(alarm => alarm.region === region);
  const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low') => {
    switch (severity) {
      case 'High':
        return { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'Medium':
        return { color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' };
      default:
        return { color: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)' };
    }
  };
  return (
    <Card sx={{ backgroundColor: '#122033', border: '1px solid #1e293b', borderRadius: '12px', p: 2.5, height: '430px', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>ALARM AKTIF TERKINI</Typography>
        <Link href="#" underline="none" sx={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 600 }}>Lihat Semua</Link>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#1e293b', borderRadius: '4px' } }}>
        {filteredAlarms.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Tidak ada alarm aktif di region ini.</Typography>
          </Box>
        ) : (
          filteredAlarms.map((alarm) => {
            const styles = getSeverityStyles(alarm.severity);
            return (
              <Box key={alarm.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, mb: 1.5, backgroundColor: '#0d1726', borderRadius: '8px', border: '1px solid #1e293b', transition: 'all 0.2s', '&:hover': { borderColor: alarm.severity === 'High' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(245, 158, 11, 0.5)', transform: 'translateX(2px)' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: alarm.severity === 'High' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: alarm.severity === 'High' ? '#ef4444' : '#f59e0b', position: 'relative', animation: alarm.severity === 'High' ? 'siren-pulse 1.5s infinite' : 'none', '@keyframes siren-pulse': { '0%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.08)', opacity: 0.8 }, '100%': { transform: 'scale(1)', opacity: 1 } } }}>
                    <IconBellRinging size={18} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{alarm.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>{alarm.site}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: alarm.severity === 'High' ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: '0.75rem' }}>{alarm.time}</Typography>
                  <Box sx={{ px: 1, py: 0.1, borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, ...styles }}>{alarm.severity}</Box>
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