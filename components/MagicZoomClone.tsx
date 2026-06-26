import React, { useRef, useState, useEffect } from "react";

interface Props {
  src: string;
  zoomSrc?: string;
  alt?: string;
  zoomLevel?: number;
  glassSize?: number;
}

const MagicZoomClone: React.FC<Props> = ({
  src,
  zoomSrc,
  alt,
  zoomLevel = 2.5,
  glassSize = 150,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showZoom, setShowZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const updateImgSize = () => {
    const imgElement = containerRef.current?.querySelector('img');
    if (imgElement) {
      const rect = imgElement.getBoundingClientRect();
      setImgSize({ width: rect.width, height: rect.height });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImgSize);
    return () => window.removeEventListener('resize', updateImgSize);
  }, []);

  const handlePointerMove = (clientX: number, clientY: number, touch: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    setPos({ x, y });
    setIsTouch(touch);
    if (!imgSize.width) updateImgSize();
  };

  const getGlassStyle = (): React.CSSProperties => {
    const containerHeight = containerRef.current?.clientHeight || 400;
    const containerWidth = containerRef.current?.clientWidth || 300;

    // ✅ SMART OFFSET LOGIC
    // Agar finger top 35% area mein hai, toh glass ko niche (positive offset) dikhao
    // Warna glass ko upar (negative offset) dikhao
    let dynamicOffset = 0;
    if (isTouch) {
      const isNearTop = pos.y < containerHeight * 0.35;
      dynamicOffset = isNearTop ? 110 : -110; 
    }

    // Accurate background percentage calculation
    const bgX = (pos.x / containerWidth) * 100;
    const bgY = (pos.y / containerHeight) * 100;

    return {
      width: isTouch ? 140 : glassSize,
      height: isTouch ? 140 : glassSize,
      left: pos.x,
      top: pos.y,
      position: "absolute",
      zIndex: 9999,
      pointerEvents: "none",
      borderRadius: "50%",
      border: "3px solid #EAB308",
      backgroundColor: "white",
      boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
      backgroundImage: `url(${zoomSrc || src})`,
      backgroundRepeat: "no-repeat",
      backgroundSize: `${zoomLevel * 100}%`,
      backgroundPosition: `${bgX}% ${bgY}%`,
      transform: `translate(-50%, -50%) translateY(${dynamicOffset}px)`,
      transition: isTouch ? "transform 0.15s ease-out" : "none",
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[450px] md:h-full flex items-center justify-center bg-rgb(197 197 197 / 0%) overflow-visible touch-none"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={(e) => {
        setShowZoom(true);
        handlePointerMove(e.clientX, e.clientY, false);
      }}
      onTouchStart={(e) => {
        setShowZoom(true);
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, true);
      }}
      onTouchMove={(e) => {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY, true);
      }}
      onTouchEnd={() => setShowZoom(false)}
    >
      {/* Main Image */}
      <img
        src={src}
        alt={alt}
        onLoad={updateImgSize}
        className="max-w-[95%] max-h-[95%] object-contain pointer-events-none"
      />

      {/* Magnifier Glass */}
      {showZoom && imgSize.width > 0 && (
        <div style={getGlassStyle()} />
      )}
    </div>
  );
};

export default MagicZoomClone;