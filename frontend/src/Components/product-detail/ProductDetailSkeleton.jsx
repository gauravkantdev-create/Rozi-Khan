function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F2EC] px-5 py-10 text-[#2F2F2F] md:px-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="mb-8 h-4 w-64 bg-[#d8c8ba]" />
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="aspect-square border border-[#d8c8ba] bg-[#fffdf8]/70" />
          <div className="flex flex-col justify-center">
            <div className="mb-5 h-7 w-44 bg-[#d8c8ba]" />
            <div className="h-12 w-4/5 bg-[#d8c8ba]" />
            <div className="mt-4 h-12 w-3/5 bg-[#d8c8ba]" />
            <div className="mt-7 space-y-3">
              <div className="h-4 bg-[#d8c8ba]" />
              <div className="h-4 w-5/6 bg-[#d8c8ba]" />
              <div className="h-4 w-3/4 bg-[#d8c8ba]" />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="h-28 bg-[#fffdf8]/70" />
              <div className="h-28 bg-[#fffdf8]/70" />
            </div>
            <div className="mt-8 h-48 bg-[#fffdf8]/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailSkeleton;
