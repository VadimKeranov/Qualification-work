// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { login as apiLogin, getMe } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("access_token");
      if (storedToken) {
        try {
          const userData = await getMe(storedToken);
          setUser(userData);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await apiLogin({ email, password });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      setToken(data.access_token);
      const userData = await getMe(data.access_token);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      isAuthenticated: !!user // Решает проблему белого экрана в Layout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ВОТ ЭТА СТРОКА ДОЛЖНА БЫТЬ ОБЯЗАТЕЛЬНО:
export const useAuth = () => useContext(AuthContext);