import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AsyncSelect from 'react-select/async';
import { searchLocations } from "../api/profile";
import { API_URL } from "../api/config";

const CreateVacancyPage = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary_from: "",
    salary_to: "",
    location: "",
    // ЗМІНЕНО: Тепер воронка - це масив об'єктів
    hiring_funnel: [
      { name: "Скринінг", description: "Коротке знайомство з HR в чаті або по телефону (15 хв)." },
      { name: "Технічне інтерв'ю", description: "Спілкування з лідом команди, перевірка hard skills (1 год)." },
      { name: "Оффер", description: "Обговорення фінальних умов та пропозиція роботи." }
    ]
  });

  const loadLocationOptions = async (inputValue) => {
    const remoteOption = { label: "🌐 Дистанційно", value: "Дистанційно" };
    if (!inputValue || inputValue.length < 2) return [remoteOption];
    const data = await searchLocations(inputValue);
    return [remoteOption, ...data];
  };

  // --- Функції для управління воронкою найму ---
  const handleFunnelChange = (index, field, value) => {
    const newFunnel = [...formData.hiring_funnel];
    newFunnel[index][field] = value;
    setFormData({ ...formData, hiring_funnel: newFunnel });
  };

  const addFunnelStep = () => {
    setFormData({
      ...formData,
      hiring_funnel: [...formData.hiring_funnel, { name: "Новий етап", description: "Опис етапу..." }]
    });
  };

  const removeFunnelStep = (index) => {
    const newFunnel = formData.hiring_funnel.filter((_, i) => i !== index);
    setFormData({ ...formData, hiring_funnel: newFunnel });
  };
  // ----------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.location) {
        return alert("Будь ласка, оберіть місто або вкажіть 'Дистанційно'!");
    }

    try {
      const profileResp = await fetch(`${API_URL}/profiles/company/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const profileData = await profileResp.json();

      const payload = {
        ...formData,
        salary_from: formData.salary_from ? parseInt(formData.salary_from) : null,
        salary_to: formData.salary_to ? parseInt(formData.salary_to) : null,
        company_id: profileData.user_id, // Використовуємо user_id як раніше виправили
        company_name: profileData.company_name,
        company_logo: profileData.logo_url
      };

      const response = await fetch(`${API_URL}/vacancies/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        navigate(`/companies/${profileData.user_id}`);
      } else {
        const errorData = await response.json();
        alert("Помилка створення: " + JSON.stringify(errorData));
      }
    } catch (error) {
      console.error(error);
      alert("Сталася помилка");
    }
  };

  const inputClass = "w-full bg-slate-900/50 border border-white/10 rounded-xl p-3 text-slate-200 focus:border-accent outline-none transition";

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 glass-panel">
      <h1 className="text-3xl font-bold text-white mb-6">Створення нової вакансії</h1>
      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block text-slate-400 text-sm mb-2 font-medium">Назва посади</label>
          <input type="text" className={inputClass} placeholder="Наприклад: Senior Frontend Developer" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2 font-medium">Місто або формат</label>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadLocationOptions}
            onChange={(selected) => setFormData({...formData, location: selected ? selected.value : ""})}
            placeholder="Почніть вводити назву міста..."
            styles={{
              control: (base) => ({ ...base, background: "rgba(15, 23, 42, 0.5)", borderColor: "rgba(255,255,255,0.1)", borderRadius: "0.75rem", padding: "2px" }),
              menu: (base) => ({ ...base, background: "#0F172A", zIndex: 50 }),
              option: (base, state) => ({ ...base, background: state.isFocused ? "rgba(168, 85, 247, 0.2)" : "transparent", color: "white" }),
              singleValue: (base) => ({ ...base, color: "white" }),
              input: (base) => ({ ...base, color: "white" })
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">Зарплата від</label>
            <input type="number" className={inputClass} value={formData.salary_from} onChange={(e) => setFormData({...formData, salary_from: e.target.value})} />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2 font-medium">Зарплата до</label>
            <input type="number" className={inputClass} value={formData.salary_to} onChange={(e) => setFormData({...formData, salary_to: e.target.value})} />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2 font-medium">Опис вакансії</label>
          <textarea rows="4" className={inputClass} placeholder="Детально опишіть обов'язки..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
        </div>

        <div>
          <label className="block text-slate-400 text-sm mb-2 font-medium">Вимоги та навички</label>
          <textarea rows="4" className={inputClass} placeholder="Які технології та досвід потрібні..." value={formData.requirements} onChange={(e) => setFormData({...formData, requirements: e.target.value})} required />
        </div>

        {/* --- Блок Налаштування Воронки Найму --- */}
        <div className="p-5 bg-slate-900/60 border border-white/5 rounded-2xl">
          <label className="block text-white text-lg mb-1 font-bold">Воронка найму</label>
          <p className="text-slate-400 text-sm mb-4">Ці етапи та їх опис будуть бачити кандидати, щоб розуміти процес відбору.</p>

          <div className="space-y-4">
            {formData.hiring_funnel.map((step, index) => (
              <div key={index} className="flex gap-3 items-start bg-black/20 p-4 rounded-xl border border-white/5 relative">
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-lg">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    className={`${inputClass} !p-2 !bg-transparent border-b !border-0 !border-b border-white/20 !rounded-none focus:!border-accent font-bold text-white`}
                    value={step.name}
                    placeholder="Назва етапу (напр. Скринінг)"
                    onChange={(e) => handleFunnelChange(index, 'name', e.target.value)}
                    required
                  />
                  <textarea
                    className={`${inputClass} !p-3 text-sm`}
                    rows="2"
                    value={step.description}
                    placeholder="Опис етапу (що чекає кандидата?)"
                    onChange={(e) => handleFunnelChange(index, 'description', e.target.value)}
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFunnelStep(index)}
                  className="text-red-400 hover:text-red-300 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addFunnelStep}
            className="mt-5 bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-4 rounded-xl transition w-full border border-white/10"
          >
            + Додати етап
          </button>
        </div>

        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-4 rounded-xl transition shadow-lg active:scale-95">
          Створити вакансію
        </button>
      </form>
    </div>
  );
};

export default CreateVacancyPage;