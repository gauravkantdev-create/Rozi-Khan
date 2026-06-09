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
  const { toggleTheme } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  const closeMobileMenu = () => setMobileOpen(false);

  const navLinkClass = ({ isActive }) =>
    `font-raleway text-xs font-bold uppercase tracking-[0.18em] transition duration-300 ${
      isActive ? "text-[#2F2F2F]" : "text-[#757575] hover:text-[#2F2F2F]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[#d8c8ba] bg-[#F3F2EC]/92 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" onClick={closeMobileMenu} className="group flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center border border-[#C5A992] bg-[#fffdf8] transition duration-300 group-hover:-translate-y-0.5">
            <img src={logo} alt="RoziKhan" className="h-9 w-9 object-contain" />
          </span>
          <span>
            <span className="block font-prata text-2xl leading-none text-[#2F2F2F]">RoziKhan</span>
            <span className="hidden font-raleway text-[10px] font-bold uppercase tracking-[0.28em] text-[#C5A992] sm:block">
              Premium dropship
            </span>
          </span>
        </Link>

        <nav className="hidden justify-center lg:flex">
          <div className="flex items-center gap-8">
            <NavLink to="/" className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" className={navLinkClass}>Products</NavLink>
            {loggedIn && <NavLink to="/orders" className={navLinkClass}>Orders</NavLink>}
            {isAdmin && <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-10 w-10 place-items-center border border-[#d8c8ba] bg-[#fffdf8] text-[#2F2F2F] transition duration-300 hover:-translate-y-0.5 hover:border-[#C5A992] sm:grid"
            aria-label="Refresh store theme"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {loggedIn ? (
            <>
              <Link
                to="/cart"
                className="relative border border-[#2F2F2F] bg-[#2F2F2F] px-4 py-2.5 font-raleway text-xs font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:bg-[#C5A992] hover:text-[#2F2F2F]"
              >
                Cart
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-[#C5A992] px-1 text-[11px] text-[#2F2F2F]">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="hidden border border-[#d8c8ba] px-4 py-2.5 font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#757575] transition hover:border-[#C5A992] hover:text-[#2F2F2F] sm:inline-flex"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#757575] transition hover:text-[#2F2F2F]">
                Login
              </Link>
              <Link
                to="/register"
                className="border border-[#2F2F2F] bg-[#2F2F2F] px-4 py-2.5 font-raleway text-xs font-bold uppercase tracking-[0.18em] text-white transition duration-300 hover:bg-[#C5A992] hover:text-[#2F2F2F]"
              >
                Register
              </Link>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center border border-[#d8c8ba] bg-[#fffdf8] text-[#2F2F2F] lg:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="mx-auto max-w-7xl border-t border-[#d8c8ba] px-4 py-4 sm:px-6 lg:hidden">
          <div className="grid gap-4 bg-[#fffdf8]/80 p-4">
            <NavLink to="/" onClick={closeMobileMenu} className={navLinkClass}>Home</NavLink>
            <NavLink to="/products" onClick={closeMobileMenu} className={navLinkClass}>Products</NavLink>
            {loggedIn && (
              <>
                <NavLink to="/cart" onClick={closeMobileMenu} className={navLinkClass}>Cart ({cartCount})</NavLink>
                <NavLink to="/orders" onClick={closeMobileMenu} className={navLinkClass}>Orders</NavLink>
              </>
            )}
            {isAdmin && <NavLink to="/dashboard" onClick={closeMobileMenu} className={navLinkClass}>Dashboard</NavLink>}
            {loggedIn && (
              <button onClick={handleLogout} className="text-left font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#757575]">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
