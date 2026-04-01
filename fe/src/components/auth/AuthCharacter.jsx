import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment } from '@react-three/drei';
import { MathUtils } from 'three';

// An abstract stylized "Orb Mascot" constructed purely via WebGL primitives.
function Mascot({ action, mouse }) {
  const group = useRef();
  const armRight = useRef();
  const armLeft = useRef();
  const head = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Core breathing/floating
    if (group.current) {
      group.current.position.y = Math.sin(t * 2) * 0.1;
    }

    // 2. Parallax Cursor Tracking (Face looks at mouse)
    if (head.current) {
      head.current.rotation.y = MathUtils.lerp(head.current.rotation.y, (mouse.x * Math.PI) / 4, 0.1);
      head.current.rotation.x = MathUtils.lerp(head.current.rotation.x, -(mouse.y * Math.PI) / 4, 0.1);
    }

    // 3. Conditional Animations
    if (action === "wave") {
      // Continuous waving
      armRight.current.rotation.z = Math.sin(t * 8) * 0.5 - 1.5;
      armRight.current.rotation.x = 0;
    } else if (action === "point") {
      // Pointing excitedly forward towards the form
      armRight.current.rotation.z = MathUtils.lerp(armRight.current.rotation.z, -Math.PI / 2, 0.1);
      armRight.current.rotation.x = MathUtils.lerp(armRight.current.rotation.x, -Math.PI / 2, 0.1);
    } else if (action === "lean") {
      // Relaxed leaning pose
      if (group.current) {
        group.current.rotation.z = MathUtils.lerp(group.current.rotation.z, -0.2, 0.05);
      }
      armRight.current.rotation.z = -0.5;
      armLeft.current.rotation.z = 0.5;
    } else if (action === "nod") {
      // Tapping watch / Nodding
      if (head.current) {
        head.current.rotation.x = Math.sin(t * 5) * 0.2;
      }
      armLeft.current.rotation.z = 1.5;
      armLeft.current.rotation.x = -1.5;
    } else {
      // Reset
      armRight.current.rotation.z = MathUtils.lerp(armRight.current.rotation.z, -0.5, 0.1);
      armRight.current.rotation.x = MathUtils.lerp(armRight.current.rotation.x, 0, 0.1);
      if (group.current) group.current.rotation.z = MathUtils.lerp(group.current.rotation.z, 0, 0.1);
    }
  });

  return (
    <group ref={group} position={[0, -1, 0]}>
      {/* Head */}
      <group ref={head} position={[0, 1.8, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#8b5cf6" roughness={0.1} metalness={0.8} />
        </mesh>
        {/* Eye Visor */}
        <mesh position={[0, 0.2, 0.61]}>
          <planeGeometry args={[0.8, 0.4]} />
          <meshBasicMaterial color="#a78bfa" />
        </mesh>
      </group>

      {/* Body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.6, 1.5, 32]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Left Arm */}
      <group position={[-1, 1, 0]}>
        <mesh ref={armLeft} position={[0, -0.5, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>

      {/* Right Arm */}
      <group position={[1, 1, 0]}>
        <mesh ref={armRight} position={[0, -0.5, 0]} castShadow>
          <capsuleGeometry args={[0.15, 0.8]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
      </group>
    </group>
  );
}

export default function AuthCharacter({ action = "wave", mouse = { x: 0, y: 0 }, style }) {
  return (
    <div style={{ position: 'absolute', pointerEvents: 'none', zIndex: 999, ...style }}>
      <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
        <spotLight position={[-10, 10, 10]} intensity={1} angle={0.3} penumbra={1} color="#8b5cf6" />
        
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
          <Mascot action={action} mouse={mouse} />
        </Float>
        
        <Environment preset="city" />
        <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      </Canvas>
    </div>
  );
}
