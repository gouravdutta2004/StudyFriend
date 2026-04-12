import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff, MonitorUp, MonitorOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ],
};

// ── Colour palette ──────────────────────────────────────────────────
const PEER_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#14B8A6'];

// ── Single video tile ────────────────────────────────────────────────
function VideoTile({ label, videoRef, muted = false, videoOn = true, index = 0, isLocal = false }) {
  const color = PEER_COLORS[index % PEER_COLORS.length];
  return (
    <div style={{
      position: 'relative',
      aspectRatio: '16/9',
      width: '100%',
      background: '#0d1117',
      borderRadius: 12,
      overflow: 'hidden',
      border: `1px solid ${color}33`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}18`,
      flexShrink: 0,
    }}>
      <video
        playsInline
        autoPlay
        muted={muted}
        ref={videoRef}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: isLocal ? 'scaleX(-1)' : 'none',
          display: videoOn ? 'block' : 'none',
        }}
      />
      {/* Avatar fallback when video off */}
      {!videoOn && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(135deg, ${color}18, #0d1117)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: `linear-gradient(135deg, ${color}88, ${color})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff',
            boxShadow: `0 0 24px ${color}66`,
          }}>
            {label?.[0]?.toUpperCase() || '?'}
          </div>
        </div>
      )}
      {/* Name tag */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(8px)',
        color: '#fff',
        padding: '3px 10px',
        borderRadius: 8,
        fontSize: 11, fontWeight: 700,
        border: `1px solid ${color}33`,
        maxWidth: '80%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>
      {/* Live dot */}
      <div style={{
        position: 'absolute', top: 8, right: 8,
        width: 8, height: 8, borderRadius: '50%',
        background: '#22C55E',
        boxShadow: '0 0 8px #22C55E',
      }} />
    </div>
  );
}

