import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../Services/orderService";
import { createRazorpayOrder, verifyPayment } from "../Services/paymentService";
import { clearCart, getCartTotals, readCart } from "../utils/cart";
import { getAuthToken, isTokenExpired } from "../utils/auth";
import { formatUsdFromInr } from "../utils/currency";
import { Container, GhostButton, PageShell, PrimaryButton, SectionHeading, inputClass, surfaceClass } from "../Components/layout/PageShell";

const steps = ["Shipping", "Billing", "Payment", "Review"];

const initialForm = {
  shipping: { fullName: "", email: "", phone: "", address: "", city: "", state: "", postalCode: "", country: "India" },
  billing: { sameAsShipping: true, fullName: "", address: "", city: "", state: "", postalCode: "", country: "India" },
  payment: { method: "razorpay" },
};

function Field({ label, error, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block font-raleway text-sm font-bold text-[#2F2F2F]">{label}</span>
      <input {...props} className={`${inputClass} ${error ? "border-red-500 bg-red-50" : ""}`} />
      {error && <span className="mt-2 block font-raleway text-xs font-bold text-red-600">{error}</span>}
    </label>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const [cartItems] = useState(() => readCart());
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState(() => {
    const token = getAuthToken();
    return token && isTokenExpired(token) ? "Your session has expired. Please refresh and login again." : "";
  });

  const totals = useMemo(() => getCartTotals(cartItems), [cartItems]);

  const updateForm = (section, field, value) => {
    setForm((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
    setErrors((current) => ({ ...current, [`${section}.${field}`]: "" }));
  };

  const validateStep = (stepIndex = currentStep) => {
    const nextErrors = {};
    if (stepIndex === 0) {
      ["fullName", "email", "phone", "address", "city", "state", "postalCode"].forEach((field) => {
        if (!form.shipping[field]?.trim()) nextErrors[`shipping.${field}`] = "This field is required.";
      });
      if (form.shipping.email && !/^\S+@\S+\.\S+$/.test(form.shipping.email)) nextErrors["shipping.email"] = "Enter a valid email address.";
      if (form.shipping.phone && form.shipping.phone.replace(/\D/g, "").length < 10) nextErrors["shipping.phone"] = "Enter a valid phone number.";
    }
    if (stepIndex === 1 && !form.billing.sameAsShipping) {
      ["fullName", "address", "city", "state", "postalCode"].forEach((field) => {
        if (!form.billing[field]?.trim()) nextErrors[`billing.${field}`] = "This field is required.";
      });
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const buildOrderData = () => ({
    orderItems: cartItems,
    shippingAddress: form.shipping,
    billingAddress: form.billing.sameAsShipping ? form.shipping : form.billing,
    itemsPrice: totals.subtotal,
    platformFee: totals.platformFee,
    shippingPrice: totals.shippingFee,
    discount: totals.discount,
    totalPrice: totals.grandTotal,
  });

  const handleRazorpayPayment = async () => {
    try {
      setPlacingOrder(true);
      setOrderError("");
      const token = getAuthToken();
      if (!token || isTokenExpired(token)) {
        setOrderError("Your session has expired. Please login again.");
        setPlacingOrder(false);
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await createRazorpayOrder(totals.grandTotal);
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Rkdrop",
        description: `Order of ${cartItems.length} item(s)`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: buildOrderData(),
            });
            clearCart();
            navigate("/order-success", { replace: true, state: { order: verifyRes.data.order, total: totals.grandTotal, deliveryEstimate: "5-8 business days" } });
          } catch (verifyErr) {
            setOrderError(verifyErr.response?.data?.message || "Payment verification failed. Please contact support.");
            setPlacingOrder(false);
          }
        },
        prefill: { name: form.shipping.fullName, email: form.shipping.email, contact: form.shipping.phone },
        theme: { color: "#C5A992" },
        modal: { ondismiss: () => setPlacingOrder(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setOrderError(response.error?.description || "Payment failed. Please try again.");
        setPlacingOrder(false);
      });
      rzp.open();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setOrderError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else {
        setOrderError(errorMessage || "Could not initiate payment. Please try again.");
      }
      setPlacingOrder(false);
    }
  };

  const handleCodOrder = async () => {
    try {
      setPlacingOrder(true);
      setOrderError("");
      const token = getAuthToken();
      if (!token || isTokenExpired(token)) {
        setOrderError("Your session has expired. Please login again.");
        setPlacingOrder(false);
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await createOrder({ ...buildOrderData(), paymentMethod: "Cash on delivery" });
      clearCart();
      navigate("/order-success", { replace: true, state: { order: data.order, total: totals.grandTotal, deliveryEstimate: "5-8 business days" } });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      if (err.response?.status === 401) {
        setOrderError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else {
        setOrderError(errorMessage || "We could not place the order. Please try again.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  const placeOrder = () => {
    const allValid = [0, 1].every((stepIndex) => validateStep(stepIndex));
    if (!allValid || cartItems.length === 0) return;
    if (form.payment.method === "razorpay") handleRazorpayPayment();
    else handleCodOrder();
  };

  if (cartItems.length === 0) {
    return (
      <PageShell>
        <Container className="py-12">
          <div className={`${surfaceClass} p-10 text-center`}>
            <SectionHeading align="center" title="Checkout needs a cart." copy="Add supplier products first, then come back to complete the order." />
            <Link to="/products" className="mt-7 inline-flex border border-[#2F2F2F] bg-[#2F2F2F] px-6 py-4 font-raleway text-xs font-bold uppercase tracking-[0.18em] text-white">Browse products</Link>
          </div>
        </Container>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Container className="py-10 sm:py-14">
        <SectionHeading eyebrow="Secure checkout" title="Complete your order" copy="A guided four-step checkout that keeps the existing Razorpay and cash-on-delivery flow intact." />

        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={`border p-4 text-left transition duration-300 ${index <= currentStep ? "border-[#2F2F2F] bg-[#2F2F2F] text-white" : "border-[#d8c8ba] bg-[#fffdf8]/76 text-[#757575] hover:border-[#C5A992]"}`}
            >
              <span className="font-raleway text-[11px] font-bold uppercase tracking-[0.2em]">Step {index + 1}</span>
              <span className="mt-1 block font-playfair text-xl font-semibold">{step}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className={`${surfaceClass} p-5 sm:p-7`}>
            {currentStep === 0 && (
              <div>
                <h2 className="font-playfair text-3xl font-semibold">Shipping details</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" value={form.shipping.fullName} onChange={(e) => updateForm("shipping", "fullName", e.target.value)} error={errors["shipping.fullName"]} />
                  <Field label="Email address" type="email" value={form.shipping.email} onChange={(e) => updateForm("shipping", "email", e.target.value)} error={errors["shipping.email"]} />
                  <Field label="Phone number" value={form.shipping.phone} onChange={(e) => updateForm("shipping", "phone", e.target.value)} error={errors["shipping.phone"]} />
                  <Field label="City" value={form.shipping.city} onChange={(e) => updateForm("shipping", "city", e.target.value)} error={errors["shipping.city"]} />
                  <Field label="Address" className="sm:col-span-2" value={form.shipping.address} onChange={(e) => updateForm("shipping", "address", e.target.value)} error={errors["shipping.address"]} />
                  <Field label="State" value={form.shipping.state} onChange={(e) => updateForm("shipping", "state", e.target.value)} error={errors["shipping.state"]} />
                  <Field label="Postal code" value={form.shipping.postalCode} onChange={(e) => updateForm("shipping", "postalCode", e.target.value)} error={errors["shipping.postalCode"]} />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h2 className="font-playfair text-3xl font-semibold">Billing details</h2>
                <label className="mt-6 flex items-center gap-3 border border-[#d8c8ba] bg-[#F3F2EC]/70 p-4 font-raleway font-bold">
                  <input type="checkbox" checked={form.billing.sameAsShipping} onChange={(e) => updateForm("billing", "sameAsShipping", e.target.checked)} className="h-5 w-5 accent-[#C5A992]" />
                  Billing address is same as shipping
                </label>
                {!form.billing.sameAsShipping && (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" value={form.billing.fullName} onChange={(e) => updateForm("billing", "fullName", e.target.value)} error={errors["billing.fullName"]} />
                    <Field label="City" value={form.billing.city} onChange={(e) => updateForm("billing", "city", e.target.value)} error={errors["billing.city"]} />
                    <Field label="Address" className="sm:col-span-2" value={form.billing.address} onChange={(e) => updateForm("billing", "address", e.target.value)} error={errors["billing.address"]} />
                    <Field label="State" value={form.billing.state} onChange={(e) => updateForm("billing", "state", e.target.value)} error={errors["billing.state"]} />
                    <Field label="Postal code" value={form.billing.postalCode} onChange={(e) => updateForm("billing", "postalCode", e.target.value)} error={errors["billing.postalCode"]} />
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="font-playfair text-3xl font-semibold">Payment method</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["razorpay", "Pay with Razorpay", "Cards, UPI, Netbanking, Wallets"],
                    ["cod", "Cash on delivery", "Pay when you receive the order"],
                  ].map(([method, title, copy]) => (
                    <button key={method} type="button" onClick={() => updateForm("payment", "method", method)} className={`border p-5 text-left transition duration-300 ${form.payment.method === method ? "border-[#2F2F2F] bg-[#2F2F2F] text-white" : "border-[#d8c8ba] bg-[#fffdf8] text-[#2F2F2F] hover:border-[#C5A992]"}`}>
                      <span className="block font-playfair text-2xl font-semibold">{title}</span>
                      <span className="mt-2 block font-raleway text-sm opacity-75">{copy}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="font-playfair text-3xl font-semibold">Order review</h2>
                <div className="mt-6 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-4 border border-[#d8c8ba] bg-[#F3F2EC]/70 p-4">
                      <img src={item.image} alt="" className="h-16 w-16 bg-white object-contain p-1" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-raleway font-bold">{item.name}</p>
                        <p className="font-raleway text-sm text-[#757575]">Qty {item.quantity} / {item.supplier}</p>
                      </div>
                      <strong>{formatUsdFromInr(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orderError && <div className="mt-6 border border-red-500/30 bg-red-500/10 p-4 font-raleway text-sm font-bold text-red-700">{orderError}</div>}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <GhostButton type="button" onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))} disabled={currentStep === 0 || placingOrder}>Back</GhostButton>
              {currentStep < steps.length - 1 ? (
                <PrimaryButton type="button" onClick={goNext}>Continue</PrimaryButton>
              ) : (
                <PrimaryButton type="button" onClick={placeOrder} disabled={placingOrder}>
                  {placingOrder ? "Processing" : form.payment.method === "razorpay" ? "Pay and place order" : "Place order COD"}
                </PrimaryButton>
              )}
            </div>
          </section>

          <aside className={`${surfaceClass} h-max p-6 lg:sticky lg:top-28`}>
            <h2 className="font-playfair text-3xl font-semibold">Summary</h2>
            <div className="mt-6 space-y-4 border-y border-[#d8c8ba] py-5 font-raleway text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{formatUsdFromInr(totals.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Platform fee</span><strong>{formatUsdFromInr(totals.platformFee)}</strong></div>
              <div className="flex justify-between"><span>Shipping</span><strong>{totals.shippingFee ? formatUsdFromInr(totals.shippingFee) : "Free"}</strong></div>
              {totals.discount > 0 && <div className="flex justify-between text-emerald-700"><span>Discount</span><strong>-{formatUsdFromInr(totals.discount)}</strong></div>}
            </div>
            <div className="mt-5 flex justify-between font-playfair text-3xl font-semibold">
              <span>Total</span>
              <span>{formatUsdFromInr(totals.grandTotal)}</span>
            </div>
            <p className="mt-5 bg-[#C5A992]/12 p-4 font-raleway text-sm leading-7 text-[#757575]">
              Delivery estimate: 5-8 business days after supplier processing.
            </p>
          </aside>
        </div>
      </Container>
    </PageShell>
  );
}

export default Checkout;
