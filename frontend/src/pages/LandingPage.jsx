import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Watch,
  Users,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Activity,
  Heart,
  Sparkles,
  Stethoscope,
  Pill,
  Calendar,
  Bot,
  Mic,
  Lock,
  ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const { user, token, onboardingCompleted } = useAuth();
  const navigate = useNavigate();

  // If the user is already authenticated and profile-complete, auto-redirect to their role dashboard
  useEffect(() => {
    if (user && token && onboardingCompleted) {
      const role = (user.role || '').toLowerCase();
      if (role === 'senior') {
        navigate('/senior', { replace: true });
      } else if (role === 'caretaker' || role === 'caregiver') {
        navigate('/caretaker', { replace: true });
      } else if (role === 'healthcare_provider' || role === 'provider') {
        navigate('/provider', { replace: true });
      } else if (role === 'admin' || role === 'super_admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/family', { replace: true });
      }
    }
  }, [user, token, onboardingCompleted, navigate]);

  const highlights = [
    {
      icon: Activity,
      title: 'Emergency Response',
      desc: 'Sub-second fall detection and autonomous emergency escalation.'
    },
    {
      icon: HeartHandshake,
      title: 'Caregiver Coordination',
      desc: 'Proximity-matched responder routing with live status tracking.'
    },
    {
      icon: Users,
      title: 'Family Connection',
      desc: 'Real-time telemetry, immutable incident timeline, and daily check-ins.'
    },
    {
      icon: Pill,
      title: 'Medication Support',
      desc: 'Timely reminders and autonomous adherence tracking.'
    },
    {
      icon: Calendar,
      title: 'Appointments',
      desc: 'Seamless healthcare appointments and assisted medical transport.'
    },
    {
      icon: Bot,
      title: 'AI Assistance',
      desc: 'Clinical AI anomaly detection and personalized health guidance.'
    },
    {
      icon: Mic,
      title: 'Voice Interaction',
      desc: 'Natural multilingual voice interaction in English, Telugu, and Hindi.'
    },
    {
      icon: Watch,
      title: 'Connected Devices',
      desc: 'Wear OS continuous heart-rate and sensor telemetry integration.'
    },
    {
      icon: Lock,
      title: 'Secure Care Network',
      desc: 'HIPAA & DISHA compliant cryptographic role-based access control.'
    }
  ];

  const loopPhases = [
    {
      step: 'DETECT',
      desc: 'Wearable sensors detect fall impact & vital anomaly in real-time',
      tag: 'Phase 01'
    },
    {
      step: 'DECIDE',
      desc: 'Clinical AI classifies triage severity and determines urgent protocol',
      tag: 'Phase 02'
    },
    {
      step: 'DISPATCH',
      desc: 'Proximity engine alerts nearest caregiver and triggers 108 EMS',
      tag: 'Phase 03'
    },
    {
      step: 'TRACK',
      desc: 'Live responder GPS, ETA timeline, and fail-safe reassessment',
      tag: 'Phase 04'
    },
    {
      step: 'RESOLVE',
      desc: 'On-scene stabilization, caregiver sign-off, and family assurance',
      tag: 'Phase 05'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle Iris Rings Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-teal-500/10 pointer-events-none -z-10 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-teal-500/15 pointer-events-none -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-teal-50/40 pointer-events-none -z-10 blur-xl"></div>

        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-teal-800 border border-teal-200 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
            IRIS — Intelligent Response & Integrated Senior-care Network
          </div>

          {/* Headline & Tagline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-charcoal-950 tracking-tight leading-[1.15]">
            Care that responds, <br />
            <span className="text-teal-700">even when they can't.</span>
          </h1>

          {/* Product Description */}
          <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
            IRIS connects seniors, family members, caregivers, and healthcare providers through an intelligent care network — coordinating rapid emergency dispatch, continuous vital health monitoring, and complete peace of mind.
          </p>

          {/* Primary & Secondary Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md shadow-teal-700/20 transition flex items-center gap-2"
            >
              GET STARTED
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 text-charcoal-900 border border-stone-300 font-semibold text-sm shadow-xs transition"
            >
              SIGN IN
            </Link>
          </div>

          {/* Quick Demo Utilities */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              to="/demo"
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-stone-200 text-xs font-medium shadow-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              2-Minute Interactive Demo
            </Link>
            <Link
              to="/simulator"
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 text-xs font-medium shadow-xs transition flex items-center gap-1.5"
            >
              <Watch className="w-3.5 h-3.5 text-teal-600" />
              Watch Hardware Simulator
            </Link>
          </div>
        </div>

        {/* Closed-Loop Safety Paradigm: DETECT -> DECIDE -> DISPATCH -> TRACK -> RESOLVE */}
        <div className="mt-20 max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Autonomous Closed-Loop Lifecycle
            </span>
            <h2 className="text-2xl font-bold text-charcoal-900 mt-2">
              The IRIS Safety Paradigm
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl mx-auto">
              From the instant an anomaly occurs to full clinical resolution, IRIS coordinates every step without relying on manual phone calls.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
            {loopPhases.map((phase, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-surface-warm border border-stone-200/80 flex flex-col justify-between hover:border-teal-300 transition duration-200"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      {phase.tag}
                    </span>
                    {idx < loopPhases.length - 1 && (
                      <span className="hidden sm:inline text-stone-300 font-bold">→</span>
                    )}
                  </div>
                  <div className="text-base font-extrabold text-charcoal-900 mt-2 tracking-tight">
                    {phase.step}
                  </div>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                    {phase.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Product Highlights Grid */}
        <div className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-charcoal-900">
              Complete Intelligent Care Network
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Purpose-built capabilities designed for the safety and dignity of older adults.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs hover:border-stone-300 transition duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 mb-3">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-charcoal-900">{item.title}</h3>
                  <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Connected Personas Section */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3.5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Senior Citizen</h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Simplified high-contrast interface, large buttons, spoken voice assistant, and 1-tap emergency support.
              </p>
            </div>
            <Link to="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800">
              Join as Senior <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3.5">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Family Member</h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Live vital telemetry, verified senior connectivity, incident timeline, and peace-of-mind alerts.
              </p>
            </div>
            <Link to="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800">
              Join as Family <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3.5">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Caregiver</h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Emergency dispatch portal with proximity routing, one-tap accept/decline, and patient dossiers.
              </p>
            </div>
            <Link to="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800">
              Join as Caregiver <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3.5">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-charcoal-900">Healthcare Provider</h3>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                Clinical oversight dashboard, vital anomaly triage reports, and authorized medical data access.
              </p>
            </div>
            <Link to="/register" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800">
              Join as Provider <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

