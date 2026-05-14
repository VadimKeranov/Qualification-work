import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api/config";
import { getAllCandidates } from "../api/profile";

const CandidatesPage = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    getAllCandidates()
      .then(setCandidates)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  const filteredCandidates = candidates.filter(c => {
    const fullName = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
    const nameMatch = fullName.includes(searchName.toLowerCase().trim());
    const locMatch = (c.city || "").toLowerCase().includes(searchLocation.toLowerCase().trim());
    return nameMatch && locMatch;
  });

  const getPhotoSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-12 mt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-10 tracking-tight">
        Пошук <span className="text-accent">співробітників</span>
      </h1>

      {/* Рядок пошуку */}
      <div className="flex flex-col md:flex-row gap-4 mb-10 glass-panel p-4">
        <input
          type="text"
          placeholder="Ім'я або спеціальність..."
          className="flex-grow bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent outline-none transition-all shadow-inner"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Місто..."
          className="md:w-1/3 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-accent outline-none transition-all shadow-inner"
          value={searchLocation}
          onChange={(e) => setSearchLocation(e.target.value)}
        />
      </div>

      {/* Список Кандидатів */}
      <div className="space-y-4">
        {filteredCandidates.length > 0 ? (
          filteredCandidates.map((c) => (
            <Link
              key={c.id}
              to={`/profile/${c.user_id}`}
              className="block group bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-accent transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-6">

                {/* Аватар */}
                <div className="flex-shrink-0">
                  {c.photo_url ? (
                    <img
                      src={getPhotoSrc(c.photo_url)}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-4xl border border-white/10 shadow-inner">
                      👤
                    </div>
                  )}
                </div>

                {/* Інформація */}
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white group-hover:text-accent transition">
                      {c.first_name || "Анонімний"} {c.last_name || "Кандидат"}
                    </h2>
                    {c.city && (
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2.5 py-1 rounded-md border border-white/5">
                        📍 {c.city}
                      </span>
                    )}
                  </div>

                  {c.resumes && c.resumes.length > 0 ? (
                     <div className="inline-block px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs font-bold uppercase tracking-wider">
                       📄 Резюме завантажено ({c.resumes.length})
                     </div>
                  ) : (
                     <div className="text-slate-500 text-xs font-medium uppercase tracking-wider">Резюме відсутнє</div>
                  )}
                </div>

                {/* Стрілка переходу */}
                <div className="hidden md:block flex-shrink-0 text-slate-500 group-hover:text-accent transition">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </div>

              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-16 glass-panel border-dashed">
            <p className="text-slate-400 text-lg font-medium">За вашим запитом кандидатів не знайдено.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidatesPage;