"use client";

import Image from "next/image";
import {
  Maximize2,
  RotateCcw,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { cn } from "@/lib/utils";

interface TownPlanViewerProps {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  webpSrc?: string;
}

/**
 * Pan + zoom town-plan viewer with contrast boost so labels stay readable.
 */
export function TownPlanViewer({
  src,
  alt,
  caption,
  className,
  webpSrc,
}: TownPlanViewerProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const [enhanced, setEnhanced] = useState(true);

  const clampScale = (n: number) => Math.min(4, Math.max(0.6, n));

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => clampScale(s + delta));
  }, []);

  const reset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.x),
      y: dragStart.current.oy + (e.clientY - dragStart.current.y),
    });
  };

  const onPointerUp = () => setDragging(false);

  const onWheel = (e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    zoomBy(e.deltaY > 0 ? -0.12 : 0.12);
  };

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border bg-[#eef3f8]",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex-1 touch-none overflow-hidden",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <div
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          }}
        >
          <div className="relative h-[min(78vh,860px)] w-[min(98%,1400px)]">
            <Image
              src={webpSrc ?? src}
              alt={alt}
              fill
              priority
              quality={100}
              sizes="(max-width: 1400px) 100vw, 1400px"
              className={cn(
                "object-contain select-none",
                enhanced && "town-plan-enhanced",
              )}
              draggable={false}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/85 to-transparent" />

        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          {(
            [
              [ZoomIn, () => zoomBy(0.2), "Zoom in"],
              [ZoomOut, () => zoomBy(-0.2), "Zoom out"],
              [RotateCcw, reset, "Reset view"],
              [Maximize2, reset, "Fit to view"],
            ] as const
          ).map(([Icon, action, label]) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/95 text-primary-navy shadow-md transition hover:bg-primary-navy hover:text-white"
              onClick={action}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <button
            type="button"
            title={enhanced ? "Natural colors" : "Enhance clarity"}
            aria-label="Toggle image enhancement"
            className={cn(
              "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white/95 text-primary-navy shadow-md transition hover:bg-primary-navy hover:text-white",
              enhanced && "bg-[#E8F2FF] ring-2 ring-[#B7D4FF]",
            )}
            onClick={() => setEnhanced((v) => !v)}
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-text-secondary shadow-sm">
          Drag to pan · scroll to zoom · {Math.round(scale * 100)}%
        </p>
      </div>

      {caption ? (
        <p className="border-t border-border bg-white px-4 py-2.5 text-center text-xs text-text-secondary">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
