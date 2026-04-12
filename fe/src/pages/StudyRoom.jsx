import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import NotesUploader from '../components/NotesUploader';
import VideoRoom from '../components/VideoRoom';
import SharedWhiteboard from '../components/SharedWhiteboard';
import StudyRoomChat from '../components/StudyRoomChat';
import CollabNotes from '../components/CollabNotes';
import GroupPomodoro from '../components/studyroom/GroupPomodoro';
import RaiseHand from '../components/studyroom/RaiseHand';
import LivePoll from '../components/studyroom/LivePoll';
import AmbientMusic from '../components/studyroom/AmbientMusic';
import RoomLeaderboard from '../components/studyroom/RoomLeaderboard';
import TaskBoard from '../components/studyroom/TaskBoard';
import VoiceReactions from '../components/studyroom/VoiceReactions';
import SessionReport from '../components/studyroom/SessionReport';
import FocusAuditor from '../components/studyroom/FocusAuditor';
import ReportUserModal from '../components/studyroom/ReportUserModal';
import ArcadeSidebar from '../components/studyroom/ArcadeSidebar';
import DraggableWidget from '../components/studyroom/DraggableWidget';

import {
  ArrowLeft, Users, Loader2, Maximize, MessageSquare,
  FileText, PenLine, LayoutList, LogOut, Lock, ShieldAlert,
  Gamepad2, Timer, CheckSquare, Music, Vote, Hand, Wifi,
  WifiOff, Sparkles, BookOpen, Crown, Zap
} from 'lucide-react';

import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

// ─── Design tokens ───────────────────────────────────────────────
const T = {
  bg:       '#0F172A',
  bgCard:   '#1E293B',
  bgGlass:  'rgba(30,41,59,0.7)',
  primary:  '#6366F1',
  primaryL: 'rgba(99,102,241,0.15)',
  primaryB: 'rgba(99,102,241,0.3)',
  accent1:  '#22C55E',
  accent2:  '#F59E0B',
  border:   'rgba(99,102,241,0.18)',
  borderSub:'rgba(255,255,255,0.06)',
  text:     '#F1F5F9',
  textMuted:'#94A3B8',
  textDim:  '#475569',
};

const glass = {
  background: T.bgGlass,
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${T.border}`,
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
};

const DOCK_ITEMS = [
  { key: 'video',  icon: Users,        label: 'Cameras', color: '#6366F1' },
  { key: 'chat',   icon: MessageSquare,label: 'Chat',    color: '#3B82F6' },
  { key: 'tasks',  icon: CheckSquare,  label: 'Tasks',   color: '#22C55E' },
  { key: 'collab', icon: PenLine,      label: 'Notes',   color: '#F59E0B' },
  { key: 'notes',  icon: FileText,     label: 'Files',   color: '#EC4899' },
  { key: 'tools',  icon: LayoutList,   label: 'Tools',   color: '#14B8A6' },
  { key: 'arcade', icon: Gamepad2,     label: 'Arcade',  color: '#8B5CF6' },
];

// ─── Participant Chip ─────────────────────────────────────────────
function ParticipantChip({ participant, index }) {
  const colors = ['#6366F1','#22C55E','#F59E0B','#EC4899','#14B8A6'];
  const color = colors[index % colors.length];
  const name = participant?.name || participant || '?';
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: index * 0.06 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: `${color}18`, border: `1px solid ${color}35`,
        borderRadius: 20, padding: '4px 10px 4px 4px',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: `linear-gradient(135deg, ${color}aa, ${color})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 800, color: '#fff',
        boxShadow: `0 0 8px ${color}55`,
      }}>
        {String(name)[0]?.toUpperCase()}
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: T.text, maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
    </motion.div>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: T.bg, gap: 20,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `3px solid ${T.primaryB}`,
          borderTopColor: T.primary,
        }}
      />
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ color: T.textMuted, fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
      >
        Entering study room…
      </motion.p>
    </div>
  );
}

