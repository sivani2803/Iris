import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Activity,
  FileText
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusActionLoading, setStatusActionLoading] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [usersRes, auditRes] = await Promise.all([
        axios.get('/api/auth/admin/users').catch(() => ({ data: { data: [] } })),
        axios.get('/api/auth/admin/audit-logs').catch(() => ({ data: { data: { recentAuditEvents: [] } } }))
      ]);

      setUsers(usersRes.data.data || []);
      setAuditLogs(auditRes.data.data?.recentAuditEvents || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateStatus = async (userId, newStatus, newVerification) => {
    setStatusActionLoading(userId);
    setActionFeedback(null);

    try {
      await axios.patch(`/api/auth/admin/users/${userId}/status`, {
        status: newStatus,
        verificationStatus: newVerification
      });

      setUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, status: newStatus, verificationStatus: newVerification } : u))
      );

      setActionFeedback({ success: true, message: `User status successfully updated to ${newStatus}.` });
    } catch (err) {
      setActionFeedback({ success: false, message: err.response?.data?.message || 'Failed to update user status.' });
    } finally {
      setStatusActionLoading(null);
      setTimeout(() => setActionFeedback(null), 3500);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-charcoal-900 text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">
              Administrative Command Console
            </h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Care Network User Governance, Verification Queue & HIPAA Audit Trail
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="py-2.5 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Console
        </button>
      </div>

      {/* Feedback Banner */}
      {actionFeedback && (
        <div className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
          actionFeedback.success ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
        }`}>
          {actionFeedback.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{actionFeedback.message}</span>
        </div>
      )}

      {/* User Governance Table */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-700" />
            <h2 className="text-sm font-bold text-charcoal-900">User Network Directory & Verifications</h2>
            <span className="text-[11px] font-mono text-stone-400">({filteredUsers.length} total)</span>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-bold">User</th>
                <th className="py-2.5 font-bold">Role</th>
                <th className="py-2.5 font-bold">Account Status</th>
                <th className="py-2.5 font-bold">Verification</th>
                <th className="py-2.5 font-bold">Senior Scope</th>
                <th className="py-2.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-stone-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isPendingReview = u.status === 'PENDING_VERIFICATION' || u.verificationStatus === 'PENDING';
                  return (
                    <tr key={u._id} className="hover:bg-stone-50/60 transition">
                      <td className="py-3">
                        <div className="font-bold text-charcoal-900">{u.name}</div>
                        <div className="text-[11px] font-mono text-stone-500">{u.email}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded uppercase font-bold text-[10px] tracking-wider bg-stone-100 text-stone-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : u.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : u.status === 'ONBOARDING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-[11px] font-semibold text-stone-600">
                          {u.verificationStatus || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-stone-600">
                        {u.seniorId || 'S102'}
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        {isPendingReview && (
                          <button
                            onClick={() => handleUpdateStatus(u._id, 'ACTIVE', 'VERIFIED')}
                            disabled={statusActionLoading === u._id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs transition"
                          >
                            Approve
                          </button>
                        )}
                        {u.status !== 'SUSPENDED' ? (
                          <button
                            onClick={() => handleUpdateStatus(u._id, 'SUSPENDED', u.verificationStatus)}
                            disabled={statusActionLoading === u._id}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-rose-50 hover:text-rose-700 text-stone-600 font-semibold text-[10px] transition"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u._id, 'ACTIVE', u.verificationStatus)}
                            disabled={statusActionLoading === u._id}
                            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[10px] transition"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Stream */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-charcoal-900">Security & Authentication Audit Stream</h2>
          </div>
          <span className="text-[10px] font-mono text-stone-400">HIPAA/DISHA Immutable Ledger</span>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <div className="text-xs text-stone-400 py-4 text-center">No recent audit logs available.</div>
          ) : (
            auditLogs.slice(0, 15).map((log, idx) => (
              <div key={log._id || idx} className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    log.action?.includes('VIOLATION') ? 'bg-rose-500' : 'bg-teal-500'
                  }`}></span>
                  <div>
                    <span className="font-bold text-stone-800 font-mono text-[11px]">{log.action}</span>
                    <span className="text-stone-500 ml-2">by {log.actor} ({log.actorRole})</span>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-stone-400">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
