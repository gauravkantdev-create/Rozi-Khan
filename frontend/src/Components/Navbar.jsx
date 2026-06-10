import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/Logo.png";
import useAuth from "../hooks/useAuth";
import useCart from "../hooks/useCart";
import useThemeMode from "../hooks/useThemeMode";

const menuGroups = {
  "Platform tour": ["Product sourcing", "Order processing", "Post-sale support", "eCommerce tools", "Customer support"],
  Dropship: ["Home", "Garden", "Health & beauty", "Fashion & lifestyle", "Automotive", "Packaging"],
  Integrations: ["TikTok Shop", "Shopify", "eBay", "WooCommerce", "Amazon", "Avasam AI"],
  Resources: ["Help center", "FAQs", "Hot products", "Blog", "Press", "Free tools"],
  Supplier: ["Supplier programme", "Approval flow", "Retailer trust", "Dashboard access"],
};

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated: loggedIn, isAdmin, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { isDark, toggleTheme } = useThemeMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("");

  const marketingTabs = [
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
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 text-[var(--text)] backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" onClick={closeMobileMenu} className="flex flex-shrink-0 items-center gap-2">
          <span className="font-playfair text-2xl font-bold tracking-tight text-[var(--text)]">
            RoziKha<span className="italic font-serif text-[var(--brand)] font-normal">n</span>
          </span>
        </Link>

        <nav className="hidden flex-1 justify-center lg:flex">
          <div className="flex items-center gap-5 xl:gap-8">
            {marketingTabs.map((item) => {
              const hasMenu = Boolean(menuGroups[item.label]);
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveMenu(hasMenu ? item.label : "")}
                  onMouseLeave={() => setActiveMenu("")}
                >
                  <Link
                    to={item.to}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold tracking-wide text-[var(--muted)] transition duration-150 hover:text-[var(--text)]"
                  >
                    {item.label}
                    {hasMenu && <span className="text-[8px] opacity-60 transition-transform duration-200">▼</span>}
                  </Link>
                  {activeMenu === item.label && (
                    <div className="absolute left-1/2 top-full mt-1 w-64 -translate-x-1/2 animate-rise-in rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)]">
                      <div className="flex flex-col">
                        {menuGroups[item.label].map((entry) => (
                          <Link 
                            key={entry} 
                            to={item.to} 
                            className="flex items-center rounded-lg px-4 py-2.5 text-[13px] font-semibold text-[var(--muted)] transition duration-200 hover:bg-[var(--surface-soft)] hover:text-[var(--brand)]"
                          >
                            {entry}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {loggedIn && <NavLink to="/orders" className="text-[13px] font-semibold tracking-wide text-[var(--muted)] hover:text-[var(--text)]">Orders</NavLink>}
            {isAdmin && <NavLink to="/dashboard" className="text-[13px] font-semibold tracking-wide text-[var(--muted)] hover:text-[var(--text)]">Dashboard</NavLink>}
          </div>
        </nav>

        <div className="flex items-center justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden h-9 w-9 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface-soft)] text-sm text-[var(--text)] transition duration-150 hover:bg-[var(--border)] sm:grid"
            aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {loggedIn ? (
            <>
              <Link to="/cart" className="relative rounded-none bg-[var(--text)] px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--surface)] transition duration-150 hover:opacity-90">
                Cart
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-[10px] font-extrabold text-white shadow-md">
                    {cartCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="hidden text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--text)] sm:inline-flex transition duration-155">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden text-[11px] font-extrabold uppercase tracking-[0.12em] text-[var(--muted)] hover:text-[var(--text)] sm:inline-flex transition duration-155">
                Login
              </Link>
              <Link to="/register" className="rounded-none bg-[var(--text)] px-6 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--surface)] transition duration-150 hover:opacity-90">
                Free trial
              </Link>
            </>
          )}

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

      {mobileOpen && (
        <div className="border-t border-[var(--border)] px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-3 rounded-lg bg-[var(--surface-soft)] p-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left text-sm font-extrabold"
            >
              Theme
              <span className="text-[var(--brand)]">{isDark ? "Night" : "Day"}</span>
            </button>
            {marketingTabs.map((item) => (
              <Link key={item.label} to={item.to} onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-extrabold text-[var(--text)] hover:bg-[var(--surface)]">
                {item.label}
              </Link>
            ))}
            {!loggedIn && <NavLink to="/login" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-extrabold">Login</NavLink>}
            {loggedIn && (
              <>
                <NavLink to="/cart" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-extrabold">Cart ({cartCount})</NavLink>
                <NavLink to="/orders" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-extrabold">Orders</NavLink>
              </>
            )}
            {isAdmin && <NavLink to="/dashboard" onClick={closeMobileMenu} className="rounded-md px-3 py-2 text-sm font-extrabold">Dashboard</NavLink>}
            {loggedIn && <button onClick={handleLogout} className="rounded-md px-3 py-2 text-left text-sm font-extrabold">Logout</button>}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
