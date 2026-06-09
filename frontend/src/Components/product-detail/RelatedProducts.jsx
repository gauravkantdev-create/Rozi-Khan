import ProductCard from "../ProductCard";
import { SectionHeading, surfaceClass } from "../layout/PageShell";

function RelatedProducts({ products = [], loading }) {
  if (loading) {
    return (
      <section className="mt-16">
        <div className="mb-6 h-8 w-56 animate-pulse bg-[#d8c8ba]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-96 animate-pulse border border-[#d8c8ba] bg-[#fffdf8]/70" />
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={`${surfaceClass} mt-16 p-8 text-center`}>
        <h2 className="font-playfair text-3xl font-semibold text-[#2F2F2F]">Related products</h2>
        <p className="mt-2 font-raleway text-[#757575]">No related products are available in this category yet.</p>
      </section>
    );
  }

  return (
    <section className="mt-16">
      <SectionHeading
        eyebrow="Curated catalog"
        title="Related products"
        copy="Explore nearby supplier-ready products to expand the same niche collection."
      />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default RelatedProducts;
