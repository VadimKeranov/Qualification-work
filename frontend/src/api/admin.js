import { API_URL } from "./config";

export const getAllUsers = async (token) => {
  const response = await fetch(`${API_URL}/auth/admin/users/`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Ошибка загрузки пользователей");
  return response.json();
};

export const deleteUser = async (token, userId) => {
  const response = await fetch(`${API_URL}/auth/admin/users/${userId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!response.ok) throw new Error("Ошибка удаления");
  return response.json();
};

export const changeRole = async (token, userId, newRole) => {
  const response = await fetch(`${API_URL}/auth/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ role: newRole })
  });
  if (!response.ok) throw new Error("Ошибка изменения роли");
  return response.json();
};

export const createUser = async (token, userData) => {
  const response = await fetch(`${API_URL}/auth/admin/users/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(userData)
  });
  if (!response.ok) throw new Error("Ошибка создания пользователя");
  return response.json();
};