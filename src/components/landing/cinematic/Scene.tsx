"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Text } from "@react-three/drei";
import * as THREE from "three";

export function Scene() {
    const { viewport } = useThree();
    const isMobile = viewport.width < 5;

    // Refs for animation
    const coreRef = useRef<THREE.Group>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const ring3Ref = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const { x, y } = state.mouse;

        // Animate Rings (Gyroscope effect)
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = t * 0.2;
            ring1Ref.current.rotation.y = t * 0.1;
            ring1Ref.current.rotation.z += 0.005;
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.x = t * -0.15;
            ring2Ref.current.rotation.y = t * 0.2;
        }
        if (ring3Ref.current) {
            ring3Ref.current.rotation.x = Math.sin(t * 0.5) * 0.5;
            ring3Ref.current.rotation.y = t * 0.3;
        }

        // Animate Core Float
        if (coreRef.current) {
            // Mouse parallax for the whole group
            // Reduce parallax intensity on mobile to prevent disorientation
            const parallaxIntensity = isMobile ? 0.1 : 0.5;
            coreRef.current.position.x = THREE.MathUtils.lerp(coreRef.current.position.x, x * parallaxIntensity, 0.1);
            coreRef.current.position.y = THREE.MathUtils.lerp(coreRef.current.position.y, y * parallaxIntensity, 0.1);
            coreRef.current.rotation.y = t * 0.1;
        }
    });

    // Material Props for the "Crystal" look
    const crystalMaterial = {
        thickness: 0.2,
        roughness: 0,
        transmission: 1,
        ior: 1.5,
        chromaticAberration: 0.2,
        backside: true,
    };

    // Responsive scale calculation
    const scale = isMobile ? 0.65 : 1;

    return (
        <group ref={coreRef} scale={[scale, scale, scale]}>
            <Float speed={2} rotationIntensity={isMobile ? 0.2 : 0.5} floatIntensity={isMobile ? 0.2 : 0.5}>

                {/* CENTER CORE: The "Data" */}
                <mesh>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshTransmissionMaterial {...crystalMaterial} color="#ffffff" toneMapped={false} />
                </mesh>

                {/* Inner Glow */}
                <pointLight distance={3} intensity={4} color="#ff5d38" />

                {/* RING 1: High Tech (Orange) */}
                <mesh ref={ring1Ref}>
                    <torusGeometry args={[2.5, 0.05, 16, 100]} />
                    <meshStandardMaterial color="#ff5d38" emissive="#ff5d38" emissiveIntensity={2} toneMapped={false} />
                </mesh>

                {/* RING 2: Stability (White/Metal) */}
                <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[3.2, 0.03, 16, 100]} />
                    <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
                </mesh>

                {/* RING 3: Network (Blue) */}
                <mesh ref={ring3Ref} rotation={[0, Math.PI / 2, 0]}>
                    <torusGeometry args={[3.8, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={1.5} toneMapped={false} />
                </mesh>

                {/* Floating Particles/Data Points */}
                {[...Array(20)].map((_, i) => {
                    const angle = (i / 20) * Math.PI * 2;
                    const radius = 4 + Math.random() * 2;
                    return (
                        <group key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                            <mesh position={[Math.sin(angle) * radius, Math.cos(angle) * radius, 0]}>
                                <boxGeometry args={[0.1, 0.1, 0.1]} />
                                <meshStandardMaterial color={i % 2 === 0 ? "#ff5d38" : "#ffffff"} emissiveIntensity={2} />
                            </mesh>
                        </group>
                    )
                })}

            </Float>

            {/* Ambient Environment */}
            <ambientLight intensity={0.2} />
            <spotLight position={[10, 10, 10]} intensity={2} angle={0.5} penumbra={1} color="#ffffff" />
            <pointLight position={[-10, -5, -5]} intensity={5} color="#3b82f6" distance={10} />
        </group>
    );
}
