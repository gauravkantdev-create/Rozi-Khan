import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import useThemeMode from "../hooks/useThemeMode";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated: loggedIn, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { isDark, toggleTheme } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  const getNavLinkClass = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-black transition-all duration-300 ${
      isActive
        ? isDark
          ? "bg-white text-slate-950 shadow-lg shadow-white/10"
          : "bg-slate-950 text-white shadow-lg shadow-slate-300/60"
        : isDark
          ? "text-gray-300 hover:bg-white/10 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
    }`;

  const authLinkClass = `text-sm font-black transition-colors ${
    isDark ? "text-gray-300 hover:text-white" : "text-slate-600 hover:text-slate-950"
  }`;

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <nav
      className={`sticky top-0 z-50 border-b px-4 py-3 backdrop-blur-2xl transition-colors duration-500 sm:px-6 lg:px-10 ${
        isDark
          ? "border-white/10 bg-[#08090d]/90 shadow-xl shadow-black/25"
          : "border-slate-200/80 bg-white/90 shadow-xl shadow-slate-200/70"
      }`}
    >
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4">
        <Link
          to="/"
          onClick={closeMobileMenu}
          className={`flex items-center gap-3 rounded-full pr-4 transition-transform duration-300 hover:-translate-y-0.5 ${
            isDark ? "text-white" : "text-slate-950"
          }`}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
              isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"
            }`}
          >
            <img
              src={logo}
              alt="RoziKhan Logo"
              className={`h-9 w-9 object-contain transition-all duration-300 ${
                isDark ? "invert brightness-[2.5] contrast-[1.1] drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]" : ""
              }`}
            />
          </span>
          <span className="hidden sm:block">
            <span className="block text-2xl font-black leading-none tracking-tight">RoziKhan</span>
            <span className={`mt-1 block text-[10px] font-black uppercase tracking-[0.28em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
              Supplier hub
            </span>
          </span>
        </Link>

        <div className="hidden justify-center lg:flex">
          <div className={`flex items-center gap-1 rounded-full border p-1 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
            <NavLink to="/" className={getNavLinkClass}>
              Home
            </NavLink>
            {loggedIn && (
              <>
                <NavLink to="/products" className={getNavLinkClass}>
                  Products
                </NavLink>
                <NavLink to="/cart" className={getNavLinkClass}>
                  Cart
                </NavLink>
                <NavLink to="/orders" className={getNavLinkClass}>
                  Orders
                </NavLink>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className={`group relative hidden sm:flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 ${
              isDark
                ? "border-white/10 bg-slate-800 text-amber-300 shadow-lg shadow-black/25 hover:bg-slate-700"
                : "border-slate-200 bg-amber-50 text-amber-600 shadow-lg shadow-slate-200/70 hover:bg-amber-100"
            }`}
            aria-label={`Switch to ${isDark ? "day" : "dark"} mode`}
          >
            {isDark ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>

          {loggedIn ? (
            <>
              {isAdmin && (
                <Link to="/dashboard" className={`hidden sm:inline ${authLinkClass}`}>
                  Dashboard
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="hidden rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:bg-red-700 hover:shadow-red-500/20 sm:inline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={authLinkClass}>
                Login
              </Link>
              <Link
                to="/register"
                className={`rounded-full px-5 py-2.5 text-sm font-black transition-all duration-300 hover:-translate-y-0.5 ${
                  isDark
                    ? "bg-white text-black shadow-lg shadow-white/10 hover:bg-blue-500 hover:text-white"
                    : "bg-slate-950 text-white shadow-lg shadow-slate-300/80 hover:bg-blue-600"
                }`}
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className={`grid h-10 w-10 place-items-center rounded-full border transition lg:hidden ${
              isDark ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-white text-slate-950"
            }`}
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`mx-auto mt-4 flex max-w-7xl flex-col gap-2 rounded-2xl border p-4 lg:hidden ${isDark ? "border-white/10 bg-[#0c0d10]" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between border-b pb-4 mb-2 sm:hidden border-slate-200/20">
            <span className={`text-sm font-black uppercase tracking-widest ${isDark ? "text-gray-400" : "text-slate-500"}`}>Theme</span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-300 hover:-translate-y-0.5 ${
                isDark
                  ? "border-white/10 bg-slate-800 text-amber-300 shadow-lg shadow-black/25 hover:bg-slate-700"
                  : "border-slate-200 bg-amber-50 text-amber-600 shadow-lg shadow-slate-200/70 hover:bg-amber-100"
              }`}
              aria-label={`Switch to ${isDark ? "day" : "dark"} mode`}
            >
              {isDark ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <NavLink to="/" onClick={closeMobileMenu} className={getNavLinkClass}>
              Home
            </NavLink>
            {loggedIn ? (
              <>
                <NavLink to="/products" onClick={closeMobileMenu} className={getNavLinkClass}>
                  Products
                </NavLink>
                <NavLink to="/cart" onClick={closeMobileMenu} className={getNavLinkClass}>
                  Cart ({cartCount})
                </NavLink>
                <NavLink to="/orders" onClick={closeMobileMenu} className={getNavLinkClass}>
                  Orders
                </NavLink>
                {isAdmin && (
                  <NavLink to="/dashboard" onClick={closeMobileMenu} className={getNavLinkClass}>
                    Dashboard
                  </NavLink>
                )}
                <button onClick={handleLogout} className="mt-2 rounded-full bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-700">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu} className={`block rounded-full px-4 py-3 text-center text-sm font-black transition-colors ${isDark ? "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}>
                  Login
                </Link>
                <Link to="/register" onClick={closeMobileMenu} className={`mt-2 block rounded-full px-5 py-3 text-center text-sm font-black transition-all duration-300 hover:-translate-y-0.5 ${isDark ? "bg-white text-black shadow-lg shadow-white/10 hover:bg-blue-500 hover:text-white" : "bg-slate-950 text-white shadow-lg shadow-slate-300/80 hover:bg-blue-600"}`}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
