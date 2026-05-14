import React, { useEffect, useState } from "react";
import { getAllVacancies } from "../api/vacancies";
import { searchLocations } from "../api/profile";
import AsyncSelect from 'react-select/async';
import { getMyApplications } from "../api/applications";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { API_URL } from "../api/config";

const HomePage = () => {
  const { user, token } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState(null);

  // Стейт для зберігання статусів (відгукнувся / переглянув)
  const [appliedIds, setAppliedIds] = useState([]);
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Отримуємо всі вакансії
        const allVacancies = await getAllVacancies();
        setVacancies(allVacancies);

        // 2. Якщо це кандидат, отримуємо його відгуки
        if (user && user.role === 'worker' && token) {
          const myApps = await getMyApplications(token);
          setAppliedIds(myApps.map(app => String(app.vacancy_id)));
        }

        // 3. Дістаємо переглянуті вакансії з LocalStorage
        const viewed = JSON.parse(localStorage.getItem('viewedVacancies') || '[]');
        setViewedIds(viewed.map(id => String(id)));

      } catch (error) {
        console.error("Помилка завантаження даних:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, token]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  const filteredVacancies = vacancies.filter(v => {
    const titleMatch = v.title.toLowerCase().includes(searchTitle.toLowerCase().trim());
    const locValue = searchLocation ? searchLocation.value : "";
    const locMatch = (v.location || "Дистанційно").toLowerCase().includes(locValue.toLowerCase().trim());
    return titleMatch && locMatch;
  });

  const getLogoSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const loadLocationOptions = async (inputValue) => {
    const defaultOptions = [
        { label: "🌍 Всі міста", value: "" },
        { label: "🌐 Дистанційно", value: "Дистанційно" }
    ];
    if (!inputValue || inputValue.length < 2) return defaultOptions;
    const data = await searchLocations(inputValue);
    return [...defaultOptions, ...data];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 mt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-10 tracking-tight">
        Пошук <span className="text-accent">вакансій</span>
      </h1>

      {/* Рядок пошуку */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 glass-panel p-4 items-center">
        <input
          type="text"
          placeholder="Посада..."
          className="flex-grow w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent outline-none transition-all shadow-inner h-[50px]"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
        />
        <div className="w-full md:w-1/3">
          <AsyncSelect
            cacheOptions
            loadOptions={loadLocationOptions}
            defaultOptions={[{ label: "🌍 Всі міста", value: "" }, { label: "🌐 Дистанційно", value: "Дистанційно" }]}
            placeholder="Місто або область..."
            onChange={(opt) => setSearchLocation(opt)}
            isClearable
            styles={{
                control: (base, state) => ({
                    ...base,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderColor: state.isFocused ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    minHeight: '50px',
                    boxShadow: 'none',
                    cursor: 'pointer'
                }),
                menu: (base) => ({ ...base, backgroundColor: '#0f172a', zIndex: 50, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem' }),
                option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? 'rgba(168, 85, 247, 0.2)' : 'transparent', color: 'white', cursor: 'pointer' }),
                singleValue: (base) => ({ ...base, color: 'white' }),
                input: (base) => ({ ...base, color: 'white' }),
                placeholder: (base) => ({ ...base, color: '#94a3b8' })
            }}
          />
        </div>
      </div>

      {/* Список вакансій */}
      <div className="space-y-4">
        {filteredVacancies.length > 0 ? (
          filteredVacancies.map((v) => {
            const isApplied = appliedIds.includes(String(v.id));
            const isViewed = viewedIds.includes(String(v.id));

            return (
              <Link
                key={v.id}
                to={`/vacancies/${v.id}`}
                className={`block group border p-6 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md border-l-4 ${
                  isApplied 
                    ? 'border-l-green-500 bg-green-500/5 border-white/5' // Зелена для відгукнутих
                    : isViewed 
                      ? 'border-l-slate-500 opacity-75 bg-black/20 border-white/5' // Сіра для переглянутих
                      : 'border-l-accent bg-white/5 border-white/10 hover:border-accent' // Звичайна для нових
                }`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow space-y-3 max-w-[80%]">

                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className={`text-2xl font-bold transition break-words leading-tight ${isApplied ? 'text-green-400' : 'text-white group-hover:text-accent'}`}>
                        {v.title}
                      </h2>

                      {/* Бейджі статусу */}
                      {isApplied && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-green-500/20 text-green-400 px-2.5 py-1 rounded-md border border-green-500/30 shrink-0">
                          ✓ Відгук надіслано
                        </span>
                      )}
                      {!isApplied && isViewed && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md border border-slate-700 shrink-0">
                          Переглянуто
                        </span>
                      )}

                      <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5 shrink-0">
                        📍 {v.location || "Дистанційно"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className={`text-sm font-mono font-semibold inline-block px-3 py-1.5 rounded-lg ${isApplied ? 'bg-green-500/10 text-green-400' : 'bg-accent/10 text-accent'}`}>
                        {v.salary_from ? `${v.salary_from.toLocaleString()} ${v.salary_to ? `- ${v.salary_to.toLocaleString()}` : ''} ₽` : "Зарплата не вказана"}
                      </div>
                      <div className="text-slate-400 text-sm font-medium flex items-center gap-2">
                        🏢 {v.company_name || "Компанія"}
                      </div>
                    </div>

                    <p className={`text-sm line-clamp-3 leading-relaxed break-words ${isViewed && !isApplied ? 'text-slate-500' : 'text-slate-400'}`}>
                      {v.description}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {v.company_logo ? (
                      <img
                        src={getLogoSrc(v.company_logo)}
                        alt="Logo"
                        className={`w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-sm ${isViewed && !isApplied ? 'grayscale opacity-70' : ''}`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 text-xs font-bold border border-white/10 shadow-inner">
                        ЛОГО
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-center py-16 glass-panel border-dashed">
            <p className="text-slate-400 text-lg font-medium">За вашим запитом нічого не знайдено.</p>
            <button
              onClick={() => { setSearchTitle(''); setSearchLocation(null); }}
              className="mt-4 text-accent hover:underline font-bold transition"
            >
              Скинути фільтри
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;