// ─── Connection Badge ─────────────────────────────────────────────
function ConnectionBadge({ connected }) {
  return (
    <motion.div
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        background: connected ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        border: `1px solid ${connected ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        borderRadius: 8, padding: '4px 9px',
      }}
    >
      {connected
        ? <Wifi size={10} color="#22C55E" />
        : <WifiOff size={10} color="#ef4444" />
      }
      <span style={{ fontSize: 10, fontWeight: 700, color: connected ? '#22C55E' : '#ef4444', letterSpacing: 0.5 }}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function StudyRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [activeWidgets, setActiveWidgets] = useState(['video', 'chat']);
  const [widgetOrder, setWidgetOrder]     = useState(['video', 'chat']);
  const [socket, setSocket]             = useState(null);
  const [showReport, setShowReport]     = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const whiteboardRef  = useRef(null);
  const mainWrapperRef = useRef(null);

  // ── Fetch & join session ──
  useEffect(() => {
    const fetchSessionAndJoin = async () => {
      try {
        const res = await api.get(`/sessions/${id}`);
        const found = res.data;
        if (!found) { toast.error('Session not found'); return navigate('/sessions'); }

        const isParticipant = found.participants?.some(p => p._id === user?._id || p === user?._id);
        const isHost = found.host?._id === user?._id || found.host === user?._id;

        if (!isParticipant && !isHost) {
          try {
            await api.post(`/sessions/${id}/join`);
            toast.success('Joined session via direct link!');
            const joinedRes = await api.get(`/sessions/${id}`);
            setSession(joinedRes.data);
          } catch (joinErr) {
            toast.error(joinErr.response?.data?.message || 'Session is full or unavailable.');
            return navigate('/sessions');
          }
        } else {
          setSession(found);
        }
      } catch (err) {
        console.error('StudyRoom Load Error:', err);
        toast.error(err.response?.data?.message || err.message || 'Failed to load study room');
        navigate('/sessions');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchSessionAndJoin();
  }, [id, navigate, user]);

  // ── Socket init ──
  useEffect(() => {
    if (!session) return;
    const wsUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001';
    const newSocket = io(wsUrl, { withCredentials: true });
    newSocket.on('connect', () => setSocketConnected(true));
    newSocket.on('disconnect', () => setSocketConnected(false));
    newSocket.emit('join_study_room', {
      roomId: id, userId: user?._id, userName: user?.name,
      title: session.title, subject: session.subject,
    });
    setSocket(newSocket);
    return () => {
      newSocket.emit('leave_study_room', { roomId: id });
      newSocket.disconnect();
    };
  }, [id, session, user]);

  // ── Layout helpers ──
  const toggleWidget = (w) => {
    if (activeWidgets.includes(w)) {
      setActiveWidgets(prev => prev.filter(x => x !== w));
    } else {
      setActiveWidgets(prev => [...prev, w]);
      bringToFront(w);
    }
  };

  const bringToFront = (w) => {
    setWidgetOrder(prev => {
      const filtered = prev.filter(x => x !== w);
      return [...filtered, w];
    });
  };

  const getZIndex = (w) => {
    const idx = widgetOrder.indexOf(w);
    return 60 + (idx >= 0 ? idx : 0); // Widgets sit above whiteboard (10)
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mainWrapperRef.current) {
      mainWrapperRef.current.requestFullscreen().catch(err => toast.error(`Fullscreen error: ${err.message}`));
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const leaveRoom = () => setShowReport(true);

  if (loading) return <LoadingScreen />;
  if (!session) return null;

  const isHost = session.host?._id === user?._id || session.host === user?._id;
  const sharedProps = { socket, roomId: id, session, isDark: true };

  // ── Report target ──
  const others = session.participants?.filter(p => {
    const pid = p._id || p;
    return String(pid) !== String(user?._id);
  });
  const reportTarget = others?.[0];
  const reportedId   = reportTarget?._id || reportTarget;
  const reportedName = reportTarget?.name || 'this user';

  return (
    <div
      ref={mainWrapperRef}
      style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        background: `radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 60%),
                     radial-gradient(ellipse at 80% 20%, rgba(34,197,94,0.04) 0%, transparent 50%),
                     ${T.bg}`,
        fontFamily: "'Inter', -apple-system, sans-serif",
        color: T.text, position: 'relative',
      }}
    >
      {/* Animated grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Voice reactions overlay moved to chat */}

      {/* AI Focus Auditor */}
      {socket && user && <FocusAuditor session={session} socket={socket} userId={user._id} />}

      {/* Session Report */}
      {showReport && (
        <SessionReport {...sharedProps} onClose={() => { setShowReport(false); navigate('/sessions'); }} />
      )}

      {/* Report User modal */}
      {showReportModal && (
        <ReportUserModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          session={session}
          socket={socket}
          reportedUserId={reportedId}
          reportedUserName={reportedName}
        />
      )}

      {/* ── Main canvas ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1 }}>

        {/* ── Top HUD bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
          padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(15,23,42,0.95) 0%, transparent 100%)',
          backdropFilter: 'blur(8px)',
          pointerEvents: 'none',
          gap: 16,
        }}>
          {/* Left: Back + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'auto', minWidth: 0, flex: 1 }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/sessions')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: T.primaryL, border: `1px solid ${T.primaryB}`,
                color: T.primary, cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
            </motion.button>

            <div style={{
              ...glass, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 10,
              minWidth: 0,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: '#22C55E',
                boxShadow: '0 0 8px #22C55E', animation: 'pulse 2s infinite', flexShrink: 0
              }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.title}
              </span>
              <div style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, flexShrink: 0,
                background: `${T.primary}20`, border: `1px solid ${T.primaryB}`,
                color: T.primary, textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {session.subject}
              </div>
              {isHost && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <Crown size={11} color="#F59E0B" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B' }}>HOST</span>
                </div>
              )}
            </div>

            {/* Participant chips (hidden on very small screens) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              overflow: 'hidden', pointerEvents: 'auto',
            }}>
              {(session.participants || []).slice(0, 3).map((p, i) => (
                <ParticipantChip key={p._id || p || i} participant={p} index={i} />
              ))}
              {(session.participants?.length || 0) > 3 && (
                <div style={{
                  padding: '4px 10px', borderRadius: 20, flexShrink: 0,
                  background: T.primaryL, border: `1px solid ${T.primaryB}`,
                  fontSize: 11, fontWeight: 700, color: T.primary,
                }}>
                  +{session.participants.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, pointerEvents: 'auto', flexShrink: 0 }}>
            {/* Status badges */}
            <ConnectionBadge connected={socketConnected} />

            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, padding: '4px 9px',
            }}>
              <Lock size={10} color="#22C55E" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22C55E', letterSpacing: 0.5 }}>E2EE</span>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: T.bgGlass, border: `1px solid ${T.borderSub}`,
              borderRadius: 8, padding: '4px 8px', backdropFilter: 'blur(12px)',
            }}>
              <Users size={12} color={T.textMuted} />
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>
                {session.participants?.length || 1}
                <span style={{ color: T.textMuted }}>/{session.maxParticipants || '∞'}</span>
              </span>
            </div>

            {/* Tools toggle handled by bottom dock now, removing inline panel toggle */}


            {/* Actions */}
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.borderSub}`,
                color: T.textMuted, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Maximize size={14} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(239,68,68,0.18)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowReportModal(true)}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <ShieldAlert size={14} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={leaveRoom}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                transition: 'all 0.3s ease',
              }}
            >
              <LogOut size={13} />
              Leave
            </motion.button>
          </div>
        </div>

        {/* ── Whiteboard canvas (background) ── */}
        <div ref={whiteboardRef} style={{ position: 'absolute', inset: 0, zIndex: 10 }}>
          {socket && <SharedWhiteboard roomId={id} socket={socket} />}
        </div>
        
        {/* ── Widgets Layer ── */}
        {socket && (
          <>
            {/* Video Widget */}
            {activeWidgets.includes('video') && (
              <DraggableWidget
                id="widget-video" roomId={id} title="Cameras" icon={Users} color="#6366F1"
                defaultPosition={{ x: 20, y: 70 }} defaultSize={{ width: 480, height: 350 }}
                onClose={() => toggleWidget('video')} zIndex={getZIndex('video')} onClick={() => bringToFront('video')}
              >
                <div style={{ flex: 1, position: 'relative' }}>
                  <VideoRoom roomId={id} socket={socket} onTogglePanel={() => toggleWidget('chat')} showPanel={activeWidgets.includes('chat')} />
                </div>
              </DraggableWidget>
            )}

            {/* Chat Widget */}
            {activeWidgets.includes('chat') && (
              <DraggableWidget
                id="widget-chat" roomId={id} title="Room Chat" icon={MessageSquare} color="#3B82F6"
                defaultPosition={{ x: window.innerWidth - 380, y: 70 }} defaultSize={{ width: 340, height: 500 }}
                onClose={() => toggleWidget('chat')} zIndex={getZIndex('chat')} onClick={() => bringToFront('chat')}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <PomodoroCard {...sharedProps} />
                    <RaiseHandCard {...sharedProps} />
                  </div>
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <StudyRoomChat socket={socket} roomId={id} />
                  </div>
                </div>
              </DraggableWidget>
            )}

            {/* Tasks Widget */}
            {activeWidgets.includes('tasks') && (
              <DraggableWidget
                id="widget-tasks" roomId={id} title="Group Tasks" icon={CheckSquare} color="#22C55E"
                defaultPosition={{ x: 100, y: 150 }} defaultSize={{ width: 400, height: 450 }}
                onClose={() => toggleWidget('tasks')} zIndex={getZIndex('tasks')} onClick={() => bringToFront('tasks')}
              >
                <TaskBoard socket={socket} roomId={id} isDark={true} />
              </DraggableWidget>
            )}

            {/* Notes/Collab Widget */}
            {activeWidgets.includes('collab') && (
              <DraggableWidget
                id="widget-collab" roomId={id} title="Collab Notes" icon={PenLine} color="#F59E0B"
                defaultPosition={{ x: 150, y: 180 }} defaultSize={{ width: 500, height: 550 }}
                onClose={() => toggleWidget('collab')} zIndex={getZIndex('collab')} onClick={() => bringToFront('collab')}
              >
                <CollabNotes roomId={id} sessionId={id} socket={socket} />
              </DraggableWidget>
            )}

            {/* Files Widget */}
            {activeWidgets.includes('notes') && (
              <DraggableWidget
                id="widget-files" roomId={id} title="Files & Resources" icon={FileText} color="#EC4899"
                defaultPosition={{ x: 200, y: 120 }} defaultSize={{ width: 360, height: 400 }}
                onClose={() => toggleWidget('notes')} zIndex={getZIndex('notes')} onClick={() => bringToFront('notes')}
              >
                <div style={{ overflowY: 'auto', height: '100%', padding: 12 }}>
                  <NotesUploader session={session} setSession={setSession} />
                </div>
              </DraggableWidget>
            )}

            {/* Tools Widget */}
            {activeWidgets.includes('tools') && (
              <DraggableWidget
                id="widget-tools" roomId={id} title="Tools & Polls" icon={LayoutList} color="#14B8A6"
                defaultPosition={{ x: 250, y: 160 }} defaultSize={{ width: 380, height: 480 }}
                onClose={() => toggleWidget('tools')} zIndex={getZIndex('tools')} onClick={() => bringToFront('tools')}
              >
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
                  <LivePoll {...sharedProps} />
                  <AmbientMusic isDark={true} />
                  <RoomLeaderboard socket={socket} roomId={id} isDark={true} />
                </div>
              </DraggableWidget>
            )}

            {/* Arcade Widget */}
            {activeWidgets.includes('arcade') && (
              <DraggableWidget
                id="widget-arcade" roomId={id} title="Arcade" icon={Gamepad2} color="#8B5CF6"
                defaultPosition={{ x: window.innerWidth / 2 - 200, y: 100 }} defaultSize={{ width: 400, height: 500 }}
                onClose={() => toggleWidget('arcade')} zIndex={getZIndex('arcade')} onClick={() => bringToFront('arcade')}
              >
                <ArcadeSidebar isDark={true} />
              </DraggableWidget>
            )}
          </>
        )}
        
        {/* ── Bottom Floating Dock ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 16, pointerEvents: 'none'
        }}>
          <motion.div
            drag
            dragMomentum={false}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(10,15,28,0.85)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              padding: '8px',
              borderRadius: 24,
              border: `1px solid ${T.borderSub}`,
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              pointerEvents: 'auto',
              cursor: 'grab',
            }}
          >
            {/* Drag Handle block */}
            <div style={{
              display: 'flex', gap: 2, padding: '0 4px', opacity: 0.5, cursor: 'grab'
            }}>
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
              <div style={{ width: 4, height: 24, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>
            {DOCK_ITEMS.map((item) => {
              const active = activeWidgets.includes(item.key);
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => toggleWidget(item.key)}
                  onMouseEnter={(e) => {
                    const tooltip = e.currentTarget.querySelector('.dock-tooltip');
                    if (tooltip) tooltip.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    const tooltip = e.currentTarget.querySelector('.dock-tooltip');
                    if (tooltip) tooltip.style.opacity = '0';
                  }}
                  style={{
                    position: 'relative',
                    width: 44, height: 44, borderRadius: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? `${item.color}25` : 'transparent',
                    border: active ? `1px solid ${item.color}50` : '1px solid transparent',
                    color: active ? item.color : T.textMuted,
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <Icon size={20} />
                  {/* Tooltip */}
                  <div
                    className="dock-tooltip"
                    style={{
                      position: 'absolute', top: -36, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.8)', padding: '4px 10px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, color: '#fff', opacity: 0,
                      pointerEvents: 'none', transition: 'opacity 0.2s', whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </div>
                  {/* Active dot */}
                  {active && (
                    <div style={{
                      position: 'absolute', bottom: 4, width: 4, height: 4,
                      borderRadius: '50%', background: item.color,
                      boxShadow: `0 0 6px ${item.color}`
                    }} />
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Global style: pulse anim */}
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 8px #22C55E; opacity: 1; }
          50%       { box-shadow: 0 0 16px #22C55E; opacity: 0.6; }
        }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.5); }
      `}</style>
    </div>
  );
}

// ─── Inline Pomodoro card (styled) ───────────────────────────────
function PomodoroCard(props) {
  return (
    <div style={{
      background: 'rgba(99,102,241,0.08)', border: `1px solid rgba(99,102,241,0.2)`,
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid rgba(99,102,241,0.12)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Timer size={13} color={T.primary} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.primary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Group Pomodoro
        </span>
      </div>
      <div style={{ padding: '0 4px 4px' }}>
        <GroupPomodoro {...props} />
      </div>
    </div>
  );
}

// ─── Inline Raise-hand card (styled) ─────────────────────────────
function RaiseHandCard(props) {
  return (
    <div style={{
      background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)',
      borderRadius: 14, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid rgba(245,158,11,0.12)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Hand size={13} color={T.accent2} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.accent2, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Raise Hand
        </span>
      </div>
      <div style={{ padding: '0 4px 4px' }}>
        <RaiseHand {...props} />
      </div>
    </div>
  );
}
