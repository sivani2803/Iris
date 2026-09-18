import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Watch, Users, HeartHandshake, UserCheck, PlayCircle, Globe, AlertCircle, Sparkles, Pill, Calendar } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { activeEmergency } = useEmergency();
  const { lang, changeLanguage } = useLanguage();

  const navLinks = [
    { to: '/', label: 'Overview', icon: Shield },
    { to: '/simulator', label: 'Watch Simulator', icon: Watch },
    { to: '/family', label: 'Family Dashboard', icon: Users },
    { to: '/caretaker', label: 'Caretaker', icon: HeartHandshake },
    { to: '/senior', label: 'Senior', icon: UserCheck },
    { to: '/ai', label: 'AI Guide', icon: Sparkles },
    { to: '/medicines', label: 'Medicines', icon: Pill },
    { to: '/demo', label: 'Demo Mode', icon: PlayCircle, highlight: true }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
      {/* Active Emergency Alert Ribbon */}
      {activeEmergency && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              🔴 ACTIVE EMERGENCY DETECTED: Senior Savitri Devi (S102) — Risk Level: {activeEmergency.riskLevel} — Responder: {activeEmergency.assignedCaretakerData?.name || 'Dispatching...'} (ETA: {activeEmergency.etaMinutes} min)
            </span>
            <Link
              to="/family"
              className="ml-auto underline text-rose-100 hover:text-white shrink-0 font-bold"
            >
              Open Live Command →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <img src="/iris-logo.svg" alt="IRIS Logo" className="w-9 h-9 group-hover:scale-105 transition-transform" />
              <span className="absolute w-2 h-2 rounded-full bg-teal-500 animate-ping opacity-75"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-charcoal-900 font-sans">IRIS</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  CARE NETWORK
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden sm:block -mt-0.5">
                Care that responds, even when they can't.
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    isActive
                      ? 'bg-stone-100 text-charcoal-950 font-semibold shadow-xs'
                      : link.highlight
                      ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-semibold'
                      : 'text-stone-600 hover:text-charcoal-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${link.highlight ? 'text-teal-700' : ''}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Tools: Language Switcher + Role Selector */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl text-xs font-semibold text-stone-600">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded-lg transition ${lang === 'en' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-stone-900'}`}
                title="English"
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('te')}
                className={`px-2 py-1 rounded-lg transition ${lang === 'te' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-stone-900'}`}
                title="తెలుగు"
              >
                తెలుగు
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded-lg transition ${lang === 'hi' ? 'bg-white text-teal-800 shadow-xs' : 'hover:text-stone-900'}`}
                title="हिन्दी"
              >
                हिन्दी
              </button>
            </div>

            {/* Real Authenticated Session Info & Logout (RBAC Pillar 1) */}
            <div className="flex items-center gap-2 border-l border-stone-200 pl-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col text-right hidden sm:flex">
                    <span className="text-xs font-bold text-charcoal-900 leading-none">{user.name}</span>
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700 tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition text-xs font-semibold"
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 text-xs font-bold transition shadow-xs"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
