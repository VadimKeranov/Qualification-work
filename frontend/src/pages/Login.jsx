import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate("/");
    } catch (error) {
      alert("Ошибка входа! Проверьте данные.");
    }
  };

  // Стили для инпутов (общие)
  const inputClass = "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all duration-300";

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      {/* Контейнер с эффектом стекла и неоновым свечением */}
      <div className="relative w-full max-w-md p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl shadow-cyan-500/10">

        {/* Декоративная полоска сверху */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-cyan-500 rounded-b-full shadow-[0_0_15px_rgba(6,182,212,0.6)]"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Системный <span className="text-cyan-400">Вход</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2">Введите учетные данные для доступа</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Username</label>
            <input
              type="text"
              placeholder="user@example.com"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-cyan-500 text-xs font-bold uppercase tracking-wider mb-2 ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transform transition hover:-translate-y-0.5"
          >
            ВОЙТИ В СИСТЕМУ
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Нет аккаунта?{" "}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium underline decoration-dashed underline-offset-4">
            Создать профиль
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;