import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, deleteUser, changeRole, createUser } from "../api/admin";

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Новые состояния для фильтра и формы
  const [filterRole, setFilterRole] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", role: "worker" });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers(token);
      setUsers(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchUsers();
  }, [token, user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Удалить пользователя навсегда?")) return;
    try {
      await deleteUser(token, id);
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      alert("Ошибка удаления");
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await changeRole(token, id, newRole);
      setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Ошибка изменения роли");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(token, formData);
      await fetchUsers(); // Перезагружаем список после создания
      setShowForm(false);
      setFormData({ email: "", password: "", role: "worker" });
    } catch (error) {
      alert("Ошибка создания пользователя");
    }
  };

  if (user?.role !== "admin") return <div className="text-white p-10 text-center">Доступ запрещен</div>;
  if (loading) return <div className="text-white p-10 text-center">Загрузка...</div>;

  // Применяем фильтр
  const filteredUsers = users.filter(u => filterRole === "all" || u.role === filterRole);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-slate-800 rounded-lg mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Панель Администратора</h1>

        {/* Фильтр и кнопка создания */}
        <div className="flex gap-4 items-center">
          <select
            className="bg-slate-900 text-white border border-slate-600 rounded p-2"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Все роли</option>
            <option value="worker">Соискатели (worker)</option>
            <option value="employer">Компании (employer)</option>
            <option value="admin">Админы (admin)</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded transition"
          >
            {showForm ? "Скрыть форму" : "+ Создать"}
          </button>
        </div>
      </div>

      {/* Форма создания пользователя */}
      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-slate-900 p-4 rounded-lg mb-6 flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-slate-400 text-sm block mb-1">Email</label>
            <input
              required type="email"
              className="w-full bg-slate-800 text-white border border-slate-600 rounded p-2"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="flex-1">
            <label className="text-slate-400 text-sm block mb-1">Пароль</label>
            <input
              required type="password"
              className="w-full bg-slate-800 text-white border border-slate-600 rounded p-2"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm block mb-1">Роль</label>
            <select
              className="bg-slate-800 text-white border border-slate-600 rounded p-2"
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="worker">Worker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded transition">
            Сохранить
          </button>
        </form>
      )}

      <table className="w-full text-left text-white">
        <thead>
          <tr className="border-b border-slate-600">
            <th className="p-2">ID</th>
            <th className="p-2">Email</th>
            <th className="p-2">Роль</th>
            <th className="p-2">Профиль</th>
            <th className="p-2">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => {
            const isMe = u.id === user.id; // Проверка, является ли строка самим админом

            return (
              <tr key={u.id} className="border-b border-slate-700">
                <td className="p-2">{u.id}</td>
                <td className="p-2">{u.email} {isMe && <span className="text-cyan-500 text-xs ml-2">(Вы)</span>}</td>
                <td className="p-2">
                  <select
                    className="bg-slate-900 border border-slate-600 rounded p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={isMe} // Нельзя менять роль самому себе
                  >
                    <option value="worker">Worker</option>
                    <option value="employer">Employer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-2">
                  <Link
                    to={`/profile/${u.id}`}
                    className="text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    Перейти
                  </Link>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={isMe} // Нельзя удалить самого себя
                    className="bg-red-600 hover:bg-red-500 disabled:bg-slate-600 disabled:text-slate-400 text-white px-3 py-1 rounded transition"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;