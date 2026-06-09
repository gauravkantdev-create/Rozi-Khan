import { useCallback, useEffect, useState } from "react";
import API from "../Services/api";
import ProductCard from "../Components/ProductCard";
import { Container, GhostButton, PageShell, SectionHeading, inputClass, surfaceClass } from "../Components/layout/PageShell";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    const timer = setTimeout(fetchProducts, 0);
    return () => clearTimeout(timer);
  }, [category, fetchProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <PageShell>
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <SectionHeading
            eyebrow="The catalog"
            title="Products with premium storefront presence."
            copy="Search and filter supplier-ready items while preserving the same FastAPI product endpoint and MongoDB-style identifiers."
          />

          <form onSubmit={handleSearch} className={`${surfaceClass} grid gap-3 p-4 sm:grid-cols-[1fr_210px_auto]`}>
            <input
              type="text"
              placeholder="Search products..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className={inputClass}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              <option value="">All categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Toys">Toys</option>
            </select>
            <GhostButton type="submit" className="w-full sm:w-auto">Search</GhostButton>
          </form>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="h-[460px] animate-pulse border border-[#d8c8ba] bg-[#fffdf8]/70" />
              ))}
            </div>
          ) : error ? (
            <div className={`${surfaceClass} p-10 text-center`}>
              <h2 className="font-playfair text-3xl font-semibold text-red-700">Catalog unavailable</h2>
              <p className="mt-3 font-raleway text-[#757575]">{error}</p>
              <GhostButton onClick={fetchProducts} className="mt-6">Try again</GhostButton>
            </div>
          ) : products.length === 0 ? (
            <div className={`${surfaceClass} p-12 text-center`}>
              <h2 className="font-playfair text-3xl font-semibold">No products found</h2>
              <p className="mt-3 font-raleway text-[#757575]">Try a different keyword or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <div key={product._id} className="animate-rise-in" style={{ animationDelay: `${index * 55}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </PageShell>
  );
}

export default Products;
