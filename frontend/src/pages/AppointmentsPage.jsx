import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, MapPin, User, Plus, Bell, RefreshCw, CheckCircle2, ChevronRight } from 'lucide-react';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [reminderSet, setReminderSet] = useState({});
  const [newAppt, setNewAppt] = useState({
    doctor: '',
    specialty: '',
    date: '24 Sept',
    time: '11:00 AM',
    location: 'City Hospital, Jubilee Hills',
    notes: 'Follow-up consultation'
  });

  const fetchAppointments = async () => {
    try {
      const res = await axios.get('/api/appointments/S102');
      setAppointments(res.data.data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/appointments', {
        seniorId: 'S102',
        ...newAppt
      });
      setModalOpen(false);
      setNewAppt({
        doctor: '',
        specialty: '',
        date: '24 Sept',
        time: '11:00 AM',
        location: 'City Hospital, Jubilee Hills',
        notes: 'Follow-up consultation'
      });
      fetchAppointments();
    } catch (err) {
      console.error('Failed to create appointment:', err);
    }
  };

  const handleToggleReminder = (id) => {
    setReminderSet((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900">Doctor Appointments</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Healthcare Calendar
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Coordinated clinical visits and specialist consultations for Savitri Devi (S102).
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-charcoal-950 text-white hover:bg-charcoal-800 text-xs font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Schedule Consultation
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((appt) => (
          <div
            key={appt._id}
            className="bg-white rounded-3xl p-6 border border-stone-200 hover:border-stone-300 shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center text-xl shrink-0 font-bold">
                👨⚕️
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-charcoal-900">{appt.doctor}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                    {appt.specialty}
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {appt.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-semibold text-stone-800">{appt.date}</span> at <span className="font-mono">{appt.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{appt.location}</span>
                  </div>
                </div>

                {appt.notes && (
                  <p className="text-xs text-stone-500 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    Notes: {appt.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons (Section 17: [ View ], [ Reschedule ], [ Add Reminder ]) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
              <button
                onClick={() => handleToggleReminder(appt._id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  reminderSet[appt._id]
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                {reminderSet[appt._id] ? 'Reminder Set ✓' : 'Add Reminder'}
              </button>

              <button
                onClick={() => alert(`Rescheduling modal simulated for ${appt.doctor}. New time requested for senior.`)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-stone-700 transition"
              >
                Reschedule
              </button>

              <button
                onClick={() => alert(`Location: ${appt.location}\nSpecialty: ${appt.specialty}\nDoctor: ${appt.doctor}`)}
                className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs font-semibold transition flex items-center gap-1"
              >
                View
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Consultation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-xl space-y-4 animate-in zoom-in-95"
          >
            <h2 className="text-xl font-bold text-charcoal-900">Schedule Doctor Visit</h2>
            <div>
              <label className="text-xs font-semibold text-stone-600">Doctor Name</label>
              <input
                type="text"
                required
                value={newAppt.doctor}
                onChange={(e) => setNewAppt({ ...newAppt, doctor: e.target.value })}
                placeholder="e.g. Dr. K. Srinivas"
                className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600">Specialty</label>
              <input
                type="text"
                required
                value={newAppt.specialty}
                onChange={(e) => setNewAppt({ ...newAppt, specialty: e.target.value })}
                placeholder="e.g. Neurology / Orthopedics"
                className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-600">Date</label>
                <input
                  type="text"
                  required
                  value={newAppt.date}
                  onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                  placeholder="e.g. 28 Sept"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">Time</label>
                <input
                  type="text"
                  required
                  value={newAppt.time}
                  onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                  placeholder="e.g. 04:15 PM"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600">Hospital Location</label>
              <input
                type="text"
                value={newAppt.location}
                onChange={(e) => setNewAppt({ ...newAppt, location: e.target.value })}
                className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 shadow-xs"
              >
                Confirm Appointment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
