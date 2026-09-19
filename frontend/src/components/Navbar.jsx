import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Shield,
  Watch,
  Users,
  HeartHandshake,
  UserCheck,
  PlayCircle,
  AlertCircle,
  Sparkles,
  Pill,
  Stethoscope,
  Send,
  Globe,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const { user, role, logout, sendVerificationEmail } = useAuth();
  const { activeEmergency } = useEmergency();
  const { currentLanguageInfo, t, isLangModalOpen, openLanguageModal } = useLanguage();

  const [resendStatus, setResendStatus] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    if (!isMobileNavOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileNavOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendStatus(null);
    try {
      const res = await sendVerificationEmail();
      setResendStatus({ success: true, message: res.message || 'Verification email sent!' });
    } catch (err) {
      setResendStatus({
        success: false,
        message: err.response?.data?.message || 'Failed to send verification email.'
      });
    } finally {
      setResendLoading(false);
      setTimeout(() => setResendStatus(null), 4000);
    }
  };

  const navLinks = [
    { to: '/', label: t('overview') || 'Overview', icon: Shield },
    { to: '/simulator', label: t('simulator') || 'Watch Simulator', icon: Watch },
    { to: '/family', label: t('familyDashboard') || 'Family Dashboard', icon: Users },
    { to: '/caretaker', label: t('caretakerDashboard') || 'Caretaker', icon: HeartHandshake },
    { to: '/senior', label: t('seniorDashboard') || 'Senior', icon: UserCheck }
  ];

  if (role === 'healthcare_provider' || role === 'admin') {
    navLinks.push({ to: '/provider', label: t('providerDashboard') || 'Provider', icon: Stethoscope });
  }

  if (role === 'admin') {
    navLinks.push({ to: '/admin', label: t('adminConsole') || 'Admin Console', icon: Shield, highlight: true });
  } else {
    navLinks.push(
      { to: '/ai', label: t('aiGuide') || 'AI Guide', icon: Sparkles },
      { to: '/medicines', label: t('medicines') || 'Medicines', icon: Pill },
      { to: '/demo', label: t('demoMode') || 'Demo Mode', icon: PlayCircle, highlight: true }
    );
  }

  const renderNavLink = (link, { onNavigate, isMobile = false } = {}) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.to;
    return (
      <Link
        key={link.to}
        to={link.to}
        onClick={onNavigate}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition min-w-0 leading-normal break-words [overflow-wrap:anywhere] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
          isMobile ? 'text-sm py-2.5 px-3.5' : ''
        } ${
          isActive
            ? 'bg-stone-100 text-charcoal-950 font-semibold shadow-2xs'
            : link.highlight
            ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-semibold'
            : 'text-stone-600 hover:text-charcoal-900 hover:bg-stone-50'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${link.highlight ? 'text-teal-700' : ''}`} />
        <span className="break-words [overflow-wrap:anywhere]">{link.label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {activeEmergency && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="min-w-0 break-words">
              🔴 {t('activeEmergency') || 'ACTIVE EMERGENCY'}: Senior {activeEmergency.seniorName || activeEmergency.seniorId || 'Recipient'} — Risk Level: {activeEmergency.riskLevel} — Responder: {activeEmergency.assignedCaretakerData?.name || 'Dispatching...'} (ETA: {activeEmergency.etaMinutes} min)
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

      {user && user.emailVerified === false && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
            <span className="min-w-0 break-words">
              Email verification required for {user.email}. Please verify your email for full emergency alerting.
            </span>
            {resendStatus && (
              <span className={`ml-2 font-bold ${resendStatus.success ? 'text-emerald-700' : 'text-rose-700'}`}>
                {resendStatus.message}
              </span>
            )}
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="ml-auto underline hover:text-amber-950 font-bold flex items-center gap-1 shrink-0 disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
              {resendLoading ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 min-h-16 py-2">
          <Link to="/" className="flex items-center gap-3 group min-w-0 shrink-0">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/iris-logo.svg" alt="IRIS Logo" className="w-9 h-9 group-hover:scale-105 transition-transform" />
              <span className="absolute w-2 h-2 rounded-full bg-teal-500 animate-ping opacity-75"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xl font-bold tracking-tight text-charcoal-900 font-sans">IRIS</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                  CARE NETWORK
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden lg:block -mt-0.5 max-w-[16rem] break-words">
                {t('irisTagline') || "Care that responds, even when they can't."}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            aria-label="Main Navigation"
            className="hidden md:flex items-center gap-1 flex-wrap justify-center min-w-0 flex-1 px-2"
          >
            {navLinks.map((link) => renderNavLink(link))}
          </nav>

          {/* Action Triggers: Language Switcher & Authentication */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 justify-end shrink-0">
            <button
              type="button"
              onClick={openLanguageModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:border-teal-400 bg-stone-50/70 hover:bg-white text-xs font-semibold text-charcoal-900 transition shadow-2xs group cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              title="Change Language (32 Languages Available)"
              aria-label="Change Language"
              aria-haspopup="dialog"
              aria-expanded={isLangModalOpen}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 group-hover:rotate-12 transition-transform shrink-0" />
              <span className="font-bold leading-normal text-left">
                {currentLanguageInfo?.nativeName || 'English'}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2 border-l border-stone-200 pl-2 sm:pl-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="flex-col text-right hidden sm:flex min-w-0">
                    <span className="text-xs font-bold text-charcoal-900 leading-none truncate max-w-[12rem]">{user.name}</span>
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700 tracking-wider">
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="p-2 rounded-xl text-stone-500 hover:text-rose-600 hover:bg-rose-50 transition text-xs font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    title={t('signOut') || 'Sign Out'}
                  >
                    {t('signOut') || 'Logout'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 rounded-xl bg-teal-700 text-white hover:bg-teal-800 text-xs font-bold transition shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {t('signIn') || 'Sign In'}
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition hidden sm:inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  >
                    {t('register') || 'Register'}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              className="md:hidden p-2 rounded-xl border border-stone-200 text-charcoal-800 hover:bg-stone-50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 cursor-pointer"
              aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileNavOpen}
              aria-controls="iris-mobile-nav"
              onClick={() => setIsMobileNavOpen((open) => !open)}
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Mobile Drawer */}
      {isMobileNavOpen && (
        <nav
          id="iris-mobile-nav"
          aria-label="Mobile Navigation"
          className="md:hidden border-t border-stone-200 bg-white/98 backdrop-blur-md shadow-lg animate-in slide-in-from-top duration-200"
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1.5">
            {navLinks.map((link) =>
              renderNavLink(link, { onNavigate: () => setIsMobileNavOpen(false), isMobile: true })
            )}

            {/* Mobile Drawer Auth Actions */}
            <div className="border-t border-stone-100 pt-3 mt-2 flex flex-col gap-2">
              {user ? (
                <div className="flex items-center justify-between p-2 rounded-xl bg-stone-50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-charcoal-900">{user.name}</span>
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-700">{user.role}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      logout();
                    }}
                    className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                  >
                    {t('signOut') || 'Sign Out'}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex-1 py-2 text-center rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
                  >
                    {t('signIn') || 'Sign In'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="flex-1 py-2 text-center rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
                  >
                    {t('register') || 'Register'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
