import React from 'react';
import { Bot, Shield, Sparkles, Terminal, BookOpen, Globe2, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-navy-950 border-t border-slate-800/80 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-500 p-0.5">
                <div className="w-full h-full bg-navy-950 rounded-[7px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
              </div>
              <span className="font-bold text-white text-base">
                AI Interview <span className="gradient-text-cyan-violet">Pro</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Next-generation AI-powered placement and technical interview simulator. Inspired by Berrybot and enterprise evaluation standards to accelerate your career readiness.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Private & Client-Side Evaluated</span>
            </div>
          </div>

          {/* Interview Tracks */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Interview Tracks</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  Campus Placement Mixed
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  Technical Architecture & SDE
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  Data Structures & Algorithmic Coding
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  HR & Behavioral (STAR Method)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  Quantitative & Logical Aptitude
                </button>
              </li>
            </ul>
          </div>

          {/* Platform Features */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-violet-400" />
              <span>Platform Engines</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Web Speech API Voice In & Out</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span>Deterministic NLP Rubric Scoring</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Zero-Cost Free Browser Runtime</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Optional Gemini 1.5 Live API Support</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Downloadable Performance Reports</span>
              </li>
            </ul>
          </div>

          {/* Quick Actions & Settings */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quick Navigation</span>
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-cyan-300 transition-colors">
                  Candidate Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('progress')} className="hover:text-cyan-300 transition-colors">
                  Progress Analytics
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('history')} className="hover:text-cyan-300 transition-colors">
                  Interview History
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('setup')} className="hover:text-cyan-300 transition-colors">
                  Configure Interview Setup
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('results')} className="hover:text-cyan-300 transition-colors">
                  Latest Results & Reports
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('settings')} className="hover:text-cyan-300 transition-colors">
                  Audio & Voice Settings
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} AI Interview Pro. Developed for next-generation placement excellence.</p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Client-side Web Speech AI</span>
            <span>•</span>
            <span>Zero Setup Required</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Built with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for engineers
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
