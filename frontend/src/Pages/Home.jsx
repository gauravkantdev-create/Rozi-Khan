import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import useAuthStatus from "../hooks/useAuthStatus";
import useThemeMode from "../hooks/useThemeMode";

function Home() {
  const loggedIn = useAuthStatus();
  const { isDark } = useThemeMode();
  const getStartedPath = loggedIn ? "/products" : "/register";

  return (
    <main
      className={`min-h-screen overflow-hidden transition-colors duration-500 ${
        isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"
      }`}
    >
      <section className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
        <div
          className={`pointer-events-none absolute inset-x-0 top-10 h-72 rounded-full blur-3xl ${
            isDark ? "bg-blue-500/10" : "bg-blue-300/25"
          }`}
        />

        <div className="relative z-10">
          <div
            className={`mb-7 inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.22em] ${
              isDark
                ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                : "border-blue-200 bg-white text-blue-700 shadow-sm"
            }`}
          >
            Verified supplier marketplace
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Source premium products and launch faster with RoziKhan.
          </h1>

          <p
            className={`mt-6 max-w-2xl text-lg leading-8 sm:text-xl ${
              isDark ? "text-gray-300" : "text-slate-600"
            }`}
          >
            Build a modern dropshipping catalog with authenticated seller tools, product discovery,
            supplier data, and a polished ecommerce workflow.
          </p>

          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <Link
              to={getStartedPath}
              className="rounded-xl bg-blue-600 px-8 py-4 text-center text-lg font-black text-white shadow-xl shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700"
            >
              {loggedIn ? "Explore Products" : "Get Started"}
            </Link>
          </div>
        </div>

        <div
          className={`relative z-10 rounded-[2rem] border p-6 shadow-2xl ${
            isDark
              ? "border-white/10 bg-[#0c0d10]/90 shadow-black/40"
              : "border-slate-200 bg-white shadow-slate-200/80"
          }`}
        >
          <div className={`rounded-3xl p-8 transition-colors duration-500 ${isDark ? "bg-black/40 backdrop-blur-md border border-white/[0.02]" : "bg-slate-50"}`}>
            <div className="relative group flex justify-center mb-8">
              {isDark && (
                <div className="absolute inset-0 mx-auto w-36 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all duration-500" />
              )}
              <img
                src={logo}
                alt="RoziKhan"
                className={`relative z-10 w-48 object-contain transition-all duration-500 hover:scale-105 ${
                  isDark ? "invert brightness-[2.5] contrast-[1.1] drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" : ""
                }`}
              />
            </div>
            <div className="space-y-4">
              {[
                [
                  "Product sourcing",
                  "Find supplier-ready products for niche stores.",
                  <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 7V13M7 10h6" />
                  </svg>
                ],
                [
                  "Inventory clarity",
                  "See stock signals before promoting products.",
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ],
                [
                  "Seller dashboard",
                  "Create, manage, and review products quickly.",
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                  </svg>
                ],
              ].map(([title, copy, icon]) => (
                <div
                  key={title}
                  className={`group/card flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                    isDark
                      ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-black/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50"
                  }`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover/card:scale-110 ${
                      isDark
                        ? "border-white/10 bg-white/[0.03] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-950"
                    }`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className={`font-black transition-colors ${isDark ? "group-hover/card:text-blue-300" : "group-hover/card:text-blue-600"}`}>
                      {title}
                    </p>
                    <p className={`mt-1 text-sm leading-6 transition-colors ${isDark ? "text-gray-400 group-hover/card:text-gray-300" : "text-slate-500 group-hover/card:text-slate-600"}`}>
                      {copy}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;
