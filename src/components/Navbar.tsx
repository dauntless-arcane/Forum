import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Sun, Moon } from 'lucide-react';
import { currentUser } from '../mockData';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold hover:text-accent transition-colors">
            <MessageCircle size={28} />
            <span>ForumHub</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/"
              className={`font-medium transition-colors ${
                isActive('/') ? 'text-accent' : 'hover:text-accent'
              }`}
            >
              Explore
            </Link>
            <Link
              to="/dashboard"
              className={`font-medium transition-colors ${
                isActive('/dashboard') ? 'text-accent' : 'hover:text-accent'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/ask"
              className="bg-accent text-primary px-4 py-2 rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Ask Question
            </Link>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-secondary/30 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2 ml-2">
              <span className="text-2xl">{currentUser.avatar}</span>
              <span className="font-medium">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
