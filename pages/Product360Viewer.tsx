import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, X, Play, Pause } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface Product360ViewerProps {
  /** Ordered array of image URLs — one per rotation frame (min 12, ideal 36–72) */
  frames: string[];
  productName?: string;
  /** Width of the magnifier glass in px (default 160) */
  magnifierSize?: number;
  /** Zoom multiplier (default 2.5) */
  zoomLevel?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const DRAG_SENSITIVITY = 3;   // pixels of drag per frame advance
const AUTO_PLAY_MS     = 80;  // ms between frames in autoplay

// ─────────────────────────────────────────────────────────────────────────────
// HOOK: Image preloader with progress tracking
// ─────────────────────────────────────────────────────────────────────────────

function usePreloadFrames(frames: string[]) {
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady]   = useState(false);
  const imagesRef           = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (!frames.length) return;
    setLoaded(0);
    setReady(false);
    imagesRef.current = [];

    let count = 0;
    frames.forEach((src, i) => {
      const img   = new Image();
      img.src     = src;
      img.onload  = () => { count++; setLoaded(count); if (count === frames.length) setReady(true); };
      img.onerror = () => { count++; setLoaded(count); if (count === frames.length) setReady(true); };
      imagesRef.current[i] = img;
    });
  }, [frames.join(',')]);   // re-run only if frame URLs change

  return { loaded, total: frames.length, ready };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const Product360Viewer: React.FC<Product360ViewerProps> = ({
  frames,
  productName = 'Product',
  magnifierSize = 160,
  zoomLevel = 2.5,
}) => {
  const total = frames.length;

  // ── State ──────────────────────────────────────────────────────────────────
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const [isAutoPlay, setIsAutoPlay]     = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHint, setShowHint]         = useState(true);
  const [isZoomed, setIsZoomed]         = useState(false);

  // Magnifier state
  const [magnifier, setMagnifier] = useState<{ x: number; y: number; show: boolean }>({
    x: 0, y: 0, show: false,
  });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const containerRef  = useRef<HTMLDivElement>(null);
  const dragStartX    = useRef(0);
  const frameAtDragStart = useRef(0);
  const autoPlayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Preloading ─────────────────────────────────────────────────────────────
  const { loaded, ready } = usePreloadFrames(frames);
  const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

  // ── Auto-play ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isAutoPlay && ready) {
      autoPlayTimer.current = setInterval(() => {
        setCurrentFrame(f => (f + 1) % total);
      }, AUTO_PLAY_MS);
    } else {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
    return () => { if (autoPlayTimer.current) clearInterval(autoPlayTimer.current); };
  }, [isAutoPlay, ready, total]);

  // Hide hint after 3 s
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // ── Drag helpers ───────────────────────────────────────────────────────────
  const getClientX = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    if ('touches' in e) return e.touches[0]?.clientX ?? ('changedTouches' in e ? e.changedTouches[0]?.clientX : 0);
    return (e as MouseEvent).clientX;
  };

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!ready) return;
    setIsDragging(true);
    setIsAutoPlay(false);
    setShowHint(false);
    dragStartX.current       = getClientX(e as any);
    frameAtDragStart.current = currentFrame;
    e.preventDefault();
  }, [ready, currentFrame]);

  const onDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const delta = getClientX(e) - dragStartX.current;
    const frameDelta = Math.floor(delta / DRAG_SENSITIVITY);
    const newFrame = ((frameAtDragStart.current - frameDelta) % total + total) % total;
    setCurrentFrame(newFrame);
  }, [isDragging, total]);

  const onDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('touchmove', onDragMove, { passive: true });
    window.addEventListener('mouseup',   onDragEnd);
    window.addEventListener('touchend',  onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('mouseup',   onDragEnd);
      window.removeEventListener('touchend',  onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  // ── Magnifier ──────────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMagnifier({
      x:    e.clientX - rect.left,
      y:    e.clientY - rect.top,
      show: true,
    });
  }, [isDragging, isZoomed]);

  const handleMouseLeave = useCallback(() => setMagnifier(m => ({ ...m, show: false })), []);

  // ── Frame progress bar segments ───────────────────────────────────────────
  const barSegments = useMemo(() => {
    return Array.from({ length: Math.min(total, 36) }, (_, i) => {
      const frameForSeg = Math.floor((i / Math.min(total, 36)) * total);
      return frameForSeg === currentFrame || Math.abs(frameForSeg - currentFrame) < total / 36 / 2;
    });
  }, [currentFrame, total]);

  // ── Render ─────────────────────────────────────────────────────────────────
  const viewerContent = (
    <div className="relative w-full h-full flex flex-col select-none">

      {/* Loading overlay */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4 rounded-2xl"
          >
            {/* Animated fastener icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full"
            />
            <div className="w-48 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest">
              Loading 360° · {progress}%
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main image area */}
      <div
        ref={containerRef}
        className={`relative flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-transparent ${
          isDragging ? 'cursor-grabbing' : isZoomed ? 'cursor-crosshair' : 'cursor-grab'
        }`}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Blueprint grid (matches parent page style) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04] rounded-2xl"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,0,0,1) 1px,transparent 1px),' +
              'linear-gradient(90deg,rgba(0,0,0,1) 1px,transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Frames — all rendered, only current is visible (avoids flash on frame change) */}
        {frames.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={idx === currentFrame ? `${productName} - 360° view` : ''}
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain transition-none"
            style={{
              opacity:         idx === currentFrame ? 1 : 0,
              pointerEvents:   idx === currentFrame ? 'none' : 'none',
              filter:          'drop-shadow(0 20px 40px rgba(0,0,0,0.12)) contrast(1.04) brightness(1.02)',
            }}
          />
        ))}

        {/* Drag hint */}
        <AnimatePresence>
          {showHint && ready && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-neutral-900/80 text-white text-xs font-mono font-bold uppercase tracking-widest px-4 py-2.5 rounded-full pointer-events-none"
            >
              <RotateCcw size={12} className="text-yellow-400" />
              Drag to Rotate
            </motion.div>
          )}
        </AnimatePresence>

        {/* Magnifier glass */}
        <AnimatePresence>
          {magnifier.show && isZoomed && !isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute pointer-events-none z-30 rounded-full overflow-hidden border-2 border-yellow-500 shadow-[0_0_0_3px_rgba(234,179,8,0.2),0_10px_40px_rgba(0,0,0,0.25)]"
              style={{
                width:  magnifierSize,
                height: magnifierSize,
                left:   magnifier.x - magnifierSize / 2,
                top:    magnifier.y - magnifierSize / 2,
              }}
            >
              {/* Get the container dimensions for background-position calculation */}
              <div
                style={{
                  width:      '100%',
                  height:     '100%',
                  backgroundImage:    `url(${frames[currentFrame]})`,
                  backgroundSize:     `${zoomLevel * 100}%`,
                  backgroundRepeat:   'no-repeat',
                  backgroundPosition: `${
                    -magnifier.x * zoomLevel + magnifierSize / 2
                  }px ${
                    -magnifier.y * zoomLevel + magnifierSize / 2
                  }px`,
                }}
              />
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[1px] h-full bg-yellow-500/30" />
                <div className="h-[1px] w-full bg-yellow-500/30 absolute" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-between mt-4 px-1 gap-3">

        {/* Frame progress bar */}
        <div className="flex-1 flex gap-[2px] items-end h-5">
          {barSegments.map((isActive, i) => (
            <button
              key={i}
              onClick={() => {
                if (!ready) return;
                setCurrentFrame(Math.floor((i / barSegments.length) * total));
                setIsAutoPlay(false);
              }}
              className={`flex-1 rounded-sm transition-all duration-150 ${
                isActive ? 'bg-yellow-500 h-4' : 'bg-neutral-300 h-2 hover:bg-neutral-400'
              }`}
            />
          ))}
        </div>

        {/* Icon buttons */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Autoplay toggle */}
          <button
            onClick={() => { setIsAutoPlay(p => !p); setShowHint(false); }}
            disabled={!ready}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all text-sm ${
              isAutoPlay
                ? 'bg-yellow-500 border-yellow-500 text-neutral-900 shadow-md'
                : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
            } disabled:opacity-30`}
            title={isAutoPlay ? 'Pause' : 'Auto-rotate'}
          >
            {isAutoPlay ? <Pause size={15} /> : <Play size={15} />}
          </button>

          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(z => !z)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-all ${
              isZoomed
                ? 'bg-yellow-500 border-yellow-500 text-neutral-900 shadow-md'
                : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900'
            }`}
            title={isZoomed ? 'Disable zoom' : 'Enable magnifier'}
          >
            {isZoomed ? <ZoomOut size={15} /> : <ZoomIn size={15} />}
          </button>

          {/* Reset */}
          <button
            onClick={() => { setCurrentFrame(0); setIsAutoPlay(false); }}
            disabled={!ready}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 transition-all disabled:opacity-30"
            title="Reset to front"
          >
            <RotateCcw size={15} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400 hover:text-neutral-900 transition-all"
            title="Fullscreen"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      </div>

      {/* Frame counter */}
      <div className="flex justify-center mt-2">
        <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-[0.25em]">
          {currentFrame + 1} / {total} frames
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* Inline viewer */}
      <div className="w-full h-full">{viewerContent}</div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-neutral-950/95 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-4xl aspect-square bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="w-10 h-10 rounded-full bg-white border border-neutral-200 text-neutral-500 hover:text-neutral-900 flex items-center justify-center shadow-lg"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="w-full h-full p-6">{viewerContent}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Product360Viewer;
