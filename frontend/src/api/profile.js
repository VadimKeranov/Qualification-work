import { API_URL } from "./config"; // Убедись, что там http://localhost:8000

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
  formData.append("file", file);

  const response = await fetch(`${API_URL}/profiles/seeker/me/upload-resume`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Ошибка загрузки резюме");
  }
  return response.json();
};

export const getCompanyProfile = async () => {
    const response = await instance.get("/profiles/company/me");
    return response.data;
};