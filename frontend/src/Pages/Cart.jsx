import { useState } from "react";
import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import useThemeMode from "../hooks/useThemeMode";
import { formatUsdFromInr } from "../utils/currency";

function CartImage({ item }) {
  const [failed, setFailed] = useState(false);

  if (!item.image || failed) {
    return (
      <div className="grid h-28 w-28 shrink-0 place-items-center rounded border border-dashed border-slate-300 bg-slate-100 p-3 text-center text-xs font-bold text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 sm:h-36 sm:w-36">
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={item.image}
      alt={item.name}
      onError={() => setFailed(true)}
      className="h-28 w-28 shrink-0 rounded bg-white object-contain p-2 shadow-sm sm:h-36 sm:w-36"
    />
  );
}

function Cart() {
  const { isDark } = useThemeMode();
  const { items: cartItems, totals, updateQuantity: updateCartQuantity, removeItem } = useCart();
  const [coupon, setCoupon] = useState("");
  const [updatedItem, setUpdatedItem] = useState("");

  const updateQuantity = (productId, nextQuantity) => {
    setUpdatedItem(productId);
    updateCartQuantity(productId, nextQuantity);
    window.setTimeout(() => setUpdatedItem(""), 220);
  };

  return (
    <main
      className={`min-h-screen px-4 py-6 transition-colors duration-500 sm:px-6 lg:px-10 ${
        isDark ? "bg-[#0f1111] text-white" : "bg-[#eaeded] text-slate-950"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        {cartItems.length === 0 ? (
          <section className={`rounded border p-8 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
            <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
              <div className="grid h-44 place-items-center rounded bg-blue-500/10">
                <div className="h-24 w-28 rounded border-4 border-blue-500/70 bg-blue-500/10" />
              </div>
              <div>
                <h1 className="text-3xl font-black">Your RoziKhan cart is empty.</h1>
                <p className={`mt-3 max-w-2xl ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                  Add supplier products to compare stock, delivery timing, and total sourcing cost before checkout.
                </p>
                <Link
                  to="/products"
                  className="mt-6 inline-flex rounded-full bg-[#ffd814] px-7 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f7ca00]"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
            <section className={`rounded border shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <h1 className="text-3xl font-black">Shopping Cart</h1>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <Link to="/products" className="font-bold text-blue-500 hover:underline">
                    Continue shopping
                  </Link>
                  <span className={isDark ? "text-gray-400" : "text-slate-500"}>Price</span>
                </div>
              </div>

              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {cartItems.map((item) => {
                  const isUpdated = updatedItem === item.productId;
                  const itemTotal = item.price * item.quantity;
                  const stock = Number(item.stock || 99);

                  return (
                    <article key={item.productId} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto]">
                      <CartImage item={item} />

                      <div className="min-w-0">
                        <h2 className="text-lg font-black leading-snug">{item.name}</h2>
                        <p className="mt-1 text-sm font-bold text-emerald-600">In stock</p>
                        <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                          Sold by {item.supplier || "RoziKhan Verified Supplier"}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                            {item.category || "Supplier product"}
                          </span>
                          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                            Delivery estimate 5-8 days
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                          <div className={`flex items-center rounded-full border p-1 ${isDark ? "border-white/10 bg-white/5" : "border-slate-300 bg-slate-50"}`}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className="grid h-8 w-8 place-items-center rounded-full font-black transition hover:bg-white dark:hover:bg-white/10"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              -
                            </button>
                            <span className={`grid h-8 min-w-10 place-items-center rounded-full px-2 font-black ${isUpdated ? "bg-blue-600 text-white" : ""}`}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="grid h-8 w-8 place-items-center rounded-full font-black transition hover:bg-white dark:hover:bg-white/10"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="font-bold text-blue-500 hover:underline"
                          >
                            Delete
                          </button>
                          <span className={isDark ? "text-gray-500" : "text-slate-400"}>|</span>
                          <button type="button" className="font-bold text-blue-500 hover:underline">
                            Save for later
                          </button>
                          <span className={`font-bold ${stock <= 5 ? "text-amber-500" : isDark ? "text-gray-400" : "text-slate-500"}`}>
                            {stock <= 5 ? `Only ${stock} left` : `${stock} available`}
                          </span>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xl font-black">{formatUsdFromInr(itemTotal)}</p>
                        <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                          {formatUsdFromInr(item.price)} each
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="border-t border-slate-200 p-5 text-right dark:border-white/10">
                <span className="text-lg">
                  Subtotal ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}):{" "}
                  <strong>{formatUsdFromInr(totals.subtotal)}</strong>
                </span>
              </div>
            </section>

            <aside className={`h-max rounded border p-5 shadow-sm lg:sticky lg:top-24 ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <div className="rounded border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-bold text-emerald-500">
                Your order qualifies for supplier protection.
              </div>

              <div className="mt-5">
                <p className="text-xl">
                  Subtotal ({totals.itemCount} item{totals.itemCount === 1 ? "" : "s"}):
                </p>
                <p className="mt-1 text-2xl font-black">{formatUsdFromInr(totals.grandTotal)}</p>
              </div>

              <Link
                to="/checkout"
                className="mt-5 flex w-full items-center justify-center rounded-full bg-[#ffd814] px-6 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-[#f7ca00]"
              >
                Proceed to checkout
              </Link>

              <div className="mt-5 rounded border border-dashed border-slate-300 p-4 dark:border-white/10">
                <label className="text-xs font-black uppercase tracking-[0.16em] text-blue-500">Coupon code</label>
                <div className="mt-3 flex gap-2">
                  <input
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    placeholder="ROZIKHAN5"
                    className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-black dark:text-white"
                  />
                  <button className="rounded border border-slate-300 px-4 py-2 text-sm font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10">
                    Apply
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm dark:border-white/10">
                <div className="flex justify-between"><span>Items</span><strong>{formatUsdFromInr(totals.subtotal)}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong>{totals.shippingFee ? formatUsdFromInr(totals.shippingFee) : "Free"}</strong></div>
                <div className="flex justify-between"><span>Platform fee</span><strong>{formatUsdFromInr(totals.platformFee)}</strong></div>
                {totals.discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount</span><strong>-{formatUsdFromInr(totals.discount)}</strong></div>}
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg dark:border-white/10">
                  <span className="font-black">Order total</span>
                  <strong>{formatUsdFromInr(totals.grandTotal)}</strong>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}

export default Cart;
