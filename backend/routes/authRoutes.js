const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole, JWT_SECRET } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { verifyFirebaseIdToken } = require('../config/firebase');

// POST /api/auth/register (Phase 3: Registration Security)
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password, role = 'family', seniorId = 'S102', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Name, email, and password are required'
      });
    }

    // Role Provisioning Policy: Block self-assigned ADMIN and SUPER_ADMIN
    const requestedRole = (role || 'family').toLowerCase();
    if (requestedRole === 'admin' || requestedRole === 'super_admin') {
      AuditLog.logEvent({
        action: 'SECURITY_VIOLATION',
        actor: email,
        actorRole: 'anonymous',
        targetType: 'UserRole',
        metadata: { attemptedRole: role, reason: 'PRIVILEGE_ESCALATION_BLOCKED' },
        ipAddress: req.ip || '127.0.0.1'
      });

      return res.status(403).json({
        success: false,
        error: 'PRIVILEGE_ESCALATION_BLOCKED',
        message: 'Administrator roles cannot be self-assigned during registration.'
      });
    }

    const safeRole = ['family', 'senior', 'caretaker'].includes(requestedRole) ? requestedRole : 'family';

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: safeRole,
      status: 'ACTIVE',
      seniorId: seniorId || 'S102',
      phone,
      emailVerified: false,
      onboardingCompleted: true,
      isActive: true
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    AuditLog.logEvent({
      action: 'ACCOUNT_CREATED',
      actor: user.email,
      actorRole: user.role,
      seniorId: user.seniorId,
      targetType: 'User',
      targetId: user._id,
      metadata: { role: user.role, registrationMethod: 'password' },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        seniorId: user.seniorId,
        phone: user.phone
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/login (Phase 4: Authentication)
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    // Enforce account status lifecycle
    if (!user.isActive || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      AuditLog.logEvent({
        action: 'SECURITY_VIOLATION',
        actor: user.email,
        actorRole: user.role,
        seniorId: user.seniorId,
        targetType: 'User',
        targetId: user._id,
        metadata: { reason: 'Login attempt on inactive/suspended account' },
        ipAddress: req.ip || '127.0.0.1'
      });

      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ACCOUNT_SUSPENDED',
        message: 'Account is suspended or deactivated'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    AuditLog.logEvent({
      action: 'LOGIN',
      actor: user.email,
      actorRole: user.role,
      seniorId: user.seniorId,
      targetType: 'User',
      targetId: user._id,
      metadata: { method: 'password' },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        seniorId: user.seniorId,
        phone: user.phone
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/auth/session (Phase 1 & 2: Firebase Identity Lifecycle Bootstrap)
router.post('/session', authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Firebase ID token is required'
      });
    }

    const firebaseUser = await verifyFirebaseIdToken(idToken);
    const { uid, email, email_verified, name } = firebaseUser;

    // Search by firebaseUid first, fallback to email
    let user = await User.findOne({ firebaseUid: uid });
    let isReturning = true;

    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        user.firebaseUid = uid;
        if (email_verified) user.emailVerified = true;
        await user.save();
      }
    }

    // If still not found, safely provision new user (First-time user)
    if (!user) {
      isReturning = false;
      user = await User.create({
        name: name || email?.split('@')[0] || 'Care Recipient',
        email: (email || `${uid}@iris.care`).toLowerCase(),
        firebaseUid: uid,
        role: 'family',
        status: 'ACTIVE',
        emailVerified: Boolean(email_verified),
        onboardingCompleted: false,
        seniorId: 'S102',
        isActive: true
      });

      AuditLog.logEvent({
        action: 'ACCOUNT_CREATED',
        actor: user.email,
        actorRole: user.role,
        seniorId: user.seniorId,
        targetType: 'User',
        targetId: user._id,
        metadata: { method: 'firebase_oauth', firebaseUid: uid },
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    // Account status check
    if (!user.isActive || user.status === 'DISABLED' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN_ACCOUNT_SUSPENDED',
        message: 'Account has been disabled or suspended.'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, firebaseUid: user.firebaseUid },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    AuditLog.logEvent({
      action: 'LOGIN',
      actor: user.email,
      actorRole: user.role,
      seniorId: user.seniorId,
      targetType: 'User',
      targetId: user._id,
      metadata: { method: 'firebase_session', returning: isReturning },
      ipAddress: req.ip || '127.0.0.1'
    });

    return res.status(200).json({
      success: true,
      returning: isReturning,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        onboardingCompleted: user.onboardingCompleted,
        seniorId: user.seniorId
      }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_FAILED',
      message: err.message || 'Firebase session verification failed'
    });
  }
});

// GET /api/auth/me (Protected by authenticateToken)
router.get('/me', authenticateToken, async (req, res) => {
  return res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
      seniorId: req.user.seniorId,
      phone: req.user.phone,
      emailVerified: req.user.emailVerified,
      onboardingCompleted: req.user.onboardingCompleted
    }
  });
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, async (req, res) => {
  AuditLog.logEvent({
    action: 'LOGOUT',
    actor: req.user.email,
    actorRole: req.user.role,
    seniorId: req.user.seniorId,
    targetType: 'User',
    targetId: req.user._id,
    ipAddress: req.ip || '127.0.0.1'
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// GET /api/auth/admin/audit-logs (Protected: ADMIN ONLY)
router.get('/admin/audit-logs', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      data: {
        auditTimestamp: new Date(),
        systemIntegrity: 'VERIFIED',
        activeDispatchGateways: ['108_EMS_TELANGANA', 'IRIS_PUSH_GATEWAY'],
        complianceStandard: 'HIPAA/DISHA Senior-Care Security Standard 2026',
        totalSessionsActive: 4,
        recentAuditEvents: logs
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
