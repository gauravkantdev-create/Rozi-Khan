import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cancelOrder, getMyOrders } from "../Services/orderService";
import { formatUsdFromInr } from "../utils/currency";

const statusStyles = {
  Pending: "bg-amber-500/10 text-amber-500 border-amber-400/30",
  Processing: "bg-blue-500/10 text-blue-500 border-blue-400/30",
  Shipped: "bg-indigo-500/10 text-indigo-500 border-indigo-400/30",
  Delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-400/30",
  Cancelled: "bg-red-500/10 text-red-500 border-red-400/30",
};

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data } = await getMyOrders();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    try {
      setCancellingId(orderId);
      setActionMessage("");

      const { data } = await cancelOrder(orderId, "Customer requested cancellation");

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === orderId ? data.order : order))
      );
      setActionMessage("Order cancelled successfully.");
    } catch (err) {
      setActionMessage(err.response?.data?.message || "Unable to cancel this order.");
    } finally {
      setCancellingId("");
    }
  };

  return (
    <main className={`min-h-screen px-4 py-8 sm:px-6 lg:px-10 bg-[var(--page)] text-[var(--text)]`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--brand)]">Order management</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">My Orders</h1>
            <p className="mt-3 text-[var(--muted)]">
              Track supplier processing, shipping, and delivery status in one clean workspace.
            </p>
          </div>
          <Link to="/products" className="rounded-xl bg-[var(--brand)] px-5 py-3 text-center text-sm font-black text-[var(--page)] transition hover:bg-[var(--brand-dark)]">
            Source products
          </Link>
        </div>

        {actionMessage && (
          <div className="mb-5 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/10 p-4 text-sm font-bold text-[var(--brand)]">
            {actionMessage}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-40 animate-pulse rounded-2xl bg-[var(--surface-soft)]" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 font-bold text-red-500">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <section className="rounded-2xl border border-[var(--border)] p-10 text-center shadow-xl bg-[var(--surface)]">
            <h2 className="text-3xl font-black">No orders yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-[var(--muted)]">
              Your confirmed supplier orders will appear here after checkout.
            </p>
          </section>
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <article key={order._id} className="overflow-hidden rounded border border-[var(--border)] shadow-sm bg-[var(--surface)]">
                <div className="grid gap-3 border-b border-[var(--border)] p-4 text-sm md:grid-cols-4 bg-[var(--surface-soft)]">
                  <div>
                    <p className="text-xs font-black uppercase text-[var(--muted)]">Order placed</p>
                    <p className="mt-1 font-bold">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[var(--muted)]">Total</p>
                    <p className="mt-1 font-bold">{formatUsdFromInr(order.totalPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-[var(--muted)]">Ship to</p>
                    <p className="mt-1 truncate font-bold">{order.shippingAddress?.fullName || "Customer"}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs font-black uppercase text-[var(--muted)]">Order # {order._id.slice(-8).toUpperCase()}</p>
                    <Link to={`/orders/${order._id}`} className="mt-1 inline-flex font-black text-[var(--brand)] hover:underline">
                      View order details
                    </Link>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black">
                      {order.status === "Delivered"
                        ? "Delivered"
                        : order.status === "Cancelled"
                          ? "Cancelled"
                          : `Arriving ${order.deliveryEstimate || "in 5-8 business days"}`}
                    </h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles[order.status] || statusStyles.Pending}`}>
                      {order.status}
                    </span>
                  </div>

                  {order.status === "Cancelled" && (
                    <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm font-bold text-red-500">
                      Cancelled {order.cancelledAt ? new Date(order.cancelledAt).toLocaleDateString() : ""}.
                      {order.cancelReason ? ` Reason: ${order.cancelReason}` : ""}
                    </div>
                  )}

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="grid gap-3">
                      {order.orderItems.slice(0, 4).map((item) => (
                        <div key={`${order._id}-${item.productId || item.name}`} className="flex gap-4">
                          <img src={item.image} alt="" className="h-20 w-20 rounded bg-[var(--surface)] object-contain p-2 shadow-sm" />
                          <div className="min-w-0">
                            <p className="truncate font-black">{item.name}</p>
                            <p className="text-sm text-[var(--muted)]">
                              Qty {item.quantity} / {item.supplier}
                            </p>
                            {item.productId && (
                              <Link to={`/products/${item.productId}`} className="mt-2 inline-flex text-sm font-black text-[var(--brand)] hover:underline">
                                Buy it again
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid h-max gap-3">
                      <Link
                        to={`/orders/${order._id}`}
                        className="rounded-full bg-[var(--brand)] px-4 py-2 text-center text-sm font-black text-[var(--page)] transition hover:bg-[var(--brand-dark)]"
                      >
                        Track package
                      </Link>
                      {["Pending", "Processing"].includes(order.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-500 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                        >
                          {cancellingId === order._id ? "Cancelling..." : "Cancel order"}
                        </button>
                      )}
                      <Link
                        to={`/orders/${order._id}`}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-center text-sm font-black transition hover:bg-[var(--surface-soft)]"
                      >
                        View invoice
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default MyOrders;
