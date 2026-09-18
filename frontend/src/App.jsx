import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EmergencyProvider } from './context/EmergencyContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';

// Pages
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
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <EmergencyProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-surface-warm text-charcoal-900 font-sans">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/unauthorized" element={<UnauthorizedPage />} />
                  <Route path="/simulator" element={<WatchSimulatorPage />} />
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
                    path="/senior"
                    element={
                      <ProtectedRoute allowedRoles={['senior', 'admin']}>
                        <SeniorDashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/ai" element={<AiAssistantPage />} />
                  <Route path="/medicines" element={<MedicinesPage />} />
                  <Route path="/appointments" element={<AppointmentsPage />} />
                  <Route path="/transport" element={<TransportPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/demo" element={<DemoPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </EmergencyProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
