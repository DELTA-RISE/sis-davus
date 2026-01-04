"use client";

import { Canvas } from "@react-three/fiber";
import { Environment, Preload } from "@react-three/drei";
import { Suspense } from "react";
import { Scene } from "@/components/landing/cinematic/Scene";

export function Experience() {
    return (
        <div className="fixed inset-0 z-0 bg-black">
            <Canvas
                shadows
                dpr={[1, 2]}
                camera={{ position: [0, 0, 5], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <Scene />
                    <Environment preset="city" />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}
