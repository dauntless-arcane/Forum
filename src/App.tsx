import { useEffect, useState } from 'react';
import { ServerCrash } from 'lucide-react';
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

  const [apiError, setApiError] = useState(false);
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
        setApiError(true);
      });
  }, []);

  if (apiError) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <ServerCrash className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-2xl font-bold text-white tracking-widest uppercase mb-2">Service Unavailable</h1>
        <p className="text-slate-400 text-center max-w-md">Our servers are currently unreachable or undergoing maintenance. Please try again later.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors border border-blue-500"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse text-white font-bold text-xl flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Connecting...
        </div>
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
            <Route path="/login" element={<Login allowSignups={appConfig.allowSignups === true} />} />
            {appConfig.allowSignups === true && (
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
