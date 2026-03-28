import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, Box, Typography, InputAdornment } from '@mui/material';
import { Search } from 'lucide-react';
import axios from 'axios';

export default function InstitutionSelect({ value, onChange, sx }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    if (query.trim().length < 3) {
      setOptions(value ? [value] : []);
      return undefined;
    }

    setLoading(true);

    const debounceFn = setTimeout(async () => {
      try {
        const { data } = await axios.get(`http://universities.hipolabs.com/search?country=India&name=${encodeURIComponent(query)}`);
        if (active) {
          // Keep only first 20 results to avoid massive lists, and ensure uniqueness
          const uniqueData = Array.from(new Map(data.map(item => [item.name, item])).values()).slice(0, 20);
          setOptions(uniqueData);
        }
      } catch (err) {
        console.error('Failed to fetch institutions', err);
      } finally {
        if (active) setLoading(false);
      }
    }, 600);

    return () => {
      active = false;
      clearTimeout(debounceFn);
    };
  }, [query, value]);

  return (
    <Autocomplete
      id="institution-select"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, val) => option.name === val?.name}
      getOptionLabel={(option) => option.name || ''}
      options={options}
      loading={loading}
      value={value}
      filterOptions={(x) => x} // Disable local filtering
      onChange={(event, newValue) => {
        onChange(newValue || null);
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue);
      }}
      noOptionsText={query.length < 3 ? "Type at least 3 characters..." : "No universities found"}
      renderOption={(props, option) => (
        <li {...props} style={{ backgroundColor: '#1e293b', color: 'white', padding: '12px' }}>
          <Box>
            <Typography variant="subtitle2">{option.name}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{option.domains[0]}</Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Indian Universities"
          fullWidth
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
            startAdornment: <InputAdornment position="start"><Search size={20} color="rgba(255,255,255,0.5)" /></InputAdornment>
          }}
          sx={sx}
        />
      )}
    />
  );
}
