import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Logo.png";
import ProductCard from "../Components/ProductCard";
import { Container, Eyebrow, PageShell, PrimaryLink, SecondaryLink, SectionHeading, surfaceClass } from "../Components/layout/PageShell";
import { getProducts } from "../Services/productService";
import useAuthStatus from "../hooks/useAuthStatus";

import heartIcon from "../assets/feature_heart.png";
import locationIcon from "../assets/feature_location.png";
import phoneIcon from "../assets/feature_phone.png";
import chatIcon from "../assets/feature_chat.png";

const featureIcons = {
  "Trusted suppliers": heartIcon,
  "Find products easily": locationIcon,
  "Reliable product data": phoneIcon,
  "Market intelligence": chatIcon,
};

const supplierFeatures = [
  ["Trusted suppliers", "Verification signals, clear delivery context, and responsive support for buyers."],
  ["Find products easily", "Searchable categories and clean product cards make catalog browsing faster."],
  ["Reliable product data", "Product information is presented consistently to reduce mis-selling."],
  ["Market intelligence", "Helpful sections guide sellers toward stronger product decisions."],
];

const pricingPlans = [
  ["Free", "GBP 0.00", "GBP 0.00", "Explore the marketplace and validate products.", ["Support tickets", "Product browsing", "Starter storefront tools"]],
  ["Starter", "GBP 24.99", "GBP 19.99", "Start selling with connected marketplace features.", ["0% transaction fees", "Unlimited integrations", "Order tracking", "Live chat support"]],
  ["Advanced", "GBP 49.99", "GBP 39.99", "Scale orders with stronger catalog controls.", ["Bulk product management", "Dynamic pricing settings", "Auto stock sync", "Telephone support"]],
  ["Business", "GBP 99.99", "GBP 79.99", "Preferred plan for serious growth.", ["Additional product discount", "Onboarding call", "Account management", "Advanced search filters"]],
  ["Guru", "GBP 199.99", "GBP 159.99", "Large-scale selling with premium support.", ["50,000 AI credit", "100,000 product sourcing", "TikTok Shop setup", "Priority support"]],
];

const faqItems = [
  "What customer support do you provide?",
  "Where can I find your help documents?",
  "Where can I find your help videos?",
  "Can I contact suppliers directly?",
];

const featureStrip = [
  "Verified UK suppliers",
  "Mobile optimized",
  "Store integrations",
  "Automated orders",
  "6 month support",
  "Translation ready",
  "Inventory sync",
];

const storeNeeds = [
  ["01", "Verified supplier network", "Source quality products from trusted suppliers with clear product and delivery context."],
  ["02", "Store native integrations", "Connect Shopify, WooCommerce, eBay, Amazon and seller channels from one flow."],
  ["03", "Automation-ready orders", "Move orders, payments and shipping updates through a cleaner seller workflow."],
  ["04", "Live inventory signals", "Keep stock visibility central so sellers can act before products go out of sync."],
  ["05", "Product data exports", "Prepare structured catalog information for faster listing, pricing and merchandising."],
  ["06", "Growth support", "Use guided sections, support touchpoints and marketplace context to scale with confidence."],
];

const platformReasons = [
  ["shield", "Trusted supplier network", "Get steady orders from reliable stores using our platform."],
  ["globe", "Global product sourcing", "Connect with stores actively looking for suppliers and expand your sales channels."],
  ["bolt", "Fast and reliable fulfillment", "Showcase your products to global marketplace and online retailers."],
];

