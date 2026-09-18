import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, Clock, MapPin, Phone, ShieldCheck, CheckCircle2, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function TransportPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('City Hospital, Jubilee Hills');
  const [mobilityRequirement, setMobilityRequirement] = useState('Wheelchair accessible');
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [appointmentReason, setAppointmentReason] = useState('Cardiology Consultation');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/api/transport/S102');
      setRequests(res.data.data);
    } catch (err) {
      console.error('Failed to load transport:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleBookTransport = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/transport', {
        seniorId: 'S102',
        destination,
        mobilityRequirement,
        preferredTime,
        appointmentReason
      });
      setBookingSuccess(true);
      fetchRequests();
      setTimeout(() => setBookingSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to book transport:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900">Assisted Medical Transportation</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Mobility Concierge
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          Specialized wheelchair-accessible transit for seniors with verified caregiver escorts.
        </p>
      </div>

      {bookingSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Transport request submitted! Driver Suresh Verma has been assigned and will arrive at 09:48 AM.</span>
        </div>
      )}

      {/* Grid: Request Form vs Active Bookings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Request Booking Form */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs">
          <h2 className="text-base font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-600" />
            Request Assisted Ride
          </h2>

          <form onSubmit={handleBookTransport} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Destination Address</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Apollo Hospital or City Clinic"
                className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Appointment Purpose</label>
              <input
                type="text"
                value={appointmentReason}
                onChange={(e) => setAppointmentReason(e.target.value)}
                placeholder="e.g. Routine blood test"
                className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Preferred Time</label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mobility Needs</label>
                <select
                  value={mobilityRequirement}
                  onChange={(e) => setMobilityRequirement(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-stone-900 bg-stone-50"
                >
                  <option value="Wheelchair accessible">Wheelchair Ramp Required</option>
                  <option value="Walking assistance">Walking Cane / Arm Assist</option>
                  <option value="Standard">Standard Vehicle</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition"
              >
                Confirm Transit Request
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Assigned Driver & Upcoming Transit Card */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            Scheduled & Assigned Rides
          </h2>

          {requests.length === 0 ? (
            <div className="bg-stone-50 rounded-3xl p-8 border border-stone-200 text-center text-xs text-stone-500">
              No pending transit requests. Book a vehicle when needed.
            </div>
          ) : (
            requests.map((r) => (
              <div key={r._id} className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                    {r.status === 'driver_assigned' ? 'Driver Assigned & En Route' : r.status}
                  </span>
                  <span className="font-mono text-xs text-stone-500">{r.preferredTime}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-stone-900">{r.destination}</div>
                      <div className="text-stone-500 text-[11px]">{r.appointmentReason}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-stone-600">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{r.mobilityRequirement}</span>
                  </div>
                </div>

                {/* Driver Details Box */}
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-charcoal-900">{r.driverName}</div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      Vehicle: {r.vehicleNumber} • ETA: {r.etaMinutes} min
                    </div>
                  </div>

                  <a
                    href={`tel:${r.driverPhone}`}
                    className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 transition"
                    title="Call Driver"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
