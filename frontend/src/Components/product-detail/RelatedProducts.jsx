import ProductCard from "../ProductCard";
import useThemeMode from "../../hooks/useThemeMode";

function RelatedProducts({ products = [], loading }) {
  const { isDark } = useThemeMode();
  if (loading) {
    return (
      <section className="mt-16">
        <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-white/10" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-xl border border-white/10 bg-white/[0.05]" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={`mt-16 rounded-2xl border p-8 text-center ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-white"}`}>
        <h2 className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-950"}`}>Related products</h2>
        <p className={`mt-2 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          No related products are available in this category yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-16">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-blue-300">Curated catalog</p>
          <h2 className={`mt-2 text-2xl font-black sm:text-3xl ${isDark ? "text-white" : "text-slate-950"}`}>
            Related products
          </h2>
        </div>
        <p className={`max-w-xl text-sm leading-6 ${isDark ? "text-gray-400" : "text-slate-500"}`}>
          Explore nearby supplier-ready products to expand the same niche collection.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default RelatedProducts;
