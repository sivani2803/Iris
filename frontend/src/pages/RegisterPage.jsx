import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, User, Mail, Lock, Phone, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, HeartHandshake, Users, UserCheck, Stethoscope, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'senior'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [isPartialFailure, setIsPartialFailure] = useState(false);

  const roleOptions = [
    {
      id: 'senior',
      title: 'Senior Citizen',
      description: 'I want support, safety and an easier way to stay connected.',
      icon: UserCheck,
      color: 'teal'
    },
    {
      id: 'family',
      title: 'Family Member',
      description: 'I care for someone and want to stay connected.',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'caretaker',
      title: 'Caregiver',
      description: 'I provide care and emergency response support.',
      icon: HeartHandshake,
      color: 'amber'
    },
    {
      id: 'healthcare_provider',
      title: 'Healthcare Provider',
      description: 'I support seniors through professional clinical care.',
      icon: Stethoscope,
      color: 'purple'
    }
  ];

  const handleNextStep = (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Phone format validation
    if (!formData.phone || formData.phone.trim().length < 7) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMessage(null);
    setIsPartialFailure(false);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        phone: formData.phone.trim(),
        seniorId: 'S102'
      });

      // Successfully registered and logged in -> transition to role-specific onboarding
      navigate('/onboarding', { replace: true });
    } catch (err) {
      console.error('[IRIS Register] Error during registration:', err);
      const isPartial = Boolean(err.isPartialFailure || err.message?.includes('finish setting up'));
      setIsPartialFailure(isPartial);

      if (isPartial) {
        setErrorMessage("We created your sign-in account, but couldn't finish setting up your IRIS profile.");
      } else {
        setErrorMessage(err.response?.data?.message || err.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center p-4 sm:p-6 bg-surface-warm">
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl shadow-stone-200/50 space-y-6 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center mx-auto mb-3 text-teal-700 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">
            {step === 1 ? 'Create your IRIS account' : 'What is your role in IRIS?'}
          </h1>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {step === 1
              ? 'Join the integrated senior care and safety command network'
              : 'Select your role so we can tailor your experience'}
          </p>

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-10 bg-teal-700' : 'w-4 bg-teal-200'}`}></div>
            <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-10 bg-teal-700' : 'w-4 bg-stone-200'}`}></div>
          </div>
        </div>

        {/* Error Alert with Partial Registration Recovery */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed font-semibold">{errorMessage}</span>
            </div>
            {isPartialFailure && (
              <div className="pt-2 border-t border-rose-200/80 flex items-center justify-between">
                <span className="text-[11px] text-rose-700">Your login credentials exist safely.</span>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs shadow-xs transition"
                >
                  {loading ? 'Retrying Setup...' : 'Retry profile setup'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Account Credentials */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Savitri Devi or Rohan Sharma"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@iris.care"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 8 characters"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                  />
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1.5">Mobile Number (with country code)</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition"
                />
                <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition"
            >
              Continue to Role Selection
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Role Selection */}
        {step === 2 && (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="grid grid-cols-1 gap-3">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = formData.role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, role: opt.id })}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-4 transition duration-200 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-600'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-charcoal-900">{opt.title}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0" />}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 leading-relaxed">{opt.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? 'Creating IRIS Account...' : 'Complete Registration'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Existing Account Footer */}
        <div className="text-center pt-2 border-t border-stone-100">
          <p className="text-xs text-stone-600">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-teal-700 hover:text-teal-800 transition underline underline-offset-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
