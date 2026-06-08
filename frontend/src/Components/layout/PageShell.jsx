import { Link } from "react-router-dom";

export const surfaceClass =
  "border border-[#d8c8ba] bg-[#fffdf8]/82 shadow-[0_24px_70px_rgba(47,47,47,0.08)] backdrop-blur";

export const inputClass =
  "w-full border border-[#d8c8ba] bg-[#fffdf8] px-4 py-3 text-sm font-semibold text-[#2F2F2F] outline-none transition duration-300 placeholder:text-[#9b9087] focus:border-[#C5A992] focus:ring-4 focus:ring-[#C5A992]/18";

export function PageShell({ children, className = "" }) {
  return (
    <main className={`min-h-screen bg-[#F3F2EC] text-[#2F2F2F] ${className}`}>
      {children}
    </main>
  );
}

export function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`font-raleway text-xs font-bold uppercase tracking-[0.28em] text-[#C5A992] ${className}`}>
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, copy, align = "left", className = "" }) {
  const isCenter = align === "center";

  return (
    <div className={`${isCenter ? "mx-auto text-center" : ""} ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 font-playfair text-3xl font-semibold leading-tight text-[#2F2F2F] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {copy && (
        <p className={`mt-4 max-w-2xl font-raleway text-base leading-8 text-[#757575] ${isCenter ? "mx-auto" : ""}`}>
          {copy}
        </p>
      )}
    </div>
  );
}

export function PrimaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center border border-[#2F2F2F] bg-[#2F2F2F] px-7 py-3.5 font-raleway text-xs font-bold uppercase tracking-[0.2em] text-white transition duration-300 hover:-translate-y-1 hover:bg-[#C5A992] hover:text-[#2F2F2F] hover:shadow-[0_18px_34px_rgba(197,169,146,0.32)] ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center border border-[#C5A992] px-7 py-3.5 font-raleway text-xs font-bold uppercase tracking-[0.2em] text-[#2F2F2F] transition duration-300 hover:-translate-y-1 hover:bg-[#C5A992]/18 ${className}`}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center border border-[#2F2F2F] bg-[#2F2F2F] px-7 py-3.5 font-raleway text-xs font-bold uppercase tracking-[0.2em] text-white transition duration-300 hover:-translate-y-1 hover:bg-[#C5A992] hover:text-[#2F2F2F] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center border border-[#d8c8ba] bg-[#fffdf8]/70 px-5 py-3 font-raleway text-xs font-bold uppercase tracking-[0.16em] text-[#2F2F2F] transition duration-300 hover:border-[#C5A992] hover:bg-[#C5A992]/14 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, detail }) {
  return (
    <div className={`${surfaceClass} p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(47,47,47,0.12)]`}>
      <p className="font-raleway text-xs font-bold uppercase tracking-[0.2em] text-[#C5A992]">{label}</p>
      <p className="mt-3 font-playfair text-3xl font-semibold text-[#2F2F2F]">{value}</p>
      {detail && <p className="mt-2 font-raleway text-sm leading-6 text-[#757575]">{detail}</p>}
    </div>
  );
}
