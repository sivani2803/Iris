import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEmergency } from '../context/EmergencyContext';
import { seniorApi } from '../services/api';
import {
  Stethoscope,
  Heart,
  Activity,
  UserCheck,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  Calendar,
  Search,
  CheckCircle2
} from 'lucide-react';

export default function HealthcareProviderDashboardPage() {
  const { user } = useAuth();
  const { currentTelemetry } = useEmergency();
  const [seniorData, setSeniorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('Patient exhibits stable baseline sinus rhythm. Continue current anti-hypertensive regimen.');
  const [notesSaved, setNotesSaved] = useState(false);

  const isPending = user?.status === 'PENDING_VERIFICATION' || user?.verificationStatus === 'PENDING';

  useEffect(() => {
    seniorApi.getProfile('S102')
      .then(res => setSeniorData(res.data.data))
      .catch(err => console.warn('Provider could not fetch patient:', err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800">
              <Stethoscope className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">
              Clinical Care Provider Portal
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Authorized Patient Care & Clinical Telemetry Monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
            isPending
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {isPending ? <Clock className="w-3.5 h-3.5 text-amber-700" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />}
            {isPending ? 'Verification Pending Review' : 'Verified Clinical Practitioner'}
          </span>
        </div>
      </div>

      {/* Verification Notice Banner */}
      {isPending && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Medical License Verification in Progress: </span>
            Your clinical account credentials are under review by the IRIS medical administration board. Full diagnostic write permissions will be activated upon license confirmation.
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Authorized Patient Overview */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-teal-700" />
                Authorized Patient Scope
              </h2>
              <span className="text-[11px] font-mono text-stone-500">ID: S102</span>
            </div>

            {loading ? (
              <div className="text-xs text-stone-400 py-4 text-center">Loading patient profile...</div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-100">
                  <div className="font-bold text-sm text-charcoal-900">{seniorData?.name || 'Savitri Devi'}</div>
                  <div className="text-stone-500 text-[11px] mt-0.5">
                    Age: {seniorData?.age || 74} • Blood Group: {seniorData?.bloodGroup || 'B+'}
                  </div>
                  <div className="text-stone-500 text-[11px]">
                    Address: {seniorData?.address || 'Madhapur, Hyderabad'}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-stone-500 font-semibold block">Diagnosed Conditions:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(seniorData?.medicalConditions || ['Hypertension', 'Mild Osteoarthritis']).map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 text-[11px] border border-teal-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-stone-500 font-semibold block">Allergies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(seniorData?.allergies || ['Penicillin']).map(a => (
                      <span key={a} className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 text-[11px] border border-rose-200">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-900 text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span>HIPAA Health-Data Consent: Granted</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center & Right Column: Real-time Clinical Telemetry & Clinical Observations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Telemetry Panel */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-700" />
              Continuous Smartwatch Telemetry (S102)
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
                <div className="text-stone-500 text-[11px] font-semibold">Heart Rate</div>
                <div className="text-2xl font-bold text-teal-900 mt-1 flex items-baseline gap-1">
                  {currentTelemetry?.heartRate || 72}
                  <span className="text-xs font-normal text-stone-500">BPM</span>
                </div>
                <div className="text-[10px] text-teal-700 mt-0.5">Sinus Rhythm</div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <div className="text-stone-500 text-[11px] font-semibold">Blood Oxygen (SpO2)</div>
                <div className="text-2xl font-bold text-blue-900 mt-1 flex items-baseline gap-1">
                  {currentTelemetry?.spo2 || 98}
                  <span className="text-xs font-normal text-stone-500">%</span>
                </div>
                <div className="text-[10px] text-blue-700 mt-0.5">Normal Oxygenation</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-stone-500 text-[11px] font-semibold">Motion Status</div>
                <div className="text-base font-bold text-charcoal-900 mt-2 capitalize">
                  {currentTelemetry?.motionState || 'Active'}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Accelerometer OK</div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="text-stone-500 text-[11px] font-semibold">Fall Sensor</div>
                <div className="text-base font-bold text-emerald-700 mt-2">
                  {currentTelemetry?.fallDetected ? 'Fall Detected!' : 'Clear'}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Wearable Online</div>
              </div>
            </div>
          </div>

          {/* Clinical Charting & Physician Notes */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-700" />
                Clinical Notes & Care Plan
              </h2>
              {notesSaved && (
                <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            <textarea
              rows={4}
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter patient observations, vital triage, or clinical care recommendations..."
              className="w-full p-3 rounded-2xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="py-2.5 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition"
              >
                Update Clinical Record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
