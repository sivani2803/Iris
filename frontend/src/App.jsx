import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EmergencyProvider } from './context/EmergencyContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';

// Existing Pages
import LandingPage from './pages/LandingPage';
import WatchSimulatorPage from './pages/WatchSimulatorPage';
import FamilyDashboardPage from './pages/FamilyDashboardPage';
import CaretakerDashboardPage from './pages/CaretakerDashboardPage';
import SeniorDashboardPage from './pages/SeniorDashboardPage';
import AiAssistantPage from './pages/AiAssistantPage';
import MedicinesPage from './pages/MedicinesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import TransportPage from './pages/TransportPage';
import CommunityPage from './pages/CommunityPage';
import DemoPage from './pages/DemoPage';
import LoginPage from './pages/LoginPage';
import UnauthorizedPage from './pages/UnauthorizedPage';

// Production Auth & Onboarding Pages
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HealthcareProviderDashboardPage from './pages/HealthcareProviderDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary name="IRIS Root Application">
      <AuthProvider>
        <LanguageProvider>
          <EmergencyProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-surface-warm text-charcoal-900 font-sans">
                <Navbar />
                <main className="flex-1">
                  <ErrorBoundary name="IRIS Route Host">
                    <Routes>
                      {/* Public Authentication Routes */}
                      <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />

                  {/* Multi-Step Onboarding (Authenticated) */}
                  <Route
                    path="/onboarding"
                    element={
                      <ProtectedRoute>
                        <OnboardingPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Role-Specific Protected Dashboards */}
                  <Route
                    path="/senior"
                    element={
                      <ProtectedRoute allowedRoles={['senior', 'admin']}>
                        <SeniorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/family"
                    element={
                      <ProtectedRoute allowedRoles={['family', 'admin']}>
                        <FamilyDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caretaker"
                    element={
                      <ProtectedRoute allowedRoles={['caretaker', 'admin']}>
                        <CaretakerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/caregiver"
                    element={
                      <ProtectedRoute allowedRoles={['caretaker', 'admin']}>
                        <CaretakerDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/provider"
                    element={
                      <ProtectedRoute allowedRoles={['healthcare_provider', 'admin']}>
                        <HealthcareProviderDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Operational Features */}
                  <Route path="/simulator" element={<WatchSimulatorPage />} />
                  <Route path="/ai" element={<AiAssistantPage />} />
                  <Route path="/medicines" element={<MedicinesPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/transport" element={<TransportPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/demo" element={<DemoPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </main>
          </div>
        </Router>
      </EmergencyProvider>
    </LanguageProvider>
  </AuthProvider>
</ErrorBoundary>
  );
}
