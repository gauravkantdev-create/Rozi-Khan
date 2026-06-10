import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../Services/api";
import { Container, PageShell, PrimaryButton, inputClass, surfaceClass } from "../Components/layout/PageShell";
import useAuth from "../hooks/useAuth";

function Login() {
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
      const { data } = await API.post("/auth/login", { email, password });
      const session = login(data.token, data.user);
      navigate(location.state?.from?.pathname || (session.isAdmin ? "/dashboard" : redirectTo), { replace: true });
    } catch (error) {
      const apiMessage = error.response?.data?.message;
      if (!error.response) {
        setMessage("Unable to connect to the server. Check your internet connection or API URL.");
      } else if (apiMessage === "User not found") {
        setMessage("No account exists for this email. Please register first, then log in.");
      } else if (apiMessage === "Please verify your email before login") {
        setMessage("Please verify your email OTP before logging in.");
      } else {
        setMessage(apiMessage || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell showFooter={false}>
      <Container className="grid min-h-[calc(100vh-118px)] items-center gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--brand)]">Seller access</p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Login to your RoziKhan workspace</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Continue to products, orders, and dashboard tools in the same clean marketplace experience.
          </p>
          <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
            {["Catalog", "Orders", "Dashboard"].map((item) => (
              <div key={item} className="rounded-lg bg-[var(--surface-soft)] p-5 text-center font-extrabold text-[var(--text)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className={`${surfaceClass} rounded-lg p-6 sm:p-8 lg:p-10`}>
          <div className="mb-8 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">Welcome back</p>
            <h2 className="mt-3 text-3xl font-extrabold">Login</h2>
            <div className="mx-auto mt-4 h-1.5 w-36 gradient-rule" />
          </div>

          {message && (
            <div className="mb-5 rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm font-semibold text-red-500">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="grid gap-5">
            <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "Logging in..." : "Login"}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            New to RoziKhan?{" "}
            <Link to="/register" className="font-extrabold text-[var(--brand)] hover:text-[var(--brand-dark)]">
              Create an account
            </Link>
          </p>
        </section>
      </Container>
    </PageShell>
  );
}

export default Login;
