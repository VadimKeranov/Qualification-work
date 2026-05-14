import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState(""); // В FastAPI это email
  const [password, setPassword] = useState("");

  // Состояния для уведомлений и логики подтверждения
  const [error, setError] = useState("");
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Логика таймера обратного отсчета
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsUnverified(false);
    setResendMessage("");

    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      // Проверяем статус ошибки от бэкенда
      if (err.response?.status === 403) {
        setIsUnverified(true);
        setError("Ваш акаунт ще не активовано. Будь ласка, підтвердіть пошту.");
      } else if (err.response?.status === 401) {
        setError("Невірна пошта або пароль.");
      } else {
        setError("Помилка з'єднання з сервером.");
      }
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    try {
      // Вызываем наш новый эндпоинт в Auth Service
      const response = await fetch("http://localhost:8000/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username }),
      });

      if (response.ok) {
        setResendMessage("Лист відправлено! Перевірте пошту.");
        setCooldown(180); // Блокировка на 3 минуты (180 секунд)
      } else {
        const data = await response.json();
        setError(data.detail || "Не вдалося відправити лист.");
      }
    } catch (error) {
      setError("Помилка при спробі відправити лист.");
    } finally {
      setIsResending(false);
    }
  };

  const inputClass = "w-full bg-surface border border-black/10 dark:border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 text-white";

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="relative w-full max-w-md p-8 rounded-2xl glass-panel">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-accent rounded-b-full glow-accent"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Системний <span className="text-accent">Вхід</span>
          </h2>
        </div>

        {/* Блок ошибок */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm text-center">
            {error}
          </div>
        )}

        {/* Блок подтверждения почты (появляется только при 403 ошибке) */}
        {isUnverified && (
          <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/30 text-center">
            {resendMessage ? (
              <p className="text-accent text-sm font-medium">{resendMessage}</p>
            ) : (
              <button
                onClick={handleResendEmail}
                disabled={cooldown > 0 || isResending}
                className="text-accent hover:underline text-sm font-bold uppercase tracking-wider"
              >
                {isResending ? "Відправка..." : "Надіслати підтвердження повторно"}
              </button>
            )}
            {cooldown > 0 && (
              <p className="text-muted text-xs mt-2">
                Повторна відправка доступна через {Math.floor(cooldown / 60)}:
                {(cooldown % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-accent text-xs font-bold uppercase tracking-wider mb-2 ml-1">Email</label>
            <input
              type="email"
              className={inputClass}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-accent text-xs font-bold uppercase tracking-wider mb-2 ml-1">Пароль</label>
            <input
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="w-full bg-accent text-white font-bold py-3 rounded-lg shadow-accent transform transition hover:-translate-y-0.5 hover:brightness-110">
            УВІЙТИ В СИСТЕМУ
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted">
          Немає акаунту?{" "}
          <Link to="/register" className="text-accent hover:opacity-80 font-medium underline decoration-dashed">
            Зареєструватися
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;