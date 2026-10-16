import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  LayoutDashboard, 
  PlayCircle, 
  Award, 
  Settings, 
  Menu, 
  X, 
  Radio, 
  Compass,
  History,
  BarChart3
} from 'lucide-react';
import { useInterview } from '../../context/InterviewContext';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { currentSession } = useInterview();

  const navItems = [
    { id: 'landing', label: 'Explore', icon: Compass },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'history', label: 'History', icon: History },
    { id: 'progress', label: 'Analytics', icon: BarChart3 },
    { id: 'setup', label: 'New Interview', icon: PlayCircle },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  const hasActiveSession = currentSession?.status === 'in_progress';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-navy-950/80 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <button
          onClick={() => handleNavClick('landing')}
          className="flex items-center gap-3 group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-violet-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-400/40 transition-all duration-300">
            <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                AI Interview <span className="gradient-text-cyan-violet">Pro</span>
              </span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                AI BOT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Your Personal Placement Interviewer
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-800/90 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA / Live Room indicator */}
        <div className="hidden md:flex items-center gap-3">
          {hasActiveSession ? (
            <button
              onClick={() => handleNavClick('room')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600/30 hover:bg-violet-600/40 text-violet-200 border border-violet-500/40 shadow-lg shadow-violet-500/20 animate-pulse transition-all"
            >
              <Radio className="w-4 h-4 text-violet-400" />
              <span>Resume Interview Room</span>
            </button>
          ) : (
            <button
              onClick={() => handleNavClick('setup')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 transition-all duration-300 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start Interview</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          {hasActiveSession && (
            <button
              onClick={() => handleNavClick('room')}
              className="p-2 rounded-lg bg-violet-950 text-violet-300 border border-violet-700/50 text-xs font-semibold flex items-center gap-1"
            >
              <Radio className="w-3.5 h-3.5 text-violet-400 animate-ping" />
              <span>Live Room</span>
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-navy-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          <div className="pt-3">
            <button
              onClick={() => handleNavClick('setup')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
            >
              <Sparkles className="w-5 h-5" />
              <span>Start New Interview</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
