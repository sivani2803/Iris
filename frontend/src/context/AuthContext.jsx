import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

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

  // Global Axios Interceptor for 401 / 403 handling
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          console.warn('[IRIS Auth] Session expired or invalid token. Purging credentials.');
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
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    setToken(jwtToken);
    setUser(userData);
    axios.defaults.headers.common['Authorization'] = `Bearer ${jwtToken}`;
    localStorage.setItem('iris_jwt_token', jwtToken);
    return userData;
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

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('iris_jwt_token');
    axios.post('/api/auth/logout').catch(() => {});
  }, []);

  const normalizedRole = user?.role ? user.role.toLowerCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        role: normalizedRole,
        token,
        loading,
        login,
        logout,
        bootstrapFirebaseSession,
        isAuthenticated: Boolean(user && token),
        isAdmin: normalizedRole === 'admin',
        isCaretaker: normalizedRole === 'caretaker',
        isFamily: normalizedRole === 'family',
        isSenior: normalizedRole === 'senior',
        hasRole: (roles) => {
          if (!user) return false;
          const allowed = Array.isArray(roles) ? roles.map(r => r.toLowerCase()) : [roles.toLowerCase()];
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
