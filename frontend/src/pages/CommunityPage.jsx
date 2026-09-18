import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Video, Calendar, Clock, Users, Compass, Heart, MessageSquare, CheckCircle2, ChevronRight } from 'lucide-react';

export default function CommunityPage() {
  const [checkIns, setCheckIns] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeCallRoom, setActiveCallRoom] = useState(null);

  useEffect(() => {
    axios.get('/api/family/check-ins/S102').then((res) => setCheckIns(res.data.data)).catch(() => {});
    axios.get('/api/family/activities').then((res) => setActivities(res.data.data)).catch(() => {});
  }, []);

  const handleJoinCall = (call) => {
    setActiveCallRoom(call);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900">Family Connection & Purpose</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Community Vitality
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Combating isolation through scheduled family video check-ins and neighborhood interest circles.
        </p>
      </div>

      {/* Video Call Active Simulation Modal */}
      {activeCallRoom && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-stone-200 shadow-2xl space-y-4 animate-in zoom-in-95 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center mx-auto text-2xl">
              📹
            </div>
            <h2 className="text-xl font-bold text-charcoal-900">
              Live Call: {activeCallRoom.title}
            </h2>
            <p className="text-xs text-stone-600">
              Connected with {activeCallRoom.familyMemberName} ({activeCallRoom.relationship}). Video feed active with adaptive noise cancellation.
            </p>

            <div className="h-44 bg-stone-900 rounded-2xl flex items-center justify-center text-stone-400 text-xs font-mono relative overflow-hidden">
              <span className="animate-pulse flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Secure Family Room Active • HD Audio
              </span>
            </div>

            <button
              onClick={() => setActiveCallRoom(null)}
              className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Scheduled Family Check-Ins */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
          <Video className="w-4 h-4 text-purple-600" />
          Scheduled Family Check-Ins
        </h2>

        <div className="space-y-3">
          {checkIns.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0 text-xl font-bold">
                  👩💼
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-charcoal-900">{item.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                      {item.relationship}
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-1 flex items-center gap-2">
                    <span>With {item.familyMemberName}</span>
                    <span>•</span>
                    <span className="font-semibold text-stone-800">{item.scheduledDay} at {item.scheduledTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: [ Join ] [ Reschedule ] */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={() => alert(`Reschedule request sent to ${item.familyMemberName}.`)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleJoinCall(item)}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <Video className="w-3.5 h-3.5" />
                  Join Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Purpose & Community Activities */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500 mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-teal-600" />
          Today's Neighborhood Activities
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activities.map((act) => (
            <div key={act.id} className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                  {act.category}
                </span>
                <h3 className="text-base font-bold text-charcoal-900 mt-2">{act.title}</h3>
                <div className="text-xs text-stone-500 mt-1 font-mono">{act.time}</div>
                <div className="text-xs text-stone-600 mt-1.5">{act.location}</div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-400">{act.participantsCount} attending</span>
                <button
                  onClick={() => alert(`Joined ${act.title}! Reminder added to senior calendar.`)}
                  className="text-teal-700 font-bold hover:underline"
                >
                  RSVP →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
