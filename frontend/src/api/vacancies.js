import { API_URL } from "./config";

// Получить все вакансии (публично)
export const getAllVacancies = async () => {
  const response = await fetch(`${API_URL}/vacancies/`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch vacancies");
  }

  return response.json();
};

// Создать вакансию (нужен токен)
export const createVacancy = async (token, vacancyData) => {
  const response = await fetch(`${API_URL}/vacancies/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(vacancyData),
  });

  if (!response.ok) {
    throw new Error("Failed to create vacancy");
  }

  return response.json();
};