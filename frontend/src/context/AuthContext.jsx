import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { registerWithFirebase, loginWithFirebase, logoutFirebase } from '../services/firebaseAuth';

const AuthContext = createContext(null);

const ROLE_NORMALIZATION = {
  'admin': 'admin',
  'ADMIN': 'admin',
  'super_admin': 'admin',
  'SUPER_ADMIN': 'admin',
  'family': 'family',
  'family_member': 'family',
  'FAMILY': 'family',
  'FAMILY_MEMBER': 'family',
  'caretaker': 'caretaker',
  'caregiver': 'caretaker',
  'CAREGIVER': 'caretaker',
  'CARETAKER': 'caretaker',
  'senior': 'senior',
  'SENIOR': 'senior',
  'healthcare_provider': 'healthcare_provider',
  'HEALTHCARE_PROVIDER': 'healthcare_provider',
  'provider': 'healthcare_provider',
  'PROVIDER': 'healthcare_provider'
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('iris_jwt_token'));
  const [loading, setLoading] = useState(true);

  // Synchronize Axios default Authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('iris_jwt_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('iris_jwt_token');
    }
  }, [token]);

  // Global Axios Interceptor for 401 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.warn('[IRIS Auth] Session expired or unauthorized. Purging active credentials.');
          setToken(null);
          setUser(null);
          delete axios.defaults.headers.common['Authorization'];
          localStorage.removeItem('iris_jwt_token');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  // Validate active session
  const verifySession = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err.response?.data?.message || err.message);
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('iris_jwt_token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (email, password) => {
    try {
      // 1. Attempt Firebase authentication if live credentials configured
      const fbResult = await loginWithFirebase(email, password);
      if (fbResult?.idToken) {
        const res = await axios.post('/api/auth/session', { idToken: fbResult.idToken });
        const { token: sessionToken, user: userData } = res.data;
        setToken(sessionToken);
        setUser(userData);
        axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
        localStorage.setItem('iris_jwt_token', sessionToken);
        return userData;
      }
    } catch (fbErr) {
      console.warn('[IRIS Auth] Firebase login attempt bypassed, falling back to direct credentials:', fbErr.message);
    }

    // 2. Direct backend bcrypt authentication fallback (for seeded and offline accounts)
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    localStorage.setItem('iris_jwt_token', jwtToken);
    return userData;
  };

  const register = async ({ name, email, password, role, phone, seniorId }) => {
    let firebaseIdToken = null;
    try {
      // Step 1: Create or recover Firebase account and retrieve verified ID token
      const fbResult = await registerWithFirebase(email, password, name);
      firebaseIdToken = fbResult?.idToken;
    } catch (fbErr) {
      throw fbErr;
    }

    try {
      // Step 2: Provision/sync IRIS backend profile using verified ID token
      const res = await axios.post('/api/auth/register', {
        idToken: firebaseIdToken,
        name,
        email,
        password,
        role,
        phone,
        seniorId: seniorId || 'S102'
      });
      const { token: jwtToken, user: userData } = res.data;
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
      localStorage.setItem('iris_jwt_token', jwtToken);
      return userData;
    } catch (backendErr) {
      // Safe Partial Registration Failure handling:
      // Firebase account exists, but IRIS backend profile creation failed
      const err = new Error(
        backendErr.response?.data?.message ||
        "We created your sign-in account, but couldn't finish setting up your IRIS profile. Try continuing setup."
      );
      err.isPartialFailure = true;
      err.firebaseIdToken = firebaseIdToken;
      err.response = backendErr.response;
      throw err;
    }
  };

  const bootstrapFirebaseSession = async (firebaseIdToken) => {
    const res = await axios.post('/api/auth/session', { idToken: firebaseIdToken });
    const { token: sessionToken, user: userData } = res.data;
    setToken(sessionToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${sessionToken}`;
    localStorage.setItem('iris_jwt_token', sessionToken);
    return userData;
  };

  const completeOnboarding = async (onboardingPayload) => {
    const res = await axios.post('/api/auth/onboarding', onboardingPayload);
    setUser(res.data.user);
    return res.data.user;
  };

  const updateProfile = async (profileUpdates) => {
    const res = await axios.patch('/api/auth/profile', profileUpdates);
    setUser(prev => ({ ...prev, ...res.data.data }));
    return res.data.data;
  };

  const sendVerificationEmail = async () => {
    const res = await axios.post('/api/auth/send-verification-email');
    return res.data;
  };

  const logout = useCallback(async () => {
    try {
      await logoutFirebase();
    } catch (e) {
      console.warn('[IRIS Auth] Firebase logout notice:', e.message);
    }
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('iris_jwt_token');
    axios.post('/api/auth/logout').catch(() => {});
  }, []);

  const normalizedRole = user?.role ? (ROLE_NORMALIZATION[user.role] || user.role.toLowerCase()) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizedRole,
        token,
        loading,
        login,
        register,
        logout,
        bootstrapFirebaseSession,
        completeOnboarding,
        updateProfile,
        sendVerificationEmail,
        refreshSession: verifySession,
        isAuthenticated: Boolean(user && token),
        onboardingCompleted: Boolean(user?.onboardingCompleted),
        isAdmin: normalizedRole === 'admin',
        isCaretaker: normalizedRole === 'caretaker',
        isCaregiver: normalizedRole === 'caretaker',
        isFamily: normalizedRole === 'family',
        isSenior: normalizedRole === 'senior',
        isProvider: normalizedRole === 'healthcare_provider',
        hasRole: (roles) => {
          if (!user) return false;
          const allowed = Array.isArray(roles) ? roles.map(r => ROLE_NORMALIZATION[r] || r.toLowerCase()) : [ROLE_NORMALIZATION[roles] || roles.toLowerCase()];
          return allowed.includes(normalizedRole);
        }
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
