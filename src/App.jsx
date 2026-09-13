import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { MagneticCursor } from '@/components/ui/magnetic-cursor';
import { isDemoMode } from './lib/supabase';
import { RefreshCw } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
          <span className="text-sm font-semibold">Verifying Supabase Session...</span>
        </div>
      </div>
    );
  }

  // Allow access in demo mode or if user has active session
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export function App() {
  return (
    <MagneticCursor
      magneticFactor={0.4}
      blendMode="exclusion"
      cursorSize={28}
      hoverPadding={8}
    >
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </MagneticCursor>
  );
}

export default App;
