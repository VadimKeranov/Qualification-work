import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API_URL } from "../api/config";

const VacancyPage = () => {
  const { id } = useParams(); // Отримуємо ID з URL
  const [vacancy, setVacancy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancy = async () => {
      try {
        // Запит до бекенду за конкретною вакансією
        const response = await fetch(`${API_URL}/vacancies/${id}`);
        if (response.ok) {
          const data = await response.json();
          setVacancy(data);
        }
      } catch (error) {
        console.error("Помилка завантаження:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancy();
  }, [id]);

  if (loading) return <div className="text-white text-center mt-20">Завантаження...</div>;
  if (!vacancy) return <div className="text-white text-center mt-20">Вакансію не знайдено</div>;

  return (
    <div className="max-w-3xl mx-auto bg-slate-800/50 border border-slate-700 rounded-2xl p-8 mt-10 shadow-xl">
      <Link to="/" className="text-cyan-500 hover:text-cyan-400 text-sm mb-6 inline-block">
        &larr; Назад до списку
      </Link>

      <h1 className="text-3xl font-bold text-white mb-4">{vacancy.title}</h1>

      <div className="bg-cyan-900/30 text-cyan-400 inline-block px-4 py-2 rounded-lg font-mono mb-8">
        {vacancy.salary_from ? `${vacancy.salary_from} - ${vacancy.salary_to} ₽` : "Зарплата не вказана"}
      </div>

      <div className="space-y-6 text-slate-300">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">Опис вакансії:</h3>
          <p className="whitespace-pre-wrap">{vacancy.description}</p>
        </div>

        <div className="pt-6 border-t border-slate-700">
          <button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition transform hover:-translate-y-1">
            Відгукнутися на вакансію
          </button>
        </div>
      </div>
    </div>
  );
};

export default VacancyPage;