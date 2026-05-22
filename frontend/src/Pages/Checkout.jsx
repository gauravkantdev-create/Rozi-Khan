import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../Services/orderService";
import {
  createRazorpayOrder,
  verifyPayment,
} from "../Services/paymentService";
import useThemeMode from "../hooks/useThemeMode";
import useAuth from "../hooks/useAuth";
import { clearCart, getCartTotals, readCart } from "../utils/cart";
import { getAuthToken, isTokenExpired } from "../utils/auth";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const steps = ["Shipping", "Billing", "Payment", "Review"];

const initialForm = {
  shipping: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  },
  billing: {
    sameAsShipping: true,
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  },
  payment: {
    method: "razorpay",
  },
};

function Field({ label, error, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black">{label}</span>
      <input
        {...props}
        className={`w-full rounded-xl border px-4 py-3 text-sm font-bold outline-none transition focus:border-blue-500 dark:bg-white/5 ${
          error
            ? "border-red-400 bg-red-50/60 dark:border-red-400/60 dark:bg-red-500/10"
            : "border-slate-200 bg-white dark:border-white/10"
        }`}
      />
      {error && <span className="mt-2 block text-xs font-bold text-red-500">{error}</span>}
    </label>
  );
}

function Checkout() {
  const { isDark } = useThemeMode();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cartItems] = useState(() => readCart());
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");

  // Check if token is expired and show warning
  useEffect(() => {
    const token = getAuthToken();
    if (token && isTokenExpired(token)) {
      setOrderError("Your session has expired. Please refresh and login again.");
    }
  }, []);

  const totals = useMemo(() => getCartTotals(cartItems), [cartItems]);

  const updateForm = (section, field, value) => {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
    setErrors((current) => ({ ...current, [`${section}.${field}`]: "" }));
  };

  const validateStep = (stepIndex = currentStep) => {
    const nextErrors = {};

    if (stepIndex === 0) {
      ["fullName", "email", "phone", "address", "city", "state", "postalCode"].forEach((field) => {
        if (!form.shipping[field]?.trim()) nextErrors[`shipping.${field}`] = "This field is required.";
      });
      if (form.shipping.email && !/^\S+@\S+\.\S+$/.test(form.shipping.email)) {
        nextErrors["shipping.email"] = "Enter a valid email address.";
      }
      if (form.shipping.phone && form.shipping.phone.replace(/\D/g, "").length < 10) {
        nextErrors["shipping.phone"] = "Enter a valid phone number.";
      }
    }

    if (stepIndex === 1 && !form.billing.sameAsShipping) {
      ["fullName", "address", "city", "state", "postalCode"].forEach((field) => {
        if (!form.billing[field]?.trim()) nextErrors[`billing.${field}`] = "This field is required.";
      });
    }

    // Step 2 (Payment) — no validation needed, just method selection

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goNext = () => {
    if (!validateStep()) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  };

  // ==========================================
  // Build order data payload
  // ==========================================

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

  // ==========================================
  // Razorpay Payment Flow
  // ==========================================

  const handleRazorpayPayment = async () => {
    try {
      setPlacingOrder(true);
      setOrderError("");

      // Check if token is valid
      const token = getAuthToken();
      if (!token || isTokenExpired(token)) {
        setOrderError("Your session has expired. Please login again.");
        setPlacingOrder(false);
        navigate("/login", { replace: true });
        return;
      }

      // Step 1: Create Razorpay order on backend
      const { data } = await createRazorpayOrder(totals.grandTotal);

      // Step 2: Open Razorpay Checkout modal
      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "RoziKhan",
        description: `Order of ${cartItems.length} item(s)`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            // Step 3: Verify payment on backend
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData: buildOrderData(),
            });

            // Step 4: Success — clear cart and redirect
            clearCart();
            navigate("/order-success", {
              replace: true,
              state: {
                order: verifyRes.data.order,
                total: totals.grandTotal,
                deliveryEstimate: "5-8 business days",
              },
            });
          } catch (verifyErr) {
            setOrderError(
              verifyErr.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
            setPlacingOrder(false);
          }
        },
        prefill: {
          name: form.shipping.fullName,
          email: form.shipping.email,
          contact: form.shipping.phone,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: () => {
            setPlacingOrder(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        setOrderError(
          response.error?.description ||
            "Payment failed. Please try again."
        );
        setPlacingOrder(false);
      });

      rzp.open();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      // Check for authentication errors
      if (err.response?.status === 401) {
        setOrderError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else {
        setOrderError(
          errorMessage || "Could not initiate payment. Please try again."
        );
      }
      setPlacingOrder(false);
    }
  };

  // ==========================================
  // COD (Cash on Delivery) Flow
  // ==========================================

  const handleCodOrder = async () => {
    try {
      setPlacingOrder(true);
      setOrderError("");

      // Check if token is valid
      const token = getAuthToken();
      if (!token || isTokenExpired(token)) {
        setOrderError("Your session has expired. Please login again.");
        setPlacingOrder(false);
        navigate("/login", { replace: true });
        return;
      }

      const { data } = await createOrder({
        ...buildOrderData(),
        paymentMethod: "Cash on delivery",
      });

      clearCart();
      navigate("/order-success", {
        replace: true,
        state: {
          order: data.order,
          total: totals.grandTotal,
          deliveryEstimate: "5-8 business days",
        },
      });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      
      // Check for authentication errors
      if (err.response?.status === 401) {
        setOrderError("Your session has expired. Please login again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } else {
        setOrderError(
          errorMessage || "We could not place the order. Please try again."
        );
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  // ==========================================
  // Place Order Handler
  // ==========================================

  const placeOrder = () => {
    const allValid = [0, 1].every((stepIndex) => validateStep(stepIndex));
    if (!allValid || cartItems.length === 0) return;

    if (form.payment.method === "razorpay") {
      handleRazorpayPayment();
    } else {
      handleCodOrder();
    }
  };

  if (cartItems.length === 0) {
    return (
      <main className={`min-h-screen px-5 py-12 ${isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"}`}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xl dark:border-white/10 dark:bg-[#0c0d10]">
          <h1 className="text-3xl font-black">Checkout needs a cart.</h1>
          <p className={`mt-3 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
            Add supplier products first, then come back to complete the order.
          </p>
          <Link to="/products" className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen px-4 py-8 transition-colors duration-500 sm:px-6 lg:px-10 ${
        isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-500">
            Secure checkout
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Complete your order</h1>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <button
              key={step}
              type="button"
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={`rounded-xl border p-4 text-left transition ${
                index <= currentStep
                  ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                  : isDark
                    ? "border-white/10 bg-white/5 text-gray-400"
                    : "border-slate-200 bg-white text-slate-500"
              }`}
            >
              <span className="text-xs font-black uppercase tracking-[0.18em]">Step {index + 1}</span>
              <span className="mt-1 block font-black">{step}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <section
            className={`rounded-2xl border p-5 shadow-xl sm:p-7 ${
              isDark ? "border-white/10 bg-[#0c0d10]" : "border-slate-200 bg-white"
            }`}
          >
            {currentStep === 0 && (
              <div>
                <h2 className="text-2xl font-black">Shipping details</h2>
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
                <h2 className="text-2xl font-black">Billing details</h2>
                <label className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 p-4 font-bold dark:border-white/10">
                  <input
                    type="checkbox"
                    checked={form.billing.sameAsShipping}
                    onChange={(e) => updateForm("billing", "sameAsShipping", e.target.checked)}
                    className="h-5 w-5 accent-blue-600"
                  />
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
                <h2 className="text-2xl font-black">Payment method</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {/* Razorpay Option */}
                  <button
                    type="button"
                    onClick={() => updateForm("payment", "method", "razorpay")}
                    className={`rounded-xl border p-5 text-left transition ${
                      form.payment.method === "razorpay"
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : isDark
                          ? "border-white/10 bg-white/5"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        form.payment.method === "razorpay"
                          ? "bg-white/20"
                          : "bg-blue-500/10"
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${form.payment.method === "razorpay" ? "text-white" : "text-blue-500"}`}>
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-black">Pay with Razorpay</span>
                        <span className={`text-xs ${form.payment.method === "razorpay" ? "text-white/70" : isDark ? "text-gray-500" : "text-slate-400"}`}>
                          Cards, UPI, Netbanking, Wallets
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* COD Option */}
                  <button
                    type="button"
                    onClick={() => updateForm("payment", "method", "cod")}
                    className={`rounded-xl border p-5 text-left transition ${
                      form.payment.method === "cod"
                        ? "border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : isDark
                          ? "border-white/10 bg-white/5"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        form.payment.method === "cod"
                          ? "bg-white/20"
                          : "bg-emerald-500/10"
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-5 w-5 ${form.payment.method === "cod" ? "text-white" : "text-emerald-500"}`}>
                          <line x1="12" x2="12" y1="2" y2="22" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div>
                        <span className="block font-black">Cash on delivery</span>
                        <span className={`text-xs ${form.payment.method === "cod" ? "text-white/70" : isDark ? "text-gray-500" : "text-slate-400"}`}>
                          Pay when you receive the order
                        </span>
                      </div>
                    </div>
                  </button>
                </div>

                {form.payment.method === "razorpay" && (
                  <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-blue-500">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-black text-blue-500">Secure payment via Razorpay</p>
                        <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                          You'll be redirected to Razorpay's secure checkout to complete the payment using Credit/Debit Card, UPI, Netbanking, or Wallet.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {form.payment.method === "cod" && (
                  <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-emerald-500">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-black text-emerald-500">Pay at delivery</p>
                        <p className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                          Your order will be confirmed immediately. Pay the delivery person in cash when your order arrives.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-2xl font-black">Order review</h2>
                <div className="mt-6 space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.productId} className={`flex gap-4 rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                      <img src={item.image} alt="" className="h-16 w-16 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black">{item.name}</p>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                          Qty {item.quantity} / {item.supplier}
                        </p>
                      </div>
                      <strong>{currency.format(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>

                {/* Payment method summary */}
                <div className={`mt-6 flex items-center gap-3 rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                  <span className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>Payment:</span>
                  <strong className="text-sm">
                    {form.payment.method === "razorpay" ? "💳 Razorpay (Cards, UPI, Netbanking)" : "💵 Cash on delivery"}
                  </strong>
                </div>

                <div className={`mt-4 rounded-xl p-4 text-sm font-bold ${
                  form.payment.method === "razorpay"
                    ? "bg-blue-500/10 text-blue-500"
                    : "bg-emerald-500/10 text-emerald-500"
                }`}>
                  {form.payment.method === "razorpay"
                    ? "Clicking \"Place order\" will open Razorpay's secure payment window."
                    : "Your order will be confirmed. Pay on delivery."}
                </div>
              </div>
            )}

            {orderError && (
              <div className="mt-6 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-500">
                {orderError}
              </div>
            )}

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((step) => Math.max(step - 1, 0))}
                disabled={currentStep === 0 || placingOrder}
                className="rounded-xl border border-slate-200 px-6 py-4 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10"
              >
                Back
              </button>
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-700"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={placingOrder}
                  className="rounded-xl bg-blue-600 px-7 py-4 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-1 hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                >
                  {placingOrder
                    ? "Processing..."
                    : form.payment.method === "razorpay"
                      ? "Pay & place order"
                      : "Place order (COD)"}
                </button>
              )}
            </div>
          </section>

          <aside className={`h-max rounded-2xl border p-5 shadow-2xl lg:sticky lg:top-28 ${isDark ? "border-white/10 bg-[#0c0d10]" : "border-slate-200 bg-white"}`}>
            <h2 className="text-2xl font-black">Summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><strong>{currency.format(totals.subtotal)}</strong></div>
              <div className="flex justify-between"><span>Platform fee</span><strong>{currency.format(totals.platformFee)}</strong></div>
              <div className="flex justify-between"><span>Shipping</span><strong>{totals.shippingFee ? currency.format(totals.shippingFee) : "Free"}</strong></div>
              {totals.discount > 0 && <div className="flex justify-between text-emerald-500"><span>Discount</span><strong>-{currency.format(totals.discount)}</strong></div>}
              <div className="border-t border-slate-200 pt-4 text-lg font-black dark:border-white/10">
                <div className="flex justify-between"><span>Total</span><span className="text-blue-500">{currency.format(totals.grandTotal)}</span></div>
              </div>
            </div>
            <div className={`mt-6 rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
              <p className="font-black">Delivery estimate</p>
              <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                5-8 business days after supplier processing.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
