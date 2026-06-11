import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Services/api";
import { getAllOrders, updateOrderStatus } from "../Services/orderService";
import { getCategories, getSuppliers, createCategory, createSupplier } from "../Services/productService";
import useAuth from "../hooks/useAuth";
import { formatUsdFromInr } from "../utils/currency";
import ProductMedia from "../Components/products/ProductMedia";
import { GhostButton, PageShell, PrimaryButton, SectionHeading, StatCard, inputClass, surfaceClass } from "../Components/layout/PageShell";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const orderStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

// Custom Styled Toast Components matching Figma Design
const CustomSuccessToast = ({ message }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-6 text-white min-w-[380px]">
    {/* Decorative Shapes */}
    <div className="absolute top-0 left-0 w-20 h-20 -ml-8 -mt-8 rounded-full bg-emerald-800/40" />
    <div className="absolute bottom-0 left-8 w-14 h-14 -mb-7 rounded-full bg-emerald-800/30" />
    <div className="absolute top-6 left-24 w-5 h-5 rounded-full bg-emerald-800/20" />

    <div className="flex items-start gap-5 relative z-10">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-emerald-600 text-2xl font-bold flex-shrink-0 shadow-lg">
        ✓
      </div>
      <div className="flex-1">
        <p className="font-playfair text-2xl font-bold text-white mb-1">Well done!</p>
        <p className="font-raleway text-sm opacity-90">{message}</p>
      </div>
    </div>
  </div>
);

const CustomErrorToast = ({ message }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-rose-500 to-red-500 rounded-3xl p-6 text-white min-w-[380px]">
    {/* Decorative Shapes */}
    <div className="absolute top-0 left-0 w-20 h-20 -ml-8 -mt-8 rounded-full bg-rose-900/40" />
    <div className="absolute bottom-0 left-8 w-14 h-14 -mb-7 rounded-full bg-rose-900/30" />
    <div className="absolute top-6 left-24 w-5 h-5 rounded-full bg-rose-900/20" />

    <div className="flex items-start gap-5 relative z-10">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-rose-600 text-2xl font-bold flex-shrink-0 shadow-lg">
        ✕
      </div>
      <div className="flex-1">
        <p className="font-playfair text-2xl font-bold text-white mb-1">Oh snap!</p>
        <p className="font-raleway text-sm opacity-90">{message}</p>
      </div>
    </div>
  </div>
);

const CustomWarningToast = ({ message }) => (
  <div className="relative overflow-hidden bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white min-w-[380px]">
    {/* Decorative Shapes */}
    <div className="absolute top-0 left-0 w-20 h-20 -ml-8 -mt-8 rounded-full bg-amber-800/40" />
    <div className="absolute bottom-0 left-8 w-14 h-14 -mb-7 rounded-full bg-amber-800/30" />
    <div className="absolute top-6 left-24 w-5 h-5 rounded-full bg-amber-800/20" />

    <div className="flex items-start gap-5 relative z-10">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white text-amber-500 text-2xl font-bold flex-shrink-0 shadow-lg">
        ⚠
      </div>
      <div className="flex-1">
        <p className="font-playfair text-2xl font-bold text-white mb-1">Warning!</p>
        <p className="font-raleway text-sm opacity-90">{message}</p>
      </div>
    </div>
  </div>
);