function Home() {
  const loggedIn = useAuthStatus();
  const getStartedPath = loggedIn ? "/products" : "/register";
  const [previewProducts, setPreviewProducts] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPreviewProducts() {
      try {
        setPreviewLoading(true);
        setPreviewError("");
        const { data } = await getProducts();
        if (active && data.success) {
          setPreviewProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch (err) {
        if (active) setPreviewError(err.response?.data?.message || err.message || "Unable to load product previews.");
      } finally {
        if (active) setPreviewLoading(false);
      }
    }

    loadPreviewProducts();
    return () => {
      active = false;
    };
  }, []);

  const premiumAdminProducts = useMemo(() => {
    const isAdminProduct = (product) => {
      const role = String(product.addedByRole || product.createdByRole || product.createdBy?.role || "").toLowerCase();
      return product.adminAdded === true || product.isAdminAdded === true || role === "admin";
    };

    const adminProducts = previewProducts.filter(isAdminProduct);
    const sourceProducts = adminProducts.length > 0 ? adminProducts : previewProducts;

    return [...sourceProducts]
      .sort((a, b) => {
        const ratingDiff = Number(b.ratings || 0) - Number(a.ratings || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.price || 0) - Number(a.price || 0);
      })
      .slice(0, 6);
  }, [previewProducts]);

  return (
    <PageShell>
      <section className="relative overflow-hidden bg-[var(--page)]">
        <Container className="grid min-h-[720px] items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <span className="h-px w-9 bg-[var(--brand)]" />
              <Eyebrow className="tracking-[0.3em]">Dropshipping marketplace</Eyebrow>
            </div>
            <h1 className="mt-9 max-w-4xl font-prata text-5xl leading-[1.05] text-[var(--text)] sm:text-6xl lg:text-7xl xl:text-8xl">
              Minimal by Design. <span className="text-[var(--brand)]">Powerful</span> by Nature.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--muted)]">
              A clean, versatile dropshipping platform built for modern sellers who want trusted products, smooth integrations, and automated order flow.
            </p>
            <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <PrimaryLink to={getStartedPath} className="rounded-none bg-[#151515] px-10 hover:bg-[var(--brand)]">
                {loggedIn ? "Explore products" : "Start free trial"}
              </PrimaryLink>
              <SecondaryLink to="/products" className="min-h-0 rounded-none border-0 border-b border-[var(--border)] px-0 py-1 text-[var(--muted)] hover:bg-transparent hover:text-[var(--brand)]">
                View catalog
              </SecondaryLink>
            </div>
            <div className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-[var(--border)] pt-8">
              {[
                ["06+", "Supplier categories"],
                ["24/7", "Automation flow"],
                ["6mo", "Support included"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-prata text-4xl leading-none text-[var(--text)]">{value}</p>
                  <p className="mt-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[480px] lg:min-h-[560px]">
            <div className="absolute inset-x-3 top-10 h-[72%] border border-[var(--border)] bg-[var(--surface)] shadow-[0_28px_70px_rgba(44,42,41,0.12)]" />
            <div className="hero-storefront-card hero-storefront-card-left">
              <MockStorefront title="Clean product sourcing" label="Supplier marketplace" />
            </div>
            <div className="hero-storefront-card hero-storefront-card-right">
              <MockStorefront title="Sell everywhere" label="Connected catalog" compact />
            </div>
            <div className="absolute bottom-8 left-0 z-20 bg-[var(--brand)] px-7 py-6 text-white shadow-[0_20px_40px_rgba(44,42,41,0.22)] sm:left-8">
              <p className="font-prata text-4xl leading-none">06+</p>
              <p className="mt-2 text-xs font-extrabold uppercase leading-5 tracking-[0.12em]">Supplier<br />categories</p>
            </div>
          </div>
        </Container>
      </section>

      <section aria-label="Platform highlights" className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface-soft)] py-5">
        <div className="flex min-w-max animate-[ticker_32s_linear_infinite] items-center gap-12 text-xs font-extrabold uppercase tracking-[0.28em] text-[var(--muted)]">
          {[...featureStrip, ...featureStrip, ...featureStrip].map((item, index) => (
            <span key={`${item}-${index}`} className="flex items-center gap-12">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section aria-label="Growth message" className="overflow-hidden bg-[var(--surface)] py-3 text-[var(--brand-dark)]">
        <div className="flex min-w-max animate-[ticker_26s_linear_infinite] gap-16 px-4 text-sm font-extrabold uppercase tracking-wide">
          <span>Skyrocket Revenue & Rapid Profit Growth Effortlessly!</span>
          <span>More Eyes. More Clicks. Capture Interest. Engage More. Convert Instantly. Sell Faster.</span>
          <span>Skyrocket Revenue & Rapid Profit Growth Effortlessly!</span>
          <span>More Eyes. More Clicks. Capture Interest. Engage More. Convert Instantly. Sell Faster.</span>
        </div>
      </section>

      <section className="bg-[var(--page)] py-16 sm:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <span className="h-px w-9 bg-[var(--brand)]" />
                <Eyebrow className="tracking-[0.28em]">Preview</Eyebrow>
              </div>
              <h2 className="mt-8 font-prata text-5xl leading-tight text-[var(--text)] sm:text-6xl lg:text-7xl">
                06 Stunning<br />
                <span className="font-playfair italic text-[var(--brand)]">Product Previews</span>
              </h2>
            </div>
            <Link
              to="/products"
              className="inline-flex min-h-14 items-center justify-center bg-[#151515] px-8 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[var(--brand)]"
            >
              Explore All Products
            </Link>
          </div>

          <div className="mt-14">
            {previewLoading ? (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div key={item} className="h-[460px] animate-pulse border border-[var(--border)] bg-[var(--surface-soft)]" />
                ))}
              </div>
            ) : previewError ? (
              <div className={`${surfaceClass} p-10 text-center`}>
                <h3 className="font-playfair text-3xl font-semibold">Product previews unavailable</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{previewError}</p>
              </div>
            ) : premiumAdminProducts.length === 0 ? (
              <div className={`${surfaceClass} p-10 text-center`}>
                <h3 className="font-playfair text-3xl font-semibold">No premium admin products yet</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Add products from the admin flow and they will appear here automatically.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {premiumAdminProducts.map((product, index) => (
                  <div key={product._id || product.id} className="animate-rise-in" style={{ animationDelay: `${index * 55}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section id="platform-tour" className="scroll-mt-32 bg-[var(--surface)] py-16 sm:py-24">
        <Container className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionHeading
            eyebrow="UK-based verified suppliers"
            title="Source inventory from trusted suppliers"
            copy="RoziKhan keeps supplier trust, product quality, and service readiness visible across the storefront experience."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {supplierFeatures.map(([title, copy]) => (
              <FeatureCard key={title} title={title} copy={copy} />
            ))}
          </div>
        </Container>
      </section>

      <section id="dropship" className="scroll-mt-32 bg-[#151515] py-16 text-white sm:py-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
            <h2 className="font-prata text-5xl leading-tight sm:text-6xl lg:text-7xl">
              Everything Your<br />
              <span className="font-playfair italic text-[#c39452]">Store Needs</span>
            </h2>
            <p className="max-w-xl text-lg font-semibold leading-8 text-[#96918c] lg:pt-8">
              One platform for product sourcing, supplier confidence, connected stores, order flow and the operational details sellers need to grow.
            </p>
          </div>

          <div className="mt-16 grid border-t border-white/12 md:grid-cols-2 xl:grid-cols-3">
            {storeNeeds.map(([number, title, copy]) => (
              <article key={number} className="store-needs-card min-h-72 border-b border-white/12 p-8">
                <p className="font-prata text-5xl text-[#8d6d3e]">{number}</p>
                <h3 className="mt-8 font-prata text-2xl leading-tight text-white">{title}</h3>
                <p className="mt-5 max-w-sm text-base font-semibold leading-8 text-[#96918c]">{copy}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section id="integrations" className="scroll-mt-32 bg-[var(--surface)] py-16 sm:py-24">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Integrations"
            title="Diversify your inventory and automate your order flow"
            copy="Popular marketplace and operational integrations are grouped clearly so sellers can scan the platform fundamentals quickly."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["TikTok Shop", "Shopify", "WooCommerce", "eBay", "Amazon", "Inventory sync", "Order routing", "Product data"].map((item) => (
              <div key={item} className={`${surfaceClass} rounded-lg p-6`}>
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface-soft)] text-xl text-[var(--brand)]">*</span>
                <h3 className="mt-5 text-lg font-extrabold">{item}</h3>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section id="pricing" className="scroll-mt-32 py-16 sm:py-24">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Pricing"
            title="Subscribe and save with premium plans"
            copy="A clearer pricing area follows the same visual rhythm as the reference while staying responsive on tablet and mobile."
          />
          <div className="mt-8 flex items-center justify-center gap-5 text-lg font-bold">
            <button
              onClick={() => setIsYearly(false)}
              className={`cursor-pointer transition-colors duration-200 ${
                !isYearly ? "text-[var(--text)] font-extrabold" : "text-[var(--muted)]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative flex h-10 w-20 cursor-pointer items-center rounded-full bg-[var(--surface-soft)] p-1 transition-colors duration-300"
              aria-label="Toggle billing cycle"
            >
              <span
                className={`h-8 w-8 rounded-full bg-[var(--brand-dark)] transition-transform duration-300 shadow-sm ${
                  isYearly ? "translate-x-10" : "translate-x-0"
                }`}
              />
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`cursor-pointer transition-colors duration-200 ${
                isYearly ? "text-[var(--text)] font-extrabold" : "text-[var(--muted)]"
              }`}
            >
              Yearly
            </button>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            {pricingPlans.map(([title, priceMonthly, priceYearly, copy, features]) => {
              const price = isYearly ? priceYearly : priceMonthly;
              return (
                <div key={title} className={`${surfaceClass} overflow-hidden rounded-lg border border-[var(--border)] hover:border-[var(--brand)] transition duration-200 shadow-sm`}>
                  <div className={`${title === "Business" ? "brand-gradient" : "bg-[var(--brand)]"} p-7 text-center text-white`}>
                    {title === "Business" && <span className="mb-3 inline-flex rounded-md bg-white px-5 py-1 text-sm text-[var(--brand-dark)] font-bold">Preferred</span>}
                    <h3 className="text-3xl font-extrabold">{title}</h3>
                    <p className="mt-6 text-4xl font-extrabold">{price}</p>
                    <p className="mt-2 text-sm font-semibold">+ VAT per month{isYearly ? " (billed yearly)" : ""}</p>
                  </div>
                  <div className="p-6">
                    <Link to="/register" className="mb-5 flex justify-center rounded-md border border-[var(--brand)] px-4 py-3 text-center text-sm font-extrabold text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition duration-200">
                      Let's begin selling
                    </Link>
                    <p className="min-h-14 text-sm leading-7 text-[var(--muted)]">{copy}</p>
                    <ul className="mt-5 space-y-3">
                      {features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm font-semibold text-[var(--muted)]">
                          <span className="text-[var(--brand-dark)]">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section id="resources" className="scroll-mt-32 bg-[var(--surface)] py-16 sm:py-24">
        <Container>
          <SectionHeading align="center" title="Your frequently asked questions!" />
          <div className="mt-12 grid gap-x-10 gap-y-4 lg:grid-cols-2">
            {faqItems.map((item) => (
              <button key={item} className="flex items-center justify-between border-b border-[var(--border)] py-5 text-left text-lg font-extrabold">
                {item}
                <span>&gt;</span>
              </button>
            ))}
          </div>
        </Container>
      </section>

      <section id="enterprise" className="scroll-mt-32 bg-[#071f27] py-16 text-white sm:py-24">
        <Container>
          <div className="relative overflow-hidden rounded-none border border-white/10 bg-[#08262f] px-6 py-12 shadow-[0_30px_90px_rgba(0,0,0,0.22)] sm:px-10 lg:px-14">
            <div className="absolute right-[7%] top-16 h-48 w-48 rounded-full bg-[#0f343d]/60" />
            <div className="absolute bottom-28 right-[5%] h-56 w-56 rounded-full bg-[#0d3038]/75" />

            <div className="relative grid gap-5 lg:grid-cols-3">
              <div className="min-h-48 p-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-white/70">What we do</p>
                <h2 className="mt-5 max-w-xs text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl">
                  Why<br />Choose Our<br />Platform
                </h2>
              </div>

              <div className="hidden rounded-lg bg-[#0a2a33]/65 lg:block" />

              <article className="rounded-lg bg-[#0a2a33]/80 p-7">
                <IconMark type={platformReasons[0][0]} />
                <h3 className="mt-12 text-xl font-extrabold leading-tight text-white">{platformReasons[0][1]}</h3>
                <p className="mt-3 max-w-xs text-xs font-semibold leading-5 text-white/60">{platformReasons[0][2]}</p>
              </article>

              {platformReasons.slice(1).map(([icon, title, copy]) => (
                <article key={title} className="rounded-lg bg-[#0a2a33]/80 p-7">
                  <IconMark type={icon} />
                  <h3 className="mt-12 text-xl font-extrabold leading-tight text-white">{title}</h3>
                  <p className="mt-3 max-w-xs text-xs font-semibold leading-5 text-white/60">{copy}</p>
                </article>
              ))}

              <div className="hidden rounded-lg bg-[#0a2a33]/50 lg:block" />
              <div className="hidden rounded-full bg-[#0d3038]/80 lg:block" />
            </div>

            <div className="relative mt-12 grid gap-8 text-center sm:grid-cols-3">
              {[
                ["12K+", "Trusted suppliers"],
                ["2M+", "Products available"],
                ["80+", "Countries served"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="text-5xl font-extrabold leading-none text-white">{value}</p>
                  <p className="mt-3 text-xs font-extrabold uppercase tracking-[0.12em] text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section id="supplier" className="scroll-mt-32 pb-16 sm:pb-24">
        <Container>
          <div className="rounded-lg bg-[var(--surface-soft)] px-6 py-14 text-center">
            <h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">Start your DropShipping journey for FREE!</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              Sign up today and use a clean, responsive marketplace foundation built for modern sellers.
            </p>
            <PrimaryLink to="/register" className="mt-8">Get started with no fees</PrimaryLink>
          </div>
        </Container>
      </section>
    </PageShell>
  );
}

function FeatureCard({ title, copy }) {
  const icon = featureIcons[title];
  return (
    <article className={`${surfaceClass} rounded-[2rem] border border-[var(--border)]/50 p-7 shadow-sm transition duration-300 hover:shadow-md`}>
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-soft)] p-3">
        {icon ? (
          <img src={icon} alt={title} className="h-full w-full object-contain" />
        ) : (
          <span className="text-2xl text-[var(--brand)]">*</span>
        )}
      </div>
      <h3 className="text-lg font-extrabold">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{copy}</p>
    </article>
  );
}

function IconMark({ type }) {
  const marks = {
    shield: "S",
    globe: "G",
    bolt: "Z",
  };

  return (
    <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/8 text-xl font-extrabold text-white shadow-[inset_0_0_24px_rgba(255,255,255,0.06)]">
      {marks[type] || "*"}
    </span>
  );
}

function MockStorefront({ title, label, compact = false }) {
  const productCount = compact ? 8 : 6;

  return (
    <div className="h-full overflow-hidden bg-white text-[#2c2a29]">
      <div className="flex items-center justify-between border-b border-[#ebe6df] px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={logo} alt="" className="h-6 w-6 object-contain" />
          <span className="text-sm font-extrabold">RoziKhan</span>
        </div>
        <div className="flex gap-2">
          <span className="h-2 w-2 rounded-full bg-[#c39452]" />
          <span className="h-2 w-2 rounded-full bg-[#d8d2c9]" />
          <span className="h-2 w-2 rounded-full bg-[#d8d2c9]" />
        </div>
      </div>
      <div className="grid gap-4 p-5">
        <div className="grid min-h-32 grid-cols-[1fr_0.75fr] overflow-hidden bg-[#f4f3ef]">
          <div className="p-5">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9c8470]">{label}</p>
            <h3 className="mt-3 max-w-48 text-2xl font-extrabold leading-tight">{title}</h3>
            <span className="mt-4 inline-flex bg-[#c39452] px-4 py-2 text-xs font-extrabold text-white">Explore</span>
          </div>
          <div className="grid place-items-center bg-[#e7dfd5]">
            <div className="h-20 w-20 rounded-full bg-[#c39452]/70" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: productCount }).map((_, index) => (
            <div key={index} className="min-h-20 bg-[#f5f2ee] p-2">
              <div className="h-9 bg-[#d8d2c9]" />
              <div className="mt-2 h-1.5 w-10 bg-[#c9c0b5]" />
              <div className="mt-1.5 h-1.5 w-7 bg-[#ded7cf]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
