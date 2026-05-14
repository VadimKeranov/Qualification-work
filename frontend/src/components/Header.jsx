import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ThemeIcon = ({ isDark }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="theme-toggle-icon w-5 h-5"
    style={{ color: 'var(--accent)' }}
  >
    {isDark ? (
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    ) : (
      <>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </>
    )}
  </svg>
);

const Header = ({ isDark, setIsDark }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const accent = "var(--accent)";

  const NavContent = ({ className = "" }) => (
    <div className={`w-full z-50 ${className}`}>
      <div className="container mx-auto flex justify-between items-center px-4 md:px-6 py-4">

        {/* ЛІВА ЧАСТИНА: Логотип + Навігація */}
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <Link to="/" className="text-2xl md:text-3xl font-black tracking-tight border-2 border-slate-300 dark:border-white/10 px-4 py-1.5 rounded-2xl hover:border-accent transition-colors bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
            Job<span style={{ color: accent }}>Flow</span>
          </Link>

          {/* Центральна навігація */}
          <nav className="flex gap-4 md:gap-6 font-bold text-slate-800 dark:text-slate-200 text-sm md:text-base">
            <Link
              to="/"
              className={`transition hover:text-accent pb-1 ${location.pathname === '/' ? 'text-accent border-b-2 border-accent' : ''}`}
            >
              Вакансії
            </Link>
            <Link
              to="/candidates"
              className={`transition hover:text-accent pb-1 ${location.pathname.startsWith('/candidates') ? 'text-accent border-b-2 border-accent' : ''}`}
            >
              Кандидати
            </Link>
          </nav>
        </div>

        {/* ПРАВА ЧАСТИНА: Кнопки профілю та авторизації */}
        <div className="flex gap-3 md:gap-4 items-center font-semibold text-sm md:text-base">
          <button onClick={() => setIsDark(!isDark)} className="theme-toggle-btn bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm">
            <ThemeIcon isDark={isDark} />
          </button>

          {user ? (
            <>
              {/* 1. АДМІН */}
              {user.role === 'admin' && (
                <Link to="/admin" className="border-2 border-slate-300 dark:border-white/10 text-accent hover:border-accent px-3 py-2 rounded-xl transition bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hidden sm:block">
                  Адмін-Панель
                </Link>
              )}

              {/* 2. РОБОТОДАВЕЦЬ */}
              {user.role === 'employer' && (
                <>
                  <Link to={`/companies/${user.id}`} className="border-2 border-slate-300 dark:border-white/10 px-3 py-2 rounded-xl hover:border-accent hover:text-accent transition bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hidden sm:block">
                    Моя компанія
                  </Link>
                  <Link to={`/companies/${user.id}/my-vacancies`} className="bg-accent text-white border-2 border-accent px-3 py-2 rounded-xl shadow-accent hover:brightness-110 transition active:scale-95 hidden md:block">
                    Мої вакансії
                  </Link>
                </>
              )}

              {/* 3. КАНДИДАТ (worker) */}
              {user.role === 'worker' && (
                <Link to="/profile" className="border-2 border-slate-300 dark:border-white/10 px-3 py-2 rounded-xl hover:border-accent hover:text-accent transition bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm hidden sm:block">
                  Мій профіль
                </Link>
              )}

              {/* КНОПКА ВИХОДУ (для всіх) */}
              <button onClick={() => { logout(); navigate("/login"); }} className="text-red-600 dark:text-red-400 border-2 border-red-200 dark:border-red-900/50 bg-white/90 dark:bg-slate-900/90 px-3 py-2 rounded-xl transition shadow-sm">
                Вихід
              </button>
            </>
          ) : (
             <>
              <Link to="/login" className="border-2 border-slate-300 dark:border-white/10 px-4 py-2 rounded-xl hover:border-accent hover:text-accent transition bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm">
                Вхід
              </Link>
              <Link to="/register" className="bg-accent text-white border-2 border-accent px-4 py-2 rounded-xl shadow-accent hover:brightness-110 transition active:scale-95 hidden sm:block">
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (isHome) {
    return (
      <header className="h-screen w-full flex flex-col justify-center items-center relative overflow-hidden glass-panel !bg-white/5 dark:!bg-black/10 mb-12" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 70% 95%, 30% 85%, 0 100%)' }}>
        <NavContent className="absolute top-0 left-0" />

        <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline points="0,100 30,85 70,95 100,90" fill="none" stroke={accent} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 -4px 10px ${accent})` }} />
        </svg>

        <div className="text-center z-10 px-4 mt-20">
          <h1 className="text-5xl md:text-8xl font-black mb-6 md:mb-8 tracking-tighter inline-block border-4 border-slate-800 dark:border-white/20 px-8 py-4 rounded-[2.5rem] bg-white/60 dark:bg-black/40 backdrop-blur-md shadow-2xl">
            Job<span style={{ color: accent, textShadow: `0 0 25px ${accent}66` }}>Flow</span>
          </h1>
          <br />
          <p className="inline-block text-lg md:text-2xl font-bold text-slate-800 dark:text-slate-100 bg-white/90 dark:bg-black/60 px-6 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 shadow-sm backdrop-blur-md mb-8">
            Майбутнє вашої кар'єри в один клік.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 mt-2 md:mt-6">
             <button
               onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
               className="bg-accent text-white px-8 py-4 rounded-2xl text-lg md:text-xl font-bold shadow-accent hover:brightness-110 transition active:scale-95 border-2 border-accent"
             >
               Знайти роботу
             </button>
             <Link
                to="/candidates"
                className="bg-slate-900/80 text-white px-8 py-4 rounded-2xl text-lg md:text-xl font-bold border-2 border-white/10 hover:bg-accent transition active:scale-95 backdrop-blur-md"
             >
                Знайти співробітників
             </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full mb-8">
      <div className="glass-panel !bg-white/5 dark:!bg-black/10 relative w-full overflow-hidden transition-all duration-300" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 90%, 80% 100%, 50% 92%, 20% 100%, 0 90%)' }}>
        <svg className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-20" preserveAspectRatio="none" viewBox="0 0 100 100">
          <polyline points="0,90 20,100 50,92 80,100 100,90" fill="none" stroke={accent} strokeWidth="2" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 -4px 8px ${accent})` }} />
        </svg>
        <NavContent />
      </div>
    </header>
  );
};

export default Header;