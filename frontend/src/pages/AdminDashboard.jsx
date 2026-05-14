import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, deleteUser, changeRole, createUser } from "../api/admin";

const AdminDashboard = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      await fetchUsers();
      setShowForm(false);
      setFormData({ email: "", password: "", role: "worker" });
    } catch (error) {
      alert("Ошибка создания пользователя");
    }
  };

  if (user?.role !== "admin") return <div className="p-10 text-center font-bold text-xl">Доступ заборонено</div>;
  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
    </div>
  );

  const filteredUsers = users.filter(u => filterRole === "all" || u.role === filterRole);

  const inputClass = "w-full bg-surface border border-black/10 dark:border-white/10 rounded-xl p-2.5 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition";

  return (
    <div className="max-w-6xl mx-auto p-8 glass-panel rounded-3xl mt-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Панель Адміністратора</h1>

        {/* Фильтр и кнопка создания */}
        <div className="flex gap-4 items-center w-full md:w-auto">
          <select
            className="bg-surface border border-black/10 dark:border-white/10 rounded-xl p-2.5 outline-none focus:border-accent transition"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="all">Всі ролі</option>
            <option value="worker">Шукачі (worker)</option>
            <option value="employer">Компанії (employer)</option>
            <option value="admin">Адміни (admin)</option>
          </select>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-accent text-white px-5 py-2.5 rounded-xl shadow-accent hover:brightness-110 transition active:scale-95 whitespace-nowrap"
          >
            {showForm ? "Сховати форму" : "+ Створити"}
          </button>
        </div>
      </div>

      {/* Форма создания пользователя */}
      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-surface border border-black/5 dark:border-white/5 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-end shadow-inner">
          <div className="flex-1 w-full">
            <label className="text-muted text-sm block mb-1.5 font-medium">Email</label>
            <input
              required type="email"
              className={inputClass}
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-muted text-sm block mb-1.5 font-medium">Пароль</label>
            <input
              required type="password"
              className={inputClass}
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="text-muted text-sm block mb-1.5 font-medium">Роль</label>
            <select
              className={inputClass}
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
            >
              <option value="worker">Worker</option>
              <option value="employer">Employer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto bg-accent text-white px-8 py-2.5 rounded-xl shadow-accent hover:brightness-110 transition font-medium">
            Зберегти
          </button>
        </form>
      )}

      {/* Таблица */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-black/10 dark:border-white/10 text-muted text-sm uppercase tracking-wider">
              <th className="p-4 font-medium">ID</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Роль</th>
              <th className="p-4 font-medium">Профіль</th>
              <th className="p-4 font-medium text-right">Дії</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const isMe = u.id === user.id;

              return (
                <tr key={u.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <td className="p-4 font-mono text-sm opacity-70">{u.id}</td>
                  <td className="p-4 font-medium">
                    {u.email} {isMe && <span className="text-accent text-xs ml-2 bg-accent/10 px-2 py-1 rounded-md">Ви</span>}
                  </td>
                  <td className="p-4">
                    <select
                      className="bg-surface border border-black/10 dark:border-white/10 rounded-lg p-1.5 text-sm outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed transition"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={isMe}
                    >
                      <option value="worker">Worker</option>
                      <option value="employer">Employer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">
                    {/* Если админ кликнет на чужой профиль, он попадет на него (убедись что этот маршрут настроен) */}
                    <Link
                      to={`/profile/${u.id}`}
                      className="text-accent hover:opacity-80 underline text-sm font-medium"
                    >
                      Перейти
                    </Link>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={isMe}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white disabled:bg-surface disabled:text-muted px-4 py-1.5 rounded-lg transition font-medium text-sm"
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;