import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { Search, ChevronRight, Zap, Bell } from 'lucide-react';
import { Button } from '../ui/Button';
export const Header = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const getBreadcrumbTitle = () => {
        const path = location.pathname;
        if (path.includes('/interview/arena'))
            return 'Interview Arena';
        if (path.includes('/interview/setup'))
            return 'Configure Session';
        if (path.includes('/interview/report'))
            return 'Performance Report';
        if (path.includes('/coach'))
            return 'AI Coach';
        if (path.includes('/analytics/dna'))
            return 'Interview DNA';
        if (path.includes('/analytics/skill-tree'))
            return 'Skill Tree';
        if (path.includes('/history'))
            return 'Session History';
        if (path.includes('/learning'))
            return 'Learning Centre';
        if (path.includes('/achievements'))
            return 'Achievements';
        if (path.includes('/settings'))
            return 'Account Settings';
        return 'Overview';
    };
    return (<header className="fixed top-0 left-72 right-0 h-16 bg-[#ffffff]/90 backdrop-blur-md border-b border-[#c6c7c0] z-40 flex items-center justify-between px-8 select-none">
      {/* Left: Breadcrumbs & Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 text-xs text-[#454742]">
          <span className="font-semibold text-[#1b1c17]">PrepPulse</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#767871]"/>
          <span className="text-[#767871]">{getBreadcrumbTitle()}</span>
        </div>

        <div className="relative flex items-center w-72">
          <Search className="w-4 h-4 absolute left-3 text-[#767871] pointer-events-none"/>
          <input className="w-full pl-9 pr-12 py-1.5 bg-[#f6f4eb] border border-[#c6c7c0] rounded-lg text-xs text-[#1b1c17] placeholder:text-[#767871] focus:outline-none focus:border-[#1b1c17] focus:ring-1 focus:ring-[#c6f26a]" placeholder="Search topics, competencies..." type="text"/>
          <span className="absolute right-2 font-mono text-[10px] text-[#454742] bg-[#e4e3da] px-1.5 py-0.5 rounded border border-[#c6c7c0]">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right: Streak & Actions */}
      <div className="flex items-center gap-4">
        {/* Streak Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1 border border-[#4b6700] bg-[#ffffff] rounded-full shadow-xs">
          <span className="text-sm leading-none">🔥</span>
          <span className="font-mono text-xs text-[#4b6700] font-semibold tracking-tight uppercase">
            Active Streak
          </span>
        </div>

        {/* Quick Start Button */}
        <Button variant="primary" size="sm" onClick={() => navigate('/interview/setup')}>
          <Zap className="w-4 h-4 fill-current"/>
          <span>Quick Start</span>
        </Button>

        {/* Notifications */}
        <button aria-label="Notifications" className="relative p-2 text-[#454742] hover:text-[#1b1c17] rounded-lg hover:bg-[#f0eee5] transition-colors cursor-pointer">
          <Bell className="w-4 h-4"/>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] ring-2 ring-[#ffffff]"></span>
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1b1c17] text-[#c6f26a] flex items-center justify-center font-bold text-xs ring-1 ring-[#c6c7c0]">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'PP'}
        </div>
      </div>
    </header>);
};
