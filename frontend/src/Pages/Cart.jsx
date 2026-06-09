import { Link } from "react-router-dom";
import useCart from "../hooks/useCart";
import ProductMedia from "../Components/products/ProductMedia";
import { Container, GhostButton, PageShell, PrimaryLink, SectionHeading, surfaceClass } from "../Components/layout/PageShell";
import { formatUsdFromInr } from "../utils/currency";

function Cart() {
  const { items: cartItems, totals, updateQuantity: updateCartQuantity, removeItem } = useCart();

  const updateQuantity = (productId, nextQuantity) => {
    updateCartQuantity(productId, nextQuantity);
  };

  return (
    <PageShell>
      <Container className="py-10 sm:py-14">
        {cartItems.length === 0 ? (
          <section className={`${surfaceClass} grid gap-8 p-8 md:grid-cols-[260px_1fr] md:items-center`}>
            <div className="grid aspect-square place-items-center bg-[#ebe4d8]">
              <span className="font-playfair text-7xl text-[#C5A992]">0</span>
            </div>
            <div>
              <SectionHeading title="Your cart is waiting for its first product." copy="Add supplier products to compare stock, delivery timing, and sourcing cost before checkout." />
              <PrimaryLink to="/products" className="mt-7">Continue shopping</PrimaryLink>
            </div>
          </section>
        ) : (
          <div className="grid gap-7 lg:grid-cols-[1fr_360px]">
            <section>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeading eyebrow="Shopping cart" title="Your selected products" />
                <Link to="/products" className="font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#C5A992] transition hover:text-[#2F2F2F]">
                  Continue shopping
                </Link>
              </div>

              <div className="grid gap-4">
                {cartItems.map((item) => {
                  const itemTotal = item.price * item.quantity;
                  const stock = Number(item.stock || 99);

                  return (
                    <article key={item.productId} className={`${surfaceClass} grid gap-5 p-4 sm:grid-cols-[150px_1fr] lg:grid-cols-[160px_1fr_auto]`}>
                      <ProductMedia src={item.image} alt={item.name} className="aspect-square" />

                      <div className="min-w-0">
                        <p className="font-raleway text-xs font-bold uppercase tracking-[0.2em] text-[#C5A992]">
                          {item.category || "Supplier product"}
                        </p>
                        <h2 className="mt-2 font-playfair text-2xl font-semibold leading-snug text-[#2F2F2F]">{item.name}</h2>
                        <p className="mt-2 font-raleway text-sm leading-7 text-[#757575]">
                          Sold by {item.supplier || "RoziKhan Verified Supplier"}
                        </p>
                        <p className={`mt-2 font-raleway text-sm font-bold ${stock <= 5 ? "text-amber-700" : "text-emerald-700"}`}>
                          {stock <= 5 ? `Only ${stock} left` : `${stock} available`}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <div className="grid h-11 w-36 grid-cols-3 border border-[#d8c8ba] bg-[#F3F2EC]">
                            <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="font-bold transition hover:bg-[#C5A992]/20" aria-label={`Decrease ${item.name} quantity`}>
                              -
                            </button>
                            <span className="grid place-items-center border-x border-[#d8c8ba] font-bold">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="font-bold transition hover:bg-[#C5A992]/20" aria-label={`Increase ${item.name} quantity`}>
                              +
                            </button>
                          </div>
                          <button type="button" onClick={() => removeItem(item.productId)} className="font-raleway text-xs font-bold uppercase tracking-[0.16em] text-red-700 transition hover:text-red-900">
                            Remove
                          </button>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="font-playfair text-3xl font-semibold">{formatUsdFromInr(itemTotal)}</p>
                        <p className="mt-1 font-raleway text-xs text-[#757575]">{formatUsdFromInr(item.price)} each</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className={`${surfaceClass} h-max p-6 lg:sticky lg:top-28`}>
              <h2 className="font-playfair text-3xl font-semibold">Order summary</h2>
              <div className="mt-6 space-y-4 border-y border-[#d8c8ba] py-5 font-raleway text-sm">
                <div className="flex justify-between"><span>Items</span><strong>{formatUsdFromInr(totals.subtotal)}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong>{totals.shippingFee ? formatUsdFromInr(totals.shippingFee) : "Free"}</strong></div>
                <div className="flex justify-between"><span>Platform fee</span><strong>{formatUsdFromInr(totals.platformFee)}</strong></div>
                {totals.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><strong>-{formatUsdFromInr(totals.discount)}</strong></div>}
              </div>
              <div className="mt-5 flex items-end justify-between gap-4">
                <span className="font-raleway text-sm font-bold uppercase tracking-[0.18em] text-[#757575]">Total</span>
                <strong className="font-playfair text-4xl font-semibold">{formatUsdFromInr(totals.grandTotal)}</strong>
              </div>
              <PrimaryLink to="/checkout" className="mt-7 w-full">Proceed to checkout</PrimaryLink>
              <GhostButton type="button" className="mt-3 w-full">Supplier protection included</GhostButton>
            </aside>
          </div>
        )}
      </Container>
    </PageShell>
  );
}

export default Cart;
