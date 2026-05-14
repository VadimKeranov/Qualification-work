import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../api/config';
import { useParams } from 'react-router-dom';
import { getPublicSeekerProfile } from '../api/profile'; // Додали імпорт для отримання аватарок

const EmployerApplications = ({ vacancyIds: propVacancyIds }) => {
    const { id } = useParams();
    const activeVacancyIds = propVacancyIds || (id ? [id] : []);

    const [applications, setApplications] = useState([]);
    const [vacancyInfo, setVacancyInfo] = useState(null);
    const [seekerProfiles, setSeekerProfiles] = useState({}); // Зберігаємо профілі кандидатів
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    const [statusDrafts, setStatusDrafts] = useState({});

    const fetchVacancyDetails = async () => {
        if (id) {
            try {
                const response = await axios.get(`${API_URL}/vacancies/${id}`);
                setVacancyInfo(response.data);
            } catch (error) {
                console.error("Помилка завантаження вакансії:", error);
            }
        }
    };

    const fetchApplications = async () => {
        if (!activeVacancyIds || activeVacancyIds.length === 0) return;
        try {
            const params = new URLSearchParams();
            activeVacancyIds.forEach(vid => params.append('vacancy_ids', vid));

            const response = await axios.get(`${API_URL}/applications/?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const apps = response.data;
            setApplications(apps);

            // Ініціалізуємо чернетки (щоб роботодавець бачив те, що вже написав)
            const initialDrafts = {};
            apps.forEach(app => {
                initialDrafts[app.id] = { status: app.status, message: app.employer_message || "" };
            });
            setStatusDrafts(initialDrafts);

            // Отримуємо унікальні ID кандидатів та підвантажуємо їх профілі (аватарки, імена)
            const uniqueSeekers = [...new Set(apps.map(a => a.seeker_id))];
            const profilesData = {};
            await Promise.all(uniqueSeekers.map(async (sid) => {
                try {
                    const prof = await getPublicSeekerProfile(sid);
                    profilesData[sid] = prof;
                } catch (e) {
                    console.error("Не вдалося завантажити профіль кандидата", sid);
                }
            }));
            setSeekerProfiles(profilesData);

        } catch (error) {
            console.error("Помилка завантаження відгуків:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchVacancyDetails(), fetchApplications()]);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [id, propVacancyIds]);

    const handleDraftChange = (appId, field, value) => {
        setStatusDrafts(prev => ({
            ...prev,
            [appId]: { ...prev[appId], [field]: value }
        }));
    };

    const saveStatusAndMessage = async (appId) => {
        const draft = statusDrafts[appId];
        try {
            await axios.patch(`${API_URL}/applications/${appId}/status`,
                { status: draft.status, employer_message: draft.message },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Оновлюємо локально
            setApplications(prev => prev.map(app =>
                app.id === appId ? { ...app, status: draft.status, employer_message: draft.message } : app
            ));

            alert("Зміни успішно збережено!");
        } catch (error) {
            alert("Помилка при збереженні");
        }
    };

    const getResumeLink = (url) => {
        if (!url || url === "default_resume.pdf") return "#";
        if (url.startsWith("http")) return url;
        return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
    };

    if (loading) return <div className="text-slate-400 text-center py-10 animate-pulse">Завантаження відгуків...</div>;

    const funnelSteps = vacancyInfo?.hiring_funnel || [];

    return (
        <div className="max-w-6xl mx-auto mt-10 px-4 pb-20 space-y-6">
            <div className="mb-8 pb-4 border-b border-white/10 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Відгуки кандидатів</h2>
                    {vacancyInfo && <p className="text-slate-400 mt-2 text-lg">Вакансія: <span className="text-accent font-semibold">{vacancyInfo.title}</span></p>}
                </div>
                <div className="text-slate-500 font-medium bg-white/5 px-4 py-2 rounded-xl">
                    Всього відгуків: {applications.length}
                </div>
            </div>

            {applications.length > 0 ? (
                <div className="grid gap-6">
                    {applications.map((app) => {
                        const profile = seekerProfiles[app.seeker_id];
                        // Шукаємо оригінальну назву резюме
                        const resumeObj = profile?.resumes?.find(r => r.file_url === app.resume_url);
                        const resumeName = resumeObj ? resumeObj.file_name : (app.resume_url && app.resume_url !== "default_resume.pdf" ? app.resume_url.split('/').pop() : 'Резюме');
                        const avatarUrl = profile?.photo_url ? (profile.photo_url.startsWith('http') ? profile.photo_url : `${API_URL}${profile.photo_url}`) : null;

                        return (
                            <div key={app.id} className="glass-panel p-0 overflow-hidden flex flex-col md:flex-row rounded-2xl border border-white/10 shadow-lg">

                                {/* ЛІВА ЧАСТИНА: Інформація про кандидата (Більша) */}
                                <div className="flex-1 p-6 md:p-8 md:border-r border-white/10">
                                    <div className="flex gap-5 items-start">

                                        {/* Аватарка */}
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-slate-700 shrink-0 shadow-md" />
                                        ) : (
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl shrink-0 shadow-md">
                                                👤
                                            </div>
                                        )}

                                        {/* Деталі */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                                <div>
                                                    <h3 className="text-xl md:text-2xl font-bold text-white truncate">
                                                        {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || `Кандидат #${app.seeker_id}` : `Кандидат #${app.seeker_id}`}
                                                    </h3>
                                                    {profile?.city && <p className="text-sm text-slate-400 mt-1">📍 {profile.city}</p>}
                                                </div>
                                                {app.status === 'pending' && <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shrink-0">Новий відгук</span>}
                                            </div>

                                            {/* Супровідний лист */}
                                            {app.cover_letter && (
                                                <div className="mt-5 bg-black/20 p-4 rounded-xl border border-white/5 relative">
                                                    <span className="absolute -top-2.5 left-4 bg-slate-900/80 backdrop-blur px-2 text-[10px] font-bold uppercase tracking-widest text-accent rounded-full border border-white/5">
                                                        Супровідний лист
                                                    </span>
                                                    <p className="text-slate-300 text-sm italic leading-relaxed">"{app.cover_letter}"</p>
                                                </div>
                                            )}

                                            {/* Кнопка Резюме */}
                                            <div className="mt-5">
                                                {app.resume_url && app.resume_url !== "default_resume.pdf" ? (
                                                    <a href={getResumeLink(app.resume_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent px-4 py-2.5 rounded-xl transition font-medium text-sm max-w-full">
                                                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                        <span className="truncate">{resumeName}</span>
                                                    </a>
                                                ) : (
                                                    <span className="inline-block text-slate-500 text-sm font-medium bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                                                        🚫 Без резюме
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ПРАВА ЧАСТИНА: Управління статусом (Менша) */}
                                <div className="w-full md:w-80 lg:w-96 bg-slate-900/60 p-6 flex flex-col justify-center">
                                    <h4 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4">Управління відгуком</h4>

                                    <div className="space-y-4 flex-1">

                                        {/* Кастомний Select */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">Етап відбору:</label>
                                            <div className="relative group">
                                                <select
                                                    value={statusDrafts[app.id]?.status || "pending"}
                                                    onChange={(e) => handleDraftChange(app.id, 'status', e.target.value)}
                                                    className="appearance-none w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none focus:border-accent group-hover:border-slate-500 transition cursor-pointer text-sm font-semibold shadow-inner"
                                                >
                                                    <option value="pending" disabled>Новий (Не оброблено)</option>
                                                    <optgroup label="Ваша воронка найму">
                                                        {funnelSteps.map((step, idx) => (
                                                            <option key={idx} value={step.name || step}>{step.name || step}</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="Завершення">
                                                        <option value="Відмовлено ❌">Відмовлено ❌</option>
                                                        <option value="Оффер прийнято ✅">Оффер прийнято ✅</option>
                                                    </optgroup>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-white transition">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Текстове поле */}
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2">Повідомлення кандидату:</label>
                                            <textarea
                                                rows="3"
                                                placeholder="Напишіть коментар, дайте посилання на тестове завдання або вкажіть причину відмови..."
                                                className="w-full bg-black/40 border border-slate-700 rounded-xl p-3 text-white text-sm outline-none focus:border-accent transition placeholder-slate-600 resize-none shadow-inner"
                                                value={statusDrafts[app.id]?.message || ""}
                                                onChange={(e) => handleDraftChange(app.id, 'message', e.target.value)}
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => saveStatusAndMessage(app.id)}
                                        className="w-full mt-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition active:scale-95 shadow-lg shadow-cyan-500/20 text-sm"
                                    >
                                        Зберегти та відправити
                                    </button>
                                </div>

                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-24 bg-slate-900/30 border border-dashed border-slate-700 rounded-3xl">
                    <p className="text-slate-500 text-lg">На цю вакансію поки немає жодного відгуку.</p>
                </div>
            )}
        </div>
    );
};

export default EmployerApplications;