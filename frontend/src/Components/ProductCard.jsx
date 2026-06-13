import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { convertRupeesToDollars, formatUsd } from "../utils/currency";
import useCart from "../hooks/useCart";

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f4f6'/%3E%3Ctext x='200' y='210' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'%3ENo Image%3C/text%3E%3C/svg%3E";

function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate = useNavigate(); // For programmatic navigation
  const [added, setAdded] = useState(false);
  const [buttonSwipeDistance, setButtonSwipeDistance] = useState(0);
  const [cardSwipeDistance, setCardSwipeDistance] = useState(0);
  const [isSwipingButton, setIsSwipingButton] = useState(false);
  const [isSwipingCard, setIsSwipingCard] = useState(false);
  const buttonStartX = useRef(0);
  const cardStartX = useRef(0);

  const imageSrc = product.images?.find(Boolean) || fallbackImage;
  const price = Number(product.price || 0);
  const usdPrice = convertRupeesToDollars(price);

  const handleAddToCart = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  // Determine card colors based on swipe direction
  const getCardBackgroundColor = () => {
    if (cardSwipeDistance < -40) return "rgba(107, 114, 128, 0.1)"; // Gray for left swipe (view details)
    return "var(--surface-soft)";
  };

  const getCardBorderColor = () => {
    if (cardSwipeDistance < -40) return "rgba(107, 114, 128, 0.3)";
    return "var(--border)";
  };

  const cardStyle = {
    transform: `translateX(${cardSwipeDistance}px) rotate(${cardSwipeDistance / 40}deg)`,
    backgroundColor: getCardBackgroundColor(),
    borderColor: getCardBorderColor(),
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

  // ---------------- Button Swipe Handlers (Add to Cart) ----------------
  const handleButtonStart = (clientX) => {
    buttonStartX.current = clientX;
    setIsSwipingButton(true);
  };

  const handleButtonMove = (clientX) => {
    if (!isSwipingButton) return;
    const delta = clientX - buttonStartX.current;
    setButtonSwipeDistance(Math.max(Math.min(delta, 150), 0)); // Only right swipe for button
  };

  const handleButtonEnd = () => {
    if (buttonSwipeDistance > 100) {
      handleAddToCart();
    }
    setButtonSwipeDistance(0);
    setIsSwipingButton(false);
  };

  // Touch handlers for button
  const handleButtonTouchStart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleButtonStart(event.touches[0]?.clientX || 0);
  };
  
  const handleButtonTouchMove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleButtonMove(event.touches[0]?.clientX || 0);
  };
  
  const handleButtonTouchEnd = () => {
    handleButtonEnd();
  };

  // Mouse handlers for button
  const handleButtonMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    handleButtonStart(event.clientX);
  };
  
  const handleButtonMouseMove = (event) => {
    if (isSwipingButton) handleButtonMove(event.clientX);
  };
  
  const handleButtonMouseUp = () => handleButtonEnd();
  const handleButtonMouseLeave = () => handleButtonEnd();

  // ---------------- Card Swipe Handlers (View Details) ----------------
  const handleCardStart = (clientX) => {
    // If we're on the button, don't swipe the card
    cardStartX.current = clientX;
    setIsSwipingCard(true);
  };

  const handleCardMove = (clientX) => {
    if (!isSwipingCard) return;
    const delta = clientX - cardStartX.current;
    setCardSwipeDistance(Math.max(Math.min(delta, 50), -100)); // Right limited, left more
  };

  const handleCardEnd = () => {
    if (cardSwipeDistance < -70) {
      // Swiped left enough - navigate to product details!
      navigate(`/products/${product._id}`);
    }
    setCardSwipeDistance(0);
    setIsSwipingCard(false);
  };

  // Touch handlers for card
  const handleCardTouchStart = (event) => {
    // Only start card swipe if not touching the button
    const target = event.target;
    if (target.closest('[data-swipe-button]')) return;
    handleCardStart(event.touches[0]?.clientX || 0);
  };
  
  const handleCardTouchMove = (event) => {
    if (!isSwipingCard) return;
    const target = event.target;
    if (target.closest('[data-swipe-button]')) return;
    handleCardMove(event.touches[0]?.clientX || 0);
  };
  
  const handleCardTouchEnd = () => {
    handleCardEnd();
  };

  // Mouse handlers for card
  const handleCardMouseDown = (event) => {
    const target = event.target;
    if (target.closest('[data-swipe-button]')) return;
    handleCardStart(event.clientX);
  };
  
  const handleCardMouseMove = (event) => {
    if (!isSwipingCard) return;
    handleCardMove(event.clientX);
  };
  
  const handleCardMouseUp = () => handleCardEnd();
  const handleCardMouseLeave = () => handleCardEnd();

  const swipeLabel = added
    ? "Added ✓"
    : isSwipingButton
    ? buttonSwipeDistance > 50
      ? "Release to buy →"
      : "Swipe →"
    : "Swipe to Buy";

  return (
    <div
      style={cardStyle}
      className="group relative flex h-full flex-col overflow-hidden rounded-4xl border p-4 transition duration-300 hover:-translate-y-2 card-shadow-hover cursor-pointer"
      onClick={(e) => {
        // Don't navigate if clicking the swipe button!
        const target = e.target;
        if (target.closest('[data-swipe-button]')) return;
        navigate(`/products/${product._id}`);
      }}
      onTouchStart={handleCardTouchStart}
      onTouchMove={handleCardTouchMove}
      onTouchEnd={handleCardTouchEnd}
      onTouchCancel={handleCardTouchEnd}
      onMouseDown={handleCardMouseDown}
      onMouseMove={isSwipingCard ? handleCardMouseMove : undefined}
      onMouseUp={handleCardMouseUp}
      onMouseLeave={handleCardMouseLeave}
    >
      {/* Left swipe indicator for details */}
      {cardSwipeDistance < 0 && (
        <div 
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full text-3xl text-white transition-all"
          style={{ 
            opacity: Math.min(Math.abs(cardSwipeDistance) / 70, 1), 
            transform: `translate(${50 + cardSwipeDistance * 0.5}px, -50%) scale(${0.5 + (Math.abs(cardSwipeDistance) / 140)})`,
            background: "rgba(107, 114, 128, 0.85)"
          }}
        >
          👁️
        </div>
      )}
      {/* Decorative Back Arrow */}
      <div className="absolute left-9 top-9 z-20 flex h-8 w-8 items-center justify-center rounded-full opacity-70 shadow-sm transition group-hover:opacity-100" style={surfaceStyle}>
        <span className="text-lg font-light leading-none" style={textStyle}>
          ←
        </span>
      </div>

      {/* Inner Rounded Product Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-4xl bg-[var(--surface)] p-4 flex items-center justify-center mb-5 shadow-sm border" style={{ borderColor: "var(--border)" }}>
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
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--brand)] transition-colors" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)] transition-colors" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--surface-soft)] transition-colors" />
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--border)] transition-colors opacity-50" />
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
        <div className="mb-4 flex items-center gap-2 px-1 text-xs font-bold transition-colors" style={{ color: "var(--muted)" }}>
          <span className="text-[9px] translate-y-[-0.5px] text-[var(--brand)]">▶</span>
          <span className="hover:text-[var(--brand)] transition-colors">View the Experience</span>
        </div>

        {/* Product Description */}
        <p className="line-clamp-2 px-1 text-xs leading-relaxed mb-5" style={mutedStyle}>
          {product.description || "A supplier-ready item selected for refined ecommerce merchandising."}
        </p>

        {/* Supplier & Review Row */}
        <div className="mb-6 px-1 flex items-center justify-between text-[11px] font-semibold" style={mutedStyle}>
          <span>{product.supplier || "Rkdrop Supplier"}</span>
          <span>★ {Number(product.ratings || 0).toFixed(1)} ({product.numReviews || 0})</span>
        </div>

        {/* Combined Action Price/Buy Pill Button - Classic Sliding Design! */}
        <div className="mt-auto pt-2">
          <div 
            data-swipe-button="true"
            className="relative w-full h-16 overflow-hidden rounded-full bg-[var(--surface-soft)] p-1 shadow-md cursor-grab active:cursor-grabbing select-none border border-[var(--border)]"
            onTouchStart={handleButtonTouchStart}
            onTouchMove={handleButtonTouchMove}
            onTouchEnd={handleButtonTouchEnd}
            onTouchCancel={handleButtonTouchEnd}
            onMouseDown={handleButtonMouseDown}
            onMouseMove={isSwipingButton ? handleButtonMouseMove : undefined}
            onMouseUp={handleButtonMouseUp}
            onMouseLeave={handleButtonMouseLeave}
          >
            {/* Neon green success background */}
            <div 
              className="absolute top-0 left-0 h-full rounded-full transition-all z-10"
              style={{ 
                width: `${Math.min((buttonSwipeDistance / 150) * 100, 100)}%`,
                backgroundColor: buttonSwipeDistance > 80 ? "var(--brand)" : "rgba(57, 255, 20, 0.3)"
              }}
            />

            {/* Swipe text label in background */}
            <div className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none z-20">
              <span className="text-[var(--brand)] text-[12px] font-black uppercase tracking-[0.25em]">
                {swipeLabel}
              </span>
            </div>

            {/* Sliding pill! */}
            <div 
              className="absolute top-1 left-1 h-[calc(100%-8px)] flex items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-xl z-30"
              style={{ 
                width: 'auto',
                minWidth: '80px',
                padding: '0 14px',
                transform: `translateX(${buttonSwipeDistance}px)`,
                transition: isSwipingButton ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <span className="text-[var(--text)] font-bold text-sm font-raleway tracking-wide">
                {formatUsd(usdPrice)}
              </span>
              {buttonSwipeDistance > 30 && (
                <span className="ml-2 text-lg transition-opacity">
                  🛒
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
