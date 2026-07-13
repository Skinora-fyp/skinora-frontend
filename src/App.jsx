import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AppProvider, useApp } from './context/AppContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
import Landing      from './pages/Landing';
import Auth         from './pages/Auth';
import Guidelines   from './pages/Guidelines';
import Upload       from './pages/Upload';
import Result       from './pages/Result';
import Consult      from './pages/Consult';
import Questionnaire from './pages/Questionnaire';
import Remedies     from './pages/Remedies';
import RemedyDetail from './pages/RemedyDetail';
import Track        from './pages/Track';
import Reminder     from './pages/Reminder';
import Checkin      from './pages/Checkin';
import History      from './pages/History';

function ProtectedRoute({ children }) {
  const { state } = useApp();
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"              element={<Landing />} />
      <Route path="/login"         element={<Auth />} />
      <Route path="/guidelines"    element={<ProtectedRoute><Guidelines /></ProtectedRoute>} />
      <Route path="/upload"        element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      <Route path="/result"        element={<ProtectedRoute><Result /></ProtectedRoute>} />
      <Route path="/consult"       element={<ProtectedRoute><Consult /></ProtectedRoute>} />
      <Route path="/questionnaire" element={<ProtectedRoute><Questionnaire /></ProtectedRoute>} />
      <Route path="/remedies"      element={<ProtectedRoute><Remedies /></ProtectedRoute>} />
      <Route path="/remedies/:id"  element={<ProtectedRoute><RemedyDetail /></ProtectedRoute>} />
      <Route path="/track"         element={<ProtectedRoute><Track /></ProtectedRoute>} />
      <Route path="/reminder"      element={<ProtectedRoute><Reminder /></ProtectedRoute>} />
      <Route path="/checkin"       element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
      <Route path="/history"       element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </GoogleOAuthProvider>
  );
}
