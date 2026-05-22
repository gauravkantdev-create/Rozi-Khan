function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] px-5 py-10 text-white md:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 h-4 w-64 rounded-full bg-white/10" />
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="aspect-square rounded-2xl border border-white/10 bg-white/[0.06]" />
          <div className="flex flex-col justify-center">
            <div className="mb-5 h-7 w-44 rounded-full bg-white/10" />
            <div className="h-12 w-4/5 rounded-xl bg-white/10" />
            <div className="mt-4 h-12 w-3/5 rounded-xl bg-white/10" />
            <div className="mt-7 space-y-3">
              <div className="h-4 rounded-full bg-white/10" />
              <div className="h-4 w-5/6 rounded-full bg-white/10" />
              <div className="h-4 w-3/4 rounded-full bg-white/10" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="h-28 rounded-2xl bg-white/[0.06]" />
              <div className="h-28 rounded-2xl bg-white/[0.06]" />
            </div>
            <div className="mt-8 h-48 rounded-2xl bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailSkeleton;
