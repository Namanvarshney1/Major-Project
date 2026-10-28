import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { LayoutDashboard, PlayCircle, Brain, Fingerprint, GitFork, History, BookOpen, Award, Settings, LogOut } from 'lucide-react';
export const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    const navLinkClasses = ({ isActive }) => `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
        ? 'bg-[#1a1c18] text-[#ffffff] font-semibold'
        : 'text-[#454742] hover:bg-[#eae8df] hover:text-[#1b1c17]'}`;
    return (<aside className="fixed left-0 top-0 h-screen w-72 bg-[#ffffff] border-r border-[#c6c7c0] z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#c6c7c0]">
          <img alt="PrepPulse Logo" className="h-8 w-8 object-contain rounded-md" src="/logo.svg"/>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold text-[#1b1c17] tracking-tight leading-none">
              PrepPulse
            </span>
            <span className="font-mono text-[10px] text-[#767871] font-semibold tracking-wider uppercase mt-1">
              Precision Suite
            </span>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="px-4 py-6 flex flex-col gap-6">
          {/* Intelligence Core */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 font-mono text-[11px] text-[#767871] uppercase tracking-wider font-semibold">
              Intelligence Core
            </span>
            <nav className="flex flex-col gap-1">
              <NavLink to="/dashboard" className={navLinkClasses}>
                <LayoutDashboard className="w-4 h-4"/>
                <span>Overview</span>
              </NavLink>
              <NavLink to="/interview/setup" className={navLinkClasses}>
                <PlayCircle className="w-4 h-4 text-[#4b6700]"/>
                <span>Start Interview</span>
              </NavLink>
              <NavLink to="/coach" className={navLinkClasses}>
                <Brain className="w-4 h-4"/>
                <span>AI Coach</span>
              </NavLink>
              <NavLink to="/analytics/dna" className={navLinkClasses}>
                <Fingerprint className="w-4 h-4"/>
                <span>Interview DNA</span>
              </NavLink>
              <NavLink to="/analytics/skill-tree" className={navLinkClasses}>
                <GitFork className="w-4 h-4"/>
                <span>Skill Tree</span>
              </NavLink>
            </nav>
          </div>

          {/* Performance Logs */}
          <div className="flex flex-col gap-1.5">
            <span className="px-3 font-mono text-[11px] text-[#767871] uppercase tracking-wider font-semibold">
              Performance Logs
            </span>
            <nav className="flex flex-col gap-1">
              <NavLink to="/history" className={navLinkClasses}>
                <History className="w-4 h-4"/>
                <span>History</span>
              </NavLink>
              <NavLink to="/learning" className={navLinkClasses}>
                <BookOpen className="w-4 h-4"/>
                <span>Learning Centre</span>
              </NavLink>
              <NavLink to="/achievements" className={navLinkClasses}>
                <Award className="w-4 h-4"/>
                <span>Achievements</span>
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Profile Bar */}
      <div className="p-4 border-t border-[#c6c7c0] bg-[#f6f4eb] flex flex-col gap-2">
        <NavLink to="/settings" className={navLinkClasses}>
          <Settings className="w-4 h-4"/>
          <span>Settings</span>
        </NavLink>

        <div className="flex items-center justify-between px-2 py-1 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#1b1c17] text-[#c6f26a] flex items-center justify-center font-bold text-xs ring-1 ring-[#c6c7c0] shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PP'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#1b1c17] truncate leading-tight">
                {user?.name || 'Candidate'}
              </span>
              <span className="text-[10px] text-[#767871] truncate">
                {user?.profile?.target_level || 'Senior IC'}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} title="Log Out" className="p-1.5 text-[#767871] hover:text-[#ba1a1a] rounded hover:bg-[#ffdad6]/40 transition-colors cursor-pointer">
            <LogOut className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </aside>);
};
