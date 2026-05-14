import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getPublicCompanyProfile, updateProfile, uploadCompanyLogo } from '../api/profile';
import { getVacanciesByCompany } from '../api/vacancies';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../api/config';

const CompanyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [company, setCompany] = useState(null);
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const logoInputRef = useRef(null);

  // Перевірка, чи поточний користувач є власником компанії
  const isOwner = user && company && user.id === company.user_id;

  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Отримання даних профілю компанії
      const companyData = await getPublicCompanyProfile(id);
      setCompany(companyData);

      // Отримання списку вакансій компанії
      const vacanciesData = await getVacanciesByCompany(id);
      setVacancies(vacanciesData);

    } catch (err) {
      setError('Компанію не знайдено або сталася помилка.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [id, user, token]);

  const handleEditClick = () => {
    setEditFormData({ ...company });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const updatedCompany = await updateProfile(token, 'employer', editFormData);
      setCompany(updatedCompany);
      setIsEditing(false);
    } catch (error) {
      console.error("Помилка збереження", error);
      alert("Не вдалося зберегти зміни");
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadCompanyLogo(token, file);
      setEditFormData(prev => ({ ...prev, logo_url: result.logo_url }));
      setCompany(prev => ({ ...prev, logo_url: result.logo_url }));
    } catch (error) {
      console.error("Помилка завантаження логотипу", error);
      alert("Не вдалося завантажити логотип");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  if (error || !company) return (
    <div className="text-center text-red-400 mt-20 p-6 glass-panel max-w-2xl mx-auto font-medium">
      {error}
    </div>
  );

  const getLogoSrc = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  };

  const inputClass = "w-full bg-slate-900/50 border border-white/10 rounded-xl p-2.5 text-slate-200 focus:border-accent outline-none transition";

  return (
    <div className="max-w-5xl mx-auto mt-10 space-y-8 px-4 pb-10">

      {/* --- БЛОК 1: Основна інформація --- */}
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-white/10 pb-8 gap-6">

          <div className="flex items-center gap-6 w-full md:w-2/3">
            <div className="relative shrink-0 group">
              {company.logo_url ? (
                <img
                  src={getLogoSrc(isEditing ? editFormData.logo_url : company.logo_url)}
                  alt="Логотип"
                  className="w-24 h-24 rounded-2xl object-cover border border-white/10 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500 text-sm font-bold border border-white/10 shadow-inner">
                  ЛОГО
                </div>
              )}

              {isOwner && isEditing && (
                <>
                  <button
                    onClick={() => logoInputRef.current.click()}
                    className="absolute -bottom-2 -right-2 bg-accent p-2 rounded-full text-white shadow-lg transition hover:scale-110 z-10"
                  >
                    📷
                  </button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </>
              )}
            </div>

            <div className="flex-grow w-full">
              {isEditing ? (
                <div className="space-y-3">
                  <input type="text" name="company_name" value={editFormData.company_name || ''} onChange={handleInputChange} placeholder="Назва компанії" className={`${inputClass} font-bold text-xl`} />
                  <input type="text" name="industry" value={editFormData.industry || ''} onChange={handleInputChange} placeholder="Галузь (напр. IT, Фінанси)" className={inputClass} />
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">{company.company_name}</h1>
                  <p className="text-accent font-medium mt-1">{company.industry || 'Галузь не вказана'}</p>
                </>
              )}
            </div>
          </div>

          {/* Панель кнопок власника */}
          {isOwner && (
            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              {isEditing ? (
                <div className="flex gap-2">
                  <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg transition active:scale-95">
                    💾 Зберегти
                  </button>
                  <button onClick={handleCancelEdit} className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-2.5 rounded-xl font-medium transition active:scale-95">
                    Скасувати
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={handleEditClick} className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl transition font-medium border border-white/10 shadow-sm">
                    ✏️ Редагувати
                  </button>
                  {/* Заміна кнопки "Створити вакансію" на "Мої вакансії" */}
                  <button onClick={() => navigate(`/companies/${id}/my-vacancies`)} className="bg-accent text-white px-5 py-2.5 rounded-xl transition font-bold shadow-accent hover:brightness-110 active:scale-95">
                    Мої вакансії
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* --- Деталі та Контакти (Наверху) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">

          {/* Деталі компанії */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="text-lg font-bold text-white mb-4">Деталі</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Сайт</label>
                  <input type="text" name="website" value={editFormData.website || ''} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="flex gap-3">
                  <div className="w-1/2">
                    <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Розмір</label>
                    <input type="text" name="company_size" value={editFormData.company_size || ''} onChange={handleInputChange} className={inputClass} placeholder="Напр: 50-100" />
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Рік заснування</label>
                    <input type="number" name="foundation_year" value={editFormData.foundation_year || ''} onChange={handleInputChange} className={inputClass} placeholder="Напр: 2023" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-medium">Сайт:</span>
                  <span className="text-white font-medium text-right">
                    {company.website ? <a href={company.website} className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">{company.website}</a> : '—'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-medium">Розмір:</span>
                  <span className="text-white font-medium text-right">{company.company_size || '—'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-medium">Рік заснування:</span>
                  <span className="text-white font-medium text-right">{company.foundation_year || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Контакти */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="text-lg font-bold text-white mb-4">Контакти</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Email</label>
                  <input type="email" name="contact_email" value={editFormData.contact_email || ''} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Телефон</label>
                  <input type="text" name="contact_phone" value={editFormData.contact_phone || ''} onChange={handleInputChange} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block uppercase tracking-wider font-bold">Адреса (Офіс)</label>
                  <input type="text" name="address" value={editFormData.address || ''} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-medium">Email:</span>
                  <span className="text-white font-medium text-right">{company.contact_email || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500 font-medium">Телефон:</span>
                  <span className="text-white font-medium text-right">{company.contact_phone || '—'}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-500 font-medium">Адреса:</span>
                  <span className="text-white font-medium text-right">{company.address || '—'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Велике поле Опис компанії --- */}
        <div className="mt-8 bg-white/5 p-6 rounded-2xl border border-white/5 shadow-inner">
          <h3 className="text-lg font-bold text-white mb-4">Про компанію</h3>
          {isEditing ? (
            <div>
              <label className="text-xs text-slate-400 mb-2 block uppercase tracking-wider font-bold">Опис (Підтримує Markdown: **жирний**, *курсив*, списки)</label>
              <textarea
                name="description"
                value={editFormData.description || ''}
                onChange={handleInputChange}
                placeholder="# Привіт!\nМи крута компанія...\n\n* Пункт 1\n* Пункт 2"
                className={`${inputClass} min-h-[250px] resize-y font-mono text-sm leading-relaxed`}
              />
            </div>
          ) : (
            <div className="text-slate-300 text-sm leading-relaxed
              [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-white [&>h1]:mb-4 [&>h1]:mt-6
              [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mb-3 [&>h2]:mt-5
              [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-white [&>h3]:mb-2 [&>h3]:mt-4
              [&>p]:mb-4
              [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ul>li]:mb-1
              [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>ol>li]:mb-1
              [&>a]:text-accent [&>a]:underline hover:[&>a]:text-white
              [&>blockquote]:border-l-4 [&>blockquote]:border-accent [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-400
              [&>pre]:bg-black/40 [&>pre]:p-4 [&>pre]:rounded-lg [&>pre]:overflow-x-auto
              [&>code]:bg-black/40 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-accent [&>code]:font-mono"
            >
              {company.description ? (
                <ReactMarkdown>{company.description}</ReactMarkdown>
              ) : (
                <span className="italic text-slate-500">Опис відсутній</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- БЛОК 2: Відкриті вакансії (для всіх користувачів) --- */}
      <div className="glass-panel p-8">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
          Відкриті вакансії
        </h2>

        {vacancies.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {vacancies.map((vacancy) => (
              <Link
                key={vacancy.id}
                to={`/vacancies/${vacancy.id}`}
                className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-accent transition-all duration-300 flex flex-col justify-between h-full group relative overflow-hidden shadow-sm hover:shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-accent transition pr-4 leading-tight">{vacancy.title}</h3>
                  </div>

                  <div className="text-sm text-accent font-mono font-semibold bg-accent/10 inline-block px-3 py-1.5 rounded-lg">
                    {vacancy.salary_from ? `${vacancy.salary_from.toLocaleString()} ₽` : ''}
                    {vacancy.salary_to ? ` - ${vacancy.salary_to.toLocaleString()} ₽` : (vacancy.salary_from ? '' : 'Не вказана')}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 border border-dashed border-white/20 rounded-2xl">
            <p className="text-slate-400 font-medium">У компанії наразі немає відкритих вакансій.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default CompanyPage;