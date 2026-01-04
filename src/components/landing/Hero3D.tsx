"use client";

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment } from "@react-three/drei";
import * as THREE from "three";

function FloatingCube({ position }: { position: [number, number, number] }) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const [hovered, setHover] = useState(false);

    useFrame((state, delta) => {
        meshRef.current.rotation.x += delta * 0.2;
        meshRef.current.rotation.y += delta * 0.2;
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh
                position={position}
                ref={meshRef}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                scale={hovered ? 1.1 : 1}
            >
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial
                    color={hovered ? "#ff5d38" : "#ffffff"}
                    wireframe
                    transparent
                    opacity={0.8}
                />
            </mesh>
        </Float>
    );
}

function DataPoints() {
    const points = useRef<THREE.Points>(null!);

    useFrame((state, delta) => {
        points.current.rotation.y -= delta * 0.05;
    });

    return (
        <points ref={points}>
            <sphereGeometry args={[4, 32, 32]} />
            <pointsMaterial size={0.05} color="#ff5d38" transparent opacity={0.4} />
        </points>
    );
}

export function Hero3D() {
    return (
        <div className="w-full h-[500px] absolute inset-0 -z-10 opacity-60">
            <Canvas>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} />
                <Environment preset="city" />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />

                <FloatingCube position={[0, 0, 0]} />
                <DataPoints />

                <fog attach="fog" args={["#000", 5, 20]} />
            </Canvas>
        </div>
    );
}
