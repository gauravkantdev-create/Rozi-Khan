import { Link } from "react-router-dom";
import { surfaceClass } from "../layout/PageShell";

function StateMessage({ title, message, actionLabel = "Back to Products", actionTo = "/products", tone = "neutral" }) {
  const toneClass = tone === "error" ? "text-red-700" : "text-[#2F2F2F]";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className={`${surfaceClass} max-w-md p-8 text-center`}>
        <p className={`font-playfair text-3xl font-semibold ${toneClass}`}>{title}</p>
        <p className="mt-3 font-raleway leading-7 text-[#757575]">{message}</p>
        <Link
          to={actionTo}
          className="mt-6 inline-flex border border-[#2F2F2F] bg-[#2F2F2F] px-5 py-3 font-raleway text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-[#C5A992] hover:text-[#2F2F2F]"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export default StateMessage;
