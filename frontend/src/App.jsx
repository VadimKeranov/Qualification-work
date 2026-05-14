import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import CreateVacancyPage from "./pages/CreateVacancyPage";
import Layout from "./components/Layout";
import VacancyPage from "./pages/VacancyPage";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import CompanyPage from "./pages/CompanyPage";
import DynamicBackground from "./components/DynamicBackground";
import CandidatesPage from "./pages/CandidatesPage";
import MyVacanciesPage from "./pages/MyVacanciesPage";
import EmployerApplications from "./pages/EmployerApplications";
import VerifyEmail from "./pages/VerifyEmail";

export default function App() {
  // Пример логики для переключения темы (пока закомментировано)
  // const [theme, setTheme] = useState('light');
  // useEffect(() => {
  //   const root = window.document.documentElement;
  //   root.classList.remove(theme === 'light' ? 'dark' : 'light');
  //   root.classList.add(theme);
  // }, [theme]);

  return (
    <BrowserRouter>
      <DynamicBackground /> {/* Добавляем фон */}
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/candidates" element={<CandidatesPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/companies/:id/my-vacancies" element={<MyVacanciesPage />} />
          <Route path="/create-vacancy" element={<CreateVacancyPage />} />
          <Route path="/vacancies/:id" element={<VacancyPage />} />
          <Route path="/vacancies/:id/applications" element={<EmployerApplications />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
