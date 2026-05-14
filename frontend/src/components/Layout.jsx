import React, { useState, useEffect } from "react";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    // Обновление CSS переменных акцента
    const hex = !isDark ? '#A855F7' : (user?.role === 'employer' ? '#BF5AF2' : '#00F2FE');
    const rgb = !isDark ? '168, 85, 247' : (user?.role === 'employer' ? '191, 90, 242' : '0, 242, 254');
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-rgb', rgb);
  }, [isDark, user]);

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* 1. Передаем пропсы в хедер, чтобы работала новая красивая SVG-кнопка */}
      <Header isDark={isDark} setIsDark={setIsDark} />

      {/* 2. Старую кнопку <div className="theme-fab">...</div> мы отсюда полностью УДАЛИЛИ */}

      <main className="flex-grow container mx-auto px-4 relative z-10">
        {children}
      </main>

      <footer className="py-8 mt-12 text-center text-muted glass-panel">
        <p>&copy; 2026 JobFlow. System Active.</p>
      </footer>
    </div>
  );
};

export default Layout;