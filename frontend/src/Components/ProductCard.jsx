import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { convertRupeesToDollars, formatUsd } from "../utils/currency";
import useCart from "../hooks/useCart";

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='200' y='210' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function ProductCard({ product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartX = useRef(0);

  const imageSrc = product.images?.find(Boolean) || fallbackImage;
  const price = Number(product.price || 0);
  const usdPrice = convertRupeesToDollars(price);

  const cardStyle = {
    transform: `translateX(${swipeDistance}px) rotate(${swipeDistance / 20}deg)`,
    backgroundColor: "var(--surface-soft)",
    borderColor: "var(--border)",
  };

  const textStyle = {
    color: "var(--text)",
  };

  const mutedStyle = {
    color: "var(--muted)",
  };

  const surfaceStyle = {
    backgroundColor: "var(--surface)",
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0]?.clientX || 0;
    setIsSwiping(true);
  };

  const handleTouchMove = (event) => {
    if (!isSwiping) return;
    const clientX = event.touches[0]?.clientX || 0;
    const delta = clientX - touchStartX.current;
    setSwipeDistance(Math.max(Math.min(delta, 70), -70));
  };

  const handleTouchEnd = () => {
    setSwipeDistance(0);
    setIsSwiping(false);
  };

  const swipeLabel = added
    ? "Added ✓"
    : isSwiping
    ? swipeDistance > 0
      ? "Swipe right to buy"
      : "Swipe left to explore"
    : "Swipe to Buy";

  return (
    <Link
      to={`/products/${product._id}`}
      style={cardStyle}
      className="group touch-swipe-card relative flex h-full flex-col overflow-hidden rounded-4xl border p-4 transition duration-500 hover:-translate-y-2 card-shadow-hover"
      aria-label={`View details for ${product.name}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Decorative Back Arrow */}
      <div className="absolute left-9 top-9 z-20 flex h-8 w-8 items-center justify-center rounded-full opacity-70 shadow-sm transition group-hover:opacity-100" style={surfaceStyle}>
        <span className="text-lg font-light leading-none" style={textStyle}>
          ←
        </span>
      </div>

      {/* Inner Rounded Product Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-4xl bg-white dark:bg-neutral-900 p-4 flex items-center justify-center mb-5 shadow-sm border" style={{ borderColor: "var(--border)" }}>
        <img
          src={imageSrc}
          alt={product.name}
          onError={(e) => {
            e.target.src = fallbackImage;
          }}
          className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col">
        {/* Page Dots Indicator */}
        <div className="mb-4 flex gap-1.5 px-1">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-600 transition-colors dark:bg-neutral-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300 transition-colors dark:bg-neutral-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200 transition-colors dark:bg-neutral-800" />
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-100 transition-colors dark:bg-neutral-900" />
        </div>

        {/* Category */}
        <p className="px-1 text-xs uppercase tracking-widest font-semibold mb-2" style={mutedStyle}>
          {product.category || "Premium"}
        </p>

        {/* Product Name */}
        <h3 className="line-clamp-2 px-1 text-2xl font-light tracking-tight leading-tight mb-3" title={product.name} style={textStyle}>
          {product.name}
        </h3>

        {/* View the Experience Link */}
        <div className="mb-4 flex items-center gap-2 px-1 text-xs font-bold transition-colors group-hover-text-brand" style={mutedStyle}>
          <span className="text-[9px] translate-y-[-0.5px]">▶</span>
          <span>View the Experience</span>
        </div>

        {/* Product Description */}
        <p className="line-clamp-2 px-1 text-xs leading-relaxed mb-5" style={mutedStyle}>
          {product.description || "A supplier-ready item selected for refined ecommerce merchandising."}
        </p>

        {/* Supplier & Review Row */}
        <div className="mb-6 px-1 flex items-center justify-between text-[11px] font-semibold" style={mutedStyle}>
          <span>{product.supplier || "RoziKhan Supplier"}</span>
          <span>★ {Number(product.ratings || 0).toFixed(1)} ({product.numReviews || 0})</span>
        </div>

        {/* Combined Action Price/Buy Pill Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-between rounded-full bg-neutral-700 dark:bg-neutral-800 p-1 shadow-md hover:bg-neutral-600 transition duration-300 cursor-pointer"
            aria-label="Add product to cart"
          >
            <div className="rounded-full bg-black dark:bg-neutral-950 px-6 py-2.5 text-sm font-bold text-white tracking-wide">
              {formatUsd(usdPrice)}
            </div>
            <span className="flex-1 text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-neutral-300 hover:text-white transition duration-300">
              {swipeLabel}
            </span>
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
