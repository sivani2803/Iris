import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import socket from '../services/socket';
import { emergencyApi, seniorApi } from '../services/api';

const EmergencyContext = createContext();

export function EmergencyProvider({ children }) {
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [currentTelemetry, setCurrentTelemetry] = useState({
    heartRate: 72,
    spo2: 98,
    motionState: 'active',
    fallDetected: false,
    watchConnected: true,
    timestamp: new Date()
  });
  const [recentAlert, setRecentAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load initial active emergency
  const refreshEmergency = useCallback(async () => {
    try {
      const res = await emergencyApi.getActive();
      setActiveEmergency(res.data?.data || null);
    } catch (err) {
      console.warn('Could not fetch active emergency:', err.message);
    }
  }, []);

  // Load latest vitals
  const refreshHealth = useCallback(async () => {
    try {
      const res = await seniorApi.getHealth('S102');
      if (res.data?.data?.current) {
        setCurrentTelemetry((prev) => ({
          ...prev,
          ...res.data.data.current
        }));
      }
    } catch (err) {
      console.warn('Could not fetch senior health:', err.message);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshEmergency(), refreshHealth()]).finally(() => {
      setLoading(false);
    });

    // Real-time socket listeners
    socket.on('telemetry_update', (telemetry) => {
      setCurrentTelemetry((prev) => ({
        ...prev,
        ...telemetry
      }));
    });

    socket.on('health_alert', (alert) => {
      setRecentAlert(alert);
    });

    socket.on('emergency_created', (emergency) => {
      setActiveEmergency(emergency);
      setRecentAlert({
        title: 'Possible Emergency Detected',
        emergency
      });
    });

    socket.on('emergency_updated', (emergency) => {
      setActiveEmergency(emergency);
    });

    socket.on('emergency_resolved', () => {
      setActiveEmergency(null);
      setRecentAlert(null);
    });

    return () => {
      socket.off('telemetry_update');
      socket.off('health_alert');
      socket.off('emergency_created');
      socket.off('emergency_updated');
      socket.off('emergency_resolved');
    };
  }, [refreshEmergency, refreshHealth]);

  const dismissAlert = () => setRecentAlert(null);

  return (
    <EmergencyContext.Provider
      value={{
        activeEmergency,
        currentTelemetry,
        recentAlert,
        dismissAlert,
        refreshEmergency,
        refreshHealth,
        loading
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
}

export function useEmergency() {
  return useContext(EmergencyContext);
}
