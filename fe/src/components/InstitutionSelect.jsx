import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Search, Globe } from 'lucide-react';
import api from '../api/axios';

/**
 * InstitutionSelect
 * -----------------
 * Searches Indian universities via our own backend proxy at /api/universities
 * which calls http://universities.hipolabs.com server-side, bypassing the
 * browser's Mixed Content (HTTPS → HTTP) block.
 *
 * Also merges results with our own locally registered Walled Gardens so that
 * institution admins appear first and are clearly labelled.
 */
export default function InstitutionSelect({ value, onChange, sx }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    if (query.trim().length < 3) {
      setOptions(value ? [value] : []);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);

    const debounceFn = setTimeout(async () => {
      try {
        const queryLower = query.toLowerCase();

        // ── 1. Fetch our own Walled Gardens (local organizations) ──
        const localResponse = await api
          .get('/auth/organizations')
          .catch(() => ({ data: [] }));
        let localOrgs = localResponse.data || [];

        localOrgs = localOrgs
          .filter(
            (org) =>
              org.name.toLowerCase().includes(queryLower) ||
              org.domain.toLowerCase().includes(queryLower)
          )
          .map((org) => ({
            name: org.name,
            domains: [org.domain],
            country: 'India',
            web_pages: [],
            isLocal: true, // flag for UI badge
          }));

        // ── 2. Fetch from HipoLabs via our secure backend proxy ──
        let externalOrgs = [];
        try {
          const { data } = await api.get(
            `/universities?search=${encodeURIComponent(query)}`
          );
          externalOrgs = Array.isArray(data) ? data : [];
        } catch (proxyErr) {
          console.error('[InstitutionSelect] Proxy request failed:', proxyErr);
          setError('University search is temporarily unavailable.');
        }

        if (active) {
          // Merge; local Walled Gardens take priority — deduplicate by primary domain
          const merged = [...localOrgs, ...externalOrgs];
          const seen = new Set();
          const uniqueData = merged
            .filter((item) => {
              const key = (item.domains?.[0] || item.name).toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 25);

          setOptions(uniqueData);
        }
      } catch (err) {
        console.error('[InstitutionSelect] Fetch error:', err);
        if (active) setError('Failed to load institutions. Please try again.');
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
      filterOptions={(x) => x} // Server-side filtering — disable local filter
      onChange={(event, newValue) => {
        onChange(newValue || null);
      }}
      onInputChange={(event, newInputValue) => {
        setQuery(newInputValue);
      }}
      noOptionsText={
        error ? (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        ) : query.length < 3 ? (
          'Type at least 3 characters…'
        ) : loading ? (
          'Searching…'
        ) : (
          'No universities found'
        )
      }
      renderOption={(props, option) => (
        <li
          {...props}
          key={`${option.name}-${option.domains?.[0]}`}
          style={{
            backgroundColor: '#1e293b',
            color: 'white',
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
            <Globe size={16} style={{ marginTop: 2, flexShrink: 0, color: 'rgba(255,255,255,0.4)' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="subtitle2" noWrap sx={{ maxWidth: 260 }}>
                  {option.name}
                </Typography>
                {option.isLocal && (
                  <Chip
                    label="Walled Garden"
                    size="small"
                    sx={{
                      height: 16,
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      bgcolor: 'rgba(99,102,241,0.2)',
                      color: '#818cf8',
                      border: '1px solid rgba(99,102,241,0.35)',
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                {option.domains?.[0] || '—'}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search Indian Universities"
          fullWidth
          error={!!error && open}
          helperText={error && open ? error : undefined}
          FormHelperTextProps={{ sx: { color: '#ef4444', mt: 0.5 } }}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="rgba(255,255,255,0.4)" />
              </InputAdornment>
            ),
          }}
          sx={sx}
        />
      )}
    />
  );
}
