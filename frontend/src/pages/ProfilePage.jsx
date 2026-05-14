import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, uploadPhoto, uploadResume, deleteResume, getPublicSeekerProfile } from '../api/profile';
import { getMyApplications } from '../api/applications';
import { API_URL } from '../api/config';
import axios from 'axios';

// --- НОВИЙ КОМПОНЕНТ: Картка відгуку з розгорнутою воронкою ---
const ApplicationDetailsCard = ({ app }) => {
    const [vacancyInfo, setVacancyInfo] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = async () => {
        if (!isExpanded && !vacancyInfo) {
            try {
                const res = await axios.get(`${API_URL}/vacancies/${app.vacancy_id}`);
                setVacancyInfo(res.data);
            } catch (error) {
                console.error("Не вдалося завантажити деталі вакансії", error);
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="bg-slate-900/80 border border-white/10 p-5 rounded-2xl transition hover:border-accent/50 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer" onClick={toggleExpand}>
                <div className="flex-1 w-full">
                    <div className="text-lg font-bold text-white group-hover:text-accent transition">
                        Відгук на вакансію #{app.vacancy_id}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm">
                        <span className="text-slate-500">Подано: {new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${
                        app.status === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        (app.status.toLowerCase().includes('відмов') || app.status.toLowerCase().includes('reject')) ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                        {app.status}
                    </span>
                    <button className="text-slate-400 bg-white/5 p-2 rounded-lg hover:bg-white/10 hover:text-white transition">
                        {isExpanded ? "▲" : "▼"}
                    </button>
                </div>
            </div>

            {/* Розгорнута частина з повідомленням та воронкою */}
            {isExpanded && (
                <div className="mt-6 pt-6 border-t border-white/10 space-y-6 animate-fade-in">

                    {/* Повідомлення від роботодавця */}
                    {app.employer_message ? (
                        <div className="bg-accent/10 border border-accent/30 p-5 rounded-xl">
                            <h4 className="text-accent font-bold text-sm uppercase tracking-wider mb-2">💬 Повідомлення від компанії:</h4>
                            <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">
                                {app.employer_message}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white/5 p-4 rounded-xl text-center">
                            <span className="text-slate-500 text-sm italic">Компанія ще не залишила коментарів.</span>
                        </div>
                    )}

                    {/* Візуальна Воронка найму */}
                    {vacancyInfo && vacancyInfo.hiring_funnel && (
                        <div>
                            <h4 className="text-white font-bold mb-4">Процес відбору на цю посаду:</h4>
                            <div className="space-y-4">
                                {vacancyInfo.hiring_funnel.map((step, index) => {
                                    // Перевіряємо, чи є цей етап поточним для кандидата
                                    const isActive = app.status === (step.name || step);

                                    return (
                                        <div key={index} className={`flex gap-4 p-4 rounded-xl border ${isActive ? 'bg-cyan-900/30 border-cyan-500/50' : 'bg-black/20 border-white/5'}`}>
                                            <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${isActive ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-slate-800 text-slate-400'}`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <h5 className={`font-bold ${isActive ? 'text-cyan-400' : 'text-slate-300'}`}>
                                                    {step.name || step} {isActive && " (Поточний етап)"}
                                                </h5>
                                                {step.description && (
                                                    <p className="text-slate-500 text-sm mt-1">{step.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- ОСНОВНИЙ КОМПОНЕНТ СТОРІНКИ ПРОФІЛЮ ---
const ProfilePage = () => {
  const { id } = useParams();
  const { user, token } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState({ loading: false, message: '', type: '' });
  const [uploadStatus, setUploadStatus] = useState({ loading: false, message: '' });

  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const isOwner = !id || (user && user.id === parseInt(id));

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (id) {
        data = await getPublicSeekerProfile(id);
      } else if (token && user) {
        data = await getProfile(token, 'worker');

        try {
            const apps = await getMyApplications(token);
            data.applications = apps;
        } catch (appErr) {
            data.applications = [];
        }

      } else {
        setIsLoading(false);
        return;
      }
      setProfileData(data);
    } catch (err) {
      setError('Не вдалося завантажити профіль. Можливо, його не існує.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id, user, token]);

  const startEditing = () => {
    setEditFormData({ ...profileData });
    setIsEditing(true);
    setSaveStatus({ loading: false, message: '', type: '' });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaveStatus({ loading: true, message: 'Збереження...', type: 'info' });
    try {
      await updateProfile(token, 'worker', editFormData);
      setSaveStatus({ loading: false, message: 'Зміни збережено!', type: 'success' });
      await fetchProfile();
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus({ loading: false, message: '', type: '' });
      }, 1500);
    } catch (err) {
      setSaveStatus({ loading: false, message: err.message || 'Помилка збереження', type: 'error' });
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Видалити це резюме?")) return;
    try {
      await deleteResume(token, resumeId);
      await fetchProfile();
    } catch (err) {
      alert("Не вдалося видалити резюме");
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus({ loading: true, message: `Завантаження ${type === 'resume' ? 'резюме' : 'фото'}...` });
    try {
      let result;
      if (type === 'photo') {
        result = await uploadPhoto(token, file);
        setEditFormData(prev => ({ ...prev, photo_url: result.photo_url }));
      } else {
        await uploadResume(token, file);
      }

      setUploadStatus({ loading: false, message: 'Успішно завантажено!' });
      await fetchProfile();
      setTimeout(() => setUploadStatus({ loading: false, message: '' }), 3000);
    } catch (err) {
      setUploadStatus({ loading: false, message: err.message || 'Помилка завантаження' });
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );

  if (!isOwner && !user && !id) return (
    <div className="text-white text-center mt-20 p-8 bg-slate-800/40 rounded-3xl border border-slate-700 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Доступ обмежено</h2>
      <p className="text-slate-400 mb-6">Будь ласка, увійдіть в систему.</p>
      <Link to="/login" className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-xl transition">Увійти</Link>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center mt-10 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto border border-red-500/50">{error}</div>
  );

  if (!profileData) return (
    <div className="max-w-2xl mx-auto mt-10 text-center bg-slate-800/50 border border-slate-700 p-10 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Профіль ще не заповнено</h2>
      {isOwner ? (
        <>
          <p className="text-slate-400 mb-6">Будь ласка, розкажіть про себе, щоб почати роботу.</p>
          <button onClick={startEditing} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg transition">
            Заповнити профіль
          </button>
        </>
      ) : (
        <p className="text-slate-400">Користувач ще не заповнив свій профіль.</p>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-10 p-8 bg-slate-800/40 backdrop-blur border border-slate-700 rounded-3xl shadow-2xl">
      <div className="space-y-8">
        <div className="flex space-x-6 border-b border-slate-700 mb-6">
          <button onClick={() => setActiveTab('info')} className={`pb-3 transition ${activeTab === 'info' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>
            {isOwner ? 'Мій профіль' : 'Резюме кандидата'}
          </button>
          {isOwner && (
            <button onClick={() => setActiveTab('my_apps')} className={`pb-3 transition ${activeTab === 'my_apps' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400'}`}>
              Мої відгуки
            </button>
          )}
        </div>

        {activeTab === 'info' ? (
          <>
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 border-b border-slate-700 pb-8 relative">
              <div className="relative group shrink-0">
                {profileData.photo_url ? (
                  <img
                    src={profileData.photo_url.startsWith('http') ? profileData.photo_url : `${API_URL}${profileData.photo_url}`}
                    alt="Аватар"
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-700"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-4xl border-4 border-slate-600">👤</div>
                )}
                {isOwner && isEditing && (
                  <>
                    <button onClick={() => photoInputRef.current.click()} className="absolute bottom-0 right-0 bg-cyan-600 p-2 rounded-full text-white shadow-lg transition z-10">📷</button>
                    <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                  </>
                )}
              </div>

              <div className="text-center md:text-left flex-grow space-y-2 w-full">
                {isOwner && isEditing ? (
                  <div className="space-y-3">
                    <input type="text" name="first_name" placeholder="Ім'я" value={editFormData.first_name || ''} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    <input type="text" name="last_name" placeholder="Прізвище" value={editFormData.last_name || ''} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    <input type="text" name="city" placeholder="Місто" value={editFormData.city || ''} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                    <input type="text" name="phone" placeholder="Телефон" value={editFormData.phone || ''} onChange={handleInputChange} className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" />
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-bold text-white">{profileData.first_name || 'Ім\'я'} {profileData.last_name || ''}</h1>
                    <p className="text-cyan-400">{profileData.city || 'Місто не вказано'}</p>
                    <p className="text-slate-400">{profileData.phone || 'Телефон не вказано'}</p>
                  </>
                )}
              </div>

              {isOwner && (
                <div className="flex space-x-3 shrink-0">
                  {isEditing ? (
                    <>
                       <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg transition">Зберегти</button>
                       <button onClick={cancelEditing} className="bg-slate-700 text-white px-5 py-2 rounded-lg transition">Скасувати</button>
                    </>
                  ) : (
                    <button onClick={startEditing} className="border border-slate-600 text-slate-300 px-4 py-2 rounded-lg transition">Редагувати</button>
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-semibold text-white">Резюме та файли</h3>
                 {isOwner && isEditing && (
                   <>
                     <button onClick={() => resumeInputRef.current.click()} className="text-cyan-400 text-sm hover:underline">+ Додати резюме</button>
                     <input type="file" ref={resumeInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'resume')} />
                   </>
                 )}
               </div>
               {profileData.resumes?.length > 0 ? profileData.resumes.map(r => (
                 <div key={r.id} className="flex justify-between items-center bg-slate-800 p-3 rounded mb-2">
                   <a href={r.file_url.startsWith('http') ? r.file_url : `${API_URL}${r.file_url}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                     📄 {r.file_name}
                   </a>
                   {isOwner && isEditing && (
                     <button onClick={() => handleDeleteResume(r.id)} className="text-red-400 text-sm hover:underline">Видалити</button>
                   )}
                 </div>
               )) : <p className="text-slate-500">Резюме не завантажено.</p>}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Історія ваших відгуків</h2>

            {profileData.applications?.length > 0 ? (
              <div className="grid gap-4">
                {profileData.applications.map((app) => (
                  <ApplicationDetailsCard key={app.id} app={app} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                <p className="text-slate-500">Ви ще не відгукнулися на жодну вакансію.</p>
                <Link to="/" className="text-accent hover:underline mt-2 inline-block font-bold">Знайти роботу зараз</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;