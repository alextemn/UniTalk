import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      const decoded = decodeJwt(accessToken);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser({
          user_id: decoded.user_id,
          username: decoded.username,
          user_type: decoded.user_type,
        });
      } else {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  function login(access, refresh) {
    const decoded = decodeJwt(access);
    if (!decoded) return null;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    const userData = {
      user_id: decoded.user_id,
      username: decoded.username,
      user_type: decoded.user_type,
    };
    setUser(userData);
    return userData;
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
