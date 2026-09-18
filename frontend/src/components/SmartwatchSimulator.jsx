import React, { useState, useEffect } from 'react';
import { emergencyApi } from '../services/api';
import { Activity, Heart, Wind, Wifi, AlertTriangle, RefreshCw, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import PulseWaveCanvas from './telemetry/PulseWaveCanvas';

export default function SmartwatchSimulator({ onEventSent }) {
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [motionState, setMotionState] = useState('active');
  const [fallDetected, setFallDetected] = useState(false);
  const [watchConnected, setWatchConnected] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [transmitting, setTransmitting] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Update digital clock every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Transmit health event to backend API
  const transmitEvent = async (overrideData = {}) => {
    setTransmitting(true);
    setErrorMessage(null);

    const payload = {
      seniorId: 'S102',
      deviceId: 'DEV-WATCH-S102',
      eventId: `EVT-WATCH-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      heartRate: overrideData.heartRate ?? heartRate,
      spo2: overrideData.spo2 ?? spo2,
      motionState: overrideData.motionState ?? motionState,
      fallDetected: overrideData.fallDetected ?? fallDetected,
      eventType: overrideData.eventType ?? (overrideData.fallDetected ? 'fall' : 'routine'),
      timestamp: new Date().toISOString()
    };

    try {
      const res = await emergencyApi.sendHealthEvent(payload);
      setLastResponse(res.data);
      if (onEventSent) onEventSent(res.data);
    } catch (err) {
      console.error('Failed to send health event:', err);
      setErrorMessage(err.message || 'Failed to transmit telemetry to backend');
    } finally {
      setTransmitting(false);
    }
  };

  // Scenario 1: Simulate Fall
  const handleSimulateFall = () => {
    const hr = 145;
    const sp = 91;
    const motion = 'stationary';
    const fall = true;

    setHeartRate(hr);
    setSpo2(sp);
    setMotionState(motion);
    setFallDetected(fall);

    transmitEvent({
      heartRate: hr,
      spo2: sp,
      motionState: motion,
      fallDetected: fall,
      eventType: 'fall'
    });
  };

  // Scenario 2: Abnormal Heart Rate
  const handleAbnormalHeartRate = () => {
    const hr = 138;
    setHeartRate(hr);
    transmitEvent({ heartRate: hr, eventType: 'abnormal_heart_rate' });
  };

  // Scenario 3: Low SpO2
  const handleLowSpo2 = () => {
    const sp = 89;
    setSpo2(sp);
    transmitEvent({ spo2: sp, eventType: 'low_spo2' });
  };

  // Scenario 4: Manual Emergency SOS
  const handleManualSos = () => {
    const hr = 118;
    setHeartRate(hr);
    transmitEvent({
      heartRate: hr,
      eventType: 'manual_sos'
    });
  };

  // Reset to Baseline
  const handleReset = async () => {
    setHeartRate(72);
    setSpo2(98);
    setMotionState('active');
    setFallDetected(false);
    setLastResponse(null);
    setErrorMessage(null);

    try {
      await emergencyApi.reset();
      await transmitEvent({
        heartRate: 72,
        spo2: 98,
        motionState: 'active',
        fallDetected: false,
        eventType: 'routine'
      });
    } catch (e) {
      console.warn('Reset error:', e);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 p-6 max-w-5xl mx-auto">
      {/* Visual Modern Smartwatch Casing */}
      <div className="relative flex flex-col items-center">
        {/* Watch Strap Top */}
        <div className="w-32 h-10 bg-gradient-to-b from-stone-800 to-stone-900 rounded-t-xl opacity-90 border-x border-stone-700 shadow-inner"></div>

        {/* Watch Chassis */}
        <div className="relative w-80 h-96 bg-stone-950 rounded-[44px] p-4 shadow-2xl border-4 border-stone-700/80 ring-1 ring-white/10 flex flex-col items-center justify-between">
          {/* Digital Crown & Button Accents */}
          <div className="absolute -right-3 top-20 w-3 h-12 bg-stone-700 rounded-r-md border border-stone-600 shadow-md"></div>
          <div className="absolute -right-2 top-36 w-2 h-8 bg-stone-700 rounded-r-sm"></div>

          {/* OLED Screen */}
          <div className="w-full h-full bg-black rounded-[36px] p-5 flex flex-col justify-between text-white overflow-hidden relative border border-stone-800">
            {/* Screen Header */}
            <div className="flex items-center justify-between text-xs text-stone-400 border-b border-stone-800/80 pb-2">
              <span className="font-semibold text-stone-200 tracking-wider">{currentTime}</span>
              <div className="flex items-center gap-1.5">
                <Wifi className={`w-3.5 h-3.5 ${watchConnected ? 'text-teal-400' : 'text-stone-500'}`} />
                <span className="text-[10px] font-medium uppercase tracking-wider text-teal-400">IRIS 4G</span>
              </div>
            </div>

            {/* Live Telemetry Display */}
            <div className="space-y-3 my-auto">
              {/* Heart Rate */}
              <div className="flex items-center justify-between bg-stone-900/90 rounded-2xl p-3 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                    <Heart className={`w-5 h-5 ${heartRate > 110 ? 'animate-ping text-rose-500' : ''}`} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-medium tracking-wider text-stone-400">Heart Rate</div>
                    <div className="text-xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1">
                      {heartRate} <span className="text-xs text-stone-400 font-sans font-normal">BPM</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    heartRate > 115 ? 'bg-rose-900/60 text-rose-300 border border-rose-700' : 'bg-stone-800 text-stone-300'
                  }`}>
                    {heartRate > 115 ? 'ELEVATED' : 'STABLE'}
                  </span>
                </div>
              </div>

              {/* Real-time Hardware Wave (RAF Canvas) */}
              <div className="h-8 w-full overflow-hidden rounded-xl bg-stone-900/60 border border-stone-800/80 px-1 py-0.5">
                <PulseWaveCanvas width={260} height={28} strokeColor={heartRate > 115 ? '#f43f5e' : '#2dd4bf'} />
              </div>

              {/* SpO2 */}
              <div className="flex items-center justify-between bg-stone-900/90 rounded-2xl p-3 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <Wind className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-medium tracking-wider text-stone-400">SpO2 Oxygen</div>
                    <div className="text-xl font-bold font-mono tracking-tight text-white flex items-baseline gap-1">
                      {spo2}<span className="text-xs text-stone-400 font-sans font-normal">%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    spo2 < 93 ? 'bg-amber-900/60 text-amber-300 border border-amber-700' : 'bg-stone-800 text-stone-300'
                  }`}>
                    {spo2 < 93 ? 'LOW' : 'OPTIMAL'}
                  </span>
                </div>
              </div>

              {/* Movement & Fall Status */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-stone-900/90 rounded-2xl p-2.5 border border-stone-800">
                  <div className="text-[10px] uppercase font-medium tracking-wider text-stone-400">Movement</div>
                  <div className="text-xs font-semibold uppercase mt-0.5 text-stone-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    {motionState}
                  </div>
                </div>
                <div className={`rounded-2xl p-2.5 border ${
                  fallDetected ? 'bg-rose-950/70 border-rose-600' : 'bg-stone-900/90 border-stone-800'
                }`}>
                  <div className="text-[10px] uppercase font-medium tracking-wider text-stone-400">Fall Event</div>
                  <div className={`text-xs font-semibold uppercase mt-0.5 flex items-center gap-1 ${
                    fallDetected ? 'text-rose-400' : 'text-stone-300'
                  }`}>
                    {fallDetected ? '⚠️ IMPACT' : 'NONE'}
                  </div>
                </div>
              </div>
            </div>

            {/* Screen Bottom Bar */}
            <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-800/80 text-stone-400">
              <span className="flex items-center gap-1.5 truncate max-w-[190px]">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0"></span>
                DEV-WATCH-S102 • S102
              </span>
              <span className="font-mono text-stone-400">94% ⚡</span>
            </div>

            {/* Transmitting Overlay Ring */}
            {transmitting && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
                <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="text-sm font-semibold text-white">Transmitting Telemetry</div>
                <div className="text-xs text-stone-400 font-mono mt-1">POST /api/emergency/health-event</div>
              </div>
            )}
          </div>
        </div>

        {/* Watch Strap Bottom */}
        <div className="w-32 h-10 bg-gradient-to-t from-stone-800 to-stone-900 rounded-b-xl opacity-90 border-x border-stone-700 shadow-inner"></div>
      </div>

      {/* Simulator Control & Telemetry Panel */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm border border-stone-200/80 w-full">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
              Smartwatch Hardware Simulator
            </div>
            <h2 className="text-xl font-bold text-charcoal-900 mt-2">Wear OS Telemetry Testbed</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulates real-world sensor streams and sends validated HTTP requests to the IRIS backend.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
        </div>

        {/* Interactive Simulation Trigger Buttons */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-2.5">
            1-Click Incident Triggers
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSimulateFall}
              disabled={transmitting}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 hover:border-rose-300 font-semibold text-sm transition shadow-sm group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-rose-950">Simulate Fall</div>
                <div className="text-[11px] text-rose-700 font-normal">Impact + HR 145 + Stationary (Critical)</div>
              </div>
            </button>

            <button
              onClick={handleAbnormalHeartRate}
              disabled={transmitting}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 font-semibold text-sm transition shadow-sm group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-amber-950">Abnormal Heart Rate</div>
                <div className="text-[11px] text-amber-700 font-normal">HR jumps to 138 BPM</div>
              </div>
            </button>

            <button
              onClick={handleLowSpo2}
              disabled={transmitting}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 hover:bg-sky-100 font-semibold text-sm transition shadow-sm group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sky-950">Low Oxygen (SpO2)</div>
                <div className="text-[11px] text-sky-700 font-normal">SpO2 drops to 89%</div>
              </div>
            </button>

            <button
              onClick={handleManualSos}
              disabled={transmitting}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 hover:bg-purple-100 font-semibold text-sm transition shadow-sm group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-purple-950">Manual SOS Trigger</div>
                <div className="text-[11px] text-purple-700 font-normal">User-pressed emergency button</div>
              </div>
            </button>
          </div>
        </div>

        {/* Manual Fine-Tuning Sensor Knobs */}
        <div className="mt-6 pt-5 border-t border-stone-100 space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
            Manual Sensor Fine-Tuning
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-xs text-stone-600 mb-1 font-medium">
                <span>Heart Rate</span>
                <span className="font-bold font-mono">{heartRate} BPM</span>
              </div>
              <input
                type="range"
                min="45"
                max="175"
                value={heartRate}
                onChange={(e) => setHeartRate(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-stone-600 mb-1 font-medium">
                <span>Blood Oxygen</span>
                <span className="font-bold font-mono">{spo2}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                value={spo2}
                onChange={(e) => setSpo2(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="text-xs text-stone-600 mb-1 font-medium">Movement State</div>
              <select
                value={motionState}
                onChange={(e) => setMotionState(e.target.value)}
                className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800"
              >
                <option value="active">Active (Moving)</option>
                <option value="stationary">Stationary (Still)</option>
                <option value="resting">Resting (Bed)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => transmitEvent()}
            disabled={transmitting}
            className="w-full mt-2 py-2.5 rounded-2xl bg-charcoal-900 text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-charcoal-800 transition"
          >
            <Send className="w-3.5 h-3.5" />
            Send Current Telemetry to IRIS Backend (POST)
          </button>
        </div>

        {/* Backend Response / Status Card */}
        {lastResponse && (
          <div className="mt-5 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 font-semibold text-stone-700">
              <span className="flex items-center gap-1.5 text-teal-700">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                Backend Evaluated Event
              </span>
              <span className="font-mono text-[10px] text-stone-500">200 OK</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-1 text-stone-600">
              <div>
                <span className="text-[10px] uppercase text-stone-600 block">Risk Level</span>
                <span className={`font-bold ${
                  lastResponse.riskAnalysis?.riskLevel === 'CRITICAL' ? 'text-rose-600' :
                  lastResponse.riskAnalysis?.riskLevel === 'HIGH' ? 'text-amber-600' : 'text-teal-700'
                }`}>
                  {lastResponse.riskAnalysis?.riskLevel} ({lastResponse.riskAnalysis?.score}/100)
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-600 block">Status</span>
                <span className="font-semibold text-stone-800 uppercase">{lastResponse.emergency?.status || 'Routine'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-600 block">Matched Responder</span>
                <span className="font-semibold text-stone-800">{lastResponse.emergency?.assignedCaretakerData?.name || 'None Required'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-600 block">Arrival ETA</span>
                <span className="font-semibold text-stone-800">
                  {lastResponse.emergency?.etaMinutes ? `${lastResponse.emergency.etaMinutes} min` : 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-stone-200/60 text-[11px] text-stone-500 italic">
              {lastResponse.riskAnalysis?.disclaimer}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
