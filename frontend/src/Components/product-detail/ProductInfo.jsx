import QuantitySelector from "./QuantitySelector";
import useThemeMode from "../../hooks/useThemeMode";
import { formatUsdFromInr } from "../../utils/currency";

function ProductInfo({ product, quantity, onQuantityChange, onAddToCart }) {
  const { isDark } = useThemeMode();
  const stock = Number(product.stock || 0);
  const inStock = stock > 0;
  const price = Number(product.price || 0);

  return (
    <section className="flex flex-col justify-center">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
          {product.category || "Premium"}
        </span>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
            inStock
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-400/30 bg-red-500/10 text-red-300"
          }`}
        >
          {inStock ? `In stock: ${stock}` : "Out of stock"}
        </span>
      </div>

      <h1 className={`max-w-2xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl ${isDark ? "text-white" : "text-slate-950"}`}>
        {product.name}
      </h1>

      <p className={`mt-5 max-w-2xl text-base leading-8 sm:text-lg ${isDark ? "text-gray-300" : "text-slate-600"}`}>
        {product.description || "No product description has been added yet."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-sm font-medium ${isDark ? "text-gray-500" : "text-slate-500"}`}>Supplier</p>
          <p className={`mt-2 text-lg font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
            {product.supplier || "RoziKhan Verified Supplier"}
          </p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
          <p className={`text-sm font-medium ${isDark ? "text-gray-500" : "text-slate-500"}`}>Dropship margin signal</p>
          <p className="mt-2 text-lg font-bold text-emerald-300">Fast-moving catalog item</p>
        </div>
      </div>

      <div className={`mt-8 rounded-2xl border p-5 shadow-xl sm:p-6 ${isDark ? "border-white/10 bg-[#0c0d10]/90 shadow-black/20" : "border-slate-200 bg-white shadow-slate-200/70"}`}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Unit price</p>
            <p className={`mt-2 text-4xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>
              {formatUsdFromInr(price)}
            </p>
          </div>

          <QuantitySelector
            quantity={quantity}
            maxQuantity={Math.max(stock, 1)}
            onChange={onQuantityChange}
            disabled={!inStock}
          />
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!inStock}
          className={`mt-6 w-full rounded-xl px-6 py-4 text-base font-black transition duration-300 ${
            inStock
              ? "bg-white text-black shadow-lg shadow-white/10 hover:-translate-y-0.5 hover:bg-blue-500 hover:text-white hover:shadow-blue-500/25"
              : "cursor-not-allowed bg-gray-800 text-gray-500"
          }`}
        >
          Add To Cart
        </button>
      </div>
    </section>
  );
}

export default ProductInfo;
