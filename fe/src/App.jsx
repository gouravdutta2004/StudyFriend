import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Connections from './pages/Connections';
import Sessions from './pages/Sessions';
import StudyRoom from './pages/StudyRoom';
import PublicGroups from './pages/PublicGroups';
import Messages from './pages/Messages';
import Support from './pages/Support';
import UserProfile from './pages/UserProfile';
import EditProfile from './pages/EditProfile';
import AdminPanel from './pages/AdminPanel';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SupportWidget from './components/SupportWidget';
import Onboarding from './pages/Onboarding';
import Leaderboard from './pages/Leaderboard';
import GlobalAnnouncementBanner from './components/GlobalAnnouncementBanner';

import AIAssistantWidget from './components/AIAssistantWidget';

const Layout = ({ children }) => (
  <>
    <GlobalAnnouncementBanner />
    <Navbar />
    <main>{children}</main>
    <SupportWidget />
    <AIAssistantWidget />
  </>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/browse" element={<ProtectedRoute><Layout><Browse /></Layout></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><Layout><Matches /></Layout></ProtectedRoute>} />
              <Route path="/connections" element={<ProtectedRoute><Layout><Connections /></Layout></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><Layout><Sessions /></Layout></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><Layout><Leaderboard /></Layout></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><Layout><PublicGroups /></Layout></ProtectedRoute>} />
              <Route path="/study-room/:id" element={<ProtectedRoute><Layout><StudyRoom /></Layout></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Layout><Messages /></Layout></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Layout><Support /></Layout></ProtectedRoute>} />
              <Route path="/user/:id" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Layout><UserProfile /></Layout></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><Layout><EditProfile /></Layout></ProtectedRoute>} />
              <Route path="/admin/user/:id/edit" element={<AdminRoute><Layout><EditProfile /></Layout></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
