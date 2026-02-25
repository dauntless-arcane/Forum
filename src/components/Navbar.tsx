import {
  BrainCircuitIcon,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  User,
  X,
  LogIn,
  UserPlus,
  Compass,
  LayoutDashboard,
  Plus,
  Shield,
  Briefcase
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
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <nav className="bg-primary text-white shadow-lg sticky top-0 z-50 w-full max-w-full">
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
                className={`tour-desktop-explore ${isActive("/") ? "text-accent" : "hover:text-accent"}`}
              >
                Explore
              </Link>

              {isAuthenticated && user?.role !== 'specialist' && (
                <Link
                  to="/dashboard"
                  className={`tour-desktop-dashboard ${isActive("/dashboard") ? "text-accent" : "hover:text-accent"}`}
                >
                  Dashboard
                </Link>
              )}

              <Link
                to="/ask"
                className="tour-desktop-ask bg-accent text-primary px-4 py-2 rounded-lg hover:bg-accent/90"
              >
                Ask Question
              </Link>

              {user?.role === 'specialist' && (
                <Link
                  to="/specialist-panel"
                  className={`tour-desktop-panel ${isActive("/specialist-panel") ? "text-accent" : "hover:text-accent"}`}
                >
                  Specialist Panel
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`tour-desktop-admin ${isActive("/admin") ? "text-accent" : "hover:text-accent"}`}
                >
                  Admin Panel
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
                    className="tour-desktop-profile flex items-center gap-2"
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

            <div className="md:hidden" ref={mobileMenuRef}>
              {/* Mobile Profile Trigger */}
              <button
                className="tour-profile flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? (
                  <X size={20} />
                ) : isAuthenticated && user ? (
                  <span className="text-xl leading-none">{user.avatar || '👤'}</span>
                ) : (
                  <User size={20} />
                )}
              </button>

              {/* Mobile Menu Dropdown (Top) */}
              {mobileOpen && (
                <div className="absolute right-4 left-auto top-16 mt-2 w-64 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-700 z-50 animate-fade-in-up shadow-2xl rounded-2xl overflow-hidden shadow-black/10 dark:shadow-black/40 origin-top-right">
                  <div className="flex flex-col">

                    {/* Top Profile / Auth section */}
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-gray-900 dark:text-white truncate text-base">{user.name}</span>
                            <span className="text-secondary text-xs font-bold uppercase tracking-widest mt-0.5">{user.role}</span>
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 font-medium transition-colors">
                            <User size={18} className="text-gray-500" /> My Profile
                          </Link>
                          <button onClick={toggleDarkMode} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 font-medium w-full text-left transition-colors">
                            {darkMode ? <Sun size={18} className="text-gray-500" /> : <Moon size={18} className="text-gray-500" />}
                            Toggle Theme
                          </button>
                          <button onClick={() => { logout(); setMobileOpen(false); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 font-medium w-full text-left text-red-600 dark:text-red-400 transition-colors">
                            <LogOut size={18} /> Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="p-2 space-y-1">
                        <button onClick={toggleDarkMode} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 font-medium w-full text-left transition-colors">
                          {darkMode ? <Sun size={18} className="text-gray-500" /> : <Moon size={18} className="text-gray-500" />} Toggle Theme
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-slate-700 my-1 mx-2" />
                        <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-700/50 font-medium transition-colors">
                          <LogIn size={18} className="text-gray-500" /> Log In
                        </Link>
                        <div className="px-2 pt-1 pb-1">
                          <Link to="/signup" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 py-2.5 w-full bg-accent text-primary rounded-xl font-bold shadow-sm transition-colors hover:bg-accent/90">
                            <UserPlus size={18} /> Sign Up
                          </Link>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[68px] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50 px-2 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">

        {/* Absolute Centered Ask Button */}
        <Link to="/ask" className="tour-mobile-ask absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center">
          <div className="bg-secondary hover:bg-secondary/90 text-white p-3.5 rounded-full shadow-lg border-4 border-white dark:border-slate-900 transition-transform active:scale-95">
            <Plus size={24} strokeWidth={3} />
          </div>
        </Link>

        {/* Distributed Icon Row - Split perfectly left/right to keep Plus centered */}
        <div className="flex w-full h-full items-center px-2">

          {/* Left Side Group */}
          <div className="flex-1 flex justify-around items-center h-full">
            {/* Always Show Explore */}
            <Link to="/" className={`tour-mobile-explore flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
              <Compass size={22} className={isActive('/') ? 'fill-secondary/20' : ''} />
              <span className="text-[10px] mt-1 font-medium">Explore</span>
            </Link>

            {/* Specialist Panel */}
            {user?.role === 'specialist' && (
              <Link to="/specialist-panel" className={`tour-mobile-panel flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/specialist-panel') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
                <Briefcase size={22} className={isActive('/specialist-panel') ? 'fill-secondary/20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Panel</span>
              </Link>
            )}

            {/* Admin Dashboard */}
            {user?.role === 'admin' && (
              <Link to="/dashboard" className={`tour-mobile-dashboard flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/dashboard') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
                <LayoutDashboard size={22} className={isActive('/dashboard') ? 'fill-secondary/20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Dashboard</span>
              </Link>
            )}
          </div>

          {/* Reserved Spacer for absolute Plus button */}
          <div className="w-16 shrink-0 h-full pointer-events-none"></div>

          {/* Right Side Group */}
          <div className="flex-1 flex justify-around items-center h-full">

            {/* Admin Panel */}
            {user?.role === 'admin' && (
              <Link to="/admin" className={`tour-mobile-admin flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/admin') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
                <Shield size={22} className={isActive('/admin') ? 'fill-secondary/20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Admin</span>
              </Link>
            )}

            {/* Log In (Logged out users) */}
            {!isAuthenticated && (
              <Link to="/login" className="flex flex-col items-center justify-center h-full min-w-[64px] text-gray-500 dark:text-slate-400 hover:text-secondary">
                <LogIn size={22} />
                <span className="text-[10px] mt-1 font-medium">Log In</span>
              </Link>
            )}

            {/* Admin Profile */}
            {isAuthenticated && user?.role === 'admin' && (
              <Link to="/profile" className={`tour-mobile-profile flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/profile') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
                <User size={22} className={isActive('/profile') ? 'fill-secondary/20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Profile</span>
              </Link>
            )}

            {/* Normal Users Dashboard */}
            {isAuthenticated && user?.role !== 'specialist' && user?.role !== 'admin' && (
              <Link to="/dashboard" className={`tour-mobile-dashboard flex flex-col items-center justify-center h-full min-w-[64px] ${isActive('/dashboard') ? 'text-secondary dark:text-blue-400' : 'text-gray-500 dark:text-slate-400 hover:text-secondary'}`}>
                <LayoutDashboard size={22} className={isActive('/dashboard') ? 'fill-secondary/20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Dashboard</span>
              </Link>
            )}

            {/* Note: Specialist intentionally has an empty right side, as Profile was requested to be hidden here. */}
          </div>
        </div>
      </div>
    </>
  );
}
