function QuantitySelector({ quantity, maxQuantity, onChange, disabled }) {
  const decreaseQuantity = () => onChange(Math.max(1, quantity - 1));
  const increaseQuantity = () => onChange(Math.min(maxQuantity, quantity + 1));

  return (
    <div className="flex items-center gap-3">
      <span className="font-raleway text-sm font-semibold text-[#757575]">Quantity</span>
      <div className="grid h-12 w-36 grid-cols-3 overflow-hidden border border-[#d8c8ba] bg-[#F3F2EC]">
        <button
          type="button"
          onClick={decreaseQuantity}
          disabled={disabled || quantity <= 1}
          className="text-xl font-bold text-[#757575] transition hover:bg-[#C5A992]/20 hover:text-[#2F2F2F] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Decrease quantity"
        >
          -
        </button>
        <div className="flex items-center justify-center border-x border-[#d8c8ba] text-base font-bold text-[#2F2F2F]">
          {quantity}
        </div>
        <button
          type="button"
          onClick={increaseQuantity}
          disabled={disabled || quantity >= maxQuantity}
          className="text-xl font-bold text-[#757575] transition hover:bg-[#C5A992]/20 hover:text-[#2F2F2F] disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default QuantitySelector;
