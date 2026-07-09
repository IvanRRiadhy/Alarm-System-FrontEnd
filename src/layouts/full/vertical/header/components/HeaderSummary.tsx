import { Box, Chip, Stack } from '@mui/material';
import { useDashboardSummary } from 'src/hooks/useDashboard';

const HeaderSummary = () => {
    const { data: summaryResponse } = useDashboardSummary(undefined);
    const dashboardData = summaryResponse?.data;

    const items = [
        {
            label: 'Device',
            value: dashboardData?.totalDevice ?? 0,
            color: '#2563EB',
        },
        {
            label: 'Alarm',
            value: dashboardData?.totalAlarmActive ?? 0,
            color: '#EF4444',
        },
        {
            label: 'Trouble',
            value: dashboardData?.totalTrouble ?? 0,
            color: '#F59E0B',
        },
        {
            label: 'Offline',
            value: dashboardData?.deviceOffline ?? 0,
            color: '#64748B',
        },
    ];

    return (
        <Stack
            direction="row"
            spacing={1}
        >
            {items.map((item) => (
                <Chip
                    key={item.label}
                    label={`${item.label} : ${item.value}`}
                    sx={{
                        bgcolor: `${item.color}20`,
                        color: item.color,
                        fontWeight: 700,
                        border: `1px solid ${item.color}50`,
                    }}
                />
            ))}
        </Stack>
    );
};

export default HeaderSummary;