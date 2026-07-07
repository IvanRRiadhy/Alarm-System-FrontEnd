import { Chip } from '@mui/material';
import CircleRoundedIcon from '@mui/icons-material/CircleRounded';

type Props = {
    online?: boolean;
};

const HeaderStatus = ({ online = true }: Props) => {
    return (
        <Chip
            icon={
                <CircleRoundedIcon
                    sx={{
                        color: online ? '#22C55E !important' : '#EF4444 !important',
                        fontSize: 12,
                    }}
                />
            }
            label={online ? 'System Online' : 'System Offline'}
            sx={{
                bgcolor: online ? '#052E16' : '#450A0A',
                color: online ? '#22C55E' : '#EF4444',
                fontWeight: 600,
                borderRadius: 2,
            }}
        />
    );
};

export default HeaderStatus;