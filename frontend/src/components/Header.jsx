import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) return <nav className="h-16 bg-slate-900 border-b border-slate-800" />;

  return (
    <nav className="flex justify-between items-center py-4 px-8 bg-slate-900 border-b border-slate-800">
      <Link to="/" className="text-xl font-bold text-white">
        JOB<span className="text-cyan-500">SPACE</span>
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <span className="text-slate-400 text-sm">{user?.email} (Роль: {user?.role})</span>

            {/* ДОДАНО: Кнопка з'явиться ТІЛЬКИ якщо роль == employer */}
            {user?.role === "employer" && (
              <Link
                to="/create-vacancy"
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition font-medium shadow-lg shadow-cyan-500/20"
              >
                + Створити вакансію
              </Link>
            )}

            {/* НОВАЯ КНОПКА АДМИНА */}
            {user?.role === "admin" && (
              <Link to="/admin" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition font-medium shadow-lg">
                Панель Админа
              </Link>
            )}

            <Link to="/profile" className="text-white hover:text-cyan-400">Профіль</Link>
            <button
              onClick={handleLogout}
              className="bg-red-600/20 text-red-500 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition cursor-pointer"
            >
              Вийти
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-white hover:text-cyan-400 transition">Вхід</Link>
            <Link to="/register" className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg transition">Реєстрація</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Header;