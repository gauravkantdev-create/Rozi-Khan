import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../Services/api";
import { Container, GhostButton, PageShell, PrimaryButton, inputClass, surfaceClass } from "../Components/layout/PageShell";
import { sendRegisterOtp } from "../Services/authService";

const passwordRules = [
  ["At least 8 characters", (value) => value.length >= 8],
  ["One uppercase letter", (value) => /[A-Z]/.test(value)],
  ["One lowercase letter", (value) => /[a-z]/.test(value)],
  ["One number", (value) => /\d/.test(value)],
  ["One special character", (value) => /[^A-Za-z0-9]/.test(value)],
];

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();
  const passwordStatus = useMemo(() => passwordRules.map(([label, test]) => [label, test(password)]), [password]);
  const passwordValid = passwordStatus.every(([, passed]) => passed);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await sendRegisterOtp(email);
      setOtpSent(true);
      setMessage({ type: "success", text: "OTP sent. Please check your email and enter the 6 digit code." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to send OTP. Please try again." });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!passwordValid) {
      setMessage({ type: "error", text: "Password must include uppercase, lowercase, number, and special character." });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", { name, email, otp, password });
      setMessage({ type: "success", text: "Email verified and account created. Redirecting to login..." });
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell showFooter={false}>
      <Container className="grid min-h-[calc(100vh-118px)] items-center gap-10 py-10 lg:grid-cols-[1fr_1fr]">
        <section className={`${surfaceClass} order-2 rounded-lg p-6 sm:p-8 lg:order-1 lg:p-10`}>
          <div className="mb-8 text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--brand)]">Verified signup</p>
            <h1 className="mt-3 text-3xl font-extrabold">Create your account</h1>
            <div className="mx-auto mt-4 h-1.5 w-36 gradient-rule" />
          </div>

          {message.text && (
            <div className={`mb-5 rounded-lg border p-3 text-sm font-semibold ${message.type === "success" ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-500" : "border-red-400/40 bg-red-500/10 text-red-500"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleRegister} className="grid gap-5">
            <input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpSent(false);
                }}
                className={inputClass}
                required
              />
              <GhostButton type="button" onClick={handleSendOtp} disabled={otpLoading || !email}>
                {otpLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
              </GhostButton>
            </div>

            <input type="text" inputMode="numeric" placeholder="6 digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className={inputClass} required />
            <input type="password" placeholder="Create strong password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} required />

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm">
              <p className="mb-3 font-extrabold">Password must contain:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {passwordStatus.map(([label, passed]) => (
                  <span key={label} className={passed ? "font-bold text-emerald-500" : "text-[var(--muted)]"}>
                    {passed ? "ok" : "-"} {label}
                  </span>
                ))}
              </div>
            </div>

            <PrimaryButton type="submit" disabled={loading || !otpSent || !passwordValid} className="w-full">
              {loading ? "Creating account..." : "Verify OTP and register"}
            </PrimaryButton>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--muted)]">
            Already have an account?{" "}
            <Link to="/login" className="font-extrabold text-[var(--brand)] hover:text-[var(--brand-dark)]">
              Login
            </Link>
          </p>
        </section>

        <section className="order-1 lg:order-2">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--brand)]">Free trial</p>
          <h2 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">Start your dropshipping journey in the same polished workspace</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--muted)]">
            Register with OTP verification, then move into the marketplace, cart, checkout, and order views without breaking the visual theme.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Verified access", "Responsive catalog", "Order-ready flow", "Day and night theme"].map((item) => (
              <div key={item} className="rounded-lg bg-[var(--surface-soft)] p-5 font-extrabold text-[var(--text)]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </Container>
    </PageShell>
  );
}

export default Register;
