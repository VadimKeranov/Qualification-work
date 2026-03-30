import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/auth";

const Register = () => {
  const [formData, setFormData] = useState({ email: "", password: "", role: "worker" });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(formData);
      alert("Регистрация успешна!");
      navigate("/login");
    } catch (err) {
      alert("Ошибка регистрации");
    }
  };

  const inputClass = "w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 transition-all";

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800 shadow-2xl">
        <h2 className="text-3xl font-bold text-white text-center mb-8">Регистрация</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-cyan-500 text-xs font-bold uppercase mb-2">Я ищу:</label>
            <select
              className={inputClass}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="worker">Работу (Соискатель)</option>
              <option value="employer">Сотрудников (Работодатель)</option>
            </select>
          </div>
          <input
            type="email"
            placeholder="Email"
            className={inputClass}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            className={inputClass}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition">
            СОЗДАТЬ АККАУНТ
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register; // <--- ОБЯЗАТЕЛЬНО: этой строки не хватало