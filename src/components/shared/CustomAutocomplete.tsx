import React from 'react';
import { Autocomplete, TextField, CircularProgress, SxProps, Theme, AutocompleteRenderGetTagProps } from '@mui/material';

type SingleSelectProps<T> = {
  multiple?: false;
  value: T | null;
  onChange: (value: T | null) => void;
};

type MultiSelectProps<T> = {
  multiple: true;
  value: T[];
  onChange: (value: T[]) => void;
  renderTags?: (value: T[], getTagProps: AutocompleteRenderGetTagProps) => React.ReactNode;
};

export type CustomAutocompleteProps<T> = {
  id?: string;
  label?: string;
  placeholder?: string;
  options: T[];
  getOptionLabel: (option: T) => string;
  isOptionEqualToValue: (option: T, value: T) => boolean;

  required?: boolean;
  error?: boolean;
  helperText?: string;

  loading?: boolean;
  disabled?: boolean;
  renderOption?: any;
  sx?: SxProps<Theme>;
  filterSelectedOptions?: boolean;
} & (SingleSelectProps<T> | MultiSelectProps<T>);

export default function CustomAutocomplete<T>(props: CustomAutocompleteProps<T>) {
  const {
    id,
    label,
    placeholder,
    options,
    getOptionLabel,
    isOptionEqualToValue,
    required = false,
    error,
    helperText,
    loading = false,
    disabled = false,
    renderOption,
    sx,
    filterSelectedOptions,
  } = props;
  return (
    <Autocomplete
      id={id}
      multiple={props.multiple}
      options={options}
      value={props.value as any}
      loading={loading} // <-- pass to Autocomplete
      disabled={disabled}
      onChange={(_, newVal) => props.onChange(newVal as any)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      renderOption={renderOption}
      renderTags={props.multiple ? props.renderTags : undefined}
      filterSelectedOptions={filterSelectedOptions}
      clearOnEscape
      fullWidth
      sx={sx}
      popupIcon={loading ? <CircularProgress size={18} /> : undefined}
      loadingText="Loading..."
      componentsProps={{
        paper: {
          elevation: 8,
          sx: {
            borderRadius: '12px',
            mt: 1,
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme: any) =>
              theme.palette.mode === 'dark'
                ? '0px 8px 24px rgba(0, 0, 0, 0.4)'
                : '0px 8px 24px rgba(145, 158, 171, 0.2)',
            '& .MuiAutocomplete-listbox': {
              maxHeight: 220,
              overflowY: 'auto',
              py: 1,
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: (theme: any) =>
                  theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(0, 0, 0, 0.15)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(128, 128, 128, 0.2) transparent',
            },
            '& .MuiAutocomplete-option': {
              mx: 1,
              my: 0.5,
              px: 2,
              py: 1.25,
              fontSize: '0.875rem',
              borderRadius: '6px',
              transition: 'all 0.2s ease',
              borderBottom: 'none',
              '&[aria-selected="true"]': {
                backgroundColor: 'primary.light',
                color: 'primary.main',
                fontWeight: 600,
              },
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            },
          },
        },
      }}
      ListboxProps={{
        style: {
          maxHeight: 220,
          overflowY: 'auto',
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          variant="outlined"
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
