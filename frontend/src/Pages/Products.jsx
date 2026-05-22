import { useCallback, useEffect, useState } from "react";
import API from "../Services/api";
import ProductCard from "../Components/ProductCard";
import useThemeMode from "../hooks/useThemeMode";

function Products() {
  const { isDark } = useThemeMode();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;

      const { data } = await API.get("/products", { params });
      
      if (data.success) {
        setProducts(data.products);
      } else {
        setError("Failed to fetch products.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [category, keyword]);

  useEffect(() => {
    // Delay fetching slightly if searching to debounce (optional, but for simple search we can rely on form submit)
    const timer = setTimeout(fetchProducts, 0);
    return () => clearTimeout(timer);
  }, [category, fetchProducts]); // Re-fetch on category change

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div
      className={`min-h-screen px-5 py-10 transition-colors duration-500 md:px-10 ${
        isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
            Discover <span className="text-blue-500">Products</span>
          </h1>
          <p className={`mx-auto max-w-2xl ${isDark ? "text-gray-400" : "text-slate-600"}`}>
            Browse our premium selection of top-tier dropshipping products to add to your store today.
          </p>
        </div>

        {/* Filters and Search */}
        <div
          className={`mb-10 flex flex-col items-center justify-between gap-5 rounded-2xl border p-4 shadow-sm md:flex-row ${
            isDark ? "border-white/10 bg-[#111111]" : "border-slate-200 bg-white"
          }`}
        >
          {/* Category Filter */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <label htmlFor="category" className={`font-medium ${isDark ? "text-gray-400" : "text-slate-600"}`}>
              Category:
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full rounded-lg border p-2 outline-none transition-colors focus:border-blue-500 md:w-48 ${
                isDark ? "border-gray-700 bg-gray-800 text-white" : "border-slate-200 bg-slate-50 text-slate-950"
              }`}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Toys">Toys</option>
            </select>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex w-full md:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={`w-full rounded-l-lg border border-r-0 p-2 outline-none transition-colors focus:border-blue-500 md:w-64 ${
                isDark ? "border-gray-700 bg-gray-800 text-white" : "border-slate-200 bg-slate-50 text-slate-950"
              }`}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-r-lg font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* State Handling */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-300">
            <p className="font-semibold text-lg">{error}</p>
            <button
              onClick={fetchProducts}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div
            className={`rounded-2xl border py-20 text-center ${
              isDark ? "border-white/10 bg-[#111111]" : "border-slate-200 bg-white"
            }`}
          >
            <h2 className={`mb-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-950"}`}>
              No Products Found
            </h2>
            <p className={isDark ? "text-gray-400" : "text-slate-500"}>
              Try adjusting your search keyword or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
