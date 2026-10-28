import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import {
  Search,
  ChevronRight,
  Zap,
  Bell,
  User,
  Settings,
  Award,
  LogOut,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Button } from '../ui/Button';

export const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getBreadcrumbTitle = () => {
    const path = location.pathname;
    if (path.includes('/interview/arena')) return 'Interview Arena';
    if (path.includes('/interview/setup')) return 'Configure Session';
    if (path.includes('/interview/report') || path.includes('/report')) return 'Performance Report';
    if (path.includes('/coach')) return 'AI Coach';
    if (path.includes('/analytics/dna') || path.includes('/dna')) return 'Interview DNA';
    if (path.includes('/analytics/skill-tree') || path.includes('/skill-tree')) return 'Skill Tree';
    if (path.includes('/history')) return 'Session History';
    if (path.includes('/learning')) return 'Learning Centre';
    if (path.includes('/achievements')) return 'Achievements';
    if (path.includes('/settings') || path.includes('/profile')) return 'Account Settings';
    return 'Overview';
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'PP';

  return (
    <header className="fixed top-0 left-72 right-0 h-16 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#c6c7c0] z-40 flex items-center justify-between px-8 select-none">
      {/* Left: Breadcrumbs & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-xs text-[#454742]">
          <span className="font-semibold text-[#1b1c17]">PrepPulse</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#767871]" />
          <span className="text-[#767871]">{getBreadcrumbTitle()}</span>
        </div>

        <div className="relative flex items-center w-72">
          <Search className="w-4 h-4 absolute left-3 text-[#767871] pointer-events-none" />
          <input
            className="w-full pl-9 pr-12 py-1.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs text-[#1b1c17] placeholder:text-[#767871] focus:outline-none focus:border-[#1b1c17] focus:ring-1 focus:ring-[#c6f26a]"
            placeholder="Search topics, competencies..."
            type="text"
          />
          <span className="absolute right-2 font-mono text-[10px] text-[#454742] bg-[#e4e3da] px-1.5 py-0.5 rounded border border-[#c6c7c0]">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Streak & Actions */}
      <div className="flex items-center gap-4">
        {/* Streak Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 border border-[#4b6700] bg-[#ffffff] rounded-full shadow-xs">
          <span className="text-sm leading-none">🔥</span>
          <span className="font-mono text-xs text-[#4b6700] font-semibold tracking-tight uppercase">
            Active Streak
          </span>
        </div>

        {/* Quick Start Button */}
        <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup')}>
          <Zap className="w-4 h-4 fill-current" />
          <span>Quick Start</span>
        </Button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-[#454742] hover:text-[#1b1c17] rounded-lg hover:bg-[#f0eee5] transition-colors cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#ffffff]"></span>
        </button>

        {/* User Profile Menu with Functional Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="User Profile Menu"
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-[#c6f26a] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1b1c17]"
          >
            <div className="w-8 h-8 rounded-full bg-[#1b1c17] text-[#c6f26a] flex items-center justify-center font-bold text-xs ring-1 ring-[#c6c7c0] shadow-xs">
              {initials}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#767871] transition-transform duration-200 ${
                dropdownOpen ? 'rotate-180 text-[#1b1c17]' : ''
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-64 bg-[#ffffff] border border-[#c6c7c0] rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
            >
              {/* User Identity Header */}
              <div className="px-4 py-3 border-b border-[#e4e3da] bg-[#fbf9f0]/60">
                <p className="text-xs font-bold text-[#1b1c17] truncate">
                  {user?.name || 'PrepPulse Candidate'}
                </p>
                <p className="text-[11px] font-mono text-[#767871] truncate mt-0.5">
                  {user?.email || 'candidate@preppulse.com'}
                </p>
                {user?.profile?.target_role && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f0eee5] text-[#4b6700] rounded text-[10px] font-mono font-medium border border-[#c6c7c0]">
                    <ShieldCheck className="w-3 h-3 text-[#4b6700]" />
                    <span className="truncate max-w-[180px]">{user.profile.target_role}</span>
                  </div>
                )}
              </div>

              {/* Menu Actions */}
              <div className="py-1">
                <button
                  role="menuitem"
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#1b1c17] hover:bg-[#f6f4eb] transition-colors text-left cursor-pointer"
                >
                  <User className="w-4 h-4 text-[#767871]" />
                  <span>Profile</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => handleNavigate('/settings')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#1b1c17] hover:bg-[#f6f4eb] transition-colors text-left cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#767871]" />
                  <span>Settings</span>
                </button>

                <button
                  role="menuitem"
                  onClick={() => handleNavigate('/achievements')}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#1b1c17] hover:bg-[#f6f4eb] transition-colors text-left cursor-pointer"
                >
                  <Award className="w-4 h-4 text-[#767871]" />
                  <span>Achievements</span>
                </button>
              </div>

              {/* Logout Divider & Action */}
              <div className="pt-1 border-t border-[#e4e3da]">
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-[#ba1a1a]" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
