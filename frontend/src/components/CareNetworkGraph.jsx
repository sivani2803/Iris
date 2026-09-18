import React from 'react';
import { Shield, HeartHandshake, Users, Hospital, Compass, AlertCircle } from 'lucide-react';

export default function CareNetworkGraph({ activeEmergency, seniorName, caretakerName = 'Assigned Responder' }) {
  const isEmergency = Boolean(activeEmergency);

  return (
    <div className="relative bg-white rounded-3xl p-6 border border-stone-200 shadow-xs overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
            Visual Integrated Care Network
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            {isEmergency
              ? 'Active Escalation Flow: Senior → IRIS → Responder → Family'
              : 'All nodes synchronized & actively monitoring'}
          </p>
        </div>
        {isEmergency ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Active Dispatch Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Network Harmonized
          </span>
        )}
      </div>

      {/* Network Canvas */}
      <div className="relative h-72 w-full flex items-center justify-center">
        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 500 280">
          {/* Top Left: Family Connection */}
          <line
            x1="250"
            y1="140"
            x2="100"
            y2="60"
            stroke={isEmergency ? '#0d9488' : '#e2e8f0'}
            strokeWidth={isEmergency ? '2.5' : '1.5'}
            strokeDasharray={isEmergency ? '4 4' : 'none'}
            className={isEmergency ? 'animate-pulse' : ''}
          />

          {/* Top Right: Caretaker Connection */}
          <line
            x1="250"
            y1="140"
            x2="400"
            y2="60"
            stroke={isEmergency ? '#ef4444' : '#e2e8f0'}
            strokeWidth={isEmergency ? '3' : '1.5'}
            strokeDasharray={isEmergency ? '6 3' : 'none'}
            className={isEmergency ? 'animate-pulse' : ''}
          />

          {/* Bottom Left: Community Connection */}
          <line
            x1="250"
            y1="140"
            x2="100"
            y2="220"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Bottom Right: Healthcare/Hospital Connection */}
          <line
            x1="250"
            y1="140"
            x2="400"
            y2="220"
            stroke={isEmergency ? '#0d9488' : '#e2e8f0'}
            strokeWidth={isEmergency ? '2' : '1.5'}
          />
        </svg>

        {/* Center Node: SENIOR (Savitri Devi) */}
        <div className="relative z-10 flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full bg-white border-4 p-1 flex flex-col items-center justify-center text-center shadow-md transition-all ${
            isEmergency
              ? 'border-rose-500 ring-8 ring-rose-100 shadow-rose-200'
              : 'border-teal-600 ring-4 ring-teal-50'
          }`}>
            <span className="text-2xl">👵</span>
            <span className="text-[11px] font-bold text-charcoal-900 leading-tight">Savitri Devi</span>
            <span className="text-[9px] text-stone-500 font-mono">S102</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
            isEmergency ? 'bg-rose-600 text-white animate-pulse' : 'bg-teal-100 text-teal-800'
          }`}>
            {isEmergency ? 'ALERT DETECTED' : 'PROTECTED'}
          </span>
        </div>

        {/* Node 1: Family (Top Left) */}
        <div className="absolute top-2 left-6 sm:left-12 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-charcoal-900 mt-1">Family</span>
          <span className="text-[10px] text-stone-500">Rohan & Ananya</span>
        </div>

        {/* Node 2: Caretaker (Top Right) */}
        <div className="absolute top-2 right-6 sm:right-12 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-xs transition-all ${
            isEmergency
              ? 'bg-rose-50 border-rose-400 text-rose-700 ring-4 ring-rose-100 animate-pulse'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            <HeartHandshake className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-charcoal-900 mt-1">Responder</span>
          <span className={`text-[10px] font-semibold ${isEmergency ? 'text-rose-600' : 'text-stone-500'}`}>
            {activeEmergency?.assignedCaretakerData?.name || caretakerName}
          </span>
        </div>

        {/* Node 3: Community (Bottom Left) */}
        <div className="absolute bottom-2 left-6 sm:left-12 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-700 shadow-xs">
            <Compass className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-charcoal-900 mt-1">Community</span>
          <span className="text-[10px] text-stone-500">Madhapur Circle</span>
        </div>

        {/* Node 4: Healthcare Hospital (Bottom Right) */}
        <div className="absolute bottom-2 right-6 sm:right-12 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-800 shadow-xs">
            <Hospital className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-charcoal-900 mt-1">Healthcare</span>
          <span className="text-[10px] text-stone-500">City Hospital</span>
        </div>
      </div>
    </div>
  );
}