function Dashboard() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [formData, setFormData] = useState({ name: "", description: "", price: "", category: "", stock: "", supplier: "", images: [] });
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "" });
  const [supplierFormData, setSupplierFormData] = useState({ company_name: "", tax_id: "", warehouse_address: "" });
  const [modalLoading, setModalLoading] = useState(false);

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

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const { data } = await getCategories();
      if (data.success) {
        // If no categories yet, provide some default ones
        const defaultCategories = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"];
        setCategories(data.categories.length > 0 ? data.categories : defaultCategories);
      }
    } catch (error) {
      console.error(error);
      // Set default categories on error
      setCategories(["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports", "Books"]);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      const { data } = await getSuppliers();
      if (data.success) setSuppliers(data.suppliers);
    } catch (error) {
      console.error(error);
      // If no suppliers, just keep an empty array
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return;

    setModalLoading(true);
    try {
      const { data } = await createCategory(categoryFormData);
      if (data.success) {
        setCategories(data.categories);
        setFormData((prev) => ({ ...prev, category: categoryFormData.name }));
        setShowCategoryModal(false);
        setCategoryFormData({ name: "" });
        toast(<CustomSuccessToast message="Category added successfully." />);
      }
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Failed to add category."} />);
    } finally {
      setModalLoading(false);
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!supplierFormData.company_name.trim()) return;

    setModalLoading(true);
    try {
      const { data } = await createSupplier(supplierFormData);
      if (data.success) {
        setSuppliers(data.suppliers);
        setFormData((prev) => ({ ...prev, supplier: supplierFormData.company_name }));
        setShowSupplierModal(false);
        setSupplierFormData({ company_name: "", tax_id: "", warehouse_address: "" });
        toast(<CustomSuccessToast message="Supplier added successfully." />);
      }
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Failed to add supplier."} />);
    } finally {
      setModalLoading(false);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data } = await getAllOrders({ status: orderFilter || undefined, keyword: orderSearch || undefined });
      setOrders(data.orders || []);
      setOrderStats(data.stats || null);
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Unable to load admin orders."} />);
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
    if (activeTab === "add") {
      fetchCategories();
      fetchSuppliers();
    }
  }, [token, navigate, activeTab, fetchUserProducts, fetchCategories, fetchSuppliers]);

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
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const uploadData = new FormData();
        uploadData.append("image", file);
        const { data } = await API.post("/upload", uploadData);
        if (data && data.success) return data.url;
        throw new Error(data?.message || "Upload failed");
      }));
      setFormData((prev) => ({ ...prev, images: [...(prev.images || []), ...urls] }));
      toast(<CustomSuccessToast message="Local image(s) uploaded successfully." />);
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || error.message || "Failed to upload image(s)."} />);
    } finally {
      setUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    const url = (imageUrlInput || "").trim();
    if (!url) return;
    setFormData((prev) => ({ ...prev, images: [...(prev.images || []), url] }));
    setImageUrlInput("");
    toast(<CustomSuccessToast message="Link added to images." />);
  };

  const handleRemoveImageAt = (index) => setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const payload = { ...formData, price: Number(formData.price), stock: Number(formData.stock), images: formData.images || [] };
      const { data } = await API.post("/products", payload);
      if (data.success) {
        toast(<CustomSuccessToast message="Product added successfully." />);
        setFormData({ name: "", description: "", price: "", category: "", stock: "", supplier: "", images: [] });
        fetchUserProducts();
      }
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Failed to add product."} />);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      const { data } = await API.delete(`/products/${id}`);
      if (data.success) {
        fetchUserProducts();
        toast(<CustomSuccessToast message="Product deleted successfully." />);
      }
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Failed to delete product."} />);
    }
  };

  const handleStockUpdate = async (product, stock) => {
    try {
      const { data } = await API.put(`/products/${product._id}`, { stock: Math.max(Number(stock || 0), 0) });
      if (data.success) {
        setUserProducts((currentProducts) => currentProducts.map((item) => (item._id === product._id ? data.product : item)));
        toast(<CustomSuccessToast message="Stock updated successfully." />);
      }
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Unable to update stock."} />);
    }
  };

  const handleOrderStatusUpdate = async (orderId, status) => {
    try {
      const { data } = await updateOrderStatus(orderId, { status, note: `Admin moved order to ${status}` });
      setOrders((currentOrders) => currentOrders.map((order) => (order._id === orderId ? data.order : order)));
      toast(<CustomSuccessToast message="Order status updated successfully." />);
      fetchOrders();
    } catch (error) {
      toast(<CustomErrorToast message={error.response?.data?.message || "Unable to update order status."} />);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "add", label: "Add Product", icon: "➕" },
    { id: "manage", label: "Manage", icon: "📦" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "inventory", label: "Inventory", icon: "📋" },
  ];

  return (
    <PageShell>
      <div className="flex min-h-screen flex-col md:flex-row bg-[var(--page)]">
        {/* Enhanced Sidebar */}
        <aside className="border-b border-[var(--border)] bg-[var(--surface)] p-6 md:w-80 md:border-b-0 md:border-r md:p-8 shadow-[0_0_40px_rgba(44,42,41,0.04)]">
          <div className="mb-1">
            <p className="font-raleway text-xs font-extrabold uppercase tracking-[0.28em] text-[var(--brand)]">Seller workspace</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dark)] flex items-center justify-center text-white font-playfair text-xl font-semibold">
                R
              </div>
              <div>
                <h2 className="font-playfair text-2xl font-semibold text-[var(--text)]">Admin Panel</h2>
                <p className="text-xs text-[var(--muted)] font-raleway mt-0.5">Welcome back!</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left font-raleway text-sm font-semibold transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white shadow-lg shadow-[var(--accent-light)]/40 transform -translate-y-0.5"
                    : "text-[var(--muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text)] hover:transform hover:-translate-y-0.5 border border-transparent hover:border-[var(--border)]"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="tracking-wide">{item.label}</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={handleLogout}
            className="mt-12 w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text)] font-raleway text-sm font-semibold hover:bg-[var(--brand)] hover:text-white hover:border-[var(--brand)] transition-all duration-200"
          >
            <span>🚪</span>
            <span className="tracking-wide">Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10">

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <SectionHeading eyebrow="Dashboard overview" title="Seller control center" copy="Monitor catalog health, order movement, and stock readiness from one editorial admin workspace." />
                <PrimaryButton onClick={() => setActiveTab("add")} className="shadow-lg shadow-[var(--accent-light)]/30 hover:shadow-xl">
                  Add product
                </PrimaryButton>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <EnhancedStatCard label="Products" value={loadingProducts ? "--" : overviewStats.totalProducts} detail="Catalog listings" color="blue" />
                <EnhancedStatCard label="Active stock" value={loadingProducts ? "--" : overviewStats.activeProducts} detail="Ready products" color="green" />
                <EnhancedStatCard label="Low stock" value={loadingProducts ? "--" : overviewStats.lowStockProducts} detail="Needs attention" color="orange" />
                <EnhancedStatCard label="Revenue" value={loadingOrders ? "--" : formatUsdFromInr(orderStats?.totalRevenue || 0)} detail="Confirmed order value" color="purple" />
              </div>
              
              <div className="grid gap-6 xl:grid-cols-2">
                <EnhancedPanel title="Inventory warnings">
                  {lowStockItems.slice(0, 5).length === 0 ? (
                    <EmptyState icon="📦" text="No low-stock products right now." />
                  ) : (
                    <div className="space-y-3">
                      {lowStockItems.slice(0, 5).map((product) => (
                        <EnhancedProductLine key={product._id} product={product} trailing={`${product.stock} left`} />
                      ))}
                    </div>
                  )}
                </EnhancedPanel>
                
                <EnhancedPanel title="Order analytics">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MiniStatCard label="Total orders" value={loadingOrders ? "--" : orderStats?.totalOrders || 0} color="blue" />
                    <MiniStatCard label="Pending" value={loadingOrders ? "--" : orderStats?.pendingOrders || 0} color="orange" />
                    <MiniStatCard label="Delivered" value={loadingOrders ? "--" : orderStats?.deliveredOrders || 0} color="green" />
                    <MiniStatCard label="Cancelled" value={loadingOrders ? "--" : orderStats?.cancelledOrders || 0} color="red" />
                  </div>
                </EnhancedPanel>
              </div>
            </div>
          )}

          {/* Add Product Tab */}
          {activeTab === "add" && (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <EnhancedPanel title="Add product">
                <p className="text-sm text-[var(--muted)] mb-6 -mt-3">Create a new product listing for your store</p>
                
                <form onSubmit={handleAddProduct} className="space-y-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Product name</label>
                      <input name="name" value={formData.name} onChange={handleFormChange} placeholder="Enter product name" className={inputClass} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Category</label>
                      <div className="flex gap-2">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          className={inputClass}
                          required
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-semibold hover:bg-[var(--brand-dark)] transition-all duration-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Price</label>
                      <input name="price" type="number" value={formData.price} onChange={handleFormChange} placeholder="0.00" className={inputClass} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Stock</label>
                      <input name="stock" type="number" value={formData.stock} onChange={handleFormChange} placeholder="0" className={inputClass} required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Supplier</label>
                      <div className="flex gap-2">
                        {suppliers.length > 0 ? (
                          <select
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleFormChange}
                            className={inputClass}
                          >
                            <option value="">Select supplier</option>
                            {suppliers.map((supplier) => (
                              <option key={supplier.id} value={supplier.company_name}>{supplier.company_name}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            name="supplier"
                            value={formData.supplier}
                            onChange={handleFormChange}
                            placeholder="Supplier name"
                            className={inputClass}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSupplierModal(true)}
                          className="flex items-center justify-center px-4 py-2 rounded-lg bg-[var(--brand)] text-white font-semibold hover:bg-[var(--brand-dark)] transition-all duration-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-sm font-semibold text-[var(--text)]">Description</label>
                      <textarea name="description" value={formData.description} onChange={handleFormChange} placeholder="Product description..." rows="5" className={`${inputClass} resize-none`} required />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <label className="text-sm font-semibold text-[var(--text)]">Product images</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setImageUploadMode("upload")} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${imageUploadMode === "upload" ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--text)]"}`}>
                          Upload
                        </button>
                        <button type="button" onClick={() => setImageUploadMode("url")} className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${imageUploadMode === "url" ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:text-[var(--text)]"}`}>
                          URL
                        </button>
                      </div>
                    </div>
                    {imageUploadMode === "upload" ? (
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="block w-full text-sm text-[var(--muted)] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand)] file:text-white hover:file:bg-[var(--brand-dark)] cursor-pointer" disabled={uploading} />
                    ) : (
                      <div className="flex gap-3">
                        <input value={imageUrlInput} onChange={(e) => setImageUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" className={inputClass} />
                        <GhostButton type="button" onClick={handleAddImageUrl} className="shrink-0">Add</GhostButton>
                      </div>
                    )}
                    {formData.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-5 gap-3">
                        {formData.images.map((image, index) => (
                          <button key={`${image}-${index}`} type="button" onClick={() => handleRemoveImageAt(index)} className="aspect-square rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-md transition-all group">
                            <img src={image} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <PrimaryButton type="submit" disabled={formLoading || uploading} className="w-full py-4 shadow-lg shadow-[var(--accent-light)]/30">
                    {formLoading ? "Saving..." : "Add product"}
                  </PrimaryButton>
                </form>
              </EnhancedPanel>

              <EnhancedPanel title="Preview">
                <p className="text-sm text-[var(--muted)] mb-6 -mt-3">How your product will appear</p>
                <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <ProductMedia src={formData.images[0]} alt={formData.name || "Product preview"} className="aspect-square" />
                  <div className="p-6">
                    <p className="font-raleway text-xs font-extrabold uppercase tracking-[0.25em] text-[var(--brand)]">{formData.category || "Category"}</p>
                    <h3 className="mt-2 font-playfair text-2xl font-semibold text-[var(--text)]">{formData.name || "Premium Dropshipping Item"}</h3>
                    <p className="mt-3 font-raleway text-sm leading-relaxed text-[var(--muted)]">{formData.description || "Your product description will appear here."}</p>
                    <div className="mt-5 flex items-center justify-between">
                      <p className="font-playfair text-3xl font-semibold text-[var(--text)]">{formatUsdFromInr(formData.price || 0)}</p>
                      <div className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1">
                        <span>🏪</span>
                        <span>In stock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </EnhancedPanel>
            </div>
          )}

          {/* Manage Products Tab */}
          {activeTab === "manage" && (
            <EnhancedPanel title="Manage products" action={<GhostButton onClick={fetchUserProducts}>Refresh</GhostButton>}>
              {loadingProducts ? (
                <EmptyState icon="⏳" text="Loading products..." />
              ) : userProducts.length === 0 ? (
                <EmptyState icon="📦" text="No products found. Add your first product!" />
              ) : (
                <div className="space-y-3">
                  {userProducts.map((product) => (
                    <div key={product._id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:shadow-md hover:border-[var(--brand)]/30">
                      <EnhancedProductLine product={product} trailing={formatUsdFromInr(product.price || 0)} />
                      <button onClick={() => handleDeleteProduct(product._id)} className="ml-auto shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand)] hover:bg-[var(--surface-soft)] transition-colors">
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </EnhancedPanel>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <EnhancedPanel title="Orders management" action={<GhostButton onClick={fetchOrders}>Refresh</GhostButton>}>
              <div className="mb-6 grid gap-4 md:grid-cols-[1fr_240px]">
                <input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Search by order ID, customer, email, city, status..." className={inputClass} />
                <select value={orderFilter} onChange={(event) => setOrderFilter(event.target.value)} className={inputClass}>
                  <option value="">All statuses</option>
                  {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="w-full min-w-[900px] border-collapse text-left font-raleway text-sm">
                  <thead className="bg-[var(--surface-soft)]">
                    <tr className="text-[var(--muted)]">
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Order</th>
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Customer</th>
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Shipping</th>
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Products</th>
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Total</th>
                      <th className="px-5 py-4 font-semibold border-b border-[var(--border)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingOrders ? (
                      <tr><td colSpan="6" className="px-5 py-12 text-center text-[var(--muted)]">Loading orders...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan="6" className="px-5 py-12 text-center text-[var(--muted)]">No orders match this view.</td></tr>
                    ) : orders.map((order, idx) => (
                      <tr key={order._id} className={`border-b border-[var(--border)]/50 ${idx % 2 === 0 ? 'bg-[var(--surface)]' : 'bg-[var(--page)]'}`}>
                        <td className="px-5 py-4">
                          <p className="font-bold text-[var(--text)]">#{order._id.slice(-8).toUpperCase()}</p>
                          <p className="text-xs text-[var(--muted)] mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[var(--text)] font-medium">{order.user?.name || order.shippingAddress?.fullName}</p>
                          <p className="text-xs text-[var(--muted)] mt-1">{order.user?.email || order.shippingAddress?.email}</p>
                        </td>
                        <td className="px-5 py-4 text-[var(--muted)]">
                          <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                          <p className="text-xs mt-1">{order.shippingAddress?.phone}</p>
                        </td>
                        <td className="px-5 py-4">
                          {order.items && order.items.slice(0, 2).map((item) => (
                            <p key={`${order._id}-${item._id}`} className="truncate text-[var(--text)]">{item.quantity}x {item.name}</p>
                          ))}
                        </td>
                        <td className="px-5 py-4 font-bold text-[var(--text)]">{formatUsdFromInr(order.totalPrice)}</td>
                        <td className="px-5 py-4">
                          <select value={order.status} onChange={(event) => handleOrderStatusUpdate(order._id, event.target.value)} className={inputClass}>
                            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </EnhancedPanel>
          )}

          {/* Inventory Tab */}
          {activeTab === "inventory" && (
            <EnhancedPanel title="Inventory management" action={<GhostButton onClick={fetchUserProducts}>Refresh</GhostButton>}>
              <div className="mb-6 grid gap-4 md:grid-cols-4">
                <MiniStatCard label="Value" value={formatUsdFromInr(overviewStats.catalogValue)} color="purple" />
                <MiniStatCard label="Active" value={overviewStats.activeProducts} color="green" />
                <MiniStatCard label="Low" value={overviewStats.lowStockProducts} color="orange" />
                <MiniStatCard label="Out" value={overviewStats.outOfStockProducts} color="red" />
              </div>
              
              {lowStockItems.length === 0 ? (
                <EmptyState icon="✅" text="No low-stock products found. Great job!" />
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((product) => (
                    <div key={product._id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-all hover:shadow-md">
                      <EnhancedProductLine product={product} trailing={`${product.stock} left`} />
                      <input type="number" min="0" defaultValue={product.stock} onBlur={(event) => handleStockUpdate(product, event.target.value)} className={`${inputClass} w-32 ml-auto`} aria-label={`Update stock for ${product.name}`} />
                    </div>
                  ))}
                </div>
              )}
            </EnhancedPanel>
          )}
        </main>
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${surfaceClass} rounded-3xl p-8 max-w-md w-full mx-4`}>
            <h3 className="font-playfair text-2xl font-semibold mb-6 text-[var(--text)]">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text)]">Category Name</label>
                <input
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Enter category name"
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" disabled={modalLoading} className="flex-1">
                  {modalLoading ? "Adding..." : "Add Category"}
                </PrimaryButton>
                <GhostButton
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setCategoryFormData({ name: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </GhostButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`${surfaceClass} rounded-3xl p-8 max-w-md w-full mx-4`}>
            <h3 className="font-playfair text-2xl font-semibold mb-6 text-[var(--text)]">Add New Supplier</h3>
            <form onSubmit={handleAddSupplier} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text)]">Company Name</label>
                <input
                  value={supplierFormData.company_name}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, company_name: e.target.value })}
                  placeholder="Enter company name"
                  className={inputClass}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text)]">Tax ID (Optional)</label>
                <input
                  value={supplierFormData.tax_id}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, tax_id: e.target.value })}
                  placeholder="Tax ID"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text)]">Warehouse Address (Optional)</label>
                <input
                  value={supplierFormData.warehouse_address}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, warehouse_address: e.target.value })}
                  placeholder="Warehouse address"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <PrimaryButton type="submit" disabled={modalLoading} className="flex-1">
                  {modalLoading ? "Adding..." : "Add Supplier"}
                </PrimaryButton>
                <GhostButton
                  type="button"
                  onClick={() => {
                    setShowSupplierModal(false);
                    setSupplierFormData({ company_name: "", tax_id: "", warehouse_address: "" });
                  }}
                  className="flex-1"
                >
                  Cancel
                </GhostButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ zIndex: 9999 }}
        toastStyle={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '0px'
        }}
      />
    </PageShell>
  );
}

function EnhancedPanel({ title, action, children }) {
  return (
    <section className={`${surfaceClass} rounded-3xl p-7 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-playfair text-2xl font-semibold text-[var(--text)]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EnhancedStatCard({ label, value, detail, color = "blue" }) {
  const iconGradients = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
  };

  return (
    <div className={`rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-raleway text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--brand)]">{label}</p>
          <p className="mt-3 font-raleway text-4xl font-extrabold text-[var(--text)]">{value}</p>
          {detail && <p className="mt-2 font-raleway text-sm leading-relaxed text-[var(--muted)]">{detail}</p>}
        </div>
        <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${iconGradients[color] || iconGradients.blue} flex items-center justify-center text-white text-xl shadow-md ml-4`}>
          {color === "blue" && "📦"}
          {color === "green" && "✅"}
          {color === "orange" && "⚠️"}
          {color === "purple" && "💰"}
          {color === "red" && "❌"}
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ label, value, color = "blue" }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:shadow-md">
      <p className="font-raleway text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 font-raleway text-2xl font-extrabold text-[var(--text)]">{value}</p>
    </div>
  );
}

function EnhancedProductLine({ product, trailing }) {
  return (
    <div className="flex min-w-0 items-center gap-4 flex-1">
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1 shadow-sm">
        {product.images?.[0] ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-[var(--muted)]">📦</div>}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-raleway font-bold text-[var(--text)]">{product.name}</p>
        <p className="truncate font-raleway text-sm text-[var(--muted)] mt-0.5">{product.supplier || "RoziKhan Supplier"} / {product.category}</p>
      </div>
      {trailing && <span className="ml-auto shrink-0 font-raleway text-sm font-bold text-[var(--brand)]">{trailing}</span>}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <p className="font-raleway text-[var(--muted)] font-medium">{text}</p>
    </div>
  );
}

export default Dashboard;
