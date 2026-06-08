import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import HomeCollections from "../Components/home/HomeCollections";
import { Container, Eyebrow, PageShell, PrimaryLink, SecondaryLink, SectionHeading, StatCard, surfaceClass } from "../Components/layout/PageShell";
import useAuthStatus from "../hooks/useAuthStatus";

function Home() {
  const loggedIn = useAuthStatus();
  const getStartedPath = loggedIn ? "/products" : "/register";

  return (
    <PageShell>
      <section className="overflow-hidden">
        <Container className="grid min-h-[calc(100vh-81px)] items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
          <div className="animate-rise-in">
            <Eyebrow>Luxury supplier marketplace</Eyebrow>
            <h1 className="mt-5 max-w-4xl font-prata text-5xl leading-[1.08] text-[#2F2F2F] sm:text-6xl lg:text-7xl">
              Premium products for modern dropshipping stores.
            </h1>
            <p className="mt-6 max-w-2xl font-raleway text-lg leading-9 text-[#757575]">
              Build a polished ecommerce catalog with verified supplier products, smooth shopping flows, and a storefront designed to feel refined on every screen.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <PrimaryLink to={getStartedPath}>{loggedIn ? "Explore products" : "Start sourcing"}</PrimaryLink>
              <SecondaryLink to="/products">View catalog</SecondaryLink>
            </div>
          </div>

          <div className="relative animate-rise-in lg:pl-8">
            <div className="absolute -left-6 top-8 hidden h-40 w-40 border border-[#C5A992]/35 lg:block" />
            <div className={`${surfaceClass} relative p-5 sm:p-7`}>
              <div className="flex aspect-[4/4.4] items-center justify-center bg-[#ebe4d8] p-8">
                <img src={logo} alt="RoziKhan" className="animate-soft-float w-56 object-contain sm:w-72" />
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <StatCard label="Catalog" value="Curated" detail="Ready to list" />
                <StatCard label="Checkout" value="Secure" detail="Razorpay ready" />
                <StatCard label="UX" value="Fluid" detail="Mobile first" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container>
        <HomeCollections />

        <section className="grid gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionHeading
            eyebrow="Editorial commerce"
            title="Designed for buyers who scan, compare, and trust quickly."
            copy="Large whitespace, serif hierarchy, tactile product cards, and subtle motion help the store feel premium without interrupting the existing cart and checkout logic."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Supplier clarity", "Every product keeps supplier and stock signals visible."],
              ["Responsive buying", "Catalog, cart, and checkout adapt cleanly from mobile to desktop."],
              ["Professional motion", "Hover, rise-in, and image scale effects add polish without noise."],
              ["API compatible", "The frontend still speaks to the same FastAPI contracts."],
            ].map(([title, copy]) => (
              <div key={title} className={`${surfaceClass} p-6 transition duration-300 hover:-translate-y-1`}>
                <h3 className="font-playfair text-2xl font-semibold">{title}</h3>
                <p className="mt-3 font-raleway text-sm leading-7 text-[#757575]">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="border-y border-[#d8c8ba] py-10 text-center">
            <p className="font-playfair text-3xl font-semibold text-[#2F2F2F] sm:text-4xl">
              Bring a premium storefront to every product you source.
            </p>
            <Link to="/products" className="mt-6 inline-flex font-raleway text-xs font-bold uppercase tracking-[0.22em] text-[#C5A992] transition hover:text-[#2F2F2F]">
              Enter the catalog
            </Link>
          </div>
        </section>
      </Container>
    </PageShell>
  );
}

export default Home;
