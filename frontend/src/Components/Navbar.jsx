import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated: loggedIn, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: "Platform tour", to: "/#platform-tour" },
    { label: "Dropship", to: "/#dropship" },
    { label: "Integrations", to: "/#integrations" },
    { label: "Pricing", to: "/#pricing" },
    { label: "Resources", to: "/#resources" },
    { label: "Enterprise", to: "/#enterprise" },
    { label: "Supplier", to: isAdmin ? "/dashboard" : "/register" },
  ];

  const handleLogout = () => {
    logout();
    setMobileOpen(false);
    navigate("/", { replace: true });
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)]">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-6 py-4 lg:px-10">
        {/* Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex flex-shrink-0 items-center gap-2">
          <span className="font-playfair text-3xl font-bold text-[var(--text)]">
            Rkdrop
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-10 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-base text-[var(--muted)] hover:text-[var(--text)] transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {loggedIn && <NavLink to="/orders" className="text-base text-[var(--muted)] hover:text-[var(--text)] transition-colors">Orders</NavLink>}
          {isAdmin && <NavLink to="/dashboard" className="text-base text-[var(--muted)] hover:text-[var(--text)] transition-colors">Dashboard</NavLink>}
        </nav>

        {/* Right Side - Cart, Auth Buttons */}
        <div className="flex items-center gap-4">
          {loggedIn ? (
            <>
              <Link to="/cart" className="relative rounded-full border-2 border-[var(--border)] bg-[var(--text)] px-6 py-2 text-base font-medium text-[var(--surface)] transition hover:opacity-90">
                Cart
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-xs font-extrabold text-white shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="text-base text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-base text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-xl border-2 border-[var(--border)] bg-transparent px-6 py-2 text-base font-medium text-[var(--text)] transition hover:border-[var(--brand)] hover:text-[var(--brand)]"
              >
                Get started
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] lg:hidden"
            aria-label="Toggle mobile menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--border)] px-6 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                onClick={closeMobileMenu}
                className="text-lg text-[var(--text)]"
              >
                {item.label}
              </Link>
            ))}
            {loggedIn && <NavLink to="/orders" onClick={closeMobileMenu} className="text-lg text-[var(--text)]">Orders</NavLink>}
            {isAdmin && <NavLink to="/dashboard" onClick={closeMobileMenu} className="text-lg text-[var(--text)]">Dashboard</NavLink>}
            {!loggedIn && <NavLink to="/login" onClick={closeMobileMenu} className="text-lg text-[var(--text)]">Login</NavLink>}
            {loggedIn && (
              <NavLink to="/cart" onClick={closeMobileMenu} className="text-lg text-[var(--text)]">
                Cart ({cartCount})
              </NavLink>
            )}
            {loggedIn && <button onClick={handleLogout} className="text-left text-lg text-[var(--text)]">Logout</button>}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
