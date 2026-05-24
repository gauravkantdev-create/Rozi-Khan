import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sendRegisterOtp } from "../Services/authService";
import useThemeMode from "../hooks/useThemeMode";

const passwordRules = [
  ["At least 8 characters", (value) => value.length >= 8],
  ["One uppercase letter", (value) => /[A-Z]/.test(value)],
  ["One lowercase letter", (value) => /[a-z]/.test(value)],
  ["One number", (value) => /\d/.test(value)],
  ["One special character", (value) => /[^A-Za-z0-9]/.test(value)],
];

function Register() {
  const { isDark } = useThemeMode();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  const passwordStatus = useMemo(
    () => passwordRules.map(([label, test]) => [label, test(password)]),
    [password]
  );
  const passwordValid = passwordStatus.every(([, passed]) => passed);

  const inputClass = `rounded-lg border p-3 outline-none transition focus:border-emerald-400 ${
    isDark ? "border-white/10 bg-gray-800 text-white" : "border-slate-200 bg-slate-50 text-slate-950"
  }`;

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await sendRegisterOtp(email);
      setOtpSent(true);
      setMessage({
        type: "success",
        text: "OTP sent. Please check your email and enter the 6 digit code.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Unable to send OTP. Please try again.",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!passwordValid) {
      setMessage({
        type: "error",
        text: "Password must include uppercase, lowercase, number, and special character.",
      });
      return;
    }

    setLoading(true);

    try {
      await API.post("/auth/register", {
        name,
        email,
        otp,
        password,
      });

      setMessage({
        type: "success",
        text: "Email verified and account created. Redirecting to login...",
      });
      setTimeout(() => navigate("/login", { replace: true }), 800);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex min-h-screen items-center justify-center px-5 py-10 transition-colors duration-500 ${
        isDark ? "bg-black" : "bg-[#f6f7fb]"
      }`}
    >
      <div
        className={`w-[440px] max-w-full rounded-2xl border p-8 shadow-2xl sm:p-10 ${
          isDark
            ? "border-white/10 bg-gray-900 shadow-black/40"
            : "border-slate-200 bg-white shadow-slate-200/80"
        }`}
      >
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
            Verified signup
          </p>
          <h1 className={`mt-3 text-4xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>
            Register
          </h1>
          <p className={`mt-3 text-sm leading-6 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
            Verify your real email with OTP before creating a RoziKhan account.
          </p>
        </div>

        {message.text && (
          <div
            className={`mb-5 rounded-lg border p-3 text-sm ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            required
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setOtpSent(false);
              }}
              className={inputClass}
              required
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={otpLoading || !email}
              className="rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {otpLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
            </button>
          </div>

          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter 6 digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inputClass}
            required
          />

          <input
            type="password"
            placeholder="Create Strong Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
          />

          <div className={`rounded-xl border p-4 text-sm ${isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
            <p className="mb-3 font-black">Password must contain:</p>
            <div className="grid gap-2">
              {passwordStatus.map(([label, passed]) => (
                <span key={label} className={passed ? "font-bold text-emerald-500" : isDark ? "text-gray-400" : "text-slate-500"}>
                  {passed ? "✓" : "•"} {label}
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !otpSent || !passwordValid}
            className="rounded-lg bg-green-600 p-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Verify OTP & Register"}
          </button>
        </form>

        <p className={`mt-6 text-center text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-300 hover:text-blue-200">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
