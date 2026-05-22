import { Link } from "react-router-dom";

function StateMessage({ title, message, actionLabel = "Back to Products", actionTo = "/products", tone = "neutral" }) {
  const toneClass =
    tone === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-200"
      : "border-white/10 bg-white/[0.04] text-gray-200";

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className={`max-w-md rounded-2xl border p-8 text-center shadow-2xl shadow-black/30 ${toneClass}`}>
        <p className="text-2xl font-black text-white">{title}</p>
        <p className="mt-3 leading-7 text-gray-300">{message}</p>
        <Link
          to={actionTo}
          className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-blue-500 hover:text-white"
        >
          {actionLabel}
        </Link>
      </div>
    </div>
  );
}

export default StateMessage;
