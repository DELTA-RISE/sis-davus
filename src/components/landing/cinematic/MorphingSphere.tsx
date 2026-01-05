"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

// --- GLSL SHADERS ---

const VertexShader = `
  uniform float uTime;
  uniform float uDistort;
  uniform float uFrequency;
  
  varying vec2 vUv;
  varying float vDistort;
  
  // Simplex 3D Noise 
  // by Ian McEwan, Ashima Arts
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){ 
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //  x0 = x0 - 0.0 + 0.0 * C 
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    // Permutations
    i = mod(i, 289.0 ); 
    vec4 p = permute( permute( permute( 
               i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
             + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients
    float n_ = 1.0/7.0; // N=7
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vUv = uv;
    
    // Noise Calculation
    float noise = snoise(position * uFrequency + uTime * 0.5);
    
    // Displace vertices based on normal
    vec3 newPosition = position + normal * (noise * uDistort);
    
    vDistort = noise; // Pass noise to fragment shader for coloring
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA; // Deep Purple/Blue
  uniform vec3 uColorB; // Bright Cyan/Pink
  
  varying vec2 vUv;
  varying float vDistort;

  void main() {
    // Basic Fresnel / Rim effect
    // We can use vDistort to map color too
    
    // Remap distortion from [-1, 1] to [0, 1] for mixing
    float distortMix = (vDistort + 1.0) * 0.5;
    
    // Mix two colors based on distortion (Peaks = ColorB, Valleys = ColorA)
    vec3 color = mix(uColorA, uColorB, distortMix);
    
    // Add a pulsing glow
    float glow = abs(sin(uTime * 2.0)) * 0.2;
    
    gl_FragColor = vec4(color + glow, 1.0);
  }
`;

// Create the declarative material
const MorphingMaterial = shaderMaterial(
    {
        uTime: 0,
        uDistort: 0.4,
        uFrequency: 1.5,
        uColorA: new THREE.Color("#7c2d12"), // Orange 900 (Dark Base)
        uColorB: new THREE.Color("#ff5d38"), // Brand Primary (Highlight)
    },
    VertexShader,
    FragmentShader
);

// Register with R3F
// Register with R3F
extend({ MorphingMaterial });

/* eslint-disable @typescript-eslint/no-empty-interface */
declare module "@react-three/fiber" {
    interface ThreeElements {
        morphingMaterial: any;
    }
}
/* eslint-enable @typescript-eslint/no-empty-interface */

interface MorphingSphereProps {
    phase?: "data" | "network" | "shield";
}

export function MorphingSphere({ phase = "data" }: MorphingSphereProps) {
    const materialRef = useRef<any>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uTime = state.clock.getElapsedTime();

            // Dynamic parameters based on phase could go here, 
            // but we'll control basic time/motion first.
        }
    });

    return (
        <mesh scale={1.2}>
            {/* High polycount needed for smooth vertex displacement */}
            <icosahedronGeometry args={[1, 64]} />
            <morphingMaterial
                ref={materialRef}
                transparent
                wireframe={false}
            />
        </mesh>
    );
}
