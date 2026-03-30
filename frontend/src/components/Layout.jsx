import React from "react";
import Header from "./Header";
import { useAuth } from "../context/AuthContext"; // Импортируем контекст

const Layout = ({ children }) => {
  const { user } = useAuth(); // Используем наличие объекта user
  const isAuthenticated = !!user;

  // Разные фоны для разных состояний
  const backgroundClass = isAuthenticated
    ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black" // Спокойный рабочий фон
    : "bg-black bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-black to-black"; // Глубокий черный для гостей

  return (
    <div className={`min-h-screen flex flex-col text-slate-200 transition-colors duration-500 ${backgroundClass}`}>
      <Header />

      {/* Если не залогинен — добавляем декоративную сетку на фон */}
      {!isAuthenticated && (
        <div className="fixed inset-0 z-0 pointer-events-none opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
      )}

      <main className="flex-grow container mx-auto px-4 py-8 z-10 relative">
        {children}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-600 text-sm z-10 relative">
        <p>&copy; 2026 JobBoard. System Active.</p>
      </footer>
    </div>
  );
};

export default Layout;