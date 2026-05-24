import { useState } from "react";
import { Link } from "react-router-dom";
import useThemeMode from "../hooks/useThemeMode";
import { convertRupeesToDollars, formatUsd } from "../utils/currency";

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640' viewBox='0 0 640 640'%3E%3Crect width='640' height='640' fill='%23f1f5f9'/%3E%3Crect x='118' y='156' width='404' height='328' rx='34' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='12'/%3E%3Cpath d='M178 418l98-114 74 82 54-62 74 94H178z' fill='%232563eb' opacity='.16'/%3E%3Ccircle cx='414' cy='246' r='42' fill='%2310b981' opacity='.22'/%3E%3Ctext x='320' y='536' text-anchor='middle' font-family='Arial' font-size='30' font-weight='700' fill='%23475569'%3ERoziKhan Product%3C/text%3E%3C/svg%3E";

function ProductCard({ product }) {
  const { isDark } = useThemeMode();
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = !imageFailed ? product.images?.find(Boolean) : fallbackImage;
  const stock = Number(product.stock || 0);
  const inStock = stock > 0;
  const price = Number(product.price || 0);
  const usdPrice = convertRupeesToDollars(price);
  const estimatedProfit = Math.max(Math.round(usdPrice * 0.32), 2);

  return (
    <Link
      to={`/products/${product._id}`}
      className={`group flex h-full flex-col overflow-hidden rounded-xl border transition duration-300 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/10 ${
        isDark
          ? "border-white/10 bg-[#111111] shadow-lg shadow-black/20"
          : "border-slate-200 bg-white shadow-lg shadow-slate-200/70"
      }`}
      aria-label={`View details for ${product.name}`}
    >
      <div className={`relative aspect-[4/3] overflow-hidden ${isDark ? "bg-[#f7f7f7]" : "bg-slate-50"}`}>
        <img
          src={imageSrc || fallbackImage}
          alt={product.name}
          onError={() => setImageFailed(true)}
          className="h-full w-full object-contain p-4 transition duration-700 group-hover:scale-105"
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            {product.category || "Premium"}
          </span>
          <span className="rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
            Trending
          </span>
        </div>

        <div
          className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${
            inStock
              ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100"
              : "border-red-300/30 bg-red-500/20 text-red-100"
          }`}
        >
          {inStock ? "In stock" : "Sold out"}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div>
          <h3
            className={`line-clamp-2 text-lg font-black leading-snug ${
              isDark ? "text-white" : "text-slate-950"
            }`}
            title={product.name}
          >
            {product.name}
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
              Verified supplier
            </span>
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
              Fast ship
            </span>
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
            {product.supplier || "RoziKhan Supplier"}
          </p>
          <p
            className={`mt-3 line-clamp-2 text-sm leading-6 ${
              isDark ? "text-gray-400" : "text-slate-500"
            }`}
            title={product.description}
          >
            {product.description || "Explore this supplier-ready dropshipping product."}
          </p>
        </div>

        <div className={`mt-auto grid gap-3 rounded-xl p-3 text-sm ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Rating</span>
            <span className="font-black text-amber-500">
              {Number(product.ratings || 0).toFixed(1)} / 5 ({product.numReviews || 0})
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Supplier cost</span>
            <span className={`font-black ${isDark ? "text-white" : "text-slate-950"}`}>
              {formatUsd(usdPrice)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Est. profit</span>
            <span className="font-black text-emerald-500">{formatUsd(estimatedProfit)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className={`text-xs font-black uppercase tracking-[0.16em] ${inStock ? "text-emerald-500" : "text-red-500"}`}>
            {inStock ? `${stock} available` : "Out of stock"}
          </span>
          <span
            className={`rounded-lg px-4 py-2 text-sm font-bold transition group-hover:bg-blue-500 group-hover:text-white ${
              isDark ? "bg-white text-black" : "bg-slate-950 text-white"
            }`}
          >
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
