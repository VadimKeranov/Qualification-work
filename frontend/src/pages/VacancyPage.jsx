import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { applyToVacancy, getMyApplications } from "../api/applications";
import { getProfile, uploadResume } from "../api/profile";

const timeAgo = (dateString) => {
  if (!dateString) return "Нещодавно";
  const date = new Date(dateString + "Z");
  if (isNaN(date)) return "Нещодавно";
  const diffMs = new Date() - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins || 1} хв. тому`;
  if (diffHours < 24) return `${diffHours} год. тому`;
  return `${diffDays} дн. тому`;
};

const VacancyPage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [vacancy, setVacancy] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Стейт для перевірки, чи вже подано заявку
  const [hasApplied, setHasApplied] = useState(false);

  // Стейт для модального вікна
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [applyStatus, setApplyStatus] = useState({ loading: false, message: '', type: '' });

  // Дані відгуку
  const [seekerProfile, setSeekerProfile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeOption, setResumeOption] = useState("none");
  const [selectedExistingResume, setSelectedExistingResume] = useState("");
  const [newResumeFile, setNewResumeFile] = useState(null);

  useEffect(() => {
    const fetchVacancyAndStatus = async () => {
      setIsLoading(true);
      try {
        // 1. Завантажуємо саму вакансію
        const response = await fetch(`http://localhost:8000/vacancies/${id}`);
        if (response.ok) {
          const data = await response.json();
          setVacancy(data);
        }

        // Записуємо вакансію в переглянуті (LocalStorage)
        if (id) {
            const viewed = JSON.parse(localStorage.getItem('viewedVacancies') || '[]');
            if (!viewed.includes(id)) {
              localStorage.setItem('viewedVacancies', JSON.stringify([...viewed, id]));
            }
        }

        // 2. Якщо користувач кандидат - перевіряємо його відгуки
        if (user && user.role === 'worker' && token) {
            const myApps = await getMyApplications(token);
            const alreadyApplied = myApps.some(app => String(app.vacancy_id) === String(id));
            setHasApplied(alreadyApplied);
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVacancyAndStatus();
  }, [id, user, token]);

  useEffect(() => {
    // Завантажуємо профіль шукача (з його резюме) тільки коли відкриваємо модалку
    if (user && user.role === 'worker' && isModalOpen) {
        getProfile(token, 'worker').then(data => {
            if (data) setSeekerProfile(data);
        }).catch(err => console.error("Помилка завантаження профілю", err));
    }
  }, [user, token, isModalOpen]);

  const handleOpenModal = () => {
    if (!user) return alert("Будь ласка, увійдіть у систему, щоб відгукнутися!");
    if (user.role !== 'worker') return alert("Тільки кандидати можуть відгукуватися на вакансії.");
    setIsModalOpen(true);
    setApplyStatus({ loading: false, message: '', type: '' });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCoverLetter("");
    setResumeOption("none");
    setNewResumeFile(null);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    setApplyStatus({ loading: true, message: '', type: '' });

    try {
        let finalResumeUrl = null;

        if (resumeOption === "existing" && selectedExistingResume) {
            finalResumeUrl = selectedExistingResume;
        } else if (resumeOption === "new" && newResumeFile) {
            const uploadResult = await uploadResume(token, newResumeFile);
            finalResumeUrl = uploadResult.file_url;
        }

        await applyToVacancy(token, vacancy.id, finalResumeUrl, coverLetter);

        setApplyStatus({ loading: false, message: 'Ваш відгук успішно надіслано!', type: 'success' });
        setHasApplied(true); // Одразу блокуємо кнопку після успіху
        setTimeout(() => handleCloseModal(), 2000);

    } catch (error) {
        setApplyStatus({ loading: false, message: error.message || 'Сталася помилка при відправці', type: 'error' });
    }
  };

  if (isLoading) return <div className="text-center mt-20 text-white">Завантаження...</div>;
  if (!vacancy) return <div className="text-center mt-20 text-white">Вакансію не знайдено</div>;

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <div className="glass-panel p-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-white/10 pb-8 mb-8">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-white/5 shadow-sm">
                {timeAgo(vacancy.created_at)}
              </span>
              {!vacancy.is_active && (
                <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
                  Закрита
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">{vacancy.title}</h1>
            <p className="text-2xl text-accent font-bold font-mono">
              {vacancy.salary_from ? `${vacancy.salary_from.toLocaleString()} ₽` : ''}
              {vacancy.salary_to ? ` - ${vacancy.salary_to.toLocaleString()} ₽` : (!vacancy.salary_from ? 'Зарплата не вказана' : '')}
            </p>
            <div className="flex flex-wrap gap-2 text-sm font-medium">
              <span className="bg-slate-800/80 text-slate-200 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">🏢 {vacancy.company_name || 'Невідома компанія'}</span>
              <span className="bg-slate-800/80 text-slate-200 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">📍 {vacancy.location}</span>
              <span className="bg-slate-800/80 text-slate-200 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2">💼 {vacancy.employment_type || 'Повна зайнятість'}</span>
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3 shrink-0">
            {vacancy.company_logo ? (
              <img src={`http://localhost:8000${vacancy.company_logo}`} alt="Лого" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-2 border-white/10 shadow-xl hidden md:block self-end" />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 text-sm font-bold border-2 border-white/10 shadow-xl hidden md:block self-end">ЛОГО</div>
            )}

            <div className="flex flex-col gap-3 mt-4 w-full">
              {/* ЛОГІКА ВІДОБРАЖЕННЯ КНОПКИ ЗАЛЕЖНО ВІД РОЛІ */}
              {user?.role === 'employer' ? (
                 <Link
                   to={`/companies/${user.id}/my-vacancies`}
                   className="bg-slate-800 border border-white/10 hover:border-accent text-white px-8 py-4 rounded-2xl font-bold transition shadow-xl text-center"
                 >
                   ⚙️ Керувати вакансією
                 </Link>
              ) : (
                <button
                  onClick={handleOpenModal}
                  disabled={!vacancy.is_active || hasApplied}
                  className={`px-8 py-4 rounded-2xl font-bold transition shadow-xl active:scale-95 ${
                    hasApplied 
                      ? 'bg-green-600/20 text-green-400 border border-green-500/30 cursor-not-allowed shadow-none' 
                      : !vacancy.is_active 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-500/20'
                  }`}
                >
                  {hasApplied ? '✓ Ви вже відгукнулися' : 'Відгукнутись'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <section>
            <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-4">Опис вакансії</h3>
            <p className="text-slate-300 text-lg whitespace-pre-wrap leading-relaxed">{vacancy.description}</p>
          </section>

          {vacancy.requirements && (
            <section>
              <h3 className="text-xl font-bold text-white mb-4 border-l-4 border-cyan-500 pl-4">Вимоги та навички</h3>
              <p className="text-slate-300 text-lg whitespace-pre-wrap leading-relaxed">{vacancy.requirements}</p>
            </section>
          )}
        </div>
      </div>

      {/* --- МОДАЛЬНЕ ВІКНО ВІДГУКУ --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
                <button onClick={handleCloseModal} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
                <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-6">Відгук на вакансію</h2>
                    <p className="text-slate-400 mb-6">Ви відгукуєтесь на посаду <strong className="text-white">{vacancy.title}</strong></p>

                    <form onSubmit={handleSubmitApplication} className="space-y-5">

                        <div>
                            <label className="block text-sm font-bold text-white mb-3">Резюме</label>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                                    <input type="radio" name="resume" value="none" checked={resumeOption === "none"} onChange={() => setResumeOption("none")} className="accent-accent" />
                                    <span className="text-slate-300 text-sm">Без резюме (тільки текст)</span>
                                </label>

                                {seekerProfile?.resumes?.length > 0 && (
                                    <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                                        <input type="radio" name="resume" value="existing" checked={resumeOption === "existing"} onChange={() => setResumeOption("existing")} className="accent-accent" />
                                        <div className="flex-1">
                                            <span className="text-slate-300 text-sm block mb-1">Обрати з мого профілю</span>
                                            {resumeOption === "existing" && (
                                                <select
                                                    className="w-full bg-slate-800 text-white text-sm p-2 rounded-lg border border-slate-600 outline-none"
                                                    onChange={(e) => setSelectedExistingResume(e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- Оберіть резюме --</option>
                                                    {seekerProfile.resumes.map(r => (
                                                        <option key={r.id} value={r.file_url}>{r.file_name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </label>
                                )}

                                <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition">
                                    <input type="radio" name="resume" value="new" checked={resumeOption === "new"} onChange={() => setResumeOption("new")} className="accent-accent" />
                                    <div className="flex-1">
                                        <span className="text-slate-300 text-sm block mb-1">Завантажити новий файл</span>
                                        {resumeOption === "new" && (
                                            <input
                                                type="file"
                                                accept=".pdf,.doc,.docx"
                                                onChange={(e) => setNewResumeFile(e.target.files[0])}
                                                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                                                required
                                            />
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2">Супровідний лист</label>
                            <textarea
                                rows="4"
                                placeholder="Напишіть кілька слів про те, чому ви підходите на цю посаду..."
                                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-accent transition text-sm"
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                            />
                        </div>

                        {applyStatus.message && (
                            <div className={`p-3 rounded-xl text-sm font-bold text-center ${applyStatus.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {applyStatus.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={applyStatus.loading}
                            className="w-full bg-accent hover:brightness-110 text-white font-bold py-3 rounded-xl transition active:scale-95 disabled:bg-slate-700"
                        >
                            {applyStatus.loading ? 'Надсилаємо...' : 'Надіслати відгук'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default VacancyPage;