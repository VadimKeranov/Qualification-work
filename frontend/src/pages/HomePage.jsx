import React, { useEffect, useState } from "react";
import { getAllVacancies } from "../api/vacancies";
import { Link } from "react-router-dom";

const HomePage = () => {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllVacancies();
        setVacancies(data);
      } catch (error) {
        console.error("Ошибка:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
          Найди работу <span className="text-cyan-400">будущего</span>
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Децентрализованная платформа для поиска специалистов. Без посредников. Без комиссий.
        </p>
      </div>

      {vacancies.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-700 rounded-lg">
          <p className="text-slate-500 text-lg">Система не обнаружила активных вакансий.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vacancies.map((v) => (
            <div key={v.id} className="group relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition duration-300 hover:shadow-lg hover:shadow-cyan-500/10 flex flex-col">

              <div className="mb-4">
                <h2 className="text-xl font-bold text-white group-hover:text-cyan-400 transition">{v.title}</h2>
                <div className="mt-2 text-sm text-cyan-600 font-mono bg-cyan-900/20 inline-block px-2 py-1 rounded">
                   {v.salary_from ? `${v.salary_from.toLocaleString()} - ${v.salary_to.toLocaleString()} ₽` : "Зарплата не указана"}
                </div>
              </div>

              <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-grow">
                {v.description}
              </p>

              <div className="flex justify-between items-center border-t border-slate-700/50 pt-4 mt-auto">
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(v.created_at).toLocaleDateString()}
                </span>
                <Link to={`/vacancies/${v.id}`} className="text-sm font-medium text-white bg-slate-700 hover:bg-cyan-600 px-4 py-2 rounded transition">
                Детальніше
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;