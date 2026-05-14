import axios from 'axios';
import { API_URL } from './config';

export const applyToVacancy = async (token, vacancyId, resumeUrl = null, coverLetter = null) => {
    try {
        const payload = {
            vacancy_id: Number(vacancyId)
        };

        if (resumeUrl) payload.resume_url = resumeUrl;
        if (coverLetter) payload.cover_letter = coverLetter;

        const response = await axios.post(`${API_URL}/applications/`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Деталі помилки:", error.response?.data);
        const detail = error.response?.data?.detail;

        // Перевіряємо формат помилки (рядок або масив валідації)
        let message = "Сталася помилка при відправці";
        if (typeof detail === 'string') {
            message = detail; // 400 Bad Request
        } else if (Array.isArray(detail)) {
            message = detail[0]?.msg || message; // 422 Validation Error
        }

        throw new Error(message);
    }
};

export const getEmployerApplications = async (token) => {
    const response = await axios.get(`${API_URL}/applications/`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// ДОДАНО: Отримати відгуки самого кандидата
export const getMyApplications = async (token) => {
    const response = await axios.get(`${API_URL}/applications/seeker/me`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};