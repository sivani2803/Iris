import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pill, Check, X, Plus, Clock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { medicineApi } from '../services/api';

export default function MedicinesPage() {
  const { user } = useAuth();
  const [data, setData] = useState({ medicines: [], adherenceRate: 100, takenCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '08:00 AM', instructions: 'Take after breakfast' });

  const fetchMedicines = async () => {
    try {
      if (user) {
        const res = await medicineApi.getMyMedicines();
        setData(res.data.data || { medicines: [], adherenceRate: 100, takenCount: 0, total: 0 });
      } else {
        const res = await axios.get('/api/medicines/S102');
        setData(res.data.data || { medicines: [], adherenceRate: 100, takenCount: 0, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load medicines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await medicineApi.updateStatus(id, status);
      fetchMedicines();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await medicineApi.addMedicine({
        seniorId: user?.seniorId || 'S102',
        ...newMed
      });
      setModalOpen(false);
      setNewMed({ name: '', dosage: '', time: '08:00 AM', instructions: 'Take after breakfast' });
      fetchMedicines();
    } catch (err) {
      console.error('Failed to add medicine:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-charcoal-900">Medication Management</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Daily Schedule
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {user?.name
              ? `Tracking daily prescriptions for ${user.name} with family adherence visibility.`
              : 'Tracking daily prescriptions for Savitri Devi (Demo S102) with family adherence visibility.'}
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-charcoal-950 text-white hover:bg-charcoal-800 text-xs font-semibold shadow-xs flex items-center gap-2 self-start sm:self-auto transition"
        >
          <Plus className="w-4 h-4" />
          Add Medication
        </button>
      </div>

      {/* Adherence Overview Banner */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-2xl font-mono">
            {data.adherenceRate}%
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Adherence Score</div>
            <div className="text-lg font-bold text-charcoal-900">
              {data.takenCount} of {data.total} Doses Confirmed Today
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Family members and caretaker Ravi Kumar receive alerts if a vital dose is missed.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 bg-stone-100 h-3 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${data.adherenceRate}%` }}
          ></div>
        </div>
      </div>

      {/* Medicines List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-500">
          Today's Prescription Schedule
        </h2>

        {data.medicines.map((med) => (
          <div
            key={med._id}
            className={`bg-white rounded-3xl p-5 border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
              med.status === 'taken'
                ? 'border-emerald-200 bg-emerald-50/20'
                : med.status === 'missed'
                ? 'border-rose-200 bg-rose-50/20'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                  med.status === 'taken'
                    ? 'bg-emerald-100 text-emerald-800'
                    : med.status === 'missed'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-teal-50 text-teal-700'
                }`}
              >
                <Pill className="w-6 h-6" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-charcoal-900">{med.name}</h3>
                  <span className="text-xs font-mono font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                    {med.dosage}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      med.status === 'taken'
                        ? 'bg-emerald-100 text-emerald-800'
                        : med.status === 'missed'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {med.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
                  <span className="flex items-center gap-1 font-mono font-medium text-stone-700">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {med.time} ({med.frequency})
                  </span>
                  <span>•</span>
                  <span>{med.instructions}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: [ Taken ] [ Missed ] */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => updateStatus(med._id, 'taken')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  med.status === 'taken'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                Taken
              </button>

              <button
                onClick={() => updateStatus(med._id, 'missed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  med.status === 'missed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-rose-50 hover:text-rose-800 text-stone-700'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                Missed
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Medication Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddMedicine}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-xl space-y-4 animate-in zoom-in-95"
          >
            <h2 className="text-xl font-bold text-charcoal-900">Add New Prescription</h2>
            <div>
              <label className="text-xs font-semibold text-stone-600">Medicine Name</label>
              <input
                type="text"
                required
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                placeholder="e.g. Lisinopril"
                className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-600">Dosage</label>
                <input
                  type="text"
                  required
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="e.g. 10 mg"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-600">Time</label>
                <input
                  type="text"
                  required
                  value={newMed.time}
                  onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                  placeholder="e.g. 08:00 AM"
                  className="w-full mt-1 p-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-600">Instructions</label>
              <input
                type="text"
                value={newMed.instructions}
                onChange={(e) => setNewMed({ ...newMed, instructions: e.target.value })}
                placeholder="e.g. Take with warm water after dinner"
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
                Save Medication
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
