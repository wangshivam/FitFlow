import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider, Sidebar, TopBar } from './components/shared';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import DietPage from './pages/DietPage';
import WorkoutPage from './pages/WorkoutPage';
import CoachPage from './pages/CoachPage';
import PremiumPage from './pages/PremiumPage';
import WeeklySummaryPage from './pages/WeeklySummaryPage';
import './styles/global.css';

// ── Protected Route Guard ──
function ProtectedRoute({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

// ── Auth-only Route (redirect if already logged in) ──
function PublicRoute({ children }) {
  const { isAuthenticated, isOnboarded, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
      </div>
    );
  }

  if (isAuthenticated && isOnboarded) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ── Authenticated App Layout ──
function AppLayout() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <TopBar user={user} />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/diet" element={<DietPage />} />
            <Route path="/workout" element={<WorkoutPage />} />
            <Route path="/coach" element={<CoachPage />} />
            <Route path="/premium" element={<PremiumPage />} />
            <Route path="/weekly-summary" element={<WeeklySummaryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ── Root App ──
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/landing" element={<LandingPage />} />
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
