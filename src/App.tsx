import { useEffect, useState } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AskQuestion from './pages/AskQuestion';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import QuestionDetail from './pages/QuestionDetail';
import SpecialistDashboard from "./pages/SpecialistDashboard";
import Specialists from "./pages/Specialists";
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingTour from './components/OnboardingTour';
import LandingPage from './pages/LandingPage';
import { config } from './services/api';

// Admin Pages
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminModeration from "./pages/admin/AdminModeration";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const [appConfig, setAppConfig] = useState<{ isLaunched: boolean, launchDate: string, allowSignups?: boolean } | null>(null);

  useEffect(() => {
    // Check if a bypass token is passed via URL
    const searchParams = new URLSearchParams(window.location.search);
    const urlToken = searchParams.get('token');

    if (urlToken) {
      localStorage.setItem('adminBypassToken', urlToken);
      // Clean up URL to hide the token from sight
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    config.getLaunchStatus()
      .then(res => {
        setAppConfig(res.data);
        // If the platform is natively launched (not just bypassed lock), 
        // we no longer need the bypass token, so we clean it up entirely.
        if (res.data.isLaunched === true && !res.data.bypassed) {
          localStorage.removeItem('adminBypassToken');
        }
      })
      .catch(err => {
        console.error("Failed to check launch status", err);
        // Fallback to launched to not block development if backend isn't ready
        setAppConfig({ isLaunched: true, launchDate: '' });
      });
  }, []);

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white font-bold text-xl">Loading...</div>
      </div>
    );
  }

  if (appConfig.isLaunched === false) {
    return <LandingPage launchDate={appConfig.launchDate} />;
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full overflow-x-hidden bg-gray-50 dark:bg-slate-900 transition-colors flex flex-col pb-[110px] md:pb-0">
          <Routes>
            <Route path="/admin*" element={null} />
            <Route path="*" element={<Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
          </Routes>
          <OnboardingTour />
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            {appConfig.allowSignups !== false && (
              <Route path="/signup" element={<Signup />} />
            )}

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ask" element={<AskQuestion />} />
              <Route path="/question/:id" element={<QuestionDetail />} />
              <Route path="/specialists" element={<Specialists />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['specialist']} />}>
              <Route path="/specialist-panel" element={<SpecialistDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
