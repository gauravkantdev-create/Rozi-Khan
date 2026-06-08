import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Services/api";
import { getAllOrders, updateOrderStatus } from "../Services/orderService";
import useAuth from "../hooks/useAuth";
import { formatUsdFromInr } from "../utils/currency";
import ProductMedia from "../Components/products/ProductMedia";
import { GhostButton, PageShell, PrimaryButton, SectionHeading, StatCard, inputClass, surfaceClass } from "../Components/layout/PageShell";

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({ name: "", description: "", price: "", category: "", stock: "", supplier: "", images: [] });
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [imageUploadMode, setImageUploadMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");

  const overviewStats = useMemo(() => {
    const totalProducts = userProducts.length;
    const activeProducts = userProducts.filter((product) => Number(product.stock || 0) > 0).length;
    const lowStockProducts = userProducts.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const catalogValue = userProducts.reduce((total, product) => total + Number(product.price || 0) * Number(product.stock || 0), 0);
    const outOfStockProducts = userProducts.filter((product) => Number(product.stock || 0) <= 0).length;
    return { totalProducts, activeProducts, lowStockProducts, outOfStockProducts, catalogValue };
  }, [userProducts]);

  const lowStockItems = useMemo(
    () => userProducts.filter((product) => Number(product.stock || 0) <= 5).sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)),
    [userProducts]
  );

  const fetchUserProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data } = await API.get("/products");
      if (data.success) setUserProducts(data.products);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await getAllOrders({ status: orderFilter || undefined, keyword: orderSearch || undefined });
      setOrders(data.orders || []);
      setOrderStats(data.stats || null);
    } catch (error) {
      setDashboardMessage(error.response?.data?.message || "Unable to load admin orders.");
    } finally {
      setLoadingOrders(false);
    }
  }, [orderFilter, orderSearch]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (activeTab === "overview" || activeTab === "manage" || activeTab === "inventory") {
      const timer = setTimeout(fetchUserProducts, 0);
      return () => clearTimeout(timer);
    }
  }, [token, navigate, activeTab, fetchUserProducts]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "overview" || activeTab === "orders") {
      const timer = setTimeout(fetchOrders, 0);
      return () => clearTimeout(timer);
    }
  }, [token, activeTab, fetchOrders]);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setFormMessage({ type: "", text: "" });
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const { data } = await API.post("/upload", uploadData);
        if (data && data.success) return data.url;
        throw new Error(data?.message || "Upload failed");
      }));
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      setFormMessage({ type: "success", text: "Local image(s) uploaded successfully." });
    } catch (error) {
      setFormMessage({ type: "error", text: error.response?.data?.message || error.message || "Failed to upload image(s)." });
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = (imageUrlInput || "").trim();
    if (!url) return;
    setFormData((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
    setImageUrlInput("");
    setFormMessage({ type: "success", text: "Link added to images." });
  };

  const handleRemoveImageAt = (index) => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage({ type: "", text: "" });
    try {
      const payload = { ...formData, price: Number(formData.price), stock: Number(formData.stock), images: formData.images || [] };
      const { data } = await API.post("/products", payload, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) {
        setFormMessage({ type: "success", text: "Product added successfully." });
        setFormData({ name: "", description: "", price: "", category: "", stock: "", supplier: "", images: [] });
        fetchUserProducts();
      }
    } catch (error) {
      setFormMessage({ type: "error", text: error.response?.data?.message || "Failed to add product." });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { data } = await API.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (data.success) fetchUserProducts();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleStockUpdate = async (product, stock) => {
    try {
      const { data } = await API.put(`/products/${product._id}`, { stock: Math.max(Number(stock || 0), 0) });
      if (data.success) {
        setUserProducts((currentProducts) => currentProducts.map((item) => (item._id === product._id ? data.product : item)));
        setDashboardMessage("Stock updated successfully.");
      }
    } catch (error) {
      setDashboardMessage(error.response?.data?.message || "Unable to update stock.");
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const { data } = await updateOrderStatus(orderId, { status, note: `Admin moved order to ${status}` });
      setOrders((currentOrders) => currentOrders.map((order) => (order._id === orderId ? data.order : order)));
      setDashboardMessage("Order status updated successfully.");
      fetchOrders();
    } catch (error) {
      setDashboardMessage(error.response?.data?.message || "Unable to update order status.");
    }
  };

  const navItems = [
    ["overview", "Overview"],
    ["add", "Add Product"],
    ["manage", "Manage"],
    ["orders", "Orders"],
    ["inventory", "Inventory"],
  ];

  return (
    <PageShell>
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="border-b border-[#d8c8ba] bg-[#fffdf8]/80 p-5 md:w-72 md:border-b-0 md:border-r md:p-7">
          <p className="font-raleway text-xs font-bold uppercase tracking-[0.24em] text-[#C5A992]">Seller workspace</p>
          <h2 className="mt-2 font-playfair text-3xl font-semibold">Admin Panel</h2>
          <div className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
            {navItems.map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`min-w-max border px-4 py-3 text-left font-raleway text-sm font-bold uppercase tracking-[0.14em] transition md:min-w-0 ${activeTab === id ? "border-[#2F2F2F] bg-[#2F2F2F] text-white" : "border-[#d8c8ba] text-[#757575] hover:border-[#C5A992] hover:text-[#2F2F2F]"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="mt-8 w-full border border-red-600/25 bg-red-500/10 px-4 py-3 font-raleway text-sm font-bold uppercase tracking-[0.16em] text-red-700 transition hover:bg-red-600 hover:text-white md:mt-12">
            Logout
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto p-5 md:p-10">
          {dashboardMessage && <div className="mb-6 border border-[#C5A992]/40 bg-[#C5A992]/12 p-4 font-raleway text-sm font-bold text-[#757575]">{dashboardMessage}</div>}

          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading eyebrow="Dashboard overview" title="Seller control center" copy="Monitor catalog health, order movement, and stock readiness from one editorial admin workspace." />
                <PrimaryButton onClick={() => setActiveTab("add")}>Add product</PrimaryButton>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Products" value={loadingProducts ? "--" : overviewStats.totalProducts} detail="Catalog listings" />
                <StatCard label="Active stock" value={loadingProducts ? "--" : overviewStats.activeProducts} detail="Ready products" />
                <StatCard label="Low stock" value={loadingProducts ? "--" : overviewStats.lowStockProducts} detail="Needs attention" />
                <StatCard label="Revenue" value={loadingOrders ? "--" : formatUsdFromInr(orderStats?.totalRevenue || 0)} detail="Confirmed order value" />
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <Panel title="Inventory warnings">
                  {lowStockItems.slice(0, 5).length === 0 ? <EmptyText>No low-stock products right now.</EmptyText> : lowStockItems.slice(0, 5).map((product) => <ProductLine key={product._id} product={product} trailing={`${product.stock} left`} />)}
                </Panel>
                <Panel title="Order analytics">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <StatCard label="Total orders" value={loadingOrders ? "--" : orderStats?.totalOrders || 0} />
                    <StatCard label="Pending" value={loadingOrders ? "--" : orderStats?.pendingOrders || 0} />
                    <StatCard label="Delivered" value={loadingOrders ? "--" : orderStats?.deliveredOrders || 0} />
                    <StatCard label="Cancelled" value={loadingOrders ? "--" : orderStats?.cancelledOrders || 0} />
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === "add" && (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <form onSubmit={handleAddProduct} className={`${surfaceClass} p-6`}>
                <SectionHeading eyebrow="New listing" title="Add product" />
                {formMessage.text && <p className={`mt-5 border p-3 font-raleway text-sm font-bold ${formMessage.type === "error" ? "border-red-500/30 bg-red-500/10 text-red-700" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"}`}>{formMessage.text}</p>}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Product name" className={inputClass} required />
                  <input name="category" value={formData.category} onChange={handleFormChange} placeholder="Category" className={inputClass} required />
                  <input name="price" type="number" value={formData.price} onChange={handleFormChange} placeholder="Price" className={inputClass} required />
                  <input name="stock" type="number" value={formData.stock} onChange={handleFormChange} placeholder="Stock" className={inputClass} required />
                  <input name="supplier" value={formData.supplier} onChange={handleFormChange} placeholder="Supplier" className={`${inputClass} sm:col-span-2`} />
                  <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Description" rows="5" className={`${inputClass} resize-none sm:col-span-2`} required />
                </div>

                <div className="mt-6 border border-[#d8c8ba] bg-[#F3F2EC]/70 p-4">
                  <div className="flex gap-2">
                    <GhostButton type="button" onClick={() => setImageUploadMode("upload")} className={imageUploadMode === "upload" ? "bg-[#C5A992]/20" : ""}>Upload</GhostButton>
                    <GhostButton type="button" onClick={() => setImageUploadMode("url")} className={imageUploadMode === "url" ? "bg-[#C5A992]/20" : ""}>URL</GhostButton>
                  </div>
                  {imageUploadMode === "upload" ? (
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="mt-4 block w-full font-raleway text-sm" disabled={uploading} />
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <input value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="Image URL" className={inputClass} />
                      <GhostButton type="button" onClick={handleAddImageUrl}>Add</GhostButton>
                    </div>
                  )}
                  {formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {formData.images.map((image, index) => (
                        <button key={`${image}-${index}`} type="button" onClick={() => handleRemoveImageAt(index)} className="aspect-square border border-[#d8c8ba] bg-white p-1">
                          <img src={image} alt="" className="h-full w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <PrimaryButton type="submit" disabled={formLoading || uploading} className="mt-6 w-full">{formLoading ? "Saving" : "Add product"}</PrimaryButton>
              </form>

              <div className={`${surfaceClass} p-6`}>
                <SectionHeading eyebrow="Preview" title="Storefront card" />
                <div className="group mt-6 border border-[#d8c8ba] bg-[#fffdf8]">
                  <ProductMedia src={formData.images[0]} alt={formData.name || "Product preview"} className="aspect-square" />
                  <div className="p-5">
                    <p className="font-raleway text-xs font-bold uppercase tracking-[0.2em] text-[#C5A992]">{formData.category || "Category"}</p>
                    <h3 className="mt-2 font-playfair text-3xl font-semibold">{formData.name || "Premium Dropshipping Item"}</h3>
                    <p className="mt-3 font-raleway text-sm leading-7 text-[#757575]">{formData.description || "Your product description will appear here."}</p>
                    <p className="mt-5 font-playfair text-3xl font-semibold">{formatUsdFromInr(formData.price || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "manage" && (
            <Panel title="Manage products" action={<GhostButton onClick={fetchUserProducts}>Refresh</GhostButton>}>
              {loadingProducts ? <EmptyText>Loading products...</EmptyText> : userProducts.length === 0 ? <EmptyText>No products found.</EmptyText> : (
                <div className="grid gap-3">
                  {userProducts.map((product) => (
                    <div key={product._id} className="grid gap-4 border border-[#d8c8ba] bg-[#F3F2EC]/60 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <ProductLine product={product} trailing={formatUsdFromInr(product.price || 0)} />
                      <button onClick={() => handleDeleteProduct(product._id)} className="font-raleway text-xs font-bold uppercase tracking-[0.16em] text-red-700">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {activeTab === "orders" && (
            <Panel title="Orders management" action={<GhostButton onClick={fetchOrders}>Refresh</GhostButton>}>
              <div className="mb-5 grid gap-3 md:grid-cols-[1fr_220px]">
                <input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search by order ID, customer, email, city, status..." className={inputClass} />
                <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className={inputClass}>
                  <option value="">All statuses</option>
                  {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left font-raleway text-sm">
                  <thead><tr className="border-b border-[#d8c8ba] text-[#757575]"><th className="p-3">Order</th><th className="p-3">Customer</th><th className="p-3">Shipping</th><th className="p-3">Products</th><th className="p-3">Total</th><th className="p-3">Status</th></tr></thead>
                  <tbody>
                    {loadingOrders ? <tr><td colSpan="6" className="p-6 text-center">Loading orders...</td></tr> : orders.length === 0 ? <tr><td colSpan="6" className="p-6 text-center text-[#757575]">No orders match this view.</td></tr> : orders.map((order) => (
                      <tr key={order._id} className="border-b border-[#d8c8ba]/70">
                        <td className="p-3 font-bold">#{order._id.slice(-8).toUpperCase()}<p className="text-xs text-[#757575]">{new Date(order.createdAt).toLocaleDateString()}</p></td>
                        <td className="p-3">{order.user?.name || order.shippingAddress?.fullName}<p className="text-xs text-[#757575]">{order.user?.email || order.shippingAddress?.email}</p></td>
                        <td className="p-3 text-[#757575]">{order.shippingAddress?.city}, {order.shippingAddress?.state}<p>{order.shippingAddress?.phone}</p></td>
                        <td className="p-3">{order.orderItems.slice(0, 2).map((item) => <p key={`${order._id}-${item.name}`} className="truncate">{item.quantity}x {item.name}</p>)}</td>
                        <td className="p-3 font-bold">{formatUsdFromInr(order.totalPrice)}</td>
                        <td className="p-3"><select value={order.status} onChange={(event) => handleOrderStatusUpdate(order._id, event.target.value)} className={inputClass}>{orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {activeTab === "inventory" && (
            <Panel title="Inventory management" action={<GhostButton onClick={fetchUserProducts}>Refresh</GhostButton>}>
              <div className="mb-5 grid gap-5 md:grid-cols-4">
                <StatCard label="Value" value={formatUsdFromInr(overviewStats.catalogValue)} />
                <StatCard label="Active" value={overviewStats.activeProducts} />
                <StatCard label="Low" value={overviewStats.lowStockProducts} />
                <StatCard label="Out" value={overviewStats.outOfStockProducts} />
              </div>
              {lowStockItems.length === 0 ? <EmptyText>No low-stock products found.</EmptyText> : (
                <div className="grid gap-3">
                  {lowStockItems.map((product) => (
                    <div key={product._id} className="grid gap-4 border border-[#d8c8ba] bg-[#F3F2EC]/60 p-4 md:grid-cols-[1fr_auto] md:items-center">
                      <ProductLine product={product} trailing={`${product.stock} left`} />
                      <input type="number" min="0" defaultValue={product.stock} onBlur={(event) => handleStockUpdate(product, event.target.value)} className={`${inputClass} w-32`} aria-label={`Update stock for ${product.name}`} />
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className={`${surfaceClass} p-6`}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-playfair text-3xl font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ProductLine({ product, trailing }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden border border-[#d8c8ba] bg-white p-1">
        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-contain" /> : <div className="grid h-full place-items-center text-xs text-[#757575]">No img</div>}
      </div>
      <div className="min-w-0">
        <p className="truncate font-raleway font-bold">{product.name}</p>
        <p className="truncate font-raleway text-sm text-[#757575]">{product.supplier || "RoziKhan Supplier"} / {product.category}</p>
      </div>
      {trailing && <span className="ml-auto shrink-0 font-raleway text-sm font-bold text-[#C5A992]">{trailing}</span>}
    </div>
  );
}

function EmptyText({ children }) {
  return <p className="border border-[#d8c8ba] bg-[#F3F2EC]/70 p-5 text-center font-raleway text-[#757575]">{children}</p>;
}

export default Dashboard;
