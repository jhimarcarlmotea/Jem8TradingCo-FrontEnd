import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { me } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await me();
      // `me()` may return axios response or plain object
      const payload = res?.data ?? res;
      setUser(payload?.data ?? payload ?? null);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();

    const onLogin = () => loadUser();
    const onLogout = () => setUser(null);

    window.addEventListener('auth-login', onLogin);
    window.addEventListener('auth-logout', onLogout);
    return () => {
      window.removeEventListener('auth-login', onLogin);
      window.removeEventListener('auth-logout', onLogout);
    };
  }, [loadUser]);

  const value = {
    user,
    loading,
    refresh: loadUser,
    department: (() => {
      if (!user) return null;
      return (
        user.department || user.dept || user.department_name || user.departmentName || user.role_department || null
      );
    })(),
    isAdmin: (() => {
      if (!user) return false;
      return !!(user.is_admin || user.isAdmin || user.role === 'admin' || user.role === 'administrator');
    })(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// DepartmentGate: render children only if current user's department matches one of allowed
export function DepartmentGate({ allowed, fallback = null, children }) {
  const { department, loading, isAdmin } = useAuth();

  if (loading) return null;

  // Admins can access everything
  if (isAdmin) return <>{children}</>;

  if (!allowed) return <>{children}</>;

  const allowedArr = Array.isArray(allowed) ? allowed : [allowed];
  const dept = (department || '').toString().toLowerCase();

  const ok = allowedArr.map((a) => (a || '').toString().toLowerCase()).includes(dept);
  return ok ? <>{children}</> : <>{fallback}</>;
}

export default AuthContext;
