function QuantitySelector({ quantity, maxQuantity, onChange, disabled }) {
  const decreaseQuantity = () => onChange(Math.max(1, quantity - 1));
  const increaseQuantity = () => onChange(Math.min(maxQuantity, quantity + 1));

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-gray-400">Quantity</span>
      <div className="grid h-12 w-36 grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-black/30">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={disabled || quantity <= 1}
          className="text-xl font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <div className="flex items-center justify-center border-x border-white/10 text-base font-bold">
          {quantity}
        </div>
        <button
          type="button"
          onClick={increaseQuantity}
          disabled={disabled || quantity >= maxQuantity}
          className="text-xl font-bold text-gray-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default QuantitySelector;
