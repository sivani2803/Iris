import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { useTelemetryStore } from '../store/useTelemetryStore';
import { emergencyApi } from '../services/api';
import LiveTimeline from '../components/LiveTimeline';
import CareNetworkGraph from '../components/CareNetworkGraph';
import PulseWaveCanvas from '../components/telemetry/PulseWaveCanvas';
import {
  Activity,
  Heart,
  Wind,
  Wifi,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Send,
  Zap,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoPage() {
  const { activeEmergency, refreshEmergency } = useEmergency();
  const heartRate = useTelemetryStore((state) => state.heartRate);
  const spo2 = useTelemetryStore((state) => state.spo2);
  const motionState = useTelemetryStore((state) => state.motionState);
  const fallDetected = useTelemetryStore((state) => state.fallDetected);
  const watchConnected = useTelemetryStore((state) => state.watchConnected);

  const [loading, setLoading] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  const logEvent = (text) => {
    setTelemetryLogs((prev) => [
      { id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), text },
      ...prev.slice(0, 10)
    ]);
  };

  // Real API Dispatches (Event-driven, no auto-play loop)
  const triggerIncident = async (payload, label) => {
    setLoading(true);
    logEvent(`Dispatching telemetry: ${label}`);
    try {
      const res = await emergencyApi.sendHealthEvent({
        seniorId: 'S102',
        ...payload,
        timestamp: new Date().toISOString()
      });
      logEvent(`Backend classified event: ${res.data?.riskAnalysis?.riskLevel} (Score: ${res.data?.riskAnalysis?.score})`);
      await refreshEmergency();
    } catch (e) {
      logEvent(`Transmission error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await emergencyApi.reset();
      await emergencyApi.sendHealthEvent({
        seniorId: 'S102',
        heartRate: 72,
        spo2: 98,
        motionState: 'active',
        fallDetected: false,
        eventType: 'routine'
      });
      logEvent('System reset: Restored normal baseline (72 BPM, 98% SpO2)');
      await refreshEmergency();
    } catch (e) {
      logEvent(`Reset error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-charcoal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-charcoal-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-900/80 text-teal-300 border border-teal-700/80 mb-3">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            Production Telemetry & Emergency Pipeline Console
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight font-sans">
            Real-Time Ingestion & Escalation Cockpit
          </h1>
          <p className="text-xs text-stone-400 mt-1.5 max-w-2xl leading-relaxed">
            Directly monitoring high-frequency WebSocket streams using an optimized Zustand ring buffer and RAF-driven Canvas waveform rendering — bypassing React re-render overhead.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition self-start md:self-center"
        >
          <RotateCcw className="w-4 h-4" />
          Reset Baseline
        </button>
      </div>

      {/* Production Telemetry Waveform & Sensor Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-Time Canvas Waveform */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                Live PPG & Cardiorespiratory Pulse Wave (RAF Canvas)
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Rendering 60-point ring buffer at 60 FPS without triggering React component tree reconciliation.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              {watchConnected ? 'STREAM ACTIVE' : 'RECONNECTING'}
            </div>
          </div>

          <div className="h-32 w-full bg-stone-900 rounded-2xl p-2 border border-stone-800 shadow-inner flex items-center">
            <PulseWaveCanvas width={600} height={110} strokeColor={heartRate > 115 ? '#f43f5e' : '#2dd4bf'} />
          </div>

          {/* Quick Real Telemetry Incident Triggers */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
              Event-Driven Pipeline Ingestion Triggers (Direct API Calls)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() =>
                  triggerIncident(
                    { heartRate: 145, spo2: 91, motionState: 'stationary', fallDetected: true, eventType: 'fall' },
                    'Fall Impact + Immobility (CRITICAL)'
                  )
                }
                disabled={loading}
                className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 font-bold text-xs transition text-left"
              >
                <div className="flex items-center justify-between">
                  <span>🚨 Trigger Fall Impact</span>
                  <span className="text-[10px] bg-rose-200 px-1.5 py-0.5 rounded font-mono">145 BPM</span>
                </div>
                <div className="text-[11px] text-rose-700 font-normal mt-1">Fall=true • Stationary • SpO2 91%</div>
              </button>

              <button
                onClick={() =>
                  triggerIncident(
                    { heartRate: 135, spo2: 89, motionState: 'stationary', fallDetected: false, eventType: 'low_spo2' },
                    'Acute Hypoxia (SpO2 89%)'
                  )
                }
                disabled={loading}
                className="p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs transition text-left"
              >
                <div className="flex items-center justify-between">
                  <span>🫁 Severe Hypoxia</span>
                  <span className="text-[10px] bg-amber-200 px-1.5 py-0.5 rounded font-mono">89%</span>
                </div>
                <div className="text-[11px] text-amber-700 font-normal mt-1">SpO2 89% • HR 135 BPM</div>
              </button>

              <button
                onClick={() =>
                  triggerIncident(
                    { heartRate: 120, spo2: 96, motionState: 'stationary', fallDetected: false, eventType: 'manual_sos' },
                    'Manual SOS Emergency Button'
                  )
                }
                disabled={loading}
                className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition text-left"
              >
                <div className="flex items-center justify-between">
                  <span>🆘 Senior SOS Press</span>
                  <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded font-mono">SOS</span>
                </div>
                <div className="text-[11px] text-purple-700 font-normal mt-1">Direct hardware button trigger</div>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Live Values & Stream Audit */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-3 border-b border-stone-100">
              Normalized Sensor Values (Zustand)
            </h2>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                <span className="text-[10px] uppercase text-stone-500 font-semibold">Heart Rate</span>
                <div className="text-2xl font-bold font-mono text-charcoal-900 mt-0.5">
                  {heartRate} <span className="text-xs font-normal">BPM</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                <span className="text-[10px] uppercase text-stone-500 font-semibold">Blood Oxygen</span>
                <div className="text-2xl font-bold font-mono text-cyan-700 mt-0.5">
                  {spo2}%
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60">
                <span className="text-[10px] uppercase text-stone-500 font-semibold">Movement</span>
                <div className="text-sm font-bold uppercase text-stone-800 mt-1">
                  {motionState}
                </div>
              </div>

              <div className={`p-3 rounded-2xl border ${
                fallDetected ? 'bg-rose-50 border-rose-300 text-rose-800' : 'bg-stone-50 border-stone-200/60 text-stone-700'
              }`}>
                <span className="text-[10px] uppercase font-semibold">Fall Impact</span>
                <div className="text-sm font-bold mt-1">
                  {fallDetected ? '⚠️ IMPACT' : 'Normal'}
                </div>
              </div>
            </div>

            {/* Event Audit Log */}
            <div className="mt-4 pt-4 border-t border-stone-100 font-mono text-[11px] space-y-1.5">
              <span className="text-[10px] font-sans font-bold uppercase text-stone-400 block">Telemetry Stream Log</span>
              {telemetryLogs.length === 0 ? (
                <div className="text-stone-400 text-xs italic">Awaiting sensor dispatches...</div>
              ) : (
                telemetryLogs.map((l) => (
                  <div key={l.id} className="text-stone-700 leading-tight">
                    <span className="text-stone-400">[{l.time}]</span> {l.text}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/simulator"
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
            >
              Open Full Hardware Simulator <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Real-Time Care Network Graph and Live Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <CareNetworkGraph
            activeEmergency={activeEmergency}
            caretakerName={activeEmergency?.assignedCaretakerData?.name || 'Ravi Kumar'}
          />
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500">
              Live Closed-Loop Incident Timeline
            </h3>
            <span className="text-[11px] text-teal-700 font-semibold font-mono">Real-time Socket.IO</span>
          </div>

          <LiveTimeline
            timeline={activeEmergency?.timeline || []}
            activeStatus={activeEmergency?.status || 'detected'}
          />
        </div>
      </div>
    </div>
  );
}
