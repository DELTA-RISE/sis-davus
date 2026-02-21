import { RefObject, useEffect } from "react";
import { useMotionValue } from "framer-motion";

export function useMouse(ref: RefObject<HTMLElement | null>) {
    const x = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
    const y = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            x.set(e.clientX);
            y.set(e.clientY);
        };

        window.addEventListener("mousemove", handleMouseMove);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [x, y, ref]);

    return { x, y };
}
