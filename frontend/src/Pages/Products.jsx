import { useCallback, useEffect, useState } from "react";
import API from "../Services/api";
import ProductCard from "../Components/ProductCard";
import { Container, GhostButton, PageShell, SectionHeading, inputClass, surfaceClass } from "../Components/layout/PageShell";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (keyword) params.keyword = keyword;
      if (category) params.category = category;

      const { data } = await API.get("/products", { params });

      if (data.success) {
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
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
                <div key={item} className="h-[460px] animate-pulse border border-[var(--border)] bg-[var(--surface-soft)]" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <div key={product._id} className="animate-rise-in" style={{ animationDelay: `${index * 55}ms` }}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className={`${surfaceClass} p-10 text-center`}>
              <h3 className="font-playfair text-3xl font-semibold">No products found</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Try a different search term or check back later for new products.</p>
            </div>
          )}
        </div>
      </Container>
    </PageShell>
  );
}

export default Products;
