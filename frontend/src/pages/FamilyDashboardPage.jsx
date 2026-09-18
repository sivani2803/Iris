import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import CareNetworkGraph from '../components/CareNetworkGraph';
import LiveTimeline from '../components/LiveTimeline';
import NodeErrorBoundary from '../components/common/NodeErrorBoundary';
import { seniorApi } from '../services/api';
import {
  Heart,
  Wind,
  Activity,
  Wifi,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  Pill,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FamilyDashboardPage() {
  const { currentTelemetry, activeEmergency, refreshEmergency } = useEmergency();
  const [recentEvents, setRecentEvents] = useState([]);
  const [seniorProfile, setSeniorProfile] = useState(null);

  useEffect(() => {
    seniorApi.getProfile('S102').then((res) => setSeniorProfile(res.data?.data)).catch(() => {});
    seniorApi.getHealth('S102').then((res) => {
      if (res.data?.data?.recentHistory) {
        setRecentEvents(res.data.data.recentHistory);
      }
    }).catch(() => {});
  }, [activeEmergency]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900">Family Peace-of-Mind Command</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Live Iris Guard Active
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Monitoring: {seniorProfile?.name || 'Savitri Devi'} (Age {seniorProfile?.age || 74}) • Villa 14, Madhapur, Hyderabad
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/simulator"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-xs flex items-center gap-2 transition"
          >
            <Wifi className="w-3.5 h-3.5 text-teal-600" />
            Watch Simulator
          </Link>
          <Link
            to="/caretaker"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-900 text-white hover:bg-charcoal-800 shadow-xs flex items-center gap-2 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            Caretaker View
          </Link>
        </div>
      </div>

      {/* ACTIVE EMERGENCY CARD (Red Accent strictly when active) */}
      {activeEmergency ? (
        <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-400 shadow-lg animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-rose-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-white bg-rose-600 px-2.5 py-0.5 rounded-full">
                    {activeEmergency.riskLevel} EMERGENCY
                  </span>
                  <span className="text-xs text-rose-800 font-mono uppercase font-bold">
                    Stage: {activeEmergency.status}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-rose-950 mt-1">
                  {activeEmergency.summary || 'Possible emergency detected'}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-rose-200 text-right">
              <div className="text-[10px] uppercase font-semibold text-stone-500">Assigned Responder</div>
              <div className="text-base font-bold text-rose-950">
                {activeEmergency.assignedCaretakerData?.name || 'Searching Best Responder...'}
              </div>
              <div className="text-xs text-rose-700 font-medium">
                {activeEmergency.etaMinutes ? `Estimated Arrival: ~${activeEmergency.etaMinutes} min` : 'Locating Nearest Responder'}
              </div>
            </div>
          </div>

          {/* Emergency Telemetry Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">Heart Rate</div>
              <div className="text-xl font-bold font-mono text-rose-600">
                {activeEmergency.triggerEvent?.heartRate || currentTelemetry.heartRate} BPM
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">SpO2 Oxygen</div>
              <div className="text-xl font-bold font-mono text-cyan-700">
                {activeEmergency.triggerEvent?.spo2 || currentTelemetry.spo2}%
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">Movement</div>
              <div className="text-xl font-bold uppercase text-stone-800">
                {activeEmergency.triggerEvent?.motionState || currentTelemetry.motionState}
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">Fall Detected</div>
              <div className="text-xl font-bold text-rose-600">
                {activeEmergency.triggerEvent?.fallDetected ? 'YES (IMPACT)' : 'No'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-xs text-teal-900">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            <span className="font-semibold">All Vitals Stable • No Active Emergency</span>
          </div>
          <span className="text-teal-700 font-medium">IRIS Monitoring Active</span>
        </div>
      )}

      {/* Top Section: Live Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">Live Heart Rate</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Heart className={`w-4 h-4 ${currentTelemetry.heartRate > 110 ? 'animate-ping' : ''}`} />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-charcoal-900 mt-3 flex items-baseline gap-1.5">
            {currentTelemetry.heartRate} <span className="text-xs font-sans text-stone-500 font-normal">BPM</span>
          </div>
          <div className="text-xs text-stone-500 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Baseline resting: 72 BPM
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">Live SpO2 Saturation</span>
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Wind className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-charcoal-900 mt-3 flex items-baseline gap-1.5">
            {currentTelemetry.spo2} <span className="text-xs font-sans text-stone-500 font-normal">%</span>
          </div>
          <div className="text-xs text-stone-500 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Optimal blood oxygen level
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">Smartwatch Sensor</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-charcoal-900 mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            Wearable Online
          </div>
          <div className="text-xs text-stone-500 mt-2">
            Motion State: <span className="font-semibold uppercase text-stone-800">{currentTelemetry.motionState}</span>
          </div>
        </div>
      </div>

      {/* Visual Care Network Graph */}
      <NodeErrorBoundary nodeName="Care Network Graph">
        <CareNetworkGraph
          activeEmergency={activeEmergency}
          caretakerName={activeEmergency?.assignedCaretakerData?.name || 'Ravi Kumar'}
        />
      </NodeErrorBoundary>

      {/* Two Column Layout: Live Timeline vs Schedule & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live Response Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
                Live Response & Reassessment Timeline
              </h3>
              <p className="text-xs text-stone-500">
                Synchronized instantaneously with backend risk engine and responder actions
              </p>
            </div>
            <button
              onClick={() => refreshEmergency()}
              className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <NodeErrorBoundary nodeName="Live Incident Timeline">
            <LiveTimeline
              timeline={activeEmergency?.timeline || []}
              activeStatus={activeEmergency?.status || 'detected'}
            />
          </NodeErrorBoundary>
        </div>

        {/* Right Col: Adherence, Appointments, and Contacts */}
        <div className="space-y-6">
          {/* Medicine Adherence Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                Medication Adherence
              </h3>
              <span className="text-xs font-bold text-teal-700">1 / 3 Taken</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-stone-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-900">Amlodipine (5 mg)</div>
                  <div className="text-[11px] text-stone-500">08:00 AM • Morning</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">TAKEN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-900">Metformin (500 mg)</div>
                  <div className="text-[11px] text-stone-500">01:30 PM • Lunch</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold">UPCOMING</span>
              </div>
            </div>
          </div>

          {/* Upcoming Appointment */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                Next Appointment
              </h3>
              <span className="text-[11px] text-teal-700 font-semibold">22 Sept</span>
            </div>
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
              <div className="font-bold text-stone-900">Dr. Ananya Rao</div>
              <div className="text-stone-500 text-[11px]">Cardiology • City Hospital</div>
              <div className="text-stone-600 mt-1 font-mono text-[11px]">10:30 AM</div>
            </div>
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Fast Escalation Contacts
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50">
                <div>
                  <div className="font-semibold text-stone-900">Rohan Sharma (Son)</div>
                  <div className="text-[11px] text-stone-500 font-mono">+91 98765 11111</div>
                </div>
                <a href="tel:+919876511111" className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50">
                <div>
                  <div className="font-semibold text-stone-900">Dr. Ananya Sharma (Daughter)</div>
                  <div className="text-[11px] text-stone-500 font-mono">+91 98765 22222</div>
                </div>
                <a href="tel:+919876522222" className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100">
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
