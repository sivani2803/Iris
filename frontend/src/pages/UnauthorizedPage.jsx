import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UnauthorizedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { attemptedRole, requiredRoles, attemptedPath } = location.state || {};

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border-2 border-rose-200 shadow-xl text-center space-y-4 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-2xl font-bold text-charcoal-900 mt-2">Access Restricted</h1>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Your active account role <strong className="text-rose-700 font-mono uppercase font-bold">[{attemptedRole || user?.role || 'Guest'}]</strong> lacks authorization to access this partition {attemptedPath ? <code className="bg-stone-100 px-1 rounded text-stone-800 font-mono text-[11px]">{attemptedPath}</code> : ''}.
        </p>

        {requiredRoles && requiredRoles.length > 0 && (
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 text-[11px] text-stone-600">
            <span className="text-stone-500 font-semibold block mb-1">Required Clearance Role:</span>
            <div className="flex justify-center gap-1.5 flex-wrap">
              {requiredRoles.map((r) => (
                <span key={r} className="px-2 py-0.5 rounded-md bg-stone-200 text-stone-800 font-mono font-bold uppercase">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-2xl bg-charcoal-950 hover:bg-charcoal-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Authorized Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
