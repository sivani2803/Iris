import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { IMAGES } from '../assets/images';
import {
  Shield,
  ShieldAlert,
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
  Globe,
  Radio,
  Clock,
  ShieldCheck,
  Check,
  PhoneCall,
  Car,
  ChevronRight,
  Compass,
  Smile
} from 'lucide-react';

export default function LandingPage() {
  const { user, token, onboardingCompleted } = useAuth();
  const { t, currentLanguageInfo, isLangModalOpen, openLanguageModal } = useLanguage();
  const navigate = useNavigate();

  // Auto-redirect authenticated & onboarded users to their role-specific dashboard
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

  const loopPhases = [
    {
      step: t('detect') || 'DETECT',
      desc: 'Sub-second fall detection and continuous vital telemetry anomalies.',
      tag: '01',
      badge: 'Sub-Second'
    },
    {
      step: t('decide') || 'DECIDE',
      desc: 'Autonomous clinical AI triage classifies severity without manual delay.',
      tag: '02',
      badge: 'Clinical AI'
    },
    {
      step: t('dispatch') || 'DISPATCH',
      desc: 'Proximity matching engine alerts the nearest verified caregiver and 108 EMS.',
      tag: '03',
      badge: 'Proximity GPS'
    },
    {
      step: t('track') || 'TRACK',
      desc: 'Real-time responder telemetry, arrival ETA timeline, and fail-safe escalation.',
      tag: '04',
      badge: 'Live GPS'
    },
    {
      step: t('resolve') || 'RESOLVE',
      desc: 'On-scene stabilization, caregiver sign-off, and immutable family audit record.',
      tag: '05',
      badge: 'Debriefed'
    }
  ];

  const everydayCapabilities = [
    {
      icon: Pill,
      title: t('medicines') || 'Medication Coordination',
      desc: 'Timely spoken reminders in native language, autonomous adherence verification, and proactive family notifications.'
    },
    {
      icon: Calendar,
      title: t('appointments') || 'Medical Appointments & Transit',
      desc: 'Assisted door-to-door transit bookings, doctor schedule synchronization, and verified companion routing.'
    },
    {
      icon: Mic,
      title: t('voiceInteraction') || '32-Language Voice Guidance',
      desc: 'Effortless conversational support across 22 Indian regional languages and 10 global languages — no typing required.'
    },
    {
      icon: Bot,
      title: t('aiAssistance') || 'Clinical AI Health Synthesis',
      desc: 'Longitudinal vitals analysis that detects subtle physiological shifts before they develop into acute emergencies.'
    },
    {
      icon: Users,
      title: t('familyConnection') || 'Unified Family Care Circle',
      desc: 'Shared peace of mind with transparent check-in status, daily activity confirmation, and instant secure calling.'
    }
  ];

  return (
    <div className="relative overflow-x-hidden bg-[#fafaf8] text-charcoal-900 selection:bg-teal-100 selection:text-teal-900">
      
      {/* ========================================================================= */}
      {/* 1. HERO SECTION & EDITORIAL CENTERPIECE                                  */}
      {/* ========================================================================= */}
      <section className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle Ambient IRIS Brand Gradient Accents */}
        <div 
          aria-hidden="true" 
          className="absolute top-10 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-teal-100/40 via-iris-50/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
        />

        <div className="text-center max-w-3xl mx-auto">
          {/* Subtle Platform Status & Multilingual Selector Trigger */}
          <div className="inline-flex max-w-full flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 rounded-2xl sm:rounded-full text-xs font-semibold bg-white text-teal-950 border border-teal-200/80 shadow-2xs mb-6 backdrop-blur-sm">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
            </span>
            <span className="truncate">IRIS Intelligent Eldercare Network</span>
            <button
              id="hero-language-switcher-btn"
              type="button"
              onClick={openLanguageModal}
              className="sm:ml-2 sm:pl-2.5 sm:border-l sm:border-stone-200 text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1.5 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg shrink-0 whitespace-nowrap"
              aria-label="Change interface language"
              aria-haspopup="dialog"
              aria-expanded={isLangModalOpen}
            >
              <Globe className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{currentLanguageInfo?.nativeName || 'English'}</span>
              <span className="text-[10px] text-stone-400 font-normal">({currentLanguageInfo?.code?.toUpperCase() || 'EN'})</span>
            </button>
          </div>

          {/* Headline with Refined Typography */}
          <h1 className="text-4xl sm:text-6xl lg:text-[4.1rem] font-extrabold text-charcoal-950 tracking-tight leading-[1.10]">
            {t('irisTagline') ? (
              t('irisTagline')
            ) : (
              <>
                Care that responds, <br />
                <span className="text-teal-700 font-serif italic font-normal">even when they can't.</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="mt-5 text-base sm:text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto font-normal">
            {t('heroSubtitle') ||
              'IRIS seamlessly unites older adults, loving families, verified caregivers, and clinical providers into a human-centered safety network — coordinating immediate emergency dispatch, continuous vital monitoring, and everyday dignity.'}
          </p>

          {/* Primary Action Triggers */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              id="hero-cta-register"
              to="/register"
              className="px-8 py-3.5 rounded-2xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white font-bold text-sm shadow-md shadow-teal-700/20 hover:shadow-teal-700/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              {t('getStarted') || 'GET STARTED'}
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              id="hero-cta-signin"
              to="/login"
              className="px-8 py-3.5 rounded-2xl bg-white hover:bg-stone-50 active:bg-stone-100 text-charcoal-900 border border-stone-300 font-semibold text-sm shadow-2xs transition cursor-pointer"
            >
              {t('signIn') || 'SIGN IN'}
            </Link>
          </div>

          {/* Quick Interactive Exploration Links */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs">
            <Link
              id="hero-link-demo"
              to="/demo"
              className="px-4 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-stone-100 font-medium shadow-2xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>{t('interactiveDemo') || '2-Minute Interactive Demo'}</span>
            </Link>
            <Link
              id="hero-link-simulator"
              to="/simulator"
              className="px-4 py-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-medium shadow-2xs transition flex items-center gap-1.5"
            >
              <Watch className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('hardwareSimulator') || 'Watch Hardware Simulator'}</span>
            </Link>
          </div>
        </div>

        {/* HERO EDITORIAL COMPOSITION WITH RESTRAINED IRIS MOTIFS */}
        <div className="mt-14 max-w-5xl mx-auto relative">
          
          {/* Concentric IRIS Rings Motif (Subtle Background Geometry) */}
          <div aria-hidden="true" className="absolute -top-12 -left-12 -right-12 -bottom-12 pointer-events-none flex items-center justify-center -z-10">
            <div className="w-[620px] h-[620px] rounded-full border border-teal-600/10 animate-pulse-slow"></div>
            <div className="absolute w-[800px] h-[800px] rounded-full border border-stone-300/40"></div>
            <div className="absolute w-[980px] h-[980px] rounded-full border border-teal-600/5"></div>
          </div>

          {/* Network Care Pathway Nodes (Restrained Hairline SVG) */}
          <div aria-hidden="true" className="hidden lg:block absolute -top-8 right-6 z-20">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-200/80 shadow-sm text-[11px] font-mono font-medium text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>IRIS Autonomous Loop: Operational</span>
              <span className="text-stone-300">•</span>
              <span className="text-teal-700 font-semibold">&lt;1s Latency</span>
            </div>
          </div>

          {/* Editorial Frame with Warm Natural Lighting */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-stone-200/90 bg-stone-100 group">
            <img
              src={IMAGES.heroCaregiverSenior.src}
              alt={IMAGES.heroCaregiverSenior.alt}
              width={IMAGES.heroCaregiverSenior.width}
              height={IMAGES.heroCaregiverSenior.height}
              className="w-full h-auto object-cover max-h-[560px] transform group-hover:scale-[1.01] transition-transform duration-700"
              loading="eager"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/75 via-charcoal-950/15 to-transparent pointer-events-none" />

            {/* Reassuring In-Scene Badge */}
            <div className="absolute bottom-6 left-6 right-6 sm:right-auto bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/50 shadow-xl max-w-md">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-charcoal-950 uppercase tracking-wider">
                      Dignity & Human Connection
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1 leading-snug">
                    "Someone is there when they need care." Autonomous coordination paired with genuine human presence at home.
                  </p>
                </div>
              </div>
            </div>

            {/* Subtle Floating Caregiver ETA Badge (Top Left Corner of Photo) */}
            <div className="absolute top-5 left-5 bg-charcoal-950/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span className="text-[11px] font-medium tracking-wide">Continuous Care Network Active</span>
            </div>
          </div>
        </div>
      </section>


      {/* ========================================================================= */}
      {/* 2. SECONDARY IMAGE STORY: CARE GOES BEYOND EMERGENCIES                    */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/60">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Narrative Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <HeartHandshake className="w-3.5 h-3.5 text-teal-700" />
              <span>FAMILY CARE NETWORK</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-950 tracking-tight leading-tight">
              Care goes beyond emergencies.
            </h2>
            
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              True peace of mind is not just about crisis alarms. It lives in the quiet reassurance of knowing your parents are well, active, and supported through life’s everyday moments — even from miles away.
            </p>

            {/* Asymmetric Editorial Points */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal-950">Daily Wellness Confirmations</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Gentle morning check-ins and medication confirmations update the family timeline automatically.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal-950">Independent Living Without Intrusiveness</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    Zero intrusive cameras. Passive wearable telemetry preserves senior dignity and personal privacy.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100/60 text-teal-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-charcoal-950">Transparent Dispatch Assurance</h4>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    If an anomaly is detected, family members track responder arrival in real-time on their phones.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/family"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 group"
              >
                <span>Explore Family Caregiver View</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Large Image Column (7 Cols) */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100">
              <img
                src={IMAGES.familyCareRemote.src}
                alt={IMAGES.familyCareRemote.alt}
                width={IMAGES.familyCareRemote.width}
                height={IMAGES.familyCareRemote.height}
                className="w-full h-auto object-cover max-h-[460px]"
                loading="lazy"
              />
              
              {/* Contextual Reassurance Badge */}
              <div className="absolute bottom-5 left-5 right-5 sm:right-auto bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200/80 shadow-lg max-w-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                    <Smile className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-charcoal-950">Dad is Resting Comfortably</div>
                    <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                      <span>Hydrated • Morning Walk Done</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-emerald-700 font-semibold">Vitals Normal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 3. EMERGENCY CLOSED-LOOP: DETECT -> DECIDE -> DISPATCH -> TRACK -> RESOLVE */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white rounded-3xl border border-stone-200 shadow-xs my-8">
        
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            {t('autonomousLoop') || 'Autonomous Closed-Loop Lifecycle'}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-950 mt-3 tracking-tight">
            {t('safetyParadigm') || 'The IRIS Safety Paradigm'}
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            "IRIS does not just detect a problem. It coordinates the human response."
            From the instant an anomaly occurs to full on-scene resolution, the protocol executes autonomously.
          </p>
        </div>

        {/* 5-Phase Sequence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative mb-14">
          {loopPhases.map((phase, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-stone-50/70 border border-stone-200 hover:border-teal-300 hover:bg-white hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    PHASE {phase.tag}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-400 uppercase">{phase.badge}</span>
                </div>
                <div className="text-base font-extrabold text-charcoal-900 mt-3 tracking-tight">
                  {phase.step}
                </div>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  {phase.desc}
                </p>
              </div>
              {idx < loopPhases.length - 1 && (
                <div className="hidden sm:block text-right pt-3 text-stone-300 font-bold">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Coordinated Human Response Editorial Focus (Caregiver Arriving to Assist) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8 border-t border-stone-100">
          
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-stone-200 shadow-md">
            <img
              src={IMAGES.caregiverArrivingAssist.src}
              alt={IMAGES.caregiverArrivingAssist.alt}
              width={IMAGES.caregiverArrivingAssist.width}
              height={IMAGES.caregiverArrivingAssist.height}
              className="w-full h-auto object-cover max-h-[420px]"
              loading="lazy"
            />
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>RAPID ON-SCENE PROTOCOL</span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-charcoal-950 tracking-tight">
              A gentle, professional presence when seconds matter.
            </h3>
            
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              When a fall or vital anomaly is verified, the closest qualified responder arrives equipped with the senior’s chronic medical history, emergency contacts, and home access notes — eliminating panicked phone delays.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-400">Average Responder ETA</div>
                <div className="text-lg font-bold text-charcoal-950 mt-0.5 font-mono">4–6 Minutes</div>
                <div className="text-[11px] text-teal-700 font-medium">Proximity Matched</div>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="text-[10px] uppercase font-bold text-stone-400">Emergency Protocol</div>
                <div className="text-lg font-bold text-charcoal-950 mt-0.5 font-mono">108 EMS Sync</div>
                <div className="text-[11px] text-teal-700 font-medium">Auto-Dispatched</div>
              </div>
            </div>
          </div>

        </div>

      </section>


      {/* ========================================================================= */}
      {/* 4. HEALTH & WEARABLE TELEMETRY SECTION                                    */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Large Photo with Concept UI Badges (7 Cols) */}
          <div className="lg:col-span-7 relative">
            <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100">
              <img
                src={IMAGES.seniorSmartwatchCare.src}
                alt={IMAGES.seniorSmartwatchCare.alt}
                width={IMAGES.seniorSmartwatchCare.width}
                height={IMAGES.seniorSmartwatchCare.height}
                className="w-full h-auto object-cover max-h-[460px]"
                loading="lazy"
              />

              {/* Restrained Telemetry Badges (Product & Concept Overlays) */}
              <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 text-rose-600 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">Continuous Heart Rate</div>
                  <div className="text-sm font-bold text-charcoal-950 font-mono">72 BPM <span className="text-[11px] font-normal text-emerald-600 font-sans">• Resting Normal</span></div>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-stone-200 shadow-md flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-stone-400">Passive Sensor Loop</div>
                  <div className="text-sm font-bold text-charcoal-950">Impact & SpO2 Monitored</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Narrative (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <Watch className="w-3.5 h-3.5 text-teal-700" />
              <span>PASSIVE WEARABLE TELEMETRY</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-950 tracking-tight leading-tight">
              Effortless biometric protection on your wrist.
            </h2>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              IRIS pairs smoothly with Wear OS and BLE medical devices. Sub-second accelerometer algorithms detect sudden impact trajectories while monitoring heart rate stability in the background.
            </p>

            <div className="space-y-3 pt-2 text-xs font-medium text-stone-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Zero manual buttons required during a fall impact</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Continuous pulse rate and SpO2 oxygenation tracking</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Low-power Bluetooth pairing with minimal battery drain</span>
              </div>
            </div>

            {/* Ethical Disclaimer (Section 7) */}
            <div className="mt-4 p-3 rounded-2xl bg-stone-100/80 border border-stone-200 text-[11px] text-stone-500 leading-snug">
              <strong>Notice:</strong> IRIS biometrics are supportive wellness and emergency-routing concepts designed to aid families and caregivers. IRIS does not claim to foresee heart attacks or replace physician diagnosis.
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 5. EVERYDAY CARE & CLINICAL AI ASSISTANT (ASPORTED EDITORIAL LAYOUT)      */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/60">
        
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            EVERYDAY ASSISTED INDEPENDENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-950 mt-3 tracking-tight">
            Integrated support for daily life.
          </h2>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Eldercare extends far beyond the emergency button. IRIS coordinates the quiet rhythms of health management, appointments, and community.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Large Editorial Photo (Senior Managing Daily Wellness) */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100">
              <img
                src={IMAGES.seniorDailyCare.src}
                alt={IMAGES.seniorDailyCare.alt}
                width={IMAGES.seniorDailyCare.width}
                height={IMAGES.seniorDailyCare.height}
                className="w-full h-auto object-cover max-h-[480px]"
                loading="lazy"
              />
            </div>
            {/* Overlay pill */}
            <div className="mt-4 flex items-center justify-between text-xs text-stone-500 px-2">
              <span className="italic">Organized daily routines foster dignity and long-term autonomy.</span>
              <span className="font-mono text-teal-700 font-semibold">Verified Adherence</span>
            </div>
          </div>

          {/* Right Capability List (Replaces 5 Generic Cards) */}
          <div className="lg:col-span-6 space-y-4">
            {everydayCapabilities.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs hover:border-teal-300 hover:shadow-xs transition-all duration-200 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-charcoal-950">{item.title}</h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 6. CLINICAL COLLABORATION & HEALTHCARE PROVIDER SECTION                   */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-stone-50/70 rounded-3xl border border-stone-200/80 my-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Content (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
              <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
              <span>AUTHORIZED CLINICAL ACCESS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-950 tracking-tight leading-tight">
              Empowering physicians with longitudinal telemetry.
            </h2>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              IRIS bridges the gap between home and clinic. Authorized healthcare providers review consolidated biometric trends, chronic illness histories, and medication responses through a consent-governed portal.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs font-medium text-stone-700">
                <Lock className="w-4 h-4 text-teal-600 shrink-0" />
                <span>DISHA & HIPAA compliant role-based cryptographic identity isolation</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-stone-700">
                <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Longitudinal telemetry summaries for periodic clinical review</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium text-stone-700">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Explicit senior and family consent required for record sharing</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/provider"
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-900 group"
              >
                <span>View Healthcare Provider Dashboard</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Image (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-white">
              <img
                src={IMAGES.doctorConsultation.src}
                alt={IMAGES.doctorConsultation.alt}
                width={IMAGES.doctorConsultation.width}
                height={IMAGES.doctorConsultation.height}
                className="w-full h-auto object-cover max-h-[460px]"
                loading="lazy"
              />
            </div>
          </div>

        </div>
      </section>


      {/* ========================================================================= */}
      {/* 7. FINAL CALL-TO-ACTION WITH EMOTIONAL CONTINUITY PHOTOGRAPHY              */}
      {/* ========================================================================= */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-2xl bg-charcoal-950 text-white">
          
          {/* Background High-Resolution Photography with Dark Editorial Wash */}
          <img
            src={IMAGES.seniorCaregiverWalk.src}
            alt={IMAGES.seniorCaregiverWalk.alt}
            width={IMAGES.seniorCaregiverWalk.width}
            height={IMAGES.seniorCaregiverWalk.height}
            className="absolute inset-0 w-full h-full object-cover object-center opacity-30 mix-blend-luminosity scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-charcoal-950/90 to-charcoal-950/70" />

          {/* Foreground CTA Content */}
          <div className="relative p-8 sm:p-16 lg:p-20 max-w-3xl">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-teal-400">
              CARE CONTINUES BEYOND THE MOMENT OF CRISIS
            </span>

            <h2 className="text-3xl sm:text-5xl font-extrabold mt-4 tracking-tight leading-tight">
              Dignified senior living. <br />
              <span className="text-teal-300 font-serif italic font-normal">Complete family reassurance.</span>
            </h2>

            <p className="mt-4 text-stone-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Experience the healthcare technology platform built for real humans. Connect your family, pair your wearable devices, and access 24/7 proximity-matched emergency coordination in under 3 minutes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                id="footer-cta-register"
                to="/register"
                className="px-8 py-4 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-charcoal-950 font-black text-sm shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                CREATE FREE ACCOUNT
              </Link>
              <Link
                id="footer-cta-demo"
                to="/demo"
                className="px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-stone-200 border border-white/20 font-semibold text-sm transition"
              >
                Explore Interactive Demo
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-xs text-stone-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-400" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-teal-400" />
                32 languages supported
              </span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
