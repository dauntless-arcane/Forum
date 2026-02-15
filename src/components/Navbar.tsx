import {
  BrainCircuitIcon,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  User,
  X,
  LogIn,
  UserPlus
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export default function Navbar({ darkMode, toggleDarkMode }: NavbarProps) {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-primary text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <BrainCircuitIcon size={26} />
            Recalibrate
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">

            <Link
              to="/"
              className={isActive("/") ? "text-accent" : "hover:text-accent"}
            >
              Explore
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                className={isActive("/dashboard") ? "text-accent" : "hover:text-accent"}
              >
                Dashboard
              </Link>
            )}

            <Link
              to="/ask"
              className="bg-accent text-primary px-4 py-2 rounded-lg hover:bg-accent/90"
            >
              Ask Question
            </Link>

            {user?.role === 'specialist' && (
              <Link
                to="/specialist-panel"
                className={isActive("/specialist-panel") ? "text-accent" : "hover:text-accent"}
              >
                Specialist Panel
              </Link>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-secondary/30"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown or Login/Signup */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2"
                >
                  <span className="text-xl">{user.avatar || '👤'}</span>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={16} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white text-gray-800 rounded-xl shadow-xl py-2">
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <User size={16} /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                      <Settings size={16} /> Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hover:text-accent transition-colors">Log In</Link>
                <Link to="/signup" className="border border-accent text-accent px-3 py-1.5 rounded-lg hover:bg-accent hover:text-primary transition-all">Sign Up</Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 space-y-4 pb-4 border-t border-white/20">

            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block pt-4"
            >
              Explore
            </Link>

            {isAuthenticated && (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block"
              >
                Dashboard
              </Link>
            )}

            {user?.role === 'specialist' && (
              <Link
                to="/specialist-panel"
                onClick={() => setMobileOpen(false)}
                className="block"
              >
                Specialist Panel
              </Link>
            )}

            <Link
              to="/ask"
              onClick={() => setMobileOpen(false)}
              className="block bg-accent text-primary px-4 py-2 rounded-lg"
            >
              Ask Question
            </Link>

            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              Toggle Theme
            </button>

            <div className="border-t border-white/20 pt-4">
              {isAuthenticated && user ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{user.avatar || '👤'}</span>
                    {user.name}
                  </div>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="block py-1">Profile</Link>
                  <Link to="/settings" onClick={() => setMobileOpen(false)} className="block py-1">Settings</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="block py-1 text-left w-full text-red-300">Logout</button>
                </>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-1"><LogIn size={16} /> Log In</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 py-1"><UserPlus size={16} /> Sign Up</Link>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </nav>
  );
}
