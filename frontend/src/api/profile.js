import { API_URL } from "./config";

// --- Запросы для владельца профиля ---

export const getProfile = async (token, role) => {
  const endpoint = role === "employer" ? "/profiles/company/me" : "/profiles/seeker/me";

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null; // Профиля еще нет, это нормально
    }
    throw new Error("Failed to fetch profile");
  }

  return response.json();
};

export const updateProfile = async (token, role, data) => {
  const endpoint = role === "employer" ? "/profiles/company/me" : "/profiles/seeker/me";

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile");
  }

  return response.json();
};

export const uploadPhoto = async (token, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/profiles/seeker/me/upload-photo`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) throw new Error("Ошибка загрузки фото");
  return response.json();
};

export const uploadResume = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);

  // Викликаємо твій ендпоінт з Profile Service для завантаження резюме
  const response = await fetch(`${API_URL}/profiles/seeker/me/upload-resume`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Помилка завантаження резюме');
  }
  return response.json(); // Повертає { file_url: "..." }
};

// Функция удаления резюме (из-за которой была ошибка)
export const deleteResume = async (token, resumeId) => {
  const response = await fetch(`${API_URL}/profiles/seeker/me/resumes/${resumeId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Ошибка при удалении резюме");
  return response.json();
};


// --- Публичные запросы (без токена) ---

export const getPublicSeekerProfile = async (id) => {
  const response = await fetch(`${API_URL}/profiles/seeker/${id}`);
  if (!response.ok) throw new Error("Помилка завантаження профілю");
  return response.json();
};

// Публичный профиль компании (для страницы CompanyPage)
export const getPublicCompanyProfile = async (id) => {
  const response = await fetch(`${API_URL}/profiles/company/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error("Не вдалося завантажити профіль компанії");

  return response.json();
};

export const searchLocations = async (query) => {
  try {
    // Используем динамический API_URL
    const response = await fetch(`${API_URL}/profiles/locations/search?q=${query}`);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Ошибка поиска локаций:", error);
    return [];
  }
};

export const uploadCompanyLogo = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/profiles/company/me/upload-logo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Помилка завантаження логотипу');
  }
  return response.json();
};

export const getAllCandidates = async () => {
  const response = await fetch(`${API_URL}/profiles/seekers`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Помилка завантаження кандидатів");
  return response.json();
};