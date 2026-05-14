// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { login as apiLogin, getMe } from "../api/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Используем ключ "token" для консистентности со всем приложением
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("token");
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
      // Сохраняем тоже под ключом "token"
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      const userData = await getMe(data.access_token);
      setUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    // Добавляем редирект на главную страницу при выходе
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);