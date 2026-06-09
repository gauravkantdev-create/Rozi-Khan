import { Link } from "react-router-dom";
import { SectionHeading, surfaceClass } from "../layout/PageShell";

const collections = [
  {
    title: "Curated Tech",
    copy: "Sleek everyday electronics selected for high-demand storefronts.",
    accent: "from-[#2F2F2F] to-[#766658]",
  },
  {
    title: "Home Edit",
    copy: "Warm, practical pieces for interiors, gifting, and seasonal catalogs.",
    accent: "from-[#C5A992] to-[#e8d7c6]",
  },
  {
    title: "Style Finds",
    copy: "Fashion accessories and lifestyle items with premium shelf appeal.",
    accent: "from-[#4d473f] to-[#C5A992]",
  },
];

function HomeCollections() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading
        align="center"
        eyebrow="Featured categories"
        title="A quieter kind of product discovery."
        copy="Explore supplier-ready collections shaped for elegant ecommerce stores and responsive shopping journeys."
      />

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {collections.map((collection, index) => (
          <Link
            key={collection.title}
            to="/products"
            className={`${surfaceClass} group relative min-h-72 overflow-hidden p-7 transition duration-500 hover:-translate-y-2 hover:shadow-[0_34px_90px_rgba(47,47,47,0.14)]`}
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${collection.accent} opacity-80 transition duration-500 group-hover:h-36`} />
            <div className="relative mt-24">
              <p className="font-raleway text-xs font-bold uppercase tracking-[0.24em] text-[#C5A992]">Collection</p>
              <h3 className="mt-3 font-playfair text-3xl font-semibold text-[#2F2F2F]">{collection.title}</h3>
              <p className="mt-4 font-raleway text-sm leading-7 text-[#757575]">{collection.copy}</p>
              <span className="mt-8 inline-flex font-raleway text-xs font-bold uppercase tracking-[0.18em] text-[#2F2F2F] transition duration-300 group-hover:translate-x-2">
                View products
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default HomeCollections;
