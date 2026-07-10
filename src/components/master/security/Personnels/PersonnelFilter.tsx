import { Box, Typography } from '@mui/material';
import AddEditPersonnel from './AddEditPersonnel';

const PersonnelFilter = () => {
  return (
    <Box display="flex" flexDirection="column" height="100%">
      {/* Add Button */}
      <Box p={2}>
        <AddEditPersonnel type="add" />
      </Box>

      {/* Placeholder for future filters */}
      <Box p={2} sx={{ flex: 1, overflowY: 'auto', textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" mt={4}>
          No additional filters available for Personnels at this time.
        </Typography>
      </Box>
    </Box>
  );
};

export default PersonnelFilter;
