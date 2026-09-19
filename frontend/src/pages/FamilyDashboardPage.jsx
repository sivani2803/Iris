import React, { useState, useEffect } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { useLanguage } from '../context/LanguageContext';
import { IMAGES } from '../assets/images';
import CareNetworkGraph from '../components/CareNetworkGraph';
import LiveTimeline from '../components/LiveTimeline';
import NodeErrorBoundary from '../components/common/NodeErrorBoundary';
import { seniorApi, medicineApi, appointmentApi, authApi } from '../services/api';
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
  Phone,
  Link as LinkIcon,
  ShieldCheck,
  UserPlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FamilyDashboardPage() {
  const { currentTelemetry, activeEmergency, refreshEmergency } = useEmergency();
  const { t } = useLanguage();
  const [recentEvents, setRecentEvents] = useState([]);
  const [seniorProfile, setSeniorProfile] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [loading, setLoading] = useState(true);

  // Real medicines and appointments for the connected senior
  const [medicines, setMedicines] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // Connect Senior Form State
  const [connectSeniorId, setConnectSeniorId] = useState('');
  const [connectInviteCode, setConnectInviteCode] = useState('');
  const [connectRelationship, setConnectRelationship] = useState('Family');
  const [connectError, setConnectError] = useState(null);
  const [connectSuccess, setConnectSuccess] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const fetchSeniorData = async () => {
    setLoading(true);
    try {
      const res = await seniorApi.getMe();
      if (res.data?.connected && res.data?.data) {
        setSeniorProfile(res.data.data);
        setIsConnected(true);

        // Fetch health
        try {
          const healthRes = await seniorApi.getMyHealth();
          if (healthRes.data?.data?.recentHistory) {
            setRecentEvents(healthRes.data.data.recentHistory);
          }
        } catch (_) {}

        // Fetch medicines
        try {
          const medsRes = await medicineApi.getMyMedicines();
          if (medsRes.data?.data?.medicines) {
            setMedicines(medsRes.data.data.medicines);
          }
        } catch (_) {}

        // Fetch appointments
        try {
          const apptsRes = await appointmentApi.getMyAppointments();
          if (apptsRes.data?.data) {
            setAppointments(apptsRes.data.data);
          }
        } catch (_) {}
      } else {
        setSeniorProfile(null);
        setIsConnected(false);
      }
    } catch (err) {
      console.warn('Could not resolve connected senior profile:', err.message);
      setSeniorProfile(null);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeniorData();
  }, [activeEmergency]);

  const handleConnectSenior = async (e) => {
    e.preventDefault();
    setConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    try {
      const res = await authApi.connectSenior({
        seniorId: connectSeniorId.trim(),
        inviteCode: connectInviteCode.trim(),
        relationship: connectRelationship
      });

      if (res.data?.success) {
        setConnectSuccess('Successfully connected to your loved one!');
        await fetchSeniorData();
        await refreshEmergency();
      }
    } catch (err) {
      setConnectError(err.response?.data?.message || 'Failed to connect. Please check the Senior ID and Invite Code.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img
              src={IMAGES.seniorAvatarRamesh.src}
              alt={IMAGES.seniorAvatarRamesh.alt}
              width={IMAGES.seniorAvatarRamesh.width}
              height={IMAGES.seniorAvatarRamesh.height}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
            />
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-charcoal-900">
                {t('familyPeaceOfMind') || 'Family Peace-of-Mind Command'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                {t('liveGuardActive') || 'Live Iris Guard Active'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {seniorProfile ? (
                <span>
                  Monitoring: <strong>{seniorProfile.name}</strong> (Age {seniorProfile.age || '74'}) • {seniorProfile.address || 'Address on file'}
                </span>
              ) : (
                <span className="text-stone-600 font-medium">
                  Monitoring: <strong>Ramesh Patel</strong> (Age 74) • Senior Villa, Hyderabad
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/simulator"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 shadow-2xs flex items-center gap-2 transition"
          >
            <Wifi className="w-3.5 h-3.5 text-teal-600" />
            Watch Simulator
          </Link>
          <Link
            to="/caretaker"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-charcoal-900 text-white hover:bg-charcoal-800 shadow-2xs flex items-center gap-2 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            Caretaker View
          </Link>
        </div>
      </div>

      {/* UNCONNECTED FAMILY MEMBER PROMPT CARD */}
      {!isConnected && !loading && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-teal-200 shadow-md">
          <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
            <div className="max-w-lg">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-extrabold text-charcoal-950">
                {t('connectSenior') || 'Connect to your Loved One'}
              </h2>
              <p className="text-sm text-stone-600 mt-2 leading-relaxed">
                {t('connectPrompt') || "Enter your loved one's Senior ID and Invite Code to monitor their vitals in real-time."}
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-stone-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Protected by cryptographic identity verification</span>
              </div>
            </div>

            {/* Connection Form */}
            <form onSubmit={handleConnectSenior} className="w-full md:max-w-sm space-y-3 bg-stone-50/60 p-5 rounded-2xl border border-stone-200">
              {connectError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {connectError}
                </div>
              )}
              {connectSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  {connectSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-charcoal-900 mb-1">
                  {t('seniorId') || 'Senior ID'}
                </label>
                <input
                  type="text"
                  value={connectSeniorId}
                  onChange={(e) => setConnectSeniorId(e.target.value)}
                  placeholder="e.g. S102 or S2968"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono uppercase focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-900 mb-1">
                  {t('inviteCode') || 'Invite Code'}
                </label>
                <input
                  type="text"
                  value={connectInviteCode}
                  onChange={(e) => setConnectInviteCode(e.target.value)}
                  placeholder="e.g. IRIS-S102"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-mono uppercase focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal-900 mb-1">
                  Relationship
                </label>
                <select
                  value={connectRelationship}
                  onChange={(e) => setConnectRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="Son">Son</option>
                  <option value="Daughter">Daughter</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="Family">Other Family Member</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                {connecting ? 'Connecting...' : (t('connect') || 'Connect')}
              </button>
            </form>
          </div>
        </div>
      )}

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
                  {activeEmergency.summary || t('emergencyDetected') || 'Possible emergency detected'}
                </h2>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 border border-rose-200 text-right">
              <div className="text-[10px] uppercase font-semibold text-stone-500">
                {t('assignedResponder') || 'Assigned Responder'}
              </div>
              <div className="text-base font-bold text-rose-950">
                {activeEmergency.assignedCaretakerData?.name || 'Searching Best Responder...'}
              </div>
              <div className="text-xs text-rose-700 font-medium">
                {activeEmergency.etaMinutes ? `${t('eta') || 'Estimated Arrival'}: ~${activeEmergency.etaMinutes} min` : 'Locating Nearest Responder'}
              </div>
            </div>
          </div>

          {/* Emergency Telemetry Snapshot */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">{t('heartRate') || 'Heart Rate'}</div>
              <div className="text-xl font-bold font-mono text-rose-600">
                {activeEmergency.triggerEvent?.heartRate || currentTelemetry.heartRate} BPM
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">{t('spo2') || 'SpO2 Oxygen'}</div>
              <div className="text-xl font-bold font-mono text-cyan-700">
                {activeEmergency.triggerEvent?.spo2 || currentTelemetry.spo2}%
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-rose-100">
              <div className="text-[10px] uppercase font-semibold text-stone-500">{t('movement') || 'Movement'}</div>
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
            <span className="font-semibold">{t('allVitalsNormal') || 'All vitals within normal range'} • No Active Emergency</span>
          </div>
          <span className="text-teal-700 font-medium">{t('liveGuardActive') || 'IRIS Monitoring Active'}</span>
        </div>
      )}

      {/* Top Section: Live Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
              {t('heartRate') || 'Live Heart Rate'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Heart className={`w-4 h-4 ${currentTelemetry.heartRate > 110 ? 'animate-ping' : ''}`} />
            </div>
          </div>
          <div className="text-3xl font-bold font-mono text-charcoal-900 mt-3 flex items-baseline gap-1.5">
            {currentTelemetry.heartRate} <span className="text-xs font-sans text-stone-500 font-normal">BPM</span>
          </div>
          <div className="text-xs text-stone-500 mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {seniorProfile?.baselineVitals?.restingHeartRate ? `Baseline resting: ${seniorProfile.baselineVitals.restingHeartRate} BPM` : 'Resting Baseline'}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
              {t('spo2') || 'Live SpO2 Saturation'}
            </span>
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

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-stone-500 tracking-wider">
              {t('watchStatus') || 'Smartwatch Sensor'}
            </span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-charcoal-900 mt-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            Wearable Online
          </div>
          <div className="text-xs text-stone-500 mt-2">
            {t('movement') || 'Movement'}: <span className="font-semibold uppercase text-stone-800">{currentTelemetry.motionState}</span>
          </div>
        </div>
      </div>

      {/* Visual Care Network Graph */}
      <NodeErrorBoundary nodeName="Care Network Graph">
        <CareNetworkGraph
          activeEmergency={activeEmergency}
          seniorName={seniorProfile?.name || 'Senior'}
          seniorId={seniorProfile?.seniorId}
          caretakerName={activeEmergency?.assignedCaretakerData?.name || 'Assigned Responder'}
        />
      </NodeErrorBoundary>

      {/* Two Column Layout: Live Timeline vs Schedule & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Live Response Timeline */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-charcoal-900">
                {t('timeline') || 'Live Response & Reassessment Timeline'}
              </h3>
              <p className="text-xs text-stone-500">
                Synchronized instantaneously with backend risk engine and responder actions
              </p>
            </div>
            <button
              onClick={() => {
                refreshEmergency();
                fetchSeniorData();
              }}
              className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-semibold cursor-pointer"
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

        {/* Right Col: Real Adherence, Appointments, and Contacts */}
        <div className="space-y-6">
          {/* Real Medicine Adherence Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-teal-600" />
                {t('dailyAdherence') || 'Medication Adherence'}
              </h3>
              <span className="text-xs font-bold text-teal-700">
                {medicines.filter(m => m.status === 'taken').length} / {medicines.length} Taken
              </span>
            </div>
            {medicines.length > 0 ? (
              <div className="space-y-2 text-xs">
                {medicines.slice(0, 3).map((med) => (
                  <div key={med._id || med.name} className="p-2.5 rounded-xl bg-stone-50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-stone-900">{med.name} ({med.dosage})</div>
                      <div className="text-[11px] text-stone-500">{med.time} • {med.frequency || 'Daily'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      med.status === 'taken' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {med.status ? med.status.toUpperCase() : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-3 text-center">
                {seniorProfile ? 'No scheduled prescriptions.' : 'Connect senior to view prescriptions.'}
              </p>
            )}
          </div>

          {/* Real Upcoming Appointment */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                {t('upcomingCheckup') || 'Next Appointment'}
              </h3>
              <Link to="/appointments" className="text-[11px] text-teal-700 hover:underline font-semibold">
                {t('viewAll') || 'View All →'}
              </Link>
            </div>
            {appointments.length > 0 ? (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs">
                <div className="font-bold text-stone-900">{appointments[0].doctor}</div>
                <div className="text-stone-500 text-[11px]">{appointments[0].specialty} • {appointments[0].location}</div>
                <div className="text-stone-600 mt-1 font-mono text-[11px]">{appointments[0].date} at {appointments[0].time}</div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 py-3 text-center">
                {seniorProfile ? 'No clinical visits scheduled.' : 'Connect senior to view appointments.'}
              </p>
            )}
          </div>

          {/* Emergency Contacts */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Fast Escalation Contacts
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50">
                <div>
                  <div className="font-semibold text-stone-900">
                    {seniorProfile?.emergencyContacts?.[0]?.name || 'Primary Emergency Contact'}
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {seniorProfile?.emergencyContacts?.[0]?.phone || '+91 98765 00000'}
                  </div>
                </div>
                {seniorProfile?.emergencyContacts?.[0]?.phone && (
                  <a
                    href={`tel:${seniorProfile.emergencyContacts[0].phone}`}
                    className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
