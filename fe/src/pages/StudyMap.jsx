import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Circle } from '@react-google-maps/api';
import { Box, Typography, Avatar, Button, Chip, Slider, Paper, CircularProgress, useTheme, Tooltip, IconButton, TextField, InputAdornment } from '@mui/material';
import { Radar, Navigation, RefreshCw, Crosshair, RadioReceiver, Search, X, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const LIBRARIES = ['places'];

// Radar UI Colors
const RADAR_PRIMARY = '#10b981'; // Emerald/Neon Green
const RADAR_SECONDARY = '#065f46'; // Dark Emerald
const RADAR_BG = '#020617'; // Deep Space Black

// Radar Specific Map Styles
const MAP_STYLES_RADAR = [
  { elementType: 'geometry', stylers: [{ color: '#020617' }] },
  { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#064e3b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#022c22' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#065f46' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#042f2e' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#10b981' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#059669' }] },
];

const STUDY_STYLE_COLORS = { Visual: '#f59e0b', Auditory: '#10b981', 'Reading/Writing': '#3b82f6', Kinesthetic: '#ef4444', Mixed: '#8b5cf6', Pomodoro: '#ec4899', default: RADAR_PRIMARY };

function createRadarBlip(color = RADAR_PRIMARY, isMe = false) {
  const w = isMe ? 40 : 24;
  const pulse = isMe ? `<circle cx="${w/2}" cy="${w/2}" r="${w/2-2}" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>
    <circle cx="${w/2}" cy="${w/2}" r="${w/2-6}" fill="none" stroke="${color}" stroke-width="1" opacity="0.4"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}">
    <defs><filter id="g"><feDropShadow dx="0" dy="0" stdDeviation="${isMe ? 6 : 4}" flood-color="${color}" flood-opacity="0.8"/></filter></defs>
    ${pulse}
    <circle cx="${w/2}" cy="${w/2}" r="${isMe ? 6 : 4}" fill="${color}" filter="url(#g)"/>
    <path d="M${w/2 - 2} ${w/2} L${w/2 + 2} ${w/2} M${w/2} ${w/2 - 2} L${w/2} ${w/2 + 2}" stroke="#000" stroke-width="1"/>
  </svg>`;
  return { url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`, scaledSize: new window.google.maps.Size(w, w), anchor: new window.google.maps.Point(w/2, w/2) };
}

export default function StudyMap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [myPos, setMyPos] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [radius, setRadius] = useState(10); // km
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [filter, setFilter] = useState('');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: LIBRARIES });

  const onMapLoad = useCallback((map) => { setMapInstance(map); }, []);

  const initLocation = useCallback(() => {
    setLoading(true); setLocationError(null);
    if (!navigator.geolocation) { setLocationError('GEOLOCATION_UNSUPPORTED'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setMyPos({ lat, lng });
        try { await api.put('/users/profile/location', { lat, lng }); } catch {/*silent*/}
        await fetchNearby(lat, lng, radius); setLoading(false);
      },
      () => { setLocationError('LOC_ACCESS_DENIED'); setLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radius]); // eslint-disable-line

  const fetchNearby = async (lat, lng, km) => {
    try { const { data } = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${km * 1000}`); setNearbyUsers(data); }
    catch { toast.error('RADAR ERROR: targets lost'); }
  };
  useEffect(() => { initLocation(); }, [initLocation]);

  const handleRadiusChange = async (_, val) => { setRadius(val); if (myPos) await fetchNearby(myPos.lat, myPos.lng, val); };
  const handleConnect = async (targetId) => { try { await api.post(`/users/connect/${targetId}`); toast.success('PING_SENT'); } catch (e) { toast.error('PING_FAIL'); } };
  const handleMessage = (targetId) => { navigate('/messages', { state: { openUserId: targetId } }); };
  const handleCenterOnMe = () => { if (mapInstance && myPos) { mapInstance.panTo(myPos); mapInstance.setZoom(14); } };

  const filteredUsers = filter.trim() ? nearbyUsers.filter(u => u.name?.toLowerCase().includes(filter.toLowerCase()) || u.subjects?.some(s => s.toLowerCase().includes(filter.toLowerCase()))) : nearbyUsers;

  if (!isLoaded || loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: '#020617' }}>
      <Radar size={64} color={RADAR_PRIMARY} className="animate-spin-slow" />
      <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: RADAR_PRIMARY, letterSpacing: 3 }}>
        {!isLoaded ? 'INITIALIZING RADAR SYSTEM...' : 'ACQUIRING SATELLITE LOCK...'}
      </Typography>
    </Box>
  );

  if (loadError || !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: '#020617', color: 'error.main' }}>
      <Typography variant="h5" fontWeight={800} fontFamily="monospace">API_KEY_MISSING</Typography>
    </Box>
  );

  if (locationError) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 72px)', gap: 3, bgcolor: '#020617', color: RADAR_PRIMARY }}>
      <Typography variant="h5" fontWeight={800} fontFamily="monospace">{locationError}</Typography>
      <Button variant="outlined" onClick={initLocation} sx={{ color: RADAR_PRIMARY, borderColor: RADAR_PRIMARY, fontFamily: 'monospace', fontWeight: 900 }}>RETRY LOCK</Button>
    </Box>
  );

  return (
    <Box sx={{ position: 'relative', height: 'calc(100vh - 72px)', overflow: 'hidden', bgcolor: '#020617' }}>
      
      {/* ── Visual Radar Overlay Animations ── */}
      <style>
        {`@keyframes sweep { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }`}
      </style>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200vw', height: '200vw', pointerEvents: 'none', zIndex: 1, 
        background: `conic-gradient(from 0deg, transparent 70%, rgba(16, 185, 129, 0.02) 80%, rgba(16, 185, 129, 0.2) 100%)`, animation: 'sweep 8s linear infinite' }} />
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 2, backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* ── Top HUD Control Panel ── */}
      <Paper elevation={0} sx={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 10, p: 2, minWidth: 380, maxWidth: '92vw',
        bgcolor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(10px)', border: `2px solid ${RADAR_PRIMARY}`,
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))', // sci-fi corners
        display: 'flex', flexDirection: 'column', gap: 2
      }}>
        {/* Header line */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${RADAR_PRIMARY}`, pb: 1 }}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, fontFamily: 'monospace', fontWeight: 900, color: RADAR_PRIMARY, textShadow: `0 0 8px ${RADAR_PRIMARY}` }}>
            <Radar size={18} /> LOCAL_RADAR_SCAN
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, color: '#f59e0b', bgcolor: 'rgba(245, 158, 11, 0.1)', px: 1, py: 0.2, border: '1px solid currentColor' }}>
              BLIPS: {filteredUsers.length}
            </Typography>
            <IconButton size="small" onClick={() => myPos && fetchNearby(myPos.lat, myPos.lng, radius)} sx={{ color: RADAR_PRIMARY, '&:hover':{bgcolor: 'rgba(16,185,129,0.2)'} }}><RefreshCw size={14} /></IconButton>
            <IconButton size="small" onClick={handleCenterOnMe} sx={{ color: RADAR_PRIMARY, '&:hover':{bgcolor: 'rgba(16,185,129,0.2)'} }}><Navigation size={14} /></IconButton>
          </Box>
        </Box>

        {/* Filter Input */}
        <TextField size="small" placeholder="SCAN QUERY..." value={filter} onChange={e => setFilter(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color={RADAR_PRIMARY}/></InputAdornment>, endAdornment: filter ? (<InputAdornment position="end"><IconButton size="small" onClick={() => setFilter('')} sx={{color: RADAR_PRIMARY}}><X size={12}/></IconButton></InputAdornment>) : null }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, fontFamily: 'monospace', color: RADAR_PRIMARY, bgcolor: 'rgba(16, 185, 129, 0.05)', '& fieldset': { borderColor: RADAR_SECONDARY }, '&:hover fieldset': { borderColor: RADAR_PRIMARY }, '&.Mui-focused fieldset': { borderColor: '#34d399' } }, '& input::placeholder': { color: RADAR_SECONDARY, opacity: 1 } }}
        />

        {/* Radius Slider */}
        <Box sx={{ px: 1 }}>
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, color: RADAR_PRIMARY }}>SCAN_RADIUS: {radius}KM</Typography>
          <Slider value={radius} min={1} max={50} step={1} onChange={handleRadiusChange}
            sx={{ color: RADAR_PRIMARY, height: 2, '& .MuiSlider-thumb': { width: 14, height: 14, borderRadius: 0, border: `2px solid ${RADAR_PRIMARY}`, bgcolor: '#020617' }, mt: 1 }}
          />
        </Box>
      </Paper>

      {/* ── Legend HUD ── */}
      <Paper elevation={0} sx={{
        position: 'absolute', bottom: 24, right: 16, zIndex: 10, p: 2,
        bgcolor: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${RADAR_PRIMARY}`, borderLeft: `4px solid ${RADAR_PRIMARY}`,
        minWidth: 150
      }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 900, color: RADAR_PRIMARY, mb: 1, letterSpacing: 1 }}>[ FREQUENCIES ]</Typography>
        {Object.entries(STUDY_STYLE_COLORS).filter(([k]) => k !== 'default').map(([style, color]) => (
          <Box key={style} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: color, boxShadow: `0 0 6px ${color}` }} />
            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>{style}</Typography>
          </Box>
        ))}
      </Paper>

      {/* ── Maps ── */}
      {myPos && (
        <Box sx={{ width: '100%', height: '100%', position: 'absolute', zIndex: 0 }}>
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={myPos} zoom={13} onLoad={onMapLoad}
            options={{ styles: MAP_STYLES_RADAR, disableDefaultUI: true, clickableIcons: false }}
          >
            {/* My position marker */}
            <Marker position={myPos} icon={createRadarBlip(RADAR_PRIMARY, true)} onClick={() => setSelectedUser('me')} zIndex={1000} />
            <Circle center={myPos} radius={radius * 1000} options={{ fillColor: RADAR_PRIMARY, fillOpacity: 0.03, strokeColor: RADAR_PRIMARY, strokeOpacity: 0.2, strokeWeight: 1 }} />

            {/* InfoWindow for Me */}
            {selectedUser === 'me' && (
              <InfoWindow position={myPos} onCloseClick={() => setSelectedUser(null)}>
                <Box sx={{ bgcolor: '#020617', border: `1px solid ${RADAR_PRIMARY}`, p: 1, minWidth: 140, textAlign: 'center' }}>
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: RADAR_PRIMARY }}>[ SELF_NODE ]</Typography>
                  <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#94a3b8', mt: 0.5 }}>LAT: {myPos.lat.toFixed(4)}<br/>LNG: {myPos.lng.toFixed(4)}</Typography>
                </Box>
              </InfoWindow>
            )}

            {/* Targets */}
            {filteredUsers.map(u => {
              const coords = u.geoLocation?.coordinates;
              if (!coords || coords.length < 2) return null;
              const pos = { lat: coords[1], lng: coords[0] };
              const tColor = STUDY_STYLE_COLORS[u.studyStyle] || STUDY_STYLE_COLORS.default;

              return (
                <React.Fragment key={u._id}>
                  <Marker position={pos} icon={createRadarBlip(tColor)} onClick={() => setSelectedUser(selectedUser?._id === u._id ? null : u)} />

                  {/* Target Info Readout */}
                  {selectedUser?._id === u._id && (
                    <InfoWindow position={pos} onCloseClick={() => setSelectedUser(null)}>
                      <Box sx={{ bgcolor: '#020617', border: `1px solid ${tColor}`, p: 1, minWidth: 220 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: `1px dashed ${tColor}`, pb: 0.5, mb: 1 }}>
                          <Crosshair size={14} color={tColor} />
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 900, color: tColor, fontSize: '0.85rem' }}>{u.name?.toUpperCase()}</Typography>
                        </Box>
                        
                        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#94a3b8', mb: 1 }}>// {u.university || 'UNKNOWN_SEC'}</Typography>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', border: `1px solid ${tColor}`, color: tColor, px: 0.5 }}>CLASS: {u.studyStyle?.toUpperCase() || 'MIXED'}</Typography>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.65rem', border: `1px solid ${tColor}`, color: tColor, px: 0.5 }}>LVL: {u.level || 1}</Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1 }}>
                          <Button size="small" variant="contained" onClick={() => handleConnect(u._id)} sx={{ bgcolor: tColor, color: '#000', borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.7rem', py: 0, flex: 1, '&:hover': {bgcolor: tColor, opacity: 0.8} }}>
                            PING
                          </Button>
                          <Button size="small" variant="outlined" onClick={() => handleMessage(u._id)} sx={{ borderColor: tColor, color: tColor, borderRadius: 0, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.7rem', py: 0, flex: 1 }}>
                            COMMS
                          </Button>
                        </Box>
                      </Box>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </Box>
      )}
    </Box>
  );
}
