import { Link } from "react-router-dom";
import ProductMedia from "./products/ProductMedia";
import { convertRupeesToDollars, formatUsd } from "../utils/currency";

function ProductCard({ product }) {
  const imageSrc = product.images?.find(Boolean);
  const stock = Number(product.stock || 0);
  const inStock = stock > 0;
  const price = Number(product.price || 0);
  const usdPrice = convertRupeesToDollars(price);

  return (
    <Link
      to={`/products/${product._id}`}
      className="group flex h-full flex-col overflow-hidden border border-[#d8c8ba] bg-[#fffdf8]/86 transition duration-500 hover:-translate-y-2 hover:border-[#C5A992] hover:shadow-[0_30px_80px_rgba(47,47,47,0.14)]"
      aria-label={`View details for ${product.name}`}
    >
      <ProductMedia src={imageSrc} alt={product.name} className="aspect-[4/4.6]" />

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="bg-[#C5A992]/18 px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-[0.18em] text-[#2F2F2F]">
            {product.category || "Premium"}
          </span>
          <span className={`px-3 py-1 font-raleway text-[11px] font-bold uppercase tracking-[0.18em] ${inStock ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
            {inStock ? "In stock" : "Sold out"}
          </span>
        </div>

        <h3 className="line-clamp-2 font-playfair text-2xl font-semibold leading-snug text-[#2F2F2F]" title={product.name}>
          {product.name}
        </h3>
        <p className="mt-3 line-clamp-2 font-raleway text-sm leading-7 text-[#757575]" title={product.description}>
          {product.description || "A supplier-ready item selected for refined ecommerce merchandising."}
        </p>

        <div className="mt-5 border-t border-[#d8c8ba] pt-4">
          <p className="font-raleway text-[11px] font-bold uppercase tracking-[0.2em] text-[#C5A992]">
            {product.supplier || "RoziKhan Supplier"}
          </p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="font-playfair text-2xl font-semibold text-[#2F2F2F]">{formatUsd(usdPrice)}</p>
              <p className="mt-1 font-raleway text-xs text-[#757575]">
                {Number(product.ratings || 0).toFixed(1)} rating / {product.numReviews || 0} reviews
              </p>
            </div>
            <span className="font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#2F2F2F] transition duration-300 group-hover:translate-x-1">
              View
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
