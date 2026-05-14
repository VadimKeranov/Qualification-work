import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // Достаем ?token=... из URL
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // 'loading', 'success', 'error'
  const [message, setMessage] = useState("Підтверджуємо вашу електронну пошту...");

  // Создаем флажок для защиты от двойного рендера в React Strict Mode
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Токен не знайдено у посиланні.");
      return;
    }

    // Если запрос уже был отправлен в этом цикле жизни компонента — выходим
    if (hasFetched.current) return;
    hasFetched.current = true; // Сразу ставим флажок, что запрос пошел

    const verifyToken = async () => {
      try {
        const response = await fetch(`http://localhost:8000/auth/verify/${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Пошта успішно підтверджена!");
        } else {
          setStatus("error");
          setMessage(data.detail || "Помилка підтвердження. Можливо, токен прострочений.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Помилка з'єднання з сервером.");
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="relative w-full max-w-md p-8 rounded-2xl glass-panel text-center">
        {/* Неоновая полоска сверху */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 rounded-b-full ${status === 'error' ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-accent glow-accent'}`}></div>

        <h2 className="text-3xl font-bold tracking-tight mb-6">
          Активація <span className="text-accent">Акаунту</span>
        </h2>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-accent rounded-full animate-spin"></div>
            <p className="text-muted">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="text-5xl text-green-500">✅</div>
            <p className="text-white font-medium">{message}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-accent text-white font-bold py-3 rounded-lg shadow-accent transform transition hover:-translate-y-0.5 hover:brightness-110"
            >
              ПЕРЕЙТИ ДО ВХОДУ
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6">
            <div className="text-5xl text-red-500">❌</div>
            <p className="text-red-400 font-medium">{message}</p>
            <Link to="/register" className="text-muted text-sm hover:text-white underline decoration-dashed">
              Повернутися до реєстрації
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default VerifyEmail;