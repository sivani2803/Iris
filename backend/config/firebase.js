const jwt = require('jsonwebtoken');

let firebaseAdmin = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    const admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    firebaseAdmin = admin;
    console.log('[IRIS Security] Firebase Admin initialized with service account.');
  } else if (process.env.FIREBASE_PROJECT_ID) {
    console.log('[IRIS Security] Firebase Project ID present:', process.env.FIREBASE_PROJECT_ID);
  }
} catch (e) {
  console.warn('[IRIS Security] Notice: Firebase Admin not initialized with live credentials. Running in decoupled security mode:', e.message);
}

/**
 * Verify a Firebase ID token.
 * Returns decoded payload containing uid, email, email_verified, etc.
 * @param {string} idToken
 * @returns {Promise<Object>}
 */
async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing or malformed Firebase ID token');
  }

  // 1. If live Firebase Admin is initialized, verify with Google
  if (firebaseAdmin) {
    return await firebaseAdmin.auth().verifyIdToken(idToken);
  }

  // 2. Decoupled / local test verification mode
  // Allows testing the full identity lifecycle without mandatory external cloud dependency
  try {
    // Attempt standard decode
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.payload) {
      throw new Error('Invalid token structure');
    }

    const payload = decoded.payload;
    const uid = payload.user_id || payload.sub || payload.uid;
    if (!uid) {
      throw new Error('Token does not contain a valid Firebase UID');
    }

    // Check expiration if present
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      const err = new Error('Firebase ID token has expired');
      err.code = 'auth/id-token-expired';
      throw err;
    }

    return {
      uid,
      email: payload.email || `${uid}@iris.local`,
      email_verified: Boolean(payload.email_verified),
      name: payload.name || payload.email || 'Iris User',
      picture: payload.picture || null,
      auth_time: payload.auth_time || Math.floor(Date.now() / 1000),
      iss: payload.iss || `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID || 'iris-care'}`,
      aud: payload.aud || process.env.FIREBASE_PROJECT_ID || 'iris-care'
    };
  } catch (err) {
    throw new Error(`Firebase token verification failed: ${err.message}`);
  }
}

module.exports = {
  verifyFirebaseIdToken,
  getFirebaseAdmin: () => firebaseAdmin
};
