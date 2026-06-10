import { Link } from "react-router-dom";

export const surfaceClass =
  "border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)]";

export const inputClass =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)] outline-none transition duration-300 placeholder:text-[var(--muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--accent-light)]";

export function PageShell({ children, className = "", showFooter = true }) {
  return (
    <main className={`min-h-screen bg-[var(--page)] text-[var(--text)] transition-colors duration-300 ${className}`}>
      {children}
      {showFooter && <Footer />}
    </main>
  );
}

export function Container({ children, className = "" }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}

export function Eyebrow({ children, className = "" }) {
  return (
    <p className={`font-raleway text-xs font-extrabold uppercase tracking-[0.22em] text-[var(--brand)] ${className}`}>
      {children}
    </p>
  );
}

export function SectionHeading({ eyebrow, title, copy, align = "left", className = "" }) {
  const isCenter = align === "center";

  return (
    <div className={`${isCenter ? "mx-auto text-center" : ""} ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-3 font-raleway text-3xl font-extrabold leading-tight text-[var(--text)] sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className={`${isCenter ? "mx-auto" : ""} mt-5 h-1.5 w-44 gradient-rule`} />
      {copy && (
        <p className={`mt-5 max-w-2xl font-raleway text-base leading-8 text-[var(--muted)] ${isCenter ? "mx-auto" : ""}`}>
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
      className={`inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--brand)] bg-[var(--brand)] px-7 py-3.5 font-raleway text-xs font-extrabold uppercase tracking-[0.1em] text-white transition duration-300 hover:-translate-y-1 hover:bg-[var(--brand-dark)] hover:shadow-[0_18px_34px_var(--accent-light)] ${className}`}
    >
      {children}
    </Link>
  );
}

export function SecondaryLink({ to, children, className = "" }) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--brand)] px-7 py-3.5 font-raleway text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--brand)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--surface-soft)] ${className}`}
    >
      {children}
    </Link>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-12 items-center justify-center rounded-md border border-[var(--brand)] bg-[var(--brand)] px-7 py-3.5 font-raleway text-xs font-extrabold uppercase tracking-[0.1em] text-white transition duration-300 hover:-translate-y-1 hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] px-5 py-3 font-raleway text-xs font-bold uppercase tracking-[0.12em] text-[var(--text)] transition duration-300 hover:border-[var(--brand)] hover:text-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, detail }) {
  return (
    <div className={`${surfaceClass} rounded-lg p-5 transition duration-300 hover:-translate-y-1`}>
      <p className="font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">{label}</p>
      <p className="mt-3 font-raleway text-3xl font-extrabold text-[var(--text)]">{value}</p>
      {detail && <p className="mt-2 font-raleway text-sm leading-6 text-[var(--muted)]">{detail}</p>}
    </div>
  );
}

function Footer() {
  const socialIcons = [
    { name: "facebook", char: "f" },
    { name: "twitter", char: "t" },
    { name: "instagram", char: "i" },
    { name: "linkedin", char: "in" },
    { name: "google", char: "G" }
  ];

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)]/50 py-8 transition-colors duration-300">
      {/* Main Footer Content */}
      <Container className="grid gap-10 py-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.25fr] pt-16 border-b border-[var(--border)]/50">
        {/* Branding column */}
        <div className="text-left">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <span className="font-playfair text-2xl font-bold tracking-tight text-[var(--text)]">
              RoziKha<span className="italic font-serif text-[var(--brand)] font-normal">n</span>
            </span>
          </Link>
          <p className="text-xs leading-relaxed text-[var(--muted)] max-w-xs mb-6">
            A clean, versatile dropshipping platform built for modern sellers who want trusted products, smooth integrations, and automated order flow.
          </p>
          <div className="flex items-center gap-3">
            {socialIcons.map((social) => (
              <a
                key={social.name}
                href="#"
                className="grid h-8 w-8 place-items-center rounded-full bg-[var(--surface-soft)] text-sm font-bold text-[var(--muted)] hover:bg-[var(--brand)] hover:text-white transition duration-200"
                aria-label={`Follow us on ${social.name}`}
              >
                {social.char}
              </a>
            ))}
          </div>
        </div>

        {/* Company Column */}
        <div className="text-left">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">Company</h4>
          <ul className="mt-5 space-y-3">
            {["About Us", "Services", "Community", "Testimonial"].map((link) => (
              <li key={link}>
                <Link to="/" className="text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Column */}
        <div className="text-left">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">Support</h4>
          <ul className="mt-5 space-y-3">
            {["Help Center", "Tweet @ Us", "Webians", "Feedback"].map((link) => (
              <li key={link}>
                <Link to="/" className="text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Column */}
        <div className="text-left">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">Links</h4>
          <ul className="mt-5 space-y-3">
            {["Courses", "Become Teacher", "Service", "All in One"].map((link) => (
              <li key={link}>
                <Link to="/" className="text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--brand)]">
                  {link}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Column */}
        <div className="text-left">
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-[var(--text)]">Contact Us</h4>
          <ul className="mt-5 space-y-4">
            <li className="flex items-center gap-3 text-xs font-semibold text-[var(--muted)]">
              <span className="text-sm text-[var(--brand)]">📞</span>
              <span>(91) 98765 4321 54</span>
            </li>
            <li className="flex items-center gap-3 text-xs font-semibold text-[var(--muted)]">
              <span className="text-sm text-[var(--brand)]">✉</span>
              <span>support@rozikhan.com</span>
            </li>
          </ul>
        </div>
      </Container>

      {/* Bottom Bar */}
      <Container className="flex flex-col gap-4 py-4 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between pt-4">
        <p>© Copyright by RoziKhan. All rights reserved.</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {["Privacy Policy", "Terms of Use", "Legal", "Site Map"].map((item) => (
            <Link key={item} to="/" className="hover:text-[var(--brand)] transition">
              {item}
            </Link>
          ))}
        </div>
      </Container>
    </footer>
  );
}
