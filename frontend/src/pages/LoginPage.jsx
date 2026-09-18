import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await login(email, password);
      // Route by role
      if (from && from !== '/' && from !== '/login') {
        navigate(from, { replace: true });
      } else if (user.role === 'senior') {
        navigate('/senior', { replace: true });
      } else if (user.role === 'caretaker') {
        navigate('/caretaker', { replace: true });
      } else if (user.role === 'admin') {
        navigate('/family', { replace: true });
      } else {
        navigate('/family', { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setTimeout(() => {
      login(roleEmail, 'Password123!').then((user) => {
        if (user.role === 'senior') navigate('/senior', { replace: true });
        else if (user.role === 'caretaker') navigate('/caretaker', { replace: true });
        else navigate('/family', { replace: true });
      }).catch((e) => setErrorMessage(e.message));
    }, 50);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-stone-200 shadow-xl space-y-6 animate-in fade-in">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center mx-auto mb-3 text-teal-700">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900">Sign In to IRIS</h1>
          <p className="text-xs text-stone-500 mt-1">
            Enterprise Senior-Care & Safety Command Network
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700 block mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@iris.care"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700 block mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-40"
          >
            {loading ? 'Authenticating...' : 'Sign In with JWT'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Fast Role Presets for Evaluators */}
        <div className="pt-4 border-t border-stone-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-2 text-center">
            Or Click to Authenticate as Test Profile (Bcrypt Verified)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('family@iris.care')}
              className="p-2.5 rounded-xl border border-stone-200 hover:border-teal-300 hover:bg-teal-50/50 text-left text-xs transition"
            >
              <div className="font-bold text-stone-900">👨💼 Family Portal</div>
              <div className="text-[10px] text-stone-500 font-mono">family@iris.care</div>
            </button>

            <button
              onClick={() => handleQuickLogin('caretaker@iris.care')}
              className="p-2.5 rounded-xl border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 text-left text-xs transition"
            >
              <div className="font-bold text-stone-900">🧑⚕️ Caretaker Portal</div>
              <div className="text-[10px] text-stone-500 font-mono">caretaker@iris.care</div>
            </button>

            <button
              onClick={() => handleQuickLogin('senior@iris.care')}
              className="p-2.5 rounded-xl border border-stone-200 hover:border-purple-300 hover:bg-purple-50/50 text-left text-xs transition"
            >
              <div className="font-bold text-stone-900">👵 Senior Interface</div>
              <div className="text-[10px] text-stone-500 font-mono">senior@iris.care</div>
            </button>

            <button
              onClick={() => handleQuickLogin('admin@iris.care')}
              className="p-2.5 rounded-xl border border-stone-200 hover:border-stone-400 hover:bg-stone-50 text-left text-xs transition"
            >
              <div className="font-bold text-stone-900">🛡️ Admin Console</div>
              <div className="text-[10px] text-stone-500 font-mono">admin@iris.care</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
