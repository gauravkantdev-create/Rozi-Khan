import ProductMedia from "../products/ProductMedia";

function ProductGallery({ images = [], productName }) {
  const primaryImage = images.find(Boolean);

  return (
    <section className="group border border-[#d8c8ba] bg-[#fffdf8]/82 p-3 shadow-[0_24px_70px_rgba(47,47,47,0.08)]">
      <ProductMedia src={primaryImage} alt={productName} className="aspect-square" imgClassName="p-8" />

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-3">
          {images.slice(0, 4).map((image, index) => (
            <div key={`${image}-${index}`} className="aspect-square overflow-hidden border border-[#d8c8ba] bg-[#F3F2EC] p-2">
              <img src={image} alt={`${productName} preview ${index + 1}`} className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductGallery;
