"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function CustomCursor() {
  const cursorRef = useRef(null);
  const trailRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [isHoveredInteractive, setIsHoveredInteractive] = useState(false);

  // Dynamic Theme Synchronization via MutationObserver & Storage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains("dark");
      setIsDark(isDarkMode);
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("storage", checkTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", checkTheme);
    };
  }, []);

  useEffect(() => {
    // Only enable custom cursor for fine pointer devices (desktops/laptops, not touchscreens)
    if (typeof window === "undefined" || window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    const cursor = cursorRef.current;
    const trail = trailRef.current;
    if (!cursor || !trail) return;

    // Snappy follow trail tracking via GSAP quickTo
    const trailXTo = gsap.quickTo(trail, "x", { duration: 0.14, ease: "power3.out" });
    const trailYTo = gsap.quickTo(trail, "y", { duration: 0.14, ease: "power3.out" });

    // Center offset (5px for 10px dot, 14px for 28px trail)
    const handleMouseMove = (e) => {
      if (!isVisible) setIsVisible(true);
      // Primary cursor dot has 0ms latency - 100% 1:1 hardware pointer synchronization
      gsap.set(cursor, { x: e.clientX - 5, y: e.clientY - 5 });
      trailXTo(e.clientX - 14);
      trailYTo(e.clientY - 14);
    };

    const handleMouseEnter = () => setIsVisible(true);
    const handleMouseLeave = () => setIsVisible(false);

    // Interactive element hover detection: scale to 1.6x & reduce opacity slightly with fast 120ms ease
    const handleMouseOver = (e) => {
      const target = e.target;
      const isInteractive = target && target.closest(
        'button, a, input, select, textarea, [role="button"], .raised-card, .dag-node, .surface-deck, [data-interactive="true"]'
      );

      if (isInteractive) {
        setIsHoveredInteractive(true);
        gsap.to(cursor, {
          scale: 1.6,
          opacity: 0.85,
          duration: 0.12,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(trail, {
          scale: 1.45,
          opacity: 0.5,
          duration: 0.12,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    const handleMouseOut = (e) => {
      const target = e.target;
      const isInteractive = target && target.closest(
        'button, a, input, select, textarea, [role="button"], .raised-card, .dag-node, .surface-deck, [data-interactive="true"]'
      );

      if (isInteractive) {
        setIsHoveredInteractive(false);
        gsap.to(cursor, {
          scale: 1.0,
          opacity: 1.0,
          duration: 0.12,
          ease: "power2.out",
          overwrite: "auto",
        });
        gsap.to(trail, {
          scale: 1.0,
          opacity: 0.35,
          duration: 0.12,
          ease: "power2.out",
          overwrite: "auto",
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mouseout", handleMouseOut, { passive: true });
    document.addEventListener("mouseenter", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mouseout", handleMouseOut);
      document.removeEventListener("mouseenter", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  // Strictly Interchangeable Theme-Inverted Color Tokens:
  // - Light Theme (white background) -> Pure Jet Black cursor (dot & trail)
  // - Dark Theme (black background)  -> Pure Radiant White cursor (dot & trail)
  const dotColor = isDark ? "bg-white" : "bg-black";

  const dotBorder = isDark
    ? "border border-black ring-1 ring-white/80"
    : "border border-white ring-1 ring-black/80";

  const dotShadow = isDark
    ? isHoveredInteractive
      ? "0 0 16px rgba(255, 255, 255, 1), 0 0 24px rgba(255, 255, 255, 0.7)"
      : "0 0 10px rgba(255, 255, 255, 0.95), 0 0 18px rgba(255, 255, 255, 0.4)"
    : isHoveredInteractive
    ? "0 0 10px rgba(0, 0, 0, 0.8), 0 2px 8px rgba(0, 0, 0, 0.6)"
    : "0 2px 6px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.9)";

  const trailBorder = isDark
    ? isHoveredInteractive
      ? "border-2 border-white/90 bg-white/15 shadow-[0_0_16px_rgba(255,255,255,0.4)]"
      : "border-2 border-white/70 bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
    : isHoveredInteractive
    ? "border-2 border-black/90 bg-black/15 shadow-[0_2px_12px_rgba(0,0,0,0.3)]"
    : "border-2 border-black/70 bg-black/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)]";

  return (
    <>
      {/* Outer Spring Follow Trail (Interchangeable Black / White Ring) */}
      <div
        ref={trailRef}
        className={`fixed top-0 left-0 w-7 h-7 rounded-full pointer-events-none z-[9998] transition-[background-color,border-color,box-shadow,opacity] duration-200 ease-out ${trailBorder}`}
        style={{
          opacity: isVisible ? 0.45 : 0,
        }}
      />
      {/* 10px Circular Primary Dot (Instant 1:1 Hardware Tracking, ZERO Lag) */}
      <div
        ref={cursorRef}
        className={`fixed top-0 left-0 w-2.5 h-2.5 rounded-full pointer-events-none z-[9999] transition-[background-color,border-color,box-shadow] duration-200 ease-out ${dotColor} ${dotBorder}`}
        style={{
          opacity: isVisible ? 1.0 : 0,
          boxShadow: dotShadow,
        }}
      />
    </>
  );
}
