import { Link, useLocation } from "react-router-dom";
import useThemeMode from "../hooks/useThemeMode";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function OrderSuccess() {
  const { isDark } = useThemeMode();
  const { state } = useLocation();
  const order = state?.order;

  return (
    <main className={`min-h-screen px-5 py-12 ${isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"}`}>
      <section className={`mx-auto max-w-3xl overflow-hidden rounded-2xl border p-8 text-center shadow-2xl sm:p-12 ${isDark ? "border-white/10 bg-[#0c0d10]" : "border-slate-200 bg-white"}`}>
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-emerald-500/10">
          <div className="h-12 w-7 rotate-45 border-b-4 border-r-4 border-emerald-500" />
        </div>

        <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-emerald-500">
          Order confirmed
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Your supplier order is live.</h1>
        <p className={`mx-auto mt-4 max-w-xl ${isDark ? "text-gray-400" : "text-slate-600"}`}>
          Payment confirmed successfully! Your order has been placed and queued for supplier processing.
        </p>

        <div className={`mt-8 grid gap-3 rounded-2xl p-5 text-left ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
          <div className="flex justify-between gap-4">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Order ID</span>
            <strong className="truncate">{order?._id || "Pending sync"}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Total</span>
            <strong>{currency.format(state?.total || order?.totalPrice || 0)}</strong>
          </div>
          <div className="flex justify-between gap-4">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Delivery estimate</span>
            <strong>{state?.deliveryEstimate || "5-8 business days"}</strong>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/orders" className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white transition hover:bg-blue-700">
            View my orders
          </Link>
          <Link to="/products" className="rounded-xl border border-slate-200 px-7 py-4 text-sm font-black transition hover:bg-slate-50 dark:border-white/10 dark:hover:bg-white/10">
            Source more products
          </Link>
        </div>
      </section>
    </main>
  );
}

export default OrderSuccess;
