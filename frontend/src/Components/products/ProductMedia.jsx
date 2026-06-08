import { useState } from "react";

const fallbackImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='720' viewBox='0 0 720 720'%3E%3Crect width='720' height='720' fill='%23F3F2EC'/%3E%3Crect x='132' y='138' width='456' height='416' fill='%23fffdf8' stroke='%23C5A992' stroke-width='10'/%3E%3Cpath d='M190 460l110-128 84 92 62-72 96 108H190z' fill='%23C5A992' opacity='.34'/%3E%3Ccircle cx='462' cy='252' r='46' fill='%232F2F2F' opacity='.12'/%3E%3Ctext x='360' y='612' text-anchor='middle' font-family='Georgia' font-size='34' fill='%232F2F2F'%3ERoziKhan%3C/text%3E%3C/svg%3E";

function ProductMedia({ src, alt, className = "", imgClassName = "" }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = failed || !src ? fallbackImage : src;

  return (
    <div className={`relative overflow-hidden bg-[#ebe4d8] ${className}`}>
      <div className="absolute inset-3 border border-[#C5A992]/30" />
      <img
        src={imageSrc}
        alt={alt}
        onError={() => setFailed(true)}
        className={`relative z-10 h-full w-full object-contain p-5 transition duration-700 group-hover:scale-105 ${imgClassName}`}
      />
    </div>
  );
}

export default ProductMedia;
