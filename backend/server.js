require('dotenv').config();
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./config/db');
const { setIO } = require('./services/emergencyService');
const { JWT_SECRET } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

// Configurable Allowed Origins (Phase 13: CORS Security)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser agents (Postman, curl, internal services) without origin header
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
};

// Configure Socket.IO with origin controls
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

setIO(io);

// Security HTTP Headers Middleware (Phase 13)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(self)');
  next();
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' })); // Prevent oversized JSON payload DoS

// Request ID tracking for distributed traceability (Phase 14 & 29)
app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/seniors', require('./routes/seniorRoutes'));
app.use('/api/devices', require('./routes/deviceRoutes'));
app.use('/api/caretakers', require('./routes/caretakerRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/transport', require('./routes/transportRoutes'));
app.use('/api/family', require('./routes/familyRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'IRIS Senior-Care Backend',
    timestamp: new Date()
  });
});

// Readiness check route (Phase 29)
app.get('/api/ready', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isReady = dbState === 1;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  return res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'degraded',
    service: 'IRIS Senior-Care Backend',
    database: dbStatusMap[dbState] || 'unknown',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date()
  });
});

// Centralized Safe Error Handling Middleware (Phase 14)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const safeMessage = statusCode >= 500 ? 'An internal server error occurred. Please contact support.' : err.message;

  console.error(`[IRIS Server Error] ${req.method} ${req.originalUrl} (${req.id}):`, err.message);

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 400 ? 'BAD_REQUEST' : statusCode === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR'),
      message: safeMessage,
      requestId: req.id
    }
  });
});

// Real-time Socket.IO events with Connection & Room Authorization (Phase 18)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
    } catch (e) {
      console.warn(`[IRIS Socket] Token verification failed for socket ${socket.id}:`, e.message);
    }
  }
  next();
});

io.on('connection', (socket) => {
  console.log(`[IRIS Socket] Client connected: ${socket.id} (User: ${socket.user?.email || 'Anonymous/Simulator'})`);

  socket.on('join_senior_room', (seniorId) => {
    // Room Authorization Gatekeeper
    if (socket.user) {
      const { role, seniorId: userSeniorId } = socket.user;
      if (role !== 'admin' && role !== 'caretaker' && userSeniorId && userSeniorId !== seniorId) {
        console.warn(`[IRIS Socket] Unauthorized room join attempt: User ${socket.user.email} -> senior_${seniorId}`);
        socket.emit('error', { message: 'Unauthorized room subscription' });
        return;
      }
    } else if (seniorId && seniorId !== 'S102') {
      // Disallow unauthenticated subscriptions to arbitrary non-demo senior channels
      console.warn(`[IRIS Socket] Blocked unauthenticated subscription to protected senior channel: senior_${seniorId}`);
      socket.emit('error', { message: 'Authentication required for non-default senior channels' });
      return;
    }

    socket.join(`senior_${seniorId}`);
    console.log(`[IRIS Socket] Client ${socket.id} authorized and joined room senior_${seniorId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[IRIS Socket] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[IRIS Backend] Server running on port ${PORT}`);
    console.log(`[IRIS Backend] Health check: http://localhost:${PORT}/api/health`);
  });
}).catch((err) => {
  console.error('[IRIS Backend] Fatal startup error:', err);
});
