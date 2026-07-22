import { Box, IconButton, InputAdornment, TextField } from '@mui/material';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { AppDispatch, RootState, useDispatch, useSelector } from 'src/store/Store';
import { UpdateAlarmRuleFilter } from 'src/store/apps/crud/alarmRule';

const AlarmRuleSearch = () => {
  const dispatch: AppDispatch = useDispatch();
  const alarmRuleFilter = useSelector(
    (state: RootState) => state.alarmRuleReducer.alarmRuleFilter,
  );

  // Initialize from Redux so it doesn't clear an external filter on mount
  const [searchValue, setSearchValue] = useState(alarmRuleFilter.search || '');

  // Keep internal state synced if Redux changes externally (like on mount from location state)
  useEffect(() => {
    setSearchValue(alarmRuleFilter.search || '');
  }, [alarmRuleFilter.search]);

  useEffect(() => {
    // Only dispatch if the local searchValue differs from Redux
    if (searchValue.trim() !== (alarmRuleFilter.search || '')) {
      const delayDebounce = setTimeout(() => {
        dispatch(UpdateAlarmRuleFilter({ search: searchValue.trim() }));
      }, 1000);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchValue, dispatch, alarmRuleFilter.search]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      dispatch(UpdateAlarmRuleFilter({ search: searchValue.trim() }));
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    dispatch(UpdateAlarmRuleFilter({ search: '' }));
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

export default AlarmRuleSearch;