// ── Control button ───────────────────────────────────────────────────
function CtrlBtn({ onClick, active, danger, children, label }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      title={label}
      style={{
        width: 48, height: 48, borderRadius: 14,
        border: 'none',
        background: danger
          ? (active ? 'rgba(239,68,68,0.2)' : '#ef4444')
          : (active ? 'rgba(255,255,255,0.12)' : 'rgba(239,68,68,0.85)'),
        color: '#fff',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: danger && !active ? '0 4px 16px rgba(239,68,68,0.4)' : 'none',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function VideoRoom({ roomId, socket }) {
  const navigate = useNavigate();
  const localVideoRef    = useRef(null);
  const remoteRefsMap    = useRef({});            // peerId → <video> DOM node
  const peerConnections  = useRef({});            // peerId → RTCPeerConnection
  const localStreamRef   = useRef(null);
  const screenStreamRef  = useRef(null);

  const [peers, setPeers]           = useState([]);   // array of peerIds
  const [micOn, setMicOn]           = useState(true);
  const [videoOn, setVideoOn]       = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────
  const addRemoteRef = useCallback((peerId, el) => {
    if (!el) return;
    remoteRefsMap.current[peerId] = el;
    // If track already arrived before DOM, replay srcObject
    const pc = peerConnections.current[peerId];
    if (pc && el && !el.srcObject) {
      const receivers = pc.getReceivers();
      const tracks = receivers.map(r => r.track).filter(Boolean);
      if (tracks.length) el.srcObject = new MediaStream(tracks);
    }
  }, []);

  // ── WebRTC setup ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;
    let mounted = true;

    const createPeerConnection = (peerId) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
      }

      pc.onicecandidate = (e) => {
        if (e.candidate && socket) socket.emit('webrtc_signal', { to: peerId, signal: e.candidate });
      };

      pc.ontrack = (e) => {
        const remoteStream = e.streams[0] || new MediaStream([e.track]);
        const videoEl = remoteRefsMap.current[peerId];
        if (videoEl) videoEl.srcObject = remoteStream;
      };

      pc.onconnectionstatechange = () => {
        if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
          if (mounted) setPeers(prev => prev.filter(id => id !== peerId));
          pc.close();
          delete peerConnections.current[peerId];
        }
      };

      return pc;
    };

    const onUserReady = async (peerId) => {
      if (!mounted) return;
      const pc = createPeerConnection(peerId);
      peerConnections.current[peerId] = pc;
      setPeers(prev => prev.includes(peerId) ? prev : [...prev, peerId]);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { to: peerId, signal: offer });
      } catch (err) {
        console.error('WebRTC offer error:', err);
      }
    };

    const onWebrtcSignal = async ({ signal, from }) => {
      if (!mounted) return;
      let pc = peerConnections.current[from];

      if (!pc) {
        pc = createPeerConnection(from);
        peerConnections.current[from] = pc;
        setPeers(prev => prev.includes(from) ? prev : [...prev, from]);
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', { to: from, signal: answer });
        } else if (signal.type === 'answer') {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal));
        }
      } catch (err) {
        console.error('WebRTC signal error:', err.message);
      }
    };

    // Get user media then signal readiness
    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 48000 },
    }).then(stream => {
      if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      socket.emit('ready_for_webrtc', { roomId });
      socket.on('user_ready_for_webrtc', onUserReady);
      socket.on('webrtc_signal', onWebrtcSignal);
    }).catch(err => {
      console.warn('Camera/mic access denied:', err.message);
      // Still signal readiness so others can see us (audio-only or no-cam)
      socket.emit('ready_for_webrtc', { roomId });
      socket.on('user_ready_for_webrtc', onUserReady);
      socket.on('webrtc_signal', onWebrtcSignal);
    });

    return () => {
      mounted = false;
      socket.off('user_ready_for_webrtc', onUserReady);
      socket.off('webrtc_signal', onWebrtcSignal);
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
    };
  }, [roomId, socket]);

  // ── Controls ─────────────────────────────────────────────────────
  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !micOn; setMicOn(v => !v); }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !videoOn; setVideoOn(v => !v); }
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
      // Restore camera track to all peers
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(camTrack).catch(() => {});
        });
      }
      setScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        // Replace video track in all peer connections
        Object.values(peerConnections.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack).catch(() => {});
        });
        // Also show screen locally
        if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
        screenTrack.onended = () => toggleScreenShare();
        setScreenSharing(true);
      } catch (err) {
        console.warn('Screen share denied:', err.message);
      }
    }
  };

  const leaveRoom = () => navigate('/sessions');

  // ── Layout helpers ────────────────────────────────────────────────
  const totalTiles = 1 + peers.length;
  const gridCols = totalTiles === 1 ? 1 : totalTiles <= 4 ? 2 : 3;
  const maxWidth  = totalTiles === 1 ? 560 : totalTiles <= 4 ? 780 : 1080;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'auto',
      zIndex: 1,
      fontFamily: "'Inter', -apple-system, sans-serif",
      overflow: 'hidden',
    }}>
      {/* ── Video grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          pointerEvents: 'auto',
          width: '100%', maxWidth,
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: 10,
          padding: '16px 16px 74px',
          overflowY: 'auto',
          maxHeight: '100%',
          boxSizing: 'border-box',
          // Custom scrollbar
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(99,102,241,0.3) transparent',
        }}
      >
            {/* Local tile */}
            <VideoTile
              label="You"
              videoRef={localVideoRef}
              muted
              videoOn={videoOn}
              index={0}
              isLocal={!screenSharing}
            />
            {/* Remote tiles */}
            {peers.map((peerId, i) => (
              <VideoTile
                key={peerId}
                label={`Peer ${i + 1}`}
                videoRef={el => addRemoteRef(peerId, el)}
                videoOn
                index={i + 1}
                isLocal={false}
              />
            ))}
      </motion.div>

      {/* ── Floating control bar (Portaled to Study Room) ── */}
      {createPortal(
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(10,14,28,0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '8px 12px',
            borderRadius: 20,
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            zIndex: 10000,
            pointerEvents: 'auto',
            flexWrap: 'nowrap',
            cursor: 'grab',
          }}
        >
          {/* Drag Handle */}
          <div style={{ display: 'flex', gap: 2, padding: '0 4px', opacity: 0.5, cursor: 'grab' }}>
            <div style={{ width: 4, height: 24, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            <div style={{ width: 4, height: 24, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
          </div>

          {/* Mic */}
          <CtrlBtn onClick={toggleMic} active={micOn} label={micOn ? 'Mute' : 'Unmute'}>
            {micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </CtrlBtn>

          {/* Camera */}
          <CtrlBtn onClick={toggleVideo} active={videoOn} label={videoOn ? 'Stop Video' : 'Start Video'}>
            {videoOn ? <Video size={20} /> : <VideoOff size={20} />}
          </CtrlBtn>

          {/* Screen share */}
          <CtrlBtn
            onClick={toggleScreenShare}
            active={!screenSharing}
            label={screenSharing ? 'Stop Sharing' : 'Share Screen'}
          >
            {screenSharing ? <MonitorOff size={20} /> : <MonitorUp size={20} />}
          </CtrlBtn>

          {/* Divider */}
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.12)', margin: '0 4px' }} />

          {/* Leave */}
          <motion.button
            whileHover={{ scale: 1.1, background: '#ef4444' }}
            whileTap={{ scale: 0.95 }}
            onClick={leaveRoom}
            title="Leave Room"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 44, borderRadius: 12,
              border: 'none',
              background: 'rgba(239,68,68,0.2)',
              color: '#ef4444', cursor: 'pointer',
              transition: 'color 0.2s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}
          >
            <PhoneOff size={20} />
          </motion.button>
        </motion.div>,
        document.body
      )}
    </div>
  );
}
