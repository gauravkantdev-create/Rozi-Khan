import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Services/api";
import { getAllOrders, updateOrderStatus } from "../Services/orderService";
import useAuth from "../hooks/useAuth";
import useThemeMode from "../hooks/useThemeMode";
import { formatUsdFromInr } from "../utils/currency";

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='640' viewBox='0 0 640 640'%3E%3Crect width='640' height='640' fill='%23f1f5f9'/%3E%3Crect x='118' y='156' width='404' height='328' rx='34' fill='%23ffffff' stroke='%23cbd5e1' stroke-width='12'/%3E%3Cpath d='M178 418l98-114 74 82 54-62 74 94H178z' fill='%232563eb' opacity='.16'/%3E%3Ccircle cx='414' cy='246' r='42' fill='%2310b981' opacity='.22'/%3E%3Ctext x='320' y='536' text-anchor='middle' font-family='Arial' font-size='30' font-weight='700' fill='%23475569'%3ERoziKhan Product%3C/text%3E%3C/svg%3E";

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark } = useThemeMode();

  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    supplier: "",
    images: [],
  });
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState({ type: "", text: "" });
  const [imageUploadMode, setImageUploadMode] = useState("upload"); // "upload" or "url"
  const [uploading, setUploading] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");

  const panelClass = isDark
    ? "border-white/10 bg-[#111111] shadow-black/30"
    : "border-slate-200 bg-white shadow-slate-200/70";
  const mutedText = isDark ? "text-gray-400" : "text-slate-500";
  const inputClass = isDark
    ? "border-gray-700 bg-[#050505] text-white focus:border-blue-500"
    : "border-slate-200 bg-slate-50 text-slate-950 focus:border-blue-500";

  const overviewStats = useMemo(() => {
    const totalProducts = userProducts.length;
    const activeProducts = userProducts.filter((product) => Number(product.stock || 0) > 0).length;
    const lowStockProducts = userProducts.filter((product) => {
      const stock = Number(product.stock || 0);
      return stock > 0 && stock <= 5;
    }).length;
    const catalogValue = userProducts.reduce(
      (total, product) => total + Number(product.price || 0) * Number(product.stock || 0),
      0
    );
    const outOfStockProducts = userProducts.filter((product) => Number(product.stock || 0) <= 0).length;

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      outOfStockProducts,
      catalogValue,
    };
  }, [userProducts]);

  const lowStockItems = useMemo(
    () =>
      userProducts
        .filter((product) => Number(product.stock || 0) <= 5)
        .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)),
    [userProducts]
  );

  const fetchUserProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data } = await API.get("/products");
      if (data.success) {
        setUserProducts(data.products);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await getAllOrders({
        status: orderFilter || undefined,
        keyword: orderSearch || undefined,
      });
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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setFormMessage({ type: "", text: "" });

    try {
      const uploadPromises = files.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const { data } = await API.post("/upload", uploadData);
        if (data && data.success) return data.url;
        throw new Error(data?.message || "Upload failed");
      });

      const urls = await Promise.all(uploadPromises);
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      setFormMessage({ type: "success", text: "Local image(s) uploaded successfully." });
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.message || error.message || "Failed to upload image(s).",
      });
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

  const handleRemoveImageAt = (index) => {
    setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormMessage({ type: "", text: "" });

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        images: formData.images || [],
      };

      const { data } = await API.post("/products", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFormMessage({ type: "success", text: "Product added successfully." });
        setFormData({
          name: "",
          description: "",
          price: "",
          category: "",
          stock: "",
          supplier: "",
          images: [],
        });
        fetchUserProducts();
      }
    } catch (error) {
      setFormMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to add product.",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const { data } = await API.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        fetchUserProducts();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleStockUpdate = async (product, stock) => {
    try {
      const { data } = await API.put(`/products/${product._id}`, {
        stock: Math.max(Number(stock || 0), 0),
      });

      if (data.success) {
        setUserProducts((currentProducts) =>
          currentProducts.map((item) => (item._id === product._id ? data.product : item))
        );
        setDashboardMessage("Stock updated successfully.");
      }
    } catch (error) {
      setDashboardMessage(error.response?.data?.message || "Unable to update stock.");
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const { data } = await updateOrderStatus(orderId, {
        status,
        note: `Admin moved order to ${status}`,
      });

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === orderId ? data.order : order))
      );
      setDashboardMessage("Order status updated successfully.");
      fetchOrders();
    } catch (error) {
      setDashboardMessage(error.response?.data?.message || "Unable to update order status.");
    }
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "add", label: "Add Product" },
    { id: "manage", label: "Manage Products" },
    { id: "orders", label: "Orders" },
    { id: "inventory", label: "Inventory" },
  ];

  return (
    <div
      className={`flex min-h-screen flex-col transition-colors duration-500 md:flex-row ${
        isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"
      }`}
    >
      <aside
        className={`w-full border-b p-5 md:w-72 md:border-b-0 md:border-r md:p-7 ${
          isDark ? "border-white/10 bg-[#090a0d]" : "border-slate-200 bg-white"
        }`}
      >
        <div className="mb-8">
          <p className={`text-xs font-black uppercase tracking-[0.22em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
            Seller workspace
          </p>
          <h2 className="mt-2 text-2xl font-black">Admin Panel</h2>
        </div>

        <div className="flex gap-2 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`min-w-max rounded-xl px-4 py-3 text-left text-sm font-bold transition-all md:min-w-0 ${
                activeTab === item.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                  : isDark
                    ? "text-gray-400 hover:bg-white/10 hover:text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="mt-8 w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black text-red-400 transition hover:bg-red-600 hover:text-white md:mt-12"
        >
          Logout
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto p-5 md:p-10">
        {dashboardMessage && (
          <div className="mb-6 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-500">
            {dashboardMessage}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-sm font-black uppercase tracking-[0.22em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                  Dashboard overview
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                  Seller control center
                </h1>
                <p className={`mt-4 max-w-3xl text-lg leading-8 ${mutedText}`}>
                  Monitor your catalog health, stock readiness, and product workflow from one clean RoziKhan workspace.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("add")}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Add New Product
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Total Products", overviewStats.totalProducts, "Products available in the catalog."],
                ["Active Stock", overviewStats.activeProducts, "Items ready for customers."],
                ["Low Stock", overviewStats.lowStockProducts, "Products needing attention."],
                ["Revenue", formatUsdFromInr(orderStats?.totalRevenue || 0), "Confirmed platform order value."],
              ].map(([label, value, description]) => (
                <div key={label} className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
                  <p className={`text-sm font-bold ${mutedText}`}>{label}</p>
                  <p className="mt-3 text-3xl font-black">{loadingProducts ? "--" : value}</p>
                  <p className={`mt-3 text-sm leading-6 ${mutedText}`}>{description}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className={`rounded-2xl border p-7 shadow-xl ${panelClass}`}>
                <h2 className="text-2xl font-black">Catalog readiness</h2>
                <p className={`mt-2 text-sm leading-6 ${mutedText}`}>
                  Keep products updated with reliable images, clear supplier names, and accurate stock before scaling traffic.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    ["Product content", "Use strong titles, descriptions, and category labels."],
                    ["Stock control", "Review low-stock items before promoting them."],
                    ["Supplier trust", "Keep supplier names visible for operational clarity."],
                  ].map(([title, copy]) => (
                    <div
                      key={title}
                      className={`rounded-xl border p-4 ${
                        isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <p className="font-black">{title}</p>
                      <p className={`mt-1 text-sm ${mutedText}`}>{copy}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-7 shadow-xl ${panelClass}`}>
                <h2 className="text-2xl font-black">Quick actions</h2>
                <div className="mt-6 grid gap-3">
                  <button
                    onClick={() => setActiveTab("add")}
                    className="rounded-xl bg-blue-600 px-5 py-4 text-left font-black text-white transition hover:bg-blue-700"
                  >
                    Add a product
                  </button>
                  <button
                    onClick={() => setActiveTab("manage")}
                    className={`rounded-xl border px-5 py-4 text-left font-black transition ${
                      isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Manage catalog
                  </button>
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`rounded-xl border px-5 py-4 text-left font-black transition ${
                      isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Manage orders
                  </button>
                  <button
                    onClick={() => setActiveTab("inventory")}
                    className={`rounded-xl border px-5 py-4 text-left font-black transition ${
                      isDark
                        ? "border-white/10 bg-white/5 hover:bg-white/10"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    Review inventory
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className={`rounded-2xl border p-7 shadow-xl ${panelClass}`}>
                <h2 className="text-2xl font-black">Order analytics</h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Total orders", orderStats?.totalOrders || 0],
                    ["Pending", orderStats?.pendingOrders || 0],
                    ["Delivered", orderStats?.deliveredOrders || 0],
                    ["Cancelled", orderStats?.cancelledOrders || 0],
                  ].map(([label, value]) => (
                    <div key={label} className={`rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                      <p className={`text-sm font-bold ${mutedText}`}>{label}</p>
                      <p className="mt-2 text-2xl font-black">{loadingOrders ? "--" : value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`rounded-2xl border p-7 shadow-xl ${panelClass}`}>
                <h2 className="text-2xl font-black">Inventory warnings</h2>
                <div className="mt-5 grid gap-3">
                  {lowStockItems.slice(0, 4).length === 0 ? (
                    <p className={`rounded-xl p-4 ${isDark ? "bg-white/5 text-gray-400" : "bg-slate-50 text-slate-500"}`}>
                      No low-stock products right now.
                    </p>
                  ) : (
                    lowStockItems.slice(0, 4).map((product) => (
                      <div key={product._id} className={`flex items-center justify-between gap-3 rounded-xl p-4 ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                        <div className="min-w-0">
                          <p className="truncate font-black">{product.name}</p>
                          <p className={`text-sm ${mutedText}`}>{product.supplier || "RoziKhan Supplier"}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-black ${Number(product.stock || 0) <= 0 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {product.stock} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "add" && (
          <div>
            <h1 className="mb-8 text-4xl font-black tracking-tight">Add New Product</h1>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] xl:grid-cols-[1.2fr_0.8fr]">
              {/* Left Column: Product Form */}
              <form onSubmit={handleAddProduct} className={`flex flex-col gap-6 rounded-2xl border p-8 shadow-xl h-fit ${panelClass}`}>
                {formMessage.text && (
                  <div
                    className={`rounded-lg border p-4 ${
                      formMessage.type === "success"
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                    }`}
                  >
                    {formMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <label className={`font-medium ${mutedText}`}>Product Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleFormChange} className={`rounded-xl border p-3 outline-none transition-colors ${inputClass}`} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={`font-medium ${mutedText}`}>Category *</label>
                    <select name="category" required value={formData.category} onChange={handleFormChange} className={`rounded-xl border p-3 outline-none transition-colors ${inputClass}`}>
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Toys">Toys</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={`font-medium ${mutedText}`}>Price (USD storefront) *</label>
                    <input type="number" name="price" step="0.01" required value={formData.price} onChange={handleFormChange} className={`rounded-xl border p-3 outline-none transition-colors ${inputClass}`} />
                    <p className={`text-xs ${mutedText}`}>
                      Storefront will display this value in USD: {formatUsdFromInr(formData.price)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className={`font-medium ${mutedText}`}>Stock *</label>
                    <input type="number" name="stock" required value={formData.stock} onChange={handleFormChange} className={`rounded-xl border p-3 outline-none transition-colors ${inputClass}`} />
                  </div>
                </div>

                {/* Unified Premium Image Field Toggle */}
                <div className={`flex flex-col gap-3 rounded-2xl border p-5 ${isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-200"}`}>
                  <div className={`flex items-center justify-between border-b pb-3 ${isDark ? "border-white/10" : "border-slate-200"}`}>
                    <label className={`font-black uppercase tracking-wider text-xs ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                      Product Image
                    </label>
                    <div className={`flex gap-1 rounded-lg border p-1 ${isDark ? "border-white/10 bg-black/20" : "border-slate-200 bg-white"}`}>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("upload")}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                          imageUploadMode === "upload"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                            : isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        📷 Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setImageUploadMode("url")}
                        className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                          imageUploadMode === "url"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                            : isDark ? "text-gray-400 hover:text-white" : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        🔗 Paste Link
                      </button>
                    </div>
                  </div>

                  {imageUploadMode === "upload" ? (
                    <div className="space-y-4">
                      {formData.images && formData.images.length > 0 ? (
                        <div className={`grid grid-cols-3 gap-3 rounded-xl border border-dashed p-3 ${isDark ? "border-white/15 bg-white/5" : "border-slate-300 bg-slate-50"}`}>
                          {formData.images.map((img, idx) => (
                            <div key={`${img}-${idx}`} className="relative rounded-lg border bg-white p-2">
                              <img src={img} alt={`preview-${idx}`} className="h-24 w-24 object-contain" onError={(e)=>{e.target.src=fallbackImage}} />
                              <button type="button" onClick={() => handleRemoveImageAt(idx)} className="absolute right-1 top-1 rounded bg-red-500/80 px-2 py-1 text-xs font-bold text-white">Remove</button>
                            </div>
                          ))}
                          <div className="flex items-center justify-center">
                            <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl p-2 text-sm font-bold transition ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                              <span className="text-xs">+ Add more</span>
                              <input type="file" accept="*/*" multiple disabled={uploading} onChange={handleImageUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label className={`flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition hover:border-blue-500 ${isDark ? "border-white/10 bg-white/[0.01] hover:bg-white/[0.03]" : "border-slate-200 bg-slate-100/50 hover:bg-slate-100"}`}>
                          <div className="flex flex-col items-center gap-2 text-center p-5">
                            {uploading ? (
                              <>
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                                <p className="text-sm font-bold">Uploading file to server...</p>
                              </>
                            ) : (
                              <>
                                <svg className={`h-8 w-8 transition ${isDark ? "text-gray-400" : "text-slate-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-black">Click to select image files</span>
                                <span className={`text-xs ${mutedText}`}>Supports any browser-recognized image format (Max 5MB)</span>
                              </>
                            )}
                          </div>
                          <input type="file" accept="*/*" multiple disabled={uploading} onChange={handleImageUpload} className="hidden" />
                        </label>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          className={`flex-1 rounded-xl border p-3 outline-none transition-colors ${inputClass}`}
                        />
                        <button type="button" onClick={handleAddImageUrl} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-black text-white">Add Link</button>
                      </div>
                      {formData.images && formData.images.length > 0 && (
                        <div className={`grid grid-cols-3 gap-3 rounded-xl border border-dashed p-3 ${isDark ? "border-white/15 bg-white/5" : "border-slate-300 bg-slate-50"}`}>
                          {formData.images.map((img, idx) => (
                            <div key={`${img}-${idx}`} className="relative rounded-lg border bg-white p-2">
                              <img src={img} alt={`preview-${idx}`} className="h-24 w-24 object-contain" onError={(e)=>{e.target.src=fallbackImage}} />
                              <button type="button" onClick={() => handleRemoveImageAt(idx)} className="absolute right-1 top-1 rounded bg-red-500/80 px-2 py-1 text-xs font-bold text-white">Remove</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-medium ${mutedText}`}>Supplier</label>
                  <input type="text" name="supplier" value={formData.supplier} onChange={handleFormChange} className={`rounded-xl border p-3 outline-none transition-colors ${inputClass}`} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={`font-medium ${mutedText}`}>Description *</label>
                  <textarea name="description" required rows="4" value={formData.description} onChange={handleFormChange} className={`resize-none rounded-xl border p-3 outline-none transition-colors ${inputClass}`} />
                </div>

                <button type="submit" disabled={formLoading} className="mt-4 rounded-xl bg-blue-600 py-4 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {formLoading ? "Creating..." : "Create Product"}
                </button>
              </form>

              {/* Right Column: Real-time Interactive Product Card Preview (Desktop Only) */}
              <div className="hidden lg:flex flex-col gap-4">
                <div className="sticky top-24">
                  <div className="mb-6">
                    <p className={`text-xs font-black uppercase tracking-[0.22em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                      Real-Time Card Preview
                    </p>
                    <p className={`text-sm ${mutedText} mt-1`}>
                      See exactly how this product card will look in the trending showcase.
                    </p>
                  </div>

                  <div className="w-[340px] max-w-full">
                    {/* Simulated Product Card */}
                    <div
                      className={`group flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:border-blue-400/40 hover:shadow-2xl hover:shadow-blue-500/10 ${
                        isDark
                          ? "border-white/10 bg-[#111111] shadow-lg shadow-black/20"
                          : "border-slate-200 bg-white shadow-lg shadow-slate-200/70"
                      }`}
                    >
                      <div className={`relative aspect-[4/3] overflow-hidden ${isDark ? "bg-[#f7f7f7]" : "bg-slate-50"}`}>
                        <img
                          src={(formData.images && formData.images[0]) || fallbackImage}
                          alt={formData.name || "Product Name"}
                          className="h-full w-full object-contain p-4 transition duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.target.src = fallbackImage;
                          }}
                        />

                        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                            {formData.category || "Category"}
                          </span>
                          <span className="rounded-full bg-blue-600/90 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                            Trending
                          </span>
                        </div>

                        <div
                          className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md ${
                            Number(formData.stock || 0) > 0
                              ? "border-emerald-300/30 bg-emerald-500/20 text-emerald-100"
                              : "border-red-300/30 bg-red-500/20 text-red-100"
                          }`}
                        >
                          {Number(formData.stock || 0) > 0 ? "In stock" : "Sold out"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 p-4 sm:p-5">
                        <div>
                          <h3
                            className={`line-clamp-2 text-lg font-black leading-snug ${
                              isDark ? "text-white" : "text-slate-950"
                            }`}
                            title={formData.name || "Product Title"}
                          >
                            {formData.name || "Premium Dropshipping Item"}
                          </h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black text-emerald-500">
                              Verified supplier
                            </span>
                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-black text-blue-500">
                              Fast ship
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-400">
                            {formData.supplier || "RoziKhan Supplier"}
                          </p>
                          <p
                            className={`mt-3 line-clamp-2 text-sm leading-6 ${
                              isDark ? "text-gray-400" : "text-slate-500"
                            }`}
                            title={formData.description}
                          >
                            {formData.description || "Describe your item's features, dimensions, or dropshipping appeal."}
                          </p>
                        </div>

                        <div className={`grid gap-3 rounded-xl p-3 text-sm ${isDark ? "bg-white/5" : "bg-slate-50"}`}>
                          <div className="flex items-center justify-between gap-3">
                            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Rating</span>
                            <span className="font-black text-amber-500">
                              5.0 / 5 (0)
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Supplier cost</span>
                            <span className={`font-black ${isDark ? "text-white" : "text-slate-950"}`}>
                              {formatUsdFromInr(formData.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <span className={isDark ? "text-gray-400" : "text-slate-500"}>Est. profit</span>
                            <span className="font-black text-emerald-500">{formatUsdFromInr(Math.max(Math.round(Number(formData.price || 0) * 0.32), 120))}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className={`text-xs font-black uppercase tracking-[0.16em] ${Number(formData.stock || 0) > 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {Number(formData.stock || 0) > 0 ? `${formData.stock} available` : "Out of stock"}
                          </span>
                          <span
                            className={`rounded-lg px-4 py-2 text-sm font-bold transition group-hover:bg-blue-500 group-hover:text-white ${
                              isDark ? "bg-white text-black" : "bg-slate-950 text-white"
                            }`}
                          >
                            View
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div>
            <div className="mb-8 flex items-end justify-between gap-4">
              <h1 className="text-4xl font-black tracking-tight">Manage Products</h1>
              <button onClick={fetchUserProducts} className="text-sm font-black text-blue-500 hover:text-blue-400">
                Refresh List
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : userProducts.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center ${panelClass}`}>
                <p className={`text-lg ${mutedText}`}>No products found. Start adding some.</p>
                <button onClick={() => setActiveTab("add")} className="mt-4 rounded-lg bg-blue-600 px-6 py-2 font-bold text-white transition-colors hover:bg-blue-700">
                  Add Product
                </button>
              </div>
            ) : (
              <div className={`overflow-hidden rounded-2xl border shadow-xl ${panelClass}`}>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className={isDark ? "border-b border-white/10 bg-white/[0.04]" : "border-b border-slate-200 bg-slate-50"}>
                        <th className={`p-4 text-sm font-bold ${mutedText}`}>Product</th>
                        <th className={`p-4 text-sm font-bold ${mutedText}`}>Category</th>
                        <th className={`p-4 text-sm font-bold ${mutedText}`}>Price</th>
                        <th className={`p-4 text-sm font-bold ${mutedText}`}>Stock</th>
                        <th className={`p-4 text-right text-sm font-bold ${mutedText}`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userProducts.map((product) => (
                        <tr key={product._id} className={isDark ? "border-b border-white/5 hover:bg-white/[0.03]" : "border-b border-slate-100 hover:bg-slate-50"}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded bg-white">
                                {product.images && product.images[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs text-gray-400">No img</span>
                                )}
                              </div>
                              <span className="block max-w-[200px] truncate font-semibold" title={product.name}>
                                {product.name}
                              </span>
                            </div>
                          </td>
                          <td className={`p-4 ${mutedText}`}>{product.category}</td>
                          <td className={`p-4 font-medium ${mutedText}`}>${product.price?.toFixed(2)}</td>
                          <td className={`p-4 ${mutedText}`}>
                            <span className={`rounded-full px-3 py-1 text-xs font-black ${
                              Number(product.stock || 0) <= 0
                                ? "bg-red-500/10 text-red-500"
                                : Number(product.stock || 0) <= 5
                                  ? "bg-amber-500/10 text-amber-500"
                                  : "bg-emerald-500/10 text-emerald-500"
                            }`}>
                              {product.stock} in stock
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteProduct(product._id)} className="rounded px-3 py-1 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300">
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className={`text-sm font-black uppercase tracking-[0.22em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                  Commerce control
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight">Orders Management</h1>
                <p className={`mt-3 max-w-2xl ${mutedText}`}>
                  Search, filter, inspect customer shipping, and move orders through the supplier workflow.
                </p>
              </div>
              <button onClick={fetchOrders} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Refresh orders
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Revenue", formatUsdFromInr(orderStats?.totalRevenue || 0)],
                ["Pending", orderStats?.pendingOrders || 0],
                ["Delivered", orderStats?.deliveredOrders || 0],
                ["Cancelled", orderStats?.cancelledOrders || 0],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
                  <p className={`text-sm font-bold ${mutedText}`}>{label}</p>
                  <p className="mt-3 text-3xl font-black">{loadingOrders ? "--" : value}</p>
                </div>
              ))}
            </div>

            <div className={`grid gap-3 rounded-2xl border p-4 shadow-xl md:grid-cols-[1fr_220px] ${panelClass}`}>
              <input
                value={orderSearch}
                onChange={(event) => setOrderSearch(event.target.value)}
                placeholder="Search by order ID, customer, email, city, status..."
                className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none ${inputClass}`}
              />
              <select
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-bold outline-none ${inputClass}`}
              >
                <option value="">All statuses</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className={`overflow-hidden rounded-2xl border shadow-xl ${panelClass}`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className={isDark ? "border-b border-white/10 bg-white/[0.04]" : "border-b border-slate-200 bg-slate-50"}>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Order</th>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Customer</th>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Shipping</th>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Products</th>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Total</th>
                      <th className={`p-4 text-sm font-bold ${mutedText}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center font-black">Loading orders...</td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={`p-8 text-center ${mutedText}`}>No orders match this view.</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order._id} className={isDark ? "border-b border-white/5 hover:bg-white/[0.03]" : "border-b border-slate-100 hover:bg-slate-50"}>
                          <td className="p-4">
                            <p className="font-black">#{order._id.slice(-8).toUpperCase()}</p>
                            <p className={`mt-1 text-xs ${mutedText}`}>{new Date(order.createdAt).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4">
                            <p className="font-black">{order.user?.name || order.shippingAddress?.fullName}</p>
                            <p className={`mt-1 text-xs ${mutedText}`}>{order.user?.email || order.shippingAddress?.email}</p>
                          </td>
                          <td className={`p-4 text-sm ${mutedText}`}>
                            {order.shippingAddress?.city}, {order.shippingAddress?.state}
                            <p>{order.shippingAddress?.phone}</p>
                          </td>
                          <td className="p-4">
                            <div className="max-w-xs space-y-1">
                              {order.orderItems.slice(0, 2).map((item) => (
                                <p key={`${order._id}-${item.name}`} className="truncate text-sm font-bold">
                                  {item.quantity}x {item.name}
                                </p>
                              ))}
                              <p className={`text-xs ${mutedText}`}>{order.orderItems.length} supplier item{order.orderItems.length === 1 ? "" : "s"}</p>
                            </div>
                          </td>
                          <td className="p-4 font-black text-blue-500">{formatUsdFromInr(order.totalPrice)}</td>
                          <td className="p-4">
                            <select
                              value={order.status}
                              onChange={(event) => handleOrderStatusUpdate(order._id, event.target.value)}
                              className={`rounded-xl border px-3 py-2 text-sm font-black outline-none ${inputClass}`}
                            >
                              {orderStatuses.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className={`text-sm font-black uppercase tracking-[0.22em] ${isDark ? "text-blue-300" : "text-blue-600"}`}>
                  Stock command
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight">Inventory Management</h1>
                <p className={`mt-3 max-w-2xl ${mutedText}`}>
                  Watch low stock, edit inventory, and keep supplier products ready for checkout.
                </p>
              </div>
              <button onClick={fetchUserProducts} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700">
                Refresh inventory
              </button>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["Inventory Value", formatUsdFromInr(overviewStats.catalogValue)],
                ["Active Stock", overviewStats.activeProducts],
                ["Low Stock", overviewStats.lowStockProducts],
                ["Out of Stock", overviewStats.outOfStockProducts],
              ].map(([label, value]) => (
                <div key={label} className={`rounded-2xl border p-6 shadow-xl ${panelClass}`}>
                  <p className={`text-sm font-bold ${mutedText}`}>{label}</p>
                  <p className="mt-3 text-3xl font-black">{loadingProducts ? "--" : value}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4">
              {lowStockItems.length === 0 ? (
                <div className={`rounded-2xl border p-8 text-center ${panelClass}`}>
                  <p className={`text-lg font-bold ${mutedText}`}>No low-stock products found.</p>
                </div>
              ) : (
                lowStockItems.map((product) => (
                  <article key={product._id} className={`grid gap-4 rounded-2xl border p-5 shadow-xl lg:grid-cols-[1fr_auto] ${panelClass}`}>
                    <div className="flex min-w-0 gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-xs text-slate-400">No img</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-black">{product.name}</h2>
                        <p className={`mt-1 text-sm ${mutedText}`}>{product.supplier || "RoziKhan Supplier"} / {product.category}</p>
                        <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black ${Number(product.stock || 0) <= 0 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                          {Number(product.stock || 0) <= 0 ? "Out of stock" : `${product.stock} units left`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        defaultValue={product.stock}
                        onBlur={(event) => handleStockUpdate(product, event.target.value)}
                        className={`w-28 rounded-xl border px-4 py-3 text-sm font-black outline-none ${inputClass}`}
                        aria-label={`Update stock for ${product.name}`}
                      />
                      <span className={`text-xs font-bold ${mutedText}`}>Blur field to save</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
