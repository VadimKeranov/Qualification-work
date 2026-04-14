import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // Предполагаем, что AuthContext доступен
import './DynamicBackground.css'; // Стили для анимации

const DynamicBackground = () => {
  const { user } = useContext(AuthContext);
  const isEmployer = user && user.role === 'employer';

  // Определяем базовые классы для фона
  let backgroundClasses = 'dynamic-background';
  if (isEmployer) {
    backgroundClasses += ' employer-gradient';
  } else {
    backgroundClasses += ' seeker-gradient';
  }

  return <div className={backgroundClasses}></div>;
};

export default DynamicBackground;
