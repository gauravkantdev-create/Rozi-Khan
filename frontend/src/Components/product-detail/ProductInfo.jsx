import QuantitySelector from "./QuantitySelector";
import { PrimaryButton, StatCard } from "../layout/PageShell";
import { formatUsdFromInr } from "../../utils/currency";

function ProductInfo({ product, quantity, onQuantityChange, onAddToCart }) {
  const stock = Number(product.stock || 0);
  const inStock = stock > 0;
  const price = Number(product.price || 0);

  return (
    <section className="flex flex-col justify-center">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="border border-[#C5A992] bg-[#C5A992]/18 px-3 py-1 font-raleway text-xs font-bold uppercase tracking-[0.22em] text-[#2F2F2F]">
          {product.category || "Premium"}
        </span>
        <span className={`border px-3 py-1 font-raleway text-xs font-bold uppercase tracking-[0.18em] ${inStock ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-700" : "border-red-600/30 bg-red-500/10 text-red-700"}`}>
          {inStock ? `${stock} in stock` : "Out of stock"}
        </span>
      </div>

      <h1 className="max-w-2xl font-playfair text-4xl font-semibold leading-tight text-[#2F2F2F] sm:text-5xl lg:text-6xl">
        {product.name}
      </h1>

      <p className="mt-6 max-w-2xl font-raleway text-base leading-8 text-[#757575] sm:text-lg">
        {product.description || "No product description has been added yet."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatCard label="Supplier" value={product.supplier || "Verified"} detail="RoziKhan supplier network" />
        <StatCard label="Rating" value={Number(product.ratings || 0).toFixed(1)} detail={`${product.numReviews || 0} customer reviews`} />
      </div>

      <div className="mt-8 border border-[#d8c8ba] bg-[#fffdf8]/86 p-5 shadow-[0_24px_70px_rgba(47,47,47,0.08)] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-raleway text-xs font-bold uppercase tracking-[0.22em] text-[#C5A992]">Unit price</p>
            <p className="mt-2 font-playfair text-4xl font-semibold text-[#2F2F2F]">{formatUsdFromInr(price)}</p>
          </div>

          <QuantitySelector quantity={quantity} maxQuantity={Math.max(stock, 1)} onChange={onQuantityChange} disabled={!inStock} />
        </div>

        <PrimaryButton type="button" onClick={onAddToCart} disabled={!inStock} className="mt-6 w-full">
          Add to Cart
        </PrimaryButton>
      </div>
    </section>
  );
}

export default ProductInfo;
