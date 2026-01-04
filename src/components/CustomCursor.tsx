"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSound } from "@/components/SoundProvider";

export function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const { playClick, playHover } = useSound();
  const pathname = usePathname();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for the cursor ring
  const springConfig = { damping: 20, stiffness: 250, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show cursor on all pages, but ensure it doesn't conflict with touch devices
  const shouldRender = mounted && typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  useEffect(() => {
    if (!shouldRender) return;

    document.documentElement.classList.add('custom-cursor-active');

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible && e.clientX > 5 && e.clientX < window.innerWidth - 5 && e.clientY > 5 && e.clientY < window.innerHeight - 5) {
        setIsVisible(true);
      }
    };

    const handleMouseDown = () => {
      setIsClicked(true);
      playClick();
    };
    const handleMouseUp = () => setIsClicked(false);

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Expanded selector list for interactive elements
      if (
        target.closest('button, a, input, textarea, [role="button"], .magnetic-btn, .cursor-hover') ||
        window.getComputedStyle(target).cursor === 'pointer'
      ) {
        setIsHovered(true);
        playHover();
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"], .magnetic-btn, .cursor-hover')) {
        setIsHovered(false);
      }
    };

    // Add explicit mouseleave for window to hide cursor when leaving viewport
    const handleWindowLeave = () => setIsVisible(false);
    const handleWindowEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseover", handleMouseEnter);
    window.addEventListener("mouseout", handleMouseLeave); // Using mouseout/mouseover for bubbling
    document.addEventListener("mouseleave", handleWindowLeave);
    document.addEventListener("mouseenter", handleWindowEnter);

    return () => {
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseover", handleMouseEnter);
      window.removeEventListener("mouseout", handleMouseLeave);
      document.removeEventListener("mouseleave", handleWindowLeave);
      document.removeEventListener("mouseenter", handleWindowEnter);
    };
  }, [shouldRender, mouseX, mouseY, isVisible]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Outer Ring - Follows with delay */}
      <motion.div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          scale: isClicked ? 0.8 : isHovered ? 2.5 : 1,
          backgroundColor: isHovered ? "white" : "transparent",
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: "spring", ...springConfig }}
      />

      {/* Inner Dot - Follows instantly */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference hidden md:block"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
}
