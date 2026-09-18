import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Shield, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      setMessage(res.data.message || "If an account exists for this email, we'll send password reset instructions.");
      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to process reset request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center p-4 sm:p-6 bg-surface-warm">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-9 border border-stone-200 shadow-xl shadow-stone-200/50 space-y-6 animate-in fade-in duration-300">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3 text-teal-700 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">
            Reset your password
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
            Enter your registered email address to receive password recovery instructions.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-800">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-700" />
                <span>Instructions Sent</span>
              </div>
              <p className="text-stone-600 leading-relaxed">
                {message}
              </p>
              <p className="text-[11px] text-stone-400">
                Please check your inbox as well as your spam folder.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition"
            >
              Return to Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@iris.care"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Sending Instructions...' : 'Send Password Reset Email'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-stone-600 hover:text-teal-700 inline-flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
