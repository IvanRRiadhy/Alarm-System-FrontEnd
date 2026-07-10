import React from 'react';
import { BASE_URL } from 'src/utils/axios';
import { useSelector } from 'src/store/Store';
import {
  ListItemText,
  Box,
  Avatar,
  ListItemButton,
  Typography,
  Stack,
  ListItemAvatar,
  Checkbox,
  Chip,
} from '@mui/material';
import { PersonnelType } from 'src/store/apps/crud/personnels';
import { RootState } from 'src/store/Store';

type Props = {
  onPersonnelClick: (event: React.MouseEvent<HTMLElement>) => void;
  personnel: PersonnelType; // make required for clarity
  manySelect?: boolean;
  setManySelectPersonnels?: (personnels: PersonnelType[]) => void;
  manySelectPersonnels?: PersonnelType[];
  active: boolean;
};

const PersonnelListItem: React.FC<Props> = ({
  onPersonnelClick,
  personnel,
  manySelect = false,
  setManySelectPersonnels,
  manySelectPersonnels = [],
  active,
}) => {
  const settings = useSelector((state: RootState) => state.settings);
  const borderRadius = `${settings.borderRadius}px`;

  // Determine if this personnel is selected in multi-select mode
  const isChecked = manySelectPersonnels.some((m) => m.id === personnel.id);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // prevent triggering onPersonnelClick
    if (!setManySelectPersonnels) return;

    if (isChecked) {
      setManySelectPersonnels(manySelectPersonnels.filter((m) => m.id !== personnel.id));
    } else {
      setManySelectPersonnels([...manySelectPersonnels, personnel]);
    }
  };

  return (
    <ListItemButton
      sx={{
        mb: 1,
        borderRadius,
        '&.Mui-selected': {
          backgroundColor: 'action.selected',
        },
      }}
      selected={active}
      onClick={onPersonnelClick}
    >
      <ListItemAvatar>
        <Avatar
          alt={personnel.name || 'Personnel Face'}
          src={personnel.photoUrl ? `${personnel.photoUrl}` : undefined}
        />
      </ListItemAvatar>

      <ListItemText
        disableTypography
        primary={
          <Typography
            variant="subtitle1"
            component="div"
            noWrap
            fontWeight={600}
            sx={{ maxWidth: '200px' }}
          >
            {personnel.name || 'Unnamed Personnel'}
          </Typography>
        }
        secondary={
          <>
            <Typography variant="body2" component="div" color="text.secondary" noWrap>
              {personnel.employeeCode || '-'}
            </Typography>
            <Typography variant="body2" component="div" color="text.secondary" noWrap>
              {personnel.position || '-'}
            </Typography>
          </>
        }
      />

      <Stack direction="row" spacing={1} alignItems="center">
        {!personnel.isActive && (
          <Chip
            label="NOT ACTIVE"
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem', fontWeight: 500 }}
          />
        )}
        {manySelect && <Checkbox edge="end" checked={isChecked} onChange={handleCheckboxChange} />}
      </Stack>
    </ListItemButton>
  );
};

export default PersonnelListItem;
