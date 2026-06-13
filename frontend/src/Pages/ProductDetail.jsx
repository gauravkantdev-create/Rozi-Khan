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
import useAuthStatus from "../hooks/useAuthStatus";
import { Container, GhostButton, PageShell, SectionHeading, inputClass, surfaceClass } from "../Components/layout/PageShell";

const renderStars = (rating = 0) => {
  const roundedRating = Math.round(Number(rating || 0));
  return "*".repeat(roundedRating) + "-".repeat(Math.max(5 - roundedRating, 0));
};

function ProductDetail() {
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
          setRelatedProducts(data.products.filter((item) => item._id !== product._id).slice(0, 4));
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
      supplier: product.supplier || "Rkdrop Verified Supplier",
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
  if (error) return <PageShell><StateMessage title="Product unavailable" message={error} tone="error" /></PageShell>;
  if (!product) return <PageShell><StateMessage title="Product not found" message="This product may have been removed from the Rkdrop catalog." /></PageShell>;

  return (
    <PageShell>
      <Container className="py-8 sm:py-12">
        <nav className="mb-8 flex flex-wrap items-center gap-2 font-raleway text-sm text-[#757575]">
          <Link to="/" className="transition hover:text-[#2F2F2F]">Home</Link>
          <span>/</span>
          <Link to="/products" className="transition hover:text-[#2F2F2F]">Products</Link>
          <span>/</span>
          <span className="max-w-[240px] truncate text-[#2F2F2F] sm:max-w-md">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
          <ProductGallery images={product.images || []} productName={product.name} />
          <div>
            <ProductInfo product={product} quantity={quantity} onQuantityChange={handleQuantityChange} onAddToCart={handleAddToCart} />
            {cartMessage && (
              <div className="mt-4 border border-emerald-600/25 bg-emerald-500/10 px-4 py-3 font-raleway text-sm font-semibold text-emerald-700">
                {cartMessage}
              </div>
            )}
          </div>
        </div>

        <section className="mt-12 grid gap-7 lg:grid-cols-[0.9fr_1.1fr]">
          <div className={`${surfaceClass} p-6 sm:p-8`}>
            <SectionHeading eyebrow="Customer trust" title="Ratings and reviews" copy="Customer feedback stays connected to the existing review endpoint." />
            <div className="mt-6 flex items-end gap-4">
              <span className="font-playfair text-6xl font-semibold text-[#C5A992]">{Number(product.ratings || 0).toFixed(1)}</span>
              <div>
                <p className="font-raleway text-lg font-bold tracking-[0.12em] text-[#2F2F2F]">{renderStars(product.ratings)}</p>
                <p className="font-raleway text-sm text-[#757575]">Based on {product.numReviews || 0} review{product.numReviews === 1 ? "" : "s"}</p>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-7 border border-[#d8c8ba] bg-[#F3F2EC]/70 p-5">
              <h3 className="font-playfair text-2xl font-semibold">Write a review</h3>
              {!loggedIn ? (
                <p className="mt-3 font-raleway text-sm text-[#757575]">
                  Please <Link to="/login" className="font-bold text-[#2F2F2F] underline">login</Link> to review this product.
                </p>
              ) : isAdmin ? (
                <p className="mt-3 border border-[#C5A992]/40 bg-[#C5A992]/10 p-4 font-raleway text-sm font-semibold text-[#757575]">
                  Admin accounts manage products from the dashboard. Customer accounts can publish reviews here.
                </p>
              ) : (
                <>
                  <label className="mt-4 block">
                    <span className="mb-2 block font-raleway text-sm font-bold">Rating</span>
                    <div className="flex flex-wrap gap-2">
                      {[5, 4, 3, 2, 1].map((ratingValue) => (
                        <button
                          key={ratingValue}
                          type="button"
                          onClick={() => setReviewRating(ratingValue)}
                          className={`border px-4 py-2 font-raleway text-sm font-bold transition ${reviewRating === ratingValue ? "border-[#2F2F2F] bg-[#2F2F2F] text-white" : "border-[#d8c8ba] bg-[#fffdf8] text-[#757575] hover:text-[#2F2F2F]"}`}
                        >
                          {ratingValue} star
                        </button>
                      ))}
                    </div>
                  </label>
                  <label className="mt-4 block">
                    <span className="mb-2 block font-raleway text-sm font-bold">Review</span>
                    <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} rows="4" placeholder="Share product quality, delivery, packaging, or supplier experience." className={`${inputClass} resize-none`} />
                  </label>
                  {reviewError && <p className="mt-3 font-raleway text-sm font-bold text-red-600">{reviewError}</p>}
                  {reviewMessage && <p className="mt-3 font-raleway text-sm font-bold text-emerald-700">{reviewMessage}</p>}
                  <GhostButton type="submit" disabled={reviewLoading || !reviewComment.trim()} className="mt-4">
                    {reviewLoading ? "Submitting" : "Submit review"}
                  </GhostButton>
                </>
              )}
            </form>
          </div>

          <div className="space-y-3">
            {(product.reviews || []).length === 0 ? (
              <div className={`${surfaceClass} p-8 text-center`}>
                <h3 className="font-playfair text-2xl font-semibold">No reviews yet.</h3>
                <p className="mt-2 font-raleway text-sm text-[#757575]">Be the first buyer to share product and supplier feedback.</p>
              </div>
            ) : (
              product.reviews.slice().reverse().map((review) => (
                <article key={review._id} className={`${surfaceClass} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-raleway font-bold">{review.name}</p>
                      <p className="mt-1 font-raleway text-sm tracking-[0.12em] text-[#C5A992]">{renderStars(review.rating)}</p>
                    </div>
                    <span className="font-raleway text-xs font-semibold text-[#757575]">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-3 font-raleway leading-7 text-[#757575]">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </section>

        <RelatedProducts products={relatedProducts} loading={relatedLoading} />
      </Container>
    </PageShell>
  );
}

export default ProductDetail;
