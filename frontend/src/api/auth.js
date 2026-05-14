import { API_URL } from "./config";

export async function register(data) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function login(data) {
  const formData = new URLSearchParams();
  formData.append("username", data.email);
  formData.append("password", data.password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: formData,
  });

  const responseData = await res.json();

  // Генерируем исключение, если сервер ответил ошибкой (401, 403)
  if (!res.ok) {
    const error = new Error("Ошибка авторизации");
    error.response = {
      status: res.status,
      data: responseData
    };
    throw error;
  }

  return responseData;
}

export async function getMe(token) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
  });

  const responseData = await res.json();

  if (!res.ok) {
    throw new Error("Ошибка получения профиля");
  }
  return responseData;
}