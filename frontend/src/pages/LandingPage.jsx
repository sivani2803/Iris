import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Watch, Users, HeartHandshake, ArrowRight, CheckCircle2, Activity, Heart, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Subtle Iris Rings Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full border border-teal-500/10 pointer-events-none -z-10 animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-teal-500/15 pointer-events-none -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-teal-50/40 pointer-events-none -z-10 blur-xl"></div>

        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-teal-800 border border-teal-200 shadow-xs mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping"></span>
            Intelligent Response & Integrated Senior-care Network
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-charcoal-950 tracking-tight leading-[1.1]">
            Care that responds, <br />
            <span className="text-teal-700">even when they can't.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto">
            An intelligent care network connecting seniors, families, and caregivers — from everyday health management to critical moments when every second matters.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/demo"
              className="px-6 py-3.5 rounded-2xl bg-charcoal-950 text-white font-semibold text-sm shadow-md hover:bg-charcoal-800 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              Launch 2-Minute Demo Experience
            </Link>
            <Link
              to="/simulator"
              className="px-6 py-3.5 rounded-2xl bg-white text-charcoal-900 border border-stone-200 font-semibold text-sm shadow-xs hover:bg-stone-50 transition flex items-center gap-2"
            >
              <Watch className="w-4 h-4 text-teal-600" />
              Smartwatch Hardware Simulator
            </Link>
          </div>
        </div>

        {/* Closed-Loop Difference Section */}
        <div className="mt-24 max-w-5xl mx-auto bg-white rounded-3xl p-8 border border-stone-200 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-charcoal-900">
              The IRIS Difference: A Closed-Loop Safety Paradigm
            </h2>
            <p className="text-sm text-stone-500 mt-1">
              Conventional SOS buttons stop at sending a notification. IRIS continuously coordinates care until the emergency is resolved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
            {[
              { step: 'DETECT', desc: 'Watch sensors detect fall impact & vital anomaly', badge: 'Sensor Array' },
              { step: 'UNDERSTAND', desc: 'Risk engine classifies severity & context', badge: 'Risk Engine' },
              { step: 'RESPOND', desc: 'Nearest certified responder matched with ETA', badge: 'Smart Match' },
              { step: 'REASSESS', desc: 'Fail-safe re-escalation if no response in 60s', badge: 'Fail-Safe' },
              { step: 'PROTECT', desc: 'Responder arrives, stabilizes & closes incident', badge: 'Full Resolution' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-surface-warm border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {item.badge}
                  </span>
                  <div className="text-base font-bold text-charcoal-900 mt-2">{item.step}</div>
                  <p className="text-xs text-stone-600 mt-1">{item.desc}</p>
                </div>
                <div className="mt-4 pt-2 border-t border-stone-200/60 text-[10px] text-stone-400 font-mono">
                  Step 0{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 Core Roles Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">Family Dashboard</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Real-time peace of mind with live vital telemetry, interactive care network visualization, and an unalterable incident timeline.
            </p>
            <Link to="/family" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800">
              Open Family View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">Caretaker Command</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Rapid dispatch portal with proximity routing, one-tap accept/decline, live status updates (En Route, Arrived), and patient health dossiers.
            </p>
            <Link to="/caretaker" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800">
              Open Caretaker Portal <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">Senior Experience</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Distraction-free, accessible design with large buttons, high contrast, multilingual voice interaction (English, Telugu, Hindi), and 1-tap SOS.
            </p>
            <Link to="/senior" className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 hover:text-purple-800">
              Open Senior Mode <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
