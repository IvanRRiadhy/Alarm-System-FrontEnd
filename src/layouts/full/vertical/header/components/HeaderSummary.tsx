import { Box, Chip, Stack } from '@mui/material';

const data = [
    {
        label: 'Device',
        value: 1832,
        color: '#2563EB',
    },
    {
        label: 'Alarm',
        value: 18,
        color: '#EF4444',
    },
    {
        label: 'Trouble',
        value: 7,
        color: '#F59E0B',
    },
    {
        label: 'Offline',
        value: 4,
        color: '#64748B',
    },
];

const HeaderSummary = () => {
    return (
        <Stack
            direction="row"
            spacing={1}
        >
            {data.map((item) => (
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