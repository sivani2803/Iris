import { io } from 'socket.io-client';
import { useTelemetryStore } from '../store/useTelemetryStore';

// Connect to WebSocket server
export const socket = io({
  autoConnect: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('[IRIS Socket] Connected with ID:', socket.id);
  socket.emit('join_senior_room', 'S102');
  useTelemetryStore.getState().setWatchStatus(true);
});

socket.on('telemetry_update', (packet) => {
  useTelemetryStore.getState().ingestPacket(packet);
});

socket.on('disconnect', () => {
  useTelemetryStore.getState().setWatchStatus(false);
});

socket.on('connect_error', (error) => {
  console.warn('[IRIS Socket] Connection error:', error.message);
});

export default socket;
