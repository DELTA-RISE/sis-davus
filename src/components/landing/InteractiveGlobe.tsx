"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";
// Patch moved to @/lib/fix-r3f-data-props


function HolographicGlobe() {
    const globeRef = useRef<THREE.Group>(null);
    const ringRef1 = useRef<THREE.Mesh>(null);
    const ringRef2 = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (globeRef.current) {
            globeRef.current.rotation.y += 0.001;
        }
        if (ringRef1.current) {
            ringRef1.current.rotation.z += 0.002;
            ringRef1.current.rotation.x += 0.001;
        }
        if (ringRef2.current) {
            ringRef2.current.rotation.z -= 0.003;
            ringRef2.current.rotation.y -= 0.001;
        }
    });

    return (
        <group ref={globeRef}>
            {/* Core Globe (Wireframe) */}
            <Sphere args={[2.5, 32, 32]}>
                <meshBasicMaterial
                    color="#3b82f6"
                    wireframe
                    transparent
                    opacity={0.15}
                />
            </Sphere>

            {/* Inner Glow Sphere */}
            <Sphere args={[2.4, 32, 32]}>
                <meshBasicMaterial color="#60a5fa" transparent opacity={0.05} />
            </Sphere>

            {/* Floating Data Nodes (random points on surface) */}
            <Points count={20} color="#60a5fa" radius={2.55} size={0.08} />
            <Points count={40} color="#ffffff" radius={2.6} size={0.03} />

            {/* Orbital Rings representing Scanning/Security */}
            <mesh ref={ringRef1} rotation={[Math.PI / 3, 0, 0]}>
                <torusGeometry args={[3.2, 0.02, 16, 100]} />
                <meshBasicMaterial color="#4ade80" transparent opacity={0.4} />
            </mesh>

            <mesh ref={ringRef2} rotation={[-Math.PI / 4, 0, 0]}>
                <torusGeometry args={[3.8, 0.02, 16, 100]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

function Points({ count, color, radius, size }: { count: number, color: string, radius: number, size: number }) {
    const points = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            temp.push(new THREE.Vector3(x, y, z));
        }
        return temp;
    }, [count, radius]);

    return (
        <group>
            {points.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <sphereGeometry args={[size, 8, 8]} />
                    <meshBasicMaterial color={color} />
                </mesh>
            ))}
        </group>
    )
}

export function InteractiveGlobe({ className = "" }: { className?: string }) {
    return (
        <div className={`w-full h-full min-h-[300px] ${className}`}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <HolographicGlobe />
                <fog attach="fog" args={['#000', 5, 25]} />
            </Canvas>
        </div>
    );
}
