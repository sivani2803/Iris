import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const MAX_HISTORY_POINTS = 60;

export const useTelemetryStore = create(
  subscribeWithSelector((set, get) => ({
    // Normalized Telemetry State
    seniorId: 'S102',
    heartRate: 72,
    spo2: 98,
    motionState: 'active',
    fallDetected: false,
    watchConnected: true,
    lastUpdated: Date.now(),

    // Low-overhead Ring Buffer for Graph Canvas
    history: Array.from({ length: MAX_HISTORY_POINTS }, (_, i) => ({
      timestamp: Date.now() - (MAX_HISTORY_POINTS - i) * 1000,
      heartRate: 72,
      spo2: 98
    })),

    // Ingest High-Frequency Packet (Throttled via RAF)
    ingestPacket: (packet) => {
      set((state) => {
        const newPoint = {
          timestamp: packet.timestamp || Date.now(),
          heartRate: packet.heartRate ?? state.heartRate,
          spo2: packet.spo2 ?? state.spo2
        };

        const updatedHistory = [...state.history.slice(1), newPoint];

        return {
          heartRate: packet.heartRate ?? state.heartRate,
          spo2: packet.spo2 ?? state.spo2,
          motionState: packet.motionState ?? state.motionState,
          fallDetected: packet.fallDetected ?? state.fallDetected,
          watchConnected: true,
          lastUpdated: Date.now(),
          history: updatedHistory
        };
      });
    },

    setWatchStatus: (connected) => set({ watchConnected: connected })
  }))
);
