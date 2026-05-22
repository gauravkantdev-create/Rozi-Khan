import useThemeMode from "../../hooks/useThemeMode";

function ProductGallery({ images = [], productName }) {
  const { isDark } = useThemeMode();
  const primaryImage = images.find(Boolean);

  return (
    <section
      className={`group relative overflow-hidden rounded-2xl border shadow-2xl ${
        isDark ? "border-white/10 bg-[#101114] shadow-black/40" : "border-slate-200 bg-slate-50 shadow-slate-200/80"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.14),transparent_32%),radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.1),transparent_28%)] opacity-80" />

      <div className="relative flex aspect-square items-center justify-center p-5 sm:p-8">
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={productName}
            className="h-full w-full object-contain transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-black/25 text-center">
            <span className={`text-sm font-semibold uppercase tracking-[0.28em] ${isDark ? "text-gray-500" : "text-slate-500"}`}>
              RoziKhan
            </span>
            <p className={`mt-3 text-lg font-bold ${isDark ? "text-gray-300" : "text-slate-600"}`}>
              Product image coming soon
            </p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="relative grid grid-cols-4 gap-3 border-t border-white/10 bg-black/20 p-4">
          {images.slice(0, 4).map((image, index) => (
            <div
              key={`${image}-${index}`}
              className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-white p-1"
            >
              <img
                src={image}
                alt={`${productName} preview ${index + 1}`}
                className="h-full w-full object-contain"
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default ProductGallery;
