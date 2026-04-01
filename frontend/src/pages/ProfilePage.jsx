import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, uploadPhoto, uploadResume, deleteResume } from '../api/profile';

const ProfilePage = () => {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Стейт для inline-редактирования
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [saveStatus, setSaveStatus] = useState({ loading: false, message: '', type: '' });

  // Стейт и рефы для загрузки файлов
  const [uploadStatus, setUploadStatus] = useState({ loading: false, message: '' });
  const photoInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const fetchProfile = async () => {
    if (!user || !token) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProfile(token, user.role);
      setProfileData(data);
    } catch (err) {
      setError('Не удалось загрузить профиль. Попробуйте обновить страницу.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user, token]);

  // --- Логика Inline-редактирования ---
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
    setSaveStatus({ loading: true, message: 'Сохранение...', type: 'info' });
    try {
      await updateProfile(token, user.role, editFormData);
      setSaveStatus({ loading: false, message: 'Изменения сохранены!', type: 'success' });
      setProfileData({ ...editFormData });
      setTimeout(() => {
        setIsEditing(false);
        setSaveStatus({ loading: false, message: '', type: '' });
      }, 1500);
    } catch (err) {
      setSaveStatus({ loading: false, message: err.message || 'Ошибка сохранения', type: 'error' });
    }
  };

  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Удалить это резюме?")) return;

    try {
      await deleteResume(token, resumeId);
      await fetchProfile(); // Обновляем список
    } catch (err) {
      alert("Не удалось удалить резюме");
    }
  };

  // --- Обработчики загрузки файлов ---
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus({ loading: true, message: `Загрузка ${type === 'photo' ? 'фото' : 'резюме'}...` });
    try {
      if (type === 'photo') {
        await uploadPhoto(token, file);
      } else {
        await uploadResume(token, file);
      }
      setUploadStatus({ loading: false, message: 'Успешно загружено!' });
      await fetchProfile(); // Обновляем профиль после успешной загрузки
      setTimeout(() => setUploadStatus({ loading: false, message: '' }), 3000);
    } catch (err) {
      setUploadStatus({ loading: false, message: err.message || 'Ошибка загрузки' });
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center mt-10 p-4 bg-red-900/20 rounded-lg max-w-2xl mx-auto border border-red-500/50">{error}</div>
  );

  if (!profileData) return (
    <div className="max-w-2xl mx-auto mt-10 text-center bg-slate-800/50 border border-slate-700 p-10 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold text-white mb-4">Профиль еще не заполнен</h2>
      <p className="text-slate-400 mb-6">Пожалуйста, расскажите немного о себе, чтобы система могла работать эффективнее.</p>
      <button onClick={startEditing} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg transition">
        Заполнить профиль
      </button>
    </div>
  );

  // --- Рендер профиля КОМПАНИИ ---
  const renderCompanyProfile = () => (
    <div className="space-y-8">
      {/* ... (код компании остается без изменений, для фокуса на соискателе) */}
      <div className="flex items-center space-x-6 border-b border-slate-700 pb-8">
        {profileData.logo_url ? (
          <img src={profileData.logo_url} alt="Логотип" className="w-24 h-24 rounded-lg object-cover border border-slate-600" />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400">Лого</div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{profileData.company_name || "Название не указано"}</h1>
          <p className="text-cyan-400">{profileData.industry || 'Отрасль не указана'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">Информация</h3>
          <p><strong className="text-slate-500">Описание:</strong> {profileData.description || '—'}</p>
          <p><strong className="text-slate-500">Сайт:</strong> {profileData.website ? <a href={profileData.website} className="text-cyan-500 hover:underline" target="_blank" rel="noopener noreferrer">{profileData.website}</a> : '—'}</p>
          <p><strong className="text-slate-500">Размер:</strong> {profileData.company_size || '—'}</p>
          <p><strong className="text-slate-500">Основана:</strong> {profileData.foundation_year || '—'}</p>
        </div>
        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-3">
          <h3 className="text-lg font-semibold text-white mb-4">Контакты</h3>
          <p><strong className="text-slate-500">Email:</strong> {profileData.contact_email || '—'}</p>
          <p><strong className="text-slate-500">Телефон:</strong> {profileData.contact_phone || '—'}</p>
          <p><strong className="text-slate-500">Адрес:</strong> {profileData.address || '—'}</p>
        </div>
      </div>
    </div>
  );

  // --- Рендер профиля СОИСКАТЕЛЯ ---
  const renderSeekerProfile = () => (
    <div className="space-y-8">
      {/* Шапка с фото */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 border-b border-slate-700 pb-8 relative">

        {saveStatus.message && (
          <div className={`absolute top-0 right-0 p-3 rounded-lg text-sm font-medium backdrop-blur border 
            ${saveStatus.type === 'success' ? 'bg-green-900/70 text-green-300 border-green-500' : 
              (saveStatus.type === 'error' ? 'bg-red-900/70 text-red-300 border-red-500' : 'bg-blue-900/70 text-blue-300 border-blue-500')}`}>
            {saveStatus.message}
          </div>
        )}

        <div className="relative group">
          {profileData.photo_url ? (
            <img src={profileData.photo_url} alt="Фото профиля" className="w-32 h-32 rounded-full object-cover border-4 border-slate-700" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center text-4xl text-slate-500 border-4 border-slate-600">👤</div>
          )}

          {/* ИЗМЕНЕНИЕ: Кнопка фото показывается ТОЛЬКО в режиме редактирования */}
          {isEditing && (
            <>
              <button onClick={() => photoInputRef.current.click()} className="absolute bottom-0 right-0 bg-cyan-600 hover:bg-cyan-500 p-2 rounded-full text-white shadow-lg transition" title="Изменить фото">📷</button>
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
            </>
          )}
        </div>

        <div className="text-center md:text-left flex-grow space-y-2">
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <input type="text" name="first_name" value={editFormData.first_name || ''} onChange={handleInputChange} placeholder="Имя" className="bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none" />
              <input type="text" name="last_name" value={editFormData.last_name || ''} onChange={handleInputChange} placeholder="Фамилия" className="bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none" />
            </div>
          ) : (
            <h1 className="text-3xl font-bold text-white">
              {profileData.first_name || 'Имя'} {profileData.last_name || 'не указано'}
            </h1>
          )}

          {isEditing ? (
            <input type="text" name="city" value={editFormData.city || ''} onChange={handleInputChange} placeholder="Город" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white focus:border-cyan-500 outline-none" />
          ) : (
            <p className="text-cyan-400 text-lg mt-1">{profileData.city ? profileData.city : 'Город не указан'}</p>
          )}
        </div>

        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button onClick={cancelEditing} className="px-4 py-2 text-slate-400 hover:text-white transition">Отмена</button>
              <button onClick={handleSave} disabled={saveStatus.loading} className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-lg transition disabled:bg-slate-600">
                {saveStatus.loading ? '...' : 'Сохранить'}
              </button>
            </>
          ) : (
            <button onClick={startEditing} className="border border-slate-600 text-slate-300 hover:text-white hover:border-white px-4 py-2 rounded-lg transition">
              Редактировать
            </button>
          )}
        </div>
      </div>

      {uploadStatus.message && (
        <div className={`p-3 rounded text-center ${uploadStatus.loading ? 'bg-blue-900/50 text-blue-300' : 'bg-green-900/50 text-green-300'}`}>
          {uploadStatus.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-2 border-b border-slate-700 pb-2">Личные данные</h3>

          {[
            { label: 'Дата рождения', name: 'birth_date', type: 'date' },
            { label: 'Район', name: 'district', type: 'text' },
            { label: 'Email для связи', name: 'contact_email', type: 'email' },
            { label: 'Телефон', name: 'phone', type: 'tel' }
          ].map(field => (
            <div key={field.name} className="grid grid-cols-[130px,1fr] items-center gap-x-2">
              <span className="text-slate-500 font-medium">{field.label}:</span>
              {isEditing ? (
                <input type={field.type} name={field.name} value={editFormData[field.name] || ''} onChange={handleInputChange} className="bg-slate-900 border border-slate-700 rounded p-1.5 text-white focus:border-cyan-500 outline-none w-full text-sm" />
              ) : (
                <span className="text-white truncate">{profileData[field.name] || '—'}</span>
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">Мои резюме</h3>
          <div className="flex-grow space-y-3 mb-4">
             {profileData.resumes && profileData.resumes.length > 0 ? (
                profileData.resumes.map(resume => (
                  <div key={resume.id} className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700">
                  <span className="text-cyan-400 truncate w-2/3" title={resume.file_name}>{resume.file_name || 'Резюме'}</span>
                    <div className="flex space-x-2">
                  <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white flex items-center">Скачать</a>
                  <button onClick={() => handleDeleteResume(resume.id)} className="text-xs bg-red-900/50 hover:bg-red-800 text-red-300 px-2 py-1 rounded transition" title="Удалить">✕</button>
                    </div>
                  </div>
                ))
             ) : (
                <p className="text-slate-500 text-sm">Вы еще не загрузили ни одного резюме в формате PDF или DOCX.</p>
             )}
          </div>

          {/* ИЗМЕНЕНИЕ: Кнопка загрузки резюме работает ВСЕГДА, вне зависимости от isEditing */}
          <button onClick={() => resumeInputRef.current.click()} className="w-full mt-auto bg-slate-700 hover:bg-cyan-600 text-white font-medium py-2 px-4 rounded transition border border-slate-600 hover:border-cyan-500">
            + Загрузить резюме
          </button>
          <input type="file" ref={resumeInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileUpload(e, 'resume')} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto mt-10 p-8 bg-slate-800/40 backdrop-blur border border-slate-700 rounded-3xl shadow-2xl">
      {user.role === 'employer' ? renderCompanyProfile() : renderSeekerProfile()}
    </div>
  );
};

export default ProfilePage;