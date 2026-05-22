import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ProductGallery from "../Components/product-detail/ProductGallery";
import ProductInfo from "../Components/product-detail/ProductInfo";
import ProductDetailSkeleton from "../Components/product-detail/ProductDetailSkeleton";
import RelatedProducts from "../Components/product-detail/RelatedProducts";
import StateMessage from "../Components/product-detail/StateMessage";
import { createProductReview, getProductById, getProducts } from "../Services/productService";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import useThemeMode from "../hooks/useThemeMode";
import useAuthStatus from "../hooks/useAuthStatus";

const renderStars = (rating = 0) => {
  const roundedRating = Math.round(Number(rating || 0));
  return "★".repeat(roundedRating) + "☆".repeat(Math.max(5 - roundedRating, 0));
};

function ProductDetail() {
  const { isDark } = useThemeMode();
  const { addItem } = useCart();
  const { isAdmin } = useAuth();
  const loggedIn = useAuthStatus();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        setCartMessage("");
        setQuantity(1);

        const { data } = await getProductById(id);

        if (!data.success || !data.product) {
          setError("Product details are not available right now.");
          return;
        }

        setProduct(data.product);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load this product.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.category) return;

    const fetchRelatedProducts = async () => {
      try {
        setRelatedLoading(true);
        const { data } = await getProducts({ category: product.category });

        if (data.success) {
          const filteredProducts = data.products
            .filter((item) => item._id !== product._id)
            .slice(0, 4);

          setRelatedProducts(filteredProducts);
        }
      } catch {
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  const maxQuantity = useMemo(() => Math.max(Number(product?.stock || 0), 1), [product]);

  const handleQuantityChange = (nextQuantity) => {
    setQuantity(Math.min(Math.max(nextQuantity, 1), maxQuantity));
  };

  const handleAddToCart = () => {
    if (!product || Number(product.stock || 0) <= 0) return;

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || "",
      category: product.category,
      supplier: product.supplier || "RoziKhan Verified Supplier",
      stock: product.stock,
    }, quantity);
    setCartMessage(`${quantity} item${quantity > 1 ? "s" : ""} added to cart.`);
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    try {
      setReviewLoading(true);
      setReviewError("");
      setReviewMessage("");

      const { data } = await createProductReview(product._id, {
        rating: reviewRating,
        comment: reviewComment,
      });

      setProduct(data.product);
      setReviewComment("");
      setReviewRating(5);
      setReviewMessage("Thanks. Your review is now visible on this product.");
    } catch (err) {
      setReviewError(err.response?.data?.message || "Unable to add review right now.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <ProductDetailSkeleton />;

  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"}`}>
        <StateMessage title="Product unavailable" message={error} tone="error" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"}`}>
        <StateMessage
          title="Product not found"
          message="This product may have been removed from the RoziKhan catalog."
        />
      </div>
    );
  }

  return (
    <main
      className={`min-h-screen px-5 py-10 transition-colors duration-500 md:px-10 ${
        isDark ? "bg-[#050505] text-white" : "bg-[#f6f7fb] text-slate-950"
      }`}
    >
      <div className="mx-auto max-w-7xl">
        <nav className={`mb-8 flex flex-wrap items-center gap-2 text-sm ${isDark ? "text-gray-500" : "text-slate-500"}`}>
          <Link to="/" className={`transition ${isDark ? "hover:text-white" : "hover:text-slate-950"}`}>
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className={`transition ${isDark ? "hover:text-white" : "hover:text-slate-950"}`}>
            Products
          </Link>
          <span>/</span>
          <span className={`max-w-[220px] truncate sm:max-w-md ${isDark ? "text-gray-300" : "text-slate-700"}`}>
            {product.name}
          </span>
        </nav>

        <div
          className={`relative overflow-hidden rounded-[28px] border p-4 shadow-2xl sm:p-6 lg:p-8 ${
            isDark
              ? "border-white/10 bg-[#090a0d] shadow-black/40"
              : "border-slate-200 bg-white shadow-slate-200/80"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.12),transparent_35%,rgba(16,185,129,0.08))]" />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
            <ProductGallery images={product.images || []} productName={product.name} />
            <div>
              <ProductInfo
                product={product}
                quantity={quantity}
                onQuantityChange={handleQuantityChange}
                onAddToCart={handleAddToCart}
              />

              {cartMessage && (
                <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">
                  {cartMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        <section
          className={`mt-8 grid gap-6 rounded-[28px] border p-5 shadow-xl lg:grid-cols-[0.9fr_1.1fr] lg:p-8 ${
            isDark
              ? "border-white/10 bg-[#090a0d] shadow-black/30"
              : "border-slate-200 bg-white shadow-slate-200/70"
          }`}
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-500">
              Customer trust
            </p>
            <h2 className="mt-3 text-3xl font-black">Ratings & Reviews</h2>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-5xl font-black text-amber-400">
                {Number(product.ratings || 0).toFixed(1)}
              </span>
              <div>
                <p className="text-xl text-amber-400">
                  {renderStars(product.ratings)}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  Based on {product.numReviews || 0} review{product.numReviews === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {(product.reviews || []).length > 0 && (
              <div className="mt-6 grid gap-3">
                {[5, 4, 3, 2, 1].map((ratingValue) => {
                  const reviewCount = product.reviews.filter(
                    (review) => Number(review.rating) === ratingValue
                  ).length;
                  const percentage = Math.round((reviewCount / product.reviews.length) * 100);

                  return (
                    <div key={ratingValue} className="grid grid-cols-[54px_1fr_42px] items-center gap-3 text-sm">
                      <span className="font-black text-amber-500">{ratingValue} star</span>
                      <div className={`h-3 overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}>
                        <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className={`text-right font-bold ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                        {percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className={`mt-6 rounded-2xl border p-4 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
              <h3 className="text-lg font-black">Write a review</h3>

              {!loggedIn ? (
                <p className={`mt-3 text-sm ${isDark ? "text-gray-400" : "text-slate-600"}`}>
                  Please <Link to="/login" className="font-black text-blue-500">login</Link> to review this product.
                </p>
              ) : isAdmin ? (
                <div className="mt-3 rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-sm font-bold text-blue-500">
                  Admin accounts manage products from the dashboard. Customer accounts can publish product reviews here.
                </div>
              ) : (
                <>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black">Rating</span>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((ratingValue) => (
                        <button
                          key={ratingValue}
                          type="button"
                          onClick={() => setReviewRating(ratingValue)}
                          className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                            reviewRating === ratingValue
                              ? "border-amber-400 bg-amber-400 text-slate-950"
                              : isDark
                                ? "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {ratingValue} ★
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black">Review</span>
                    <textarea
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      rows="4"
                      placeholder="Share product quality, delivery, packaging, or supplier experience."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold outline-none focus:border-blue-500 dark:border-white/10 dark:bg-black"
                    />
                  </label>
                  {reviewError && <p className="mt-3 text-sm font-bold text-red-500">{reviewError}</p>}
                  {reviewMessage && <p className="mt-3 text-sm font-bold text-emerald-500">{reviewMessage}</p>}
                  <button
                    type="submit"
                    disabled={reviewLoading || !reviewComment.trim()}
                    className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewLoading ? "Submitting..." : "Submit review"}
                  </button>
                </>
              )}
            </form>
          </div>

          <div className="space-y-3">
            {(product.reviews || []).length === 0 ? (
              <div className={`rounded-2xl border p-6 text-center ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
                <h3 className="text-xl font-black">No reviews yet.</h3>
                <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-slate-500"}`}>
                  Be the first buyer to share product and supplier feedback.
                </p>
              </div>
            ) : (
              product.reviews
                .slice()
                .reverse()
                .map((review) => (
                  <article key={review._id} className={`rounded-2xl border p-5 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-slate-200 bg-slate-50"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{review.name}</p>
                        <p className="mt-1 text-sm text-amber-400">
                          {renderStars(review.rating)}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${isDark ? "text-gray-500" : "text-slate-500"}`}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={`mt-3 leading-7 ${isDark ? "text-gray-300" : "text-slate-600"}`}>
                      {review.comment}
                    </p>
                  </article>
                ))
            )}
          </div>
        </section>

        <RelatedProducts products={relatedProducts} loading={relatedLoading} />
      </div>
    </main>
  );
}

export default ProductDetail;
