import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './routes/LandingPage';
import AuthPage from './routes/AuthPage';
import DashboardPage from './routes/DashboardPage';
import BuilderPage from './routes/BuilderPage';

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('brahm_access_token');
  if (!token || isTokenExpired(token)) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/builder/:projectId" element={<ProtectedRoute><BuilderPage /></ProtectedRoute>} />
    </Routes>
  );
}
