import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelOrder, getOrderById } from "../Services/orderService";
import useThemeMode from "../hooks/useThemeMode";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const statusSteps = ["Pending", "Processing", "Shipped", "Delivered"];

const statusCopy = {
  Pending: "Order received",
  Processing: "Preparing for dispatch",
  Shipped: "On the way",
  Delivered: "Delivered",
  Cancelled: "Cancelled",
};

const statusStyles = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-400/30",
  Processing: "bg-blue-500/10 text-blue-600 border-blue-400/30",
  Shipped: "bg-indigo-500/10 text-indigo-600 border-indigo-400/30",
  Delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-400/30",
  Cancelled: "bg-red-500/10 text-red-600 border-red-400/30",
};

function safeImage(item) {
  return item.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='150' y='154' text-anchor='middle' font-family='Arial' font-size='18' font-weight='700' fill='%2364758b'%3ERoziKhan%3C/text%3E%3C/svg%3E";
}

function OrderDetail() {
  const { id } = useParams();
  const { isDark } = useThemeMode();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const currentStatusIndex = useMemo(() => {
    if (!order || order.status === "Cancelled") return -1;
    return Math.max(statusSteps.indexOf(order.status), 0);
  }, [order]);

  const firstItem = order?.orderItems?.[0];

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const { data } = await getOrderById(id);
        setOrder(data.order);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this order.");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    try {
      setCancelling(true);
      setActionMessage("");
      const { data } = await cancelOrder(order._id, "Customer requested cancellation");
      setOrder(data.order);
      setActionMessage("Order cancelled successfully.");
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Unable to cancel this order.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <main className={`min-h-screen px-5 py-8 ${isDark ? "bg-[#0f1111]" : "bg-[#eaeded]"}`}>
        <div className="mx-auto grid max-w-7xl gap-5">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className={`min-h-screen px-5 py-10 ${isDark ? "bg-[#0f1111] text-white" : "bg-[#eaeded] text-slate-950"}`}>
        <div className="mx-auto max-w-3xl rounded border border-red-400/30 bg-red-500/10 p-8 text-center text-red-500">
          <h1 className="text-2xl font-black">Order unavailable</h1>
          <p className="mt-2 font-bold">{error || "This order could not be found."}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen px-4 py-6 sm:px-6 lg:px-10 ${isDark ? "bg-[#0f1111] text-white" : "bg-[#eaeded] text-slate-950"}`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-5">
          <Link to="/orders" className="text-sm font-black text-blue-600 hover:underline">
            Back to orders
          </Link>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                Placed {new Date(order.createdAt).toLocaleString()} / {order.orderItems.length} item{order.orderItems.length === 1 ? "" : "s"}
              </p>
            </div>
            <span className={`w-max rounded-full border px-4 py-2 text-sm font-black ${statusStyles[order.status] || statusStyles.Pending}`}>
              {statusCopy[order.status] || order.status}
            </span>
          </div>
        </div>

        {actionMessage && (
          <div className="mb-5 rounded border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-600">
            {actionMessage}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <section className="space-y-5">
            <div className={`rounded border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <div className="grid gap-5 md:grid-cols-[auto_1fr] md:items-center">
                {firstItem && (
                  <img
                    src={safeImage(firstItem)}
                    alt={firstItem.name}
                    className="h-28 w-28 rounded bg-white object-contain p-2 shadow-sm"
                  />
                )}
                <div>
                  <p className={`text-sm font-black ${order.status === "Cancelled" ? "text-red-600" : "text-emerald-600"}`}>
                    {order.status === "Cancelled"
                      ? "This order was cancelled"
                      : order.status === "Delivered"
                        ? "Delivered"
                        : `Arriving ${order.deliveryEstimate || "in 5-8 business days"}`}
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    {order.status === "Cancelled" ? "Order cancelled" : statusCopy[order.status] || order.status}
                  </h2>
                  <p className={`mt-2 ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                    {firstItem?.name}
                    {order.orderItems.length > 1 ? ` and ${order.orderItems.length - 1} more item${order.orderItems.length > 2 ? "s" : ""}` : ""}
                  </p>
                </div>
              </div>

              {order.status !== "Cancelled" ? (
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-slate-200 dark:bg-white/10" />
                    <div
                      className="absolute left-0 top-4 h-1 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%` }}
                    />
                    <div className="relative grid grid-cols-4 gap-2">
                      {statusSteps.map((status, index) => {
                        const complete = index <= currentStatusIndex;
                        return (
                          <div key={status} className="text-center">
                            <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full border-2 text-xs font-black ${
                              complete
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : isDark
                                  ? "border-white/20 bg-[#131921] text-gray-500"
                                  : "border-slate-300 bg-white text-slate-400"
                            }`}>
                              {index + 1}
                            </div>
                            <p className={`mt-2 text-xs font-black ${complete ? "text-emerald-600" : isDark ? "text-gray-500" : "text-slate-500"}`}>
                              {status}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold text-red-600">
                  {order.cancelReason || "Cancelled by customer"}
                </div>
              )}
            </div>

            <div className={`rounded border shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <div className="border-b border-slate-200 p-5 dark:border-white/10">
                <h2 className="text-2xl font-black">Items in this order</h2>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-white/10">
                {order.orderItems.map((item) => (
                  <article key={`${item.productId}-${item.name}`} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto]">
                    <img src={safeImage(item)} alt={item.name} className="h-28 w-28 rounded bg-white object-contain p-2 shadow-sm" />
                    <div className="min-w-0">
                      <h3 className="font-black leading-snug">{item.name}</h3>
                      <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                        Sold by {item.supplier || "RoziKhan Verified Supplier"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-600">
                          {item.category || "Supplier product"}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-600">
                          Supplier dispatch 2-3 days
                        </span>
                      </div>
                      {item.productId && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link
                            to={`/products/${item.productId}`}
                            className="rounded-full bg-[#ffd814] px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-[#f7ca00]"
                          >
                            Buy it again
                          </Link>
                          <Link
                            to={`/products/${item.productId}`}
                            className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                          >
                            View product
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-black">{currency.format(item.price * item.quantity)}</p>
                      <p className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                        Qty {item.quantity}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className={`rounded border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-black">Shipment activity</h2>
              <div className="mt-4 space-y-3">
                {(order.statusHistory || []).length === 0 ? (
                  <p className={isDark ? "text-gray-400" : "text-slate-600"}>No shipment updates yet.</p>
                ) : (
                  order.statusHistory.map((entry, index) => (
                    <div key={`${entry.status}-${index}`} className="grid gap-1 border-l-4 border-blue-500 pl-4">
                      <p className="font-black">{statusCopy[entry.status] || entry.status}</p>
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                        {entry.note || `Status updated to ${entry.status}`} / {new Date(entry.changedAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className={`rounded border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-black">Shipping address</h2>
              <div className={`mt-3 text-sm leading-6 ${isDark ? "text-gray-300" : "text-slate-700"}`}>
                <p className="font-black">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.address}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
                <p className="mt-2">{order.shippingAddress.phone}</p>
                <p>{order.shippingAddress.email}</p>
              </div>
            </div>

            <div className={`rounded border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-black">Order summary</h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span>Items</span><strong>{currency.format(order.itemsPrice)}</strong></div>
                <div className="flex justify-between"><span>Delivery</span><strong>{order.shippingPrice ? currency.format(order.shippingPrice) : "Free"}</strong></div>
                <div className="flex justify-between"><span>Platform fee</span><strong>{currency.format(order.platformFee)}</strong></div>
                {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><strong>-{currency.format(order.discount)}</strong></div>}
                <div className="flex justify-between border-t border-slate-200 pt-3 text-lg dark:border-white/10">
                  <span className="font-black">Order total</span>
                  <strong>{currency.format(order.totalPrice)}</strong>
                </div>
              </div>
            </div>

            <div className={`rounded border p-5 shadow-sm ${isDark ? "border-white/10 bg-[#131921]" : "border-slate-200 bg-white"}`}>
              <h2 className="text-xl font-black">Need help?</h2>
              <div className="mt-4 grid gap-3">
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10">
                  Track package
                </button>
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10">
                  Contact supplier
                </button>
                {["Pending", "Processing"].includes(order.status) && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    {cancelling ? "Cancelling..." : "Cancel order"}
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default OrderDetail;
