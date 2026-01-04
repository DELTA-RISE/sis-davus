"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Text, Trail } from "@react-three/drei";
import * as THREE from "three";
import { useScrollStore } from "@/lib/landing-store";

export function Scene() {
    const { viewport } = useThree();
    const isMobile = viewport.width < 5;

    // Global Scroll State from Zustand
    const scrollProgress = useScrollStore((state) => state.scrollProgress);

    // Refs
    const groupRef = useRef<THREE.Group>(null);
    const coreRef = useRef<THREE.Mesh>(null);
    const globeRef = useRef<THREE.Group>(null);
    const shieldRef = useRef<THREE.Mesh>(null);
    const ring1Ref = useRef<THREE.Mesh>(null);
    const ring2Ref = useRef<THREE.Mesh>(null);
    const ring3Ref = useRef<THREE.Mesh>(null);

    // Particles Data
    const particleCount = 40;
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < particleCount; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, []);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        const { x, y } = state.mouse;

        // --- PHASE LOGIC ---
        // 0.0 - 0.3: DATA (Octahedron + Chaos)
        // 0.3 - 0.6: NETWORK (Sphere + Connectivity)
        // 0.6 - 1.0: SECURITY (Icosahedron/Shield + Stability)

        // Helper for smooth opacity/scale transitions
        const getPhaseIntensity = (start: number, end: number) => {
            // 0.1 buffer for transition
            if (scrollProgress < start) return 0;
            if (scrollProgress > end) return 0;
            // Fade in
            if (scrollProgress < start + 0.1) return (scrollProgress - start) * 10;
            // Fade out
            if (scrollProgress > end - 0.1) return (end - scrollProgress) * 10;
            return 1;
        };

        // Phase 1: Data Core (Default) - Fades out as we scroll deep
        const phase1 = 1 - THREE.MathUtils.smoothstep(scrollProgress, 0.1, 0.3);

        // Phase 2: Globe Network
        const phase2 = THREE.MathUtils.smoothstep(scrollProgress, 0.2, 0.4) * (1 - THREE.MathUtils.smoothstep(scrollProgress, 0.6, 0.8));

        // Phase 3: Shield Vault
        const phase3 = THREE.MathUtils.smoothstep(scrollProgress, 0.7, 0.9);


        // --- ANIMATIONS ---

        // Rings (Always present but change behavior)
        if (ring1Ref.current) {
            ring1Ref.current.rotation.x = t * 0.2 + scrollProgress * 2;
            ring1Ref.current.rotation.y = t * 0.1;
            // Expand rings based on scroll
            const ringScale = 1 + scrollProgress * 0.5;
            ring1Ref.current.scale.setScalar(ringScale);
        }
        if (ring2Ref.current) {
            ring2Ref.current.rotation.x = t * -0.15;
            ring2Ref.current.rotation.y = t * 0.2 + scrollProgress * 2;
            const ringScale = 1 + scrollProgress * 0.6;
            ring2Ref.current.scale.setScalar(ringScale);
        }

        // 1. CORE (Octahedron)
        if (coreRef.current) {
            coreRef.current.scale.setScalar(phase1);
            coreRef.current.rotation.y += 0.01;
            coreRef.current.rotation.z += 0.005;
        }

        // 2. GLOBE (Points/Sphere)
        if (globeRef.current) {
            globeRef.current.scale.setScalar(phase2 * 1.5); // Make it slightly larger
            globeRef.current.rotation.y = t * 0.2;
        }

        // 3. SHIELD (Icosahedron)
        if (shieldRef.current) {
            shieldRef.current.scale.setScalar(phase3 * 1.2);
            shieldRef.current.rotation.x = t * 0.1;
            shieldRef.current.rotation.y = t * 0.1;
        }


        // Group Parallax
        if (groupRef.current) {
            const parallaxIntensity = isMobile ? 0.05 : 0.2;
            groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, x * parallaxIntensity, 0.1);
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, y * parallaxIntensity, 0.1);
            // Gentle bobbing
            groupRef.current.position.y += Math.sin(t) * 0.002;
        }

    });

    // Material Props
    const crystalMaterial = {
        thickness: 0.2,
        roughness: 0,
        transmission: 1,
        ior: 1.5,
        chromaticAberration: 0.2,
        backside: true,
    };

    const scale = isMobile ? 0.65 : 1;

    return (
        <group ref={groupRef} scale={[scale, scale, scale]}>
            <Float speed={2} rotationIntensity={isMobile ? 0.2 : 0.5} floatIntensity={0.2}>

                {/* --- STATE 1: CORE (DATA) --- */}
                <mesh ref={coreRef}>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshTransmissionMaterial {...crystalMaterial} color="#ffffff" toneMapped={false} />
                </mesh>

                {/* --- STATE 2: GLOBE (NETWORK) --- */}
                <group ref={globeRef} scale={0}>
                    <mesh>
                        <sphereGeometry args={[1, 16, 16]} />
                        <meshBasicMaterial wireframe color="#3b82f6" transparent opacity={0.3} />
                    </mesh>
                    {/* Nodes */}
                    {[...Array(8)].map((_, i) => (
                        <mesh key={i} position={[
                            Math.sin(i) * 1,
                            Math.cos(i) * 1,
                            Math.sin(i * 2) * 1
                        ]}>
                            <sphereGeometry args={[0.05]} />
                            <meshBasicMaterial color="#60a5fa" />
                        </mesh>
                    ))}
                </group>

                {/* --- STATE 3: SHIELD (SECURITY) --- */}
                <mesh ref={shieldRef} scale={0}>
                    <icosahedronGeometry args={[1.2, 0]} />
                    <MeshTransmissionMaterial
                        {...crystalMaterial}
                        color="#10b981"
                        distortion={0.5}
                        distortionScale={0.5}
                        temporalDistortion={0.2}
                    />
                </mesh>


                {/* PIVOTING RINGS (Always visible context) */}
                <mesh ref={ring1Ref}>
                    <torusGeometry args={[2.5, 0.02, 16, 100]} />
                    <meshStandardMaterial color="#ff5d38" emissive="#ff5d38" emissiveIntensity={2} toneMapped={false} />
                </mesh>

                <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[3.2, 0.01, 16, 100]} />
                    <meshStandardMaterial color="#ffffff" metalness={1} roughness={0.1} />
                </mesh>

                {/* Ambient Environment */}
                <pointLight position={[0, 0, 0]} intensity={2} color="#ffffff" distance={5} />
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} intensity={2} angle={0.5} penumbra={1} color="#ffffff" />

            </Float>
        </group>
    );
}
