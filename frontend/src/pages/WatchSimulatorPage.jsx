import React from 'react';
import SmartwatchSimulator from '../components/SmartwatchSimulator';
import { ShieldCheck, Cpu, Radio, Network } from 'lucide-react';

export default function WatchSimulatorPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Info */}
      <div className="max-w-5xl mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">
          Smartwatch Emergency Pipeline
        </h1>
        <p className="text-sm text-stone-600 mt-2 max-w-2xl mx-auto">
          Wearable prototype interface that detects falls, anomalous heart rates, and critical SpO2 drops, directly transmitting sensor payloads to the IRIS backend engine.
        </p>
      </div>

      {/* Simulator Component */}
      <SmartwatchSimulator />

      {/* Architecture Pipeline Explanation */}
      <div className="max-w-5xl mx-auto mt-12 p-6 rounded-3xl bg-white border border-stone-200">
        <h3 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
          <Network className="w-4 h-4 text-teal-600" />
          Live Closed-Loop Data Flow
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 text-xs font-bold">1</div>
            <div className="font-semibold text-xs text-stone-900">Watch Sensor Array</div>
            <div className="text-[11px] text-stone-500 mt-1">Accelerometers + PPG optical sensors detect sudden impact and physiological drift.</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 text-xs font-bold">2</div>
            <div className="font-semibold text-xs text-stone-900">IRIS Backend API</div>
            <div className="text-[11px] text-stone-500 mt-1"><code className="text-teal-700">POST /api/emergency/health-event</code> validates and stores immutable telemetry.</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 text-xs font-bold">3</div>
            <div className="font-semibold text-xs text-stone-900">Risk Engine & Matcher</div>
            <div className="text-[11px] text-stone-500 mt-1">Classifies severity (CRITICAL/HIGH) and matches optimal responder with ETA.</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto mb-2 text-xs font-bold">4</div>
            <div className="font-semibold text-xs text-stone-900">Real-Time Dashboards</div>
            <div className="text-[11px] text-stone-500 mt-1">WebSocket broadcast instantly notifies family and sounds alert for caretaker.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
