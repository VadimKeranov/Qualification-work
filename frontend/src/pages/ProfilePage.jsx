import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Предполагается, что у вас есть хук для доступа к данным пользователя и токену
// import { useAuth } from '../context/AuthContext'; 
// Если у вас нет такого хука, замените useAuth() на вашу реализацию
const useAuth = () => ({
  user: { role: 'employer', id: 1 }, // ЗАГЛУШКА: Замените на реальные данные пользователя
});

// Импортируем функции API, которые мы определили
import { getCompanyProfile, getSeekerProfile } from '../api/profile';

// Стили можно вынести в отдельный CSS-модуль
// import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let data;
        // В зависимости от роли пользователя, вызываем нужную функцию API
        if (user.role === 'employer') {
          data = await getCompanyProfile();
        } else if (user.role === 'worker') {
          // data = await getSeekerProfile(); // Раскомментируйте, когда будет готова функция
          // Пока используем заглушку для соискателя
          data = { first_name: 'Иван', last_name: 'Иванов', city: 'Москва' };
        }
        setProfileData(data);
      } catch (err) {
        setError('Не удалось загрузить профиль. Попробуйте обновить страницу.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]); // Перезагружаем профиль, если меняется пользователь

  if (isLoading) {
    return <div>Загрузка профиля...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>{error}</div>;
  }

  if (!profileData) {
    return <div>Не удалось найти данные профиля.</div>;
  }

  // --- Рендер компонента в зависимости от роли ---

  const renderCompanyProfile = () => (
    <div className="company-profile">
      <header>
        <h1>{profileData.company_name}</h1>
        {profileData.logo_url && <img src={profileData.logo_url} alt="Логотип компании" style={{ maxWidth: '150px' }} />}
      </header>
      
      <section className="profile-details">
        <h2>О компании</h2>
        <p><strong>Описание:</strong> {profileData.description || 'Нет описания'}</p>
        <p><strong>Сайт:</strong> <a href={profileData.website} target="_blank" rel="noopener noreferrer">{profileData.website}</a></p>
        <p><strong>Отрасль:</strong> {profileData.industry || 'Не указана'}</p>
        <p><strong>Размер компании:</strong> {profileData.company_size || 'Не указан'}</p>
        <p><strong>Год основания:</strong> {profileData.foundation_year || 'Не указан'}</p>
        <p><strong>Адрес:</strong> {profileData.address || 'Не указан'}</p>
        <p><strong>Телефон:</strong> {profileData.contact_phone || 'Не указан'}</p>
      </section>

      <section className="vacancies-list">
        <h2>Активные вакансии</h2>
        {profileData.vacancies && profileData.vacancies.length > 0 ? (
          <ul>
            {profileData.vacancies.map((vacancy) => (
              <li key={vacancy.id}>
                <Link to={`/vacancies/${vacancy.id}`}>{vacancy.title}</Link>
                <span>
                  {vacancy.salary_from && ` от ${vacancy.salary_from}`}
                  {vacancy.salary_to && ` до ${vacancy.salary_to}`}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>У компании пока нет открытых вакансий.</p>
        )}
      </section>
    </div>
  );

  const renderSeekerProfile = () => (
    <div className="seeker-profile">
      <h1>Профиль соискателя</h1>
      <p><strong>Имя:</strong> {profileData.first_name}</p>
      <p><strong>Фамилия:</strong> {profileData.last_name}</p>
      <p><strong>Город:</strong> {profileData.city}</p>
      {/* Здесь будет остальная информация о соискателе */}
    </div>
  );

  return (
    <div className="profile-page-container">
      {user.role === 'employer' ? renderCompanyProfile() : renderSeekerProfile()}
    </div>
  );
};

export default ProfilePage;
