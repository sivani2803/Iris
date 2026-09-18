import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, isAuthenticated, loading, hasRole, onboardingCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-stone-600 mt-4 font-semibold tracking-wide">
          Verifying cryptographic health session...
        </p>
        <span className="text-[11px] text-stone-400 mt-1">IRIS Care Network Security Standard</span>
      </div>
    );
  }

  // 1. Unauthenticated users must log in
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Incomplete onboarding gatekeeper: must complete required profile setup
  if (user && onboardingCompleted === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // 3. Role-Based Access Control gatekeeper
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ attemptedRole: user.role, requiredRoles: allowedRoles, attemptedPath: location.pathname }}
        replace
      />
    );
  }

  return children;
}
