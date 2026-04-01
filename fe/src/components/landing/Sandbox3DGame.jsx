import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Float, Text3D, Center, ContactShadows, Environment, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@mui/material/styles';

function InteractiveShape({ position, color, speed, type }) {
  const ref = useRef();
  const [hovered, setHover] = useState(false);
  const [clicked, setClick] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    ref.current.position.y = position[1] + Math.sin(t) * (hovered ? 0.5 : 0.2);
    ref.current.rotation.x = Math.cos(t) * 0.5;
    ref.current.rotation.z = Math.sin(t) * 0.5;
    
    // Scale spring animation
    const targetScale = clicked ? 1.5 : hovered ? 1.2 : 1;
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'grab'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = 'none'; }}
      onPointerDown={() => { setClick(true); document.body.style.cursor = 'grabbing'; }}
      onPointerUp={() => { setClick(false); document.body.style.cursor = 'grab'; }}
      castShadow
      receiveShadow
    >
      {type === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {type === 'sphere' && <sphereGeometry args={[0.7, 32, 32]} />}
      {type === 'torus' && <torusGeometry args={[0.6, 0.2, 16, 100]} />}
      {type === 'octahedron' && <octahedronGeometry args={[0.8]} />}
      <MeshWobbleMaterial factor={hovered ? 0.8 : 0.1} speed={hovered ? 2 : 1} color={color} roughness={0.1} metalness={0.8} />
    </mesh>
  );
}

export default function Sandbox3DGame() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'auto' }}>
      <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
        <ambientLight intensity={isDark ? 0.5 : 1} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#c084fc" />
        
        <PresentationControls global config={{ mass: 2, tension: 500 }} snap={{ mass: 4, tension: 1500 }} rotation={[0, 0, 0]} polar={[-Math.PI / 4, Math.PI / 4]} azimuth={[-Math.PI / 4, Math.PI / 4]}>
          <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
            {/* Interactive Physics Shapes */}
            <InteractiveShape type="box" position={[-3, 1, 0]} color="#6366f1" speed={1.2} />
            <InteractiveShape type="sphere" position={[3, 2, -1]} color="#f43f5e" speed={0.8} />
            <InteractiveShape type="torus" position={[0, -2, 1]} color="#10b981" speed={1.5} />
            <InteractiveShape type="octahedron" position={[-2, -1.5, -2]} color="#f59e0b" speed={1.1} />
            <InteractiveShape type="sphere" position={[2.5, -1, 2]} color="#8b5cf6" speed={1.3} />
          </Float>
        </PresentationControls>

        <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={20} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
