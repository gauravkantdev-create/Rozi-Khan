import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../Services/api";
import useAuth from "../hooks/useAuth";
import useThemeMode from "../hooks/useThemeMode";

function Login() {
  const { isDark } = useThemeMode();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/products";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const { data } = await API.post("/auth/login", {
        email,
        password,
      });

      const session = login(data.token, data.user);
      navigate(location.state?.from?.pathname || (session.isAdmin ? "/dashboard" : redirectTo), {
        replace: true,
      });
    } catch (error) {
      setMessage(error.response?.data?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-5 transition-colors duration-500 ${
        isDark ? "bg-black" : "bg-[#f6f7fb]"
      }`}
    >
      <div
        className={`w-[400px] max-w-full rounded-2xl border p-8 shadow-2xl sm:p-10 ${
          isDark
            ? "border-white/10 bg-gray-900 shadow-black/40"
            : "border-slate-200 bg-white shadow-slate-200/80"
        }`}
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-300">
            Seller access
          </p>
          <h1 className={`mt-3 text-4xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>
            Login
          </h1>
          <p className={`mt-3 text-sm leading-6 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Continue to your RoziKhan product catalog and dashboard.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`rounded-lg border p-3 outline-none transition focus:border-blue-400 ${
              isDark ? "border-white/10 bg-gray-800 text-white" : "border-slate-200 bg-slate-50 text-slate-950"
            }`}
            required
          />

          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`rounded-lg border p-3 outline-none transition focus:border-blue-400 ${
              isDark ? "border-white/10 bg-gray-800 text-white" : "border-slate-200 bg-slate-50 text-slate-950"
            }`}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 p-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          New to RoziKhan?{" "}
          <Link to="/register" className="font-semibold text-blue-300 hover:text-blue-200">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
