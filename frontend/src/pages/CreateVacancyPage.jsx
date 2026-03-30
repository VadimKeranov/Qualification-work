import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Добавили импорт контекста

const CreateVacancyPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth(); // Достаем токен из контекста авторизации

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    salary_from: "",
    salary_to: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // УДАЛИЛИ строку: const token = localStorage.getItem("token");

    try {
      // 1. Получаем профиль компании
      const profileResponse = await fetch("http://localhost:8000/profiles/company/me", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const profileData = await profileResponse.json();

      if (!profileData.id) {
        alert("Сначала заполните профиль компании!");
        return;
      }

      // 2. Формируем данные (преобразуем зарплату в числа)
      const vacancyData = {
        title: formData.title,
        description: formData.description,
        requirements: formData.description,
        salary_from: formData.salary_from ? Number(formData.salary_from) : null,
        salary_to: formData.salary_to ? Number(formData.salary_to) : null,
        company_id: profileData.id
      };

      // 3. Отправляем запрос на создание
      const createResponse = await fetch("http://localhost:8000/vacancies/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(vacancyData)
      });

      if (!createResponse.ok) {
          throw new Error("Ошибка при создании вакансии");
      }

      alert("Вакансия успешно создана!");
      navigate("/"); // Раскомментировали редирект на главную
    } catch (err) {
      console.error(err);
      alert("Ошибка при создании: " + err.message);
    }
  };

  const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition";
  const labelClass = "block text-slate-400 text-sm font-medium mb-2";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <span className="text-cyan-500">#</span> Новая вакансия
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelClass}>Должность</label>
            <input
              type="text"
              className={inputClass}
              placeholder="Например: Senior React Developer"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Зарплата от (₽)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="100 000"
                value={formData.salary_from}
                onChange={(e) => setFormData({ ...formData, salary_from: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Зарплата до (₽)</label>
              <input
                type="number"
                className={inputClass}
                placeholder="250 000"
                value={formData.salary_to}
                onChange={(e) => setFormData({ ...formData, salary_to: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Описание и требования</label>
            <textarea
              rows="5"
              className={inputClass}
              placeholder="Опишите стек технологий, задачи и условия..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.01]">
              Опубликовать вакансию
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVacancyPage;