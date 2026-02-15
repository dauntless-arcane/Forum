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

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ask" element={<AskQuestion />} />
            <Route path="/question/:id" element={<QuestionDetail />} />
            <Route path="/specialists" element={<Specialists />} />
            <Route path="/specialist-panel" element={<SpecialistDashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
