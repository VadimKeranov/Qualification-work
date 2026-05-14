import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getVacanciesByCompany } from '../api/vacancies';
import { useAuth } from '../context/AuthContext';

const MyVacanciesPage = () => {
  const { id } = useParams(); // ID компанії з URL
  const navigate = useNavigate();
  const { token } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        const data = await getVacanciesByCompany(id);
        setVacancies(data);
      } catch (err) {
        console.error("Помилка завантаження вакансій:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, [id]);

  if (loading) return <div className="text-center mt-10 text-white">Завантаження...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Керування вакансіями</h1>
        <button
          onClick={() => navigate('/create-vacancy')}
          className="bg-accent text-white px-6 py-2 rounded-xl font-bold hover:brightness-110 transition"
        >
          + Створити нову
        </button>
      </div>

      <div className="grid gap-6">
        {vacancies.map(v => (
          <div key={v.id} className="glass-panel p-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{v.title}</h3>
              <p className="text-slate-400">{v.location} | {v.salary_from} - {v.salary_to} ₽</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/vacancies/${v.id}/applications`)}
                className="bg-slate-800 text-white px-5 py-2 rounded-xl border border-white/10 hover:border-accent transition"
              >
                👀 Подивитися відгуки
              </button>
              <button
                onClick={() => navigate(`/vacancies/${v.id}/edit`)}
                className="bg-white/5 text-slate-300 px-5 py-2 rounded-xl hover:bg-white/10 transition"
              >
                Редагувати
              </button>
            </div>
          </div>
        ))}

        {vacancies.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
            <p className="text-slate-500">У вас ще немає створених вакансій.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyVacanciesPage;