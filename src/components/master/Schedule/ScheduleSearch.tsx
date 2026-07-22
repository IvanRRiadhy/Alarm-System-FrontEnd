import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { AppDispatch, RootState, useDispatch, useSelector } from 'src/store/Store';
import { UpdateScheduleFilter } from 'src/store/apps/crud/schedule';

const ScheduleSearch = () => {
  const dispatch: AppDispatch = useDispatch();
  const scheduleFilter = useSelector(
    (state: RootState) => state.scheduleReducer.scheduleFilter,
  );

  // Initialize from Redux so it doesn't clear an external filter on mount
  const [searchValue, setSearchValue] = useState(scheduleFilter.search || '');

  // Keep internal state synced if Redux changes externally (like on mount from location state)
  useEffect(() => {
    setSearchValue(scheduleFilter.search || '');
  }, [scheduleFilter.search]);

  useEffect(() => {
    // Only dispatch if the local searchValue differs from Redux
    if (searchValue.trim() !== (scheduleFilter.search || '')) {
      const delayDebounce = setTimeout(() => {
        dispatch(UpdateScheduleFilter({ search: searchValue.trim() }));
      }, 1000);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchValue, dispatch, scheduleFilter.search]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      dispatch(UpdateScheduleFilter({ search: searchValue.trim() }));
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    dispatch(UpdateScheduleFilter({ search: '' }));
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <TextField
        placeholder="Search..."
        variant="outlined"
        size="small"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={handleSearchKeyPress}
        sx={{ width: 220 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <IconSearch size={18} />
            </InputAdornment>
          ),
          endAdornment: searchValue.length > 0 && (
            <InputAdornment position="end">
              <IconButton size="small" onClick={handleClearSearch}>
                <IconX size={16} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ScheduleSearch;
