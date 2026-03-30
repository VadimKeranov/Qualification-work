import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProfilePage from "./pages/ProfilePage";
import HomePage from "./pages/HomePage";
import CreateVacancyPage from "./pages/CreateVacancyPage";
import Layout from "./components/Layout"; // <--- Импортируем Layout
import VacancyPage from "./pages/VacancyPage";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  return (
    <BrowserRouter>
      {/* Оборачиваем всё в Layout, он сам добавит Header и Footer */}
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/create-vacancy" element={<CreateVacancyPage />} />
          <Route path="/vacancies/:id" element={<VacancyPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}