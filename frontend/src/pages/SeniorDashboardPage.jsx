import React, { useState } from 'react';
import { useEmergency } from '../context/EmergencyContext';
import { useLanguage } from '../context/LanguageContext';
import { emergencyApi } from '../services/api';
import { IMAGES } from '../assets/images';
import {
  ShieldAlert,
  Mic,
  Pill,
  Calendar,
  Users,
  Car,
  Heart,
  Wind,
  PhoneCall,
  Check,
  AlertCircle,
  X,
  Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SeniorDashboardPage() {
  const { currentTelemetry, activeEmergency, refreshEmergency } = useEmergency();
  const { t, lang } = useLanguage();
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [medicineTaken, setMedicineTaken] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callStatus, setCallStatus] = useState(null);
  const [sosSending, setSosSending] = useState(false);

  // Manual SOS Trigger from Senior Screen
  const handleTriggerSOS = async () => {
    setSosSending(true);
    try {
      await emergencyApi.sendHealthEvent({
        seniorId: 'S102',
        heartRate: 118,
        spo2: 95,
        motionState: 'stationary',
        fallDetected: false,
        eventType: 'manual_sos',
        timestamp: new Date().toISOString()
      });
      await refreshEmergency();
      setSosModalOpen(false);
    } catch (e) {
      console.error('SOS failed:', e);
    } finally {
      setSosSending(false);
    }
  };

  const handleCallFamily = (personName, phone) => {
    setCallStatus(`Connecting direct audio to ${personName} (${phone})...`);
    setTimeout(() => {
      setCallStatus(`Connected with ${personName}! Speaking over speakerphone.`);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Reassuring Greeting Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            <img
              src={IMAGES.seniorAvatarRamesh.src}
              alt={IMAGES.seniorAvatarRamesh.alt}
              width={IMAGES.seniorAvatarRamesh.width}
              height={IMAGES.seniorAvatarRamesh.height}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-teal-600/30 shadow-sm"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs"></span>
          </div>
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              IRIS CONTINUOUS CARE
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-950 mt-2">
              {t('seniorGreeting')}
            </h1>
            <p className="text-sm text-stone-600 mt-1 font-medium">
              {t('irisTagline')}
            </p>
          </div>
        </div>

        {/* Live Vitals Minimal Pill */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center gap-6 shrink-0 text-center">
          <div>
            <div className="text-[11px] uppercase font-bold text-stone-500 flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              {t('heartRate')}
            </div>
            <div className="text-xl font-extrabold font-mono text-charcoal-900 mt-0.5">
              {currentTelemetry.heartRate} <span className="text-xs font-normal">BPM</span>
            </div>
          </div>
          <div className="w-px h-8 bg-stone-200"></div>
          <div>
            <div className="text-[11px] uppercase font-bold text-stone-500 flex items-center justify-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-600" />
              {t('spo2')}
            </div>
            <div className="text-xl font-extrabold font-mono text-charcoal-900 mt-0.5">
              {currentTelemetry.spo2}%
            </div>
          </div>
        </div>
      </div>

      {/* ACTIVE EMERGENCY STATUS IF TRIGGERED */}
      {activeEmergency && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-6 rounded-3xl bg-rose-50 border-4 border-rose-500 text-rose-950 shadow-xl animate-in fade-in"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center text-2xl shrink-0 animate-bounce" aria-hidden="true">
              🚨
            </div>
            <div className="flex-1">
              <div className="text-xs font-black tracking-wider uppercase text-rose-800 bg-rose-200 px-3 py-0.5 rounded-full inline-block">
                {t('activeEmergency')}
              </div>
              <h2 className="text-2xl font-black text-rose-950 mt-1">
                Help is on the way! Stay seated.
              </h2>
              <p className="text-base text-rose-800 font-semibold mt-1">
                Responder: <strong className="underline">{activeEmergency.assignedCaretakerData?.name || 'Ravi Kumar'}</strong> is on the way (ETA: ~{activeEmergency.etaMinutes} min).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* GIANT HIGH-CONTRAST EMERGENCY BUTTON (Section 13) */}
      <button
        type="button"
        aria-label="Activate Emergency SOS assistance now"
        onClick={() => setSosModalOpen(true)}
        className="w-full min-h-[110px] p-8 rounded-3xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-rose-400 text-white shadow-xl border-4 border-rose-700 transition flex flex-col sm:flex-row items-center justify-center gap-6 group cursor-pointer"
      >
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition" aria-hidden="true">
          <ShieldAlert className="w-12 h-12 text-white animate-pulse" />
        </div>
        <div className="text-center sm:text-left">
          <div className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
            {t('helpButton')}
          </div>
          <div className="text-base text-rose-100 font-semibold mt-1">
            Tap here anytime you need immediate assistance or feeling unwell
          </div>
        </div>
      </button>

      {/* MAIN LARGE ACTION TILES GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Tile 1: Talk to IRIS (Voice Assistant) */}
        <Link
          to="/ai"
          className="p-6 rounded-3xl bg-teal-700 hover:bg-teal-800 text-white shadow-md border-2 border-teal-800 transition flex items-center gap-5 group"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight">{t('talkToIris')}</h3>
            <p className="text-xs text-teal-100 font-medium mt-1">
              Ask health questions, describe symptoms, or speak in English, Telugu, or Hindi.
            </p>
          </div>
        </Link>

        {/* Tile 2: Medicines */}
        <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0 text-teal-700">
              <Pill className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                NEXT MEDICINE
              </span>
              <h3 className="text-lg font-black text-charcoal-950">Amlodipine (5 mg)</h3>
              <p className="text-xs text-stone-500 font-medium">08:00 AM • Daily with water</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
            <button
              onClick={() => setMedicineTaken(!medicineTaken)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
                medicineTaken
                  ? 'bg-emerald-600 text-white'
                  : 'bg-charcoal-900 text-white hover:bg-charcoal-800'
              }`}
            >
              <Check className="w-4 h-4" />
              {medicineTaken ? 'Marked as Taken ✓' : 'Mark Taken'}
            </button>
            <Link to="/medicines" className="text-xs font-semibold text-teal-700 hover:underline">
              View All →
            </Link>
          </div>
        </div>

        {/* Tile 3: Appointments */}
        <div className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0 text-amber-700">
              <Calendar className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                DOCTOR APPOINTMENT
              </span>
              <h3 className="text-lg font-black text-charcoal-950">Dr. Ananya Rao</h3>
              <p className="text-xs text-stone-500 font-medium">Cardiology • 22 Sept at 10:30 AM</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-bold text-stone-700">City Hospital, Jubilee Hills</span>
            <Link to="/appointments" className="text-xs font-semibold text-teal-700 hover:underline">
              Details →
            </Link>
          </div>
        </div>

        {/* Tile 4: Call Family */}
        <button
          onClick={() => setCallModalOpen(true)}
          className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm hover:border-stone-300 transition text-left flex items-center gap-5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 text-purple-700 group-hover:scale-105 transition">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-charcoal-950 uppercase">{t('family')}</h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              1-Tap Call to Rohan (Son) or Dr. Ananya (Daughter)
            </p>
          </div>
        </button>

        {/* Tile 5: Transport Ride Assistance */}
        <Link
          to="/transport"
          className="p-6 rounded-3xl bg-white border-2 border-stone-200 shadow-sm hover:border-stone-300 transition flex items-center gap-5 sm:col-span-2 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 text-sky-700 group-hover:scale-105 transition">
            <Car className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-charcoal-950 uppercase">{t('transport')}</h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Book medical transit with wheelchair assistance for doctor visits or grocery trips.
            </p>
          </div>
        </Link>
      </div>

      {/* SOS CONFIRMATION MODAL */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-rose-500 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <h2 className="text-2xl font-black text-charcoal-950">Confirm Emergency Call?</h2>
            <p className="text-sm text-stone-600">
              This will immediately alert Caretaker Ravi Kumar, notify your son Rohan, and dispatch help to your home.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSosModalOpen(false)}
                className="flex-1 py-4 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-base transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTriggerSOS}
                disabled={sosSending}
                className="flex-1 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-base shadow-lg transition"
              >
                {sosSending ? 'Alerting...' : 'YES, SEND HELP'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL FAMILY MODAL */}
      {callModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-xl font-bold text-charcoal-950">Family Direct Voice Call</h2>
              <button onClick={() => { setCallModalOpen(false); setCallStatus(null); }} className="p-1 rounded-lg hover:bg-stone-100">
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {callStatus ? (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center mx-auto animate-pulse">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-teal-900">{callStatus}</div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => handleCallFamily('Rohan Sharma (Son)', '+91 98765 11111')}
                  className="w-full p-4 rounded-2xl bg-stone-50 hover:bg-teal-50 hover:border-teal-300 border border-stone-200 text-left flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-base text-charcoal-900">Rohan Sharma (Son)</div>
                    <div className="text-xs text-stone-500 font-mono">+91 98765 11111</div>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-600 text-white">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => handleCallFamily('Dr. Ananya Sharma (Daughter)', '+91 98765 22222')}
                  className="w-full p-4 rounded-2xl bg-stone-50 hover:bg-teal-50 hover:border-teal-300 border border-stone-200 text-left flex items-center justify-between transition"
                >
                  <div>
                    <div className="font-bold text-base text-charcoal-900">Dr. Ananya Sharma (Daughter)</div>
                    <div className="text-xs text-stone-500 font-mono">+91 98765 22222</div>
                  </div>
                  <div className="p-3 rounded-xl bg-teal-600 text-white">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
