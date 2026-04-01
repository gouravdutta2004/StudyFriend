import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import { Canvas, useFrame } from '@react-three/fiber';
import { PresentationControls, Environment, Float, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

const CLASSES = [
  { id: 'coder', name: 'The Architect', color: '#6366f1', description: 'Tech, CS, Engineering', form: 'box' },
  { id: 'medical', name: 'The Healer', color: '#10b981', description: 'Med, Bio, Health', form: 'sphere' },
  { id: 'artist', name: 'The Visionary', color: '#f43f5e', description: 'Design, Art, Lit', form: 'torus' }
];

function CharacterModel({ color, form, isSelected, position, onClick }) {
  const ref = useRef();

  useFrame((state) => {
    if (isSelected) {
      ref.current.rotation.y += 0.02;
      ref.current.scale.lerp(new THREE.Vector3(1.5, 1.5, 1.5), 0.1);
    } else {
      ref.current.scale.lerp(new THREE.Vector3(0.8, 0.8, 0.8), 0.1);
    }
  });

  return (
    <mesh ref={ref} position={position} onClick={onClick}>
      {form === 'box' && <boxGeometry args={[1, 1.5, 1]} />}
      {form === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      {form === 'torus' && <torusGeometry args={[0.8, 0.3, 16, 100]} />}
      <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} emissive={isSelected ? color : '#000000'} emissiveIntensity={0.5} />
    </mesh>
  );
}

export default function Signup3D() {
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();

  const activeClass = CLASSES[selected];

  const handleContinue = () => {
    // In a real app we'd pass this via React Context or URL state
    navigate('/register');
  };

  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: '#020617', overflow: 'hidden', position: 'relative' }}>
      
      {/* 3D Scene */}
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
        <PointLight color={activeClass.color} position={[0, 0, 0]} intensity={2} />
        
        <PresentationControls global rotation={[0, 0, 0]} polar={[-0.1, 0.1]} azimuth={[-Math.PI/4, Math.PI/4]}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <group position={[0, -0.5, 0]}>
              {CLASSES.map((c, i) => (
                <CharacterModel 
                  key={c.id} 
                  color={c.color} 
                  form={c.form}
                  position={[(i - 1) * 3, 0, isSelected(i) ? 1 : 0]} 
                  isSelected={isSelected(i)} 
                  onClick={(e) => { e.stopPropagation(); setSelected(i); }} 
                />
              ))}
            </group>
          </Float>
        </PresentationControls>

        <ContactShadows position={[0, -2, 0]} opacity={0.7} scale={20} blur={2} far={4} />
      </Canvas>

      {/* UI Overlay */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', flexDirection: 'column', p: 4, justifyContent: 'space-between' }}>
        <Typography variant="h3" fontWeight={900} color="white" textAlign="center" sx={{ letterSpacing: -1, mt: 4 }}>
          CHOOSE YOUR PATH
        </Typography>

        <Box sx={{ textAlign: 'center', mb: 8, pointerEvents: 'auto' }}>
          <Typography variant="h2" fontWeight={900} color={activeClass.color} sx={{ textShadow: `0 0 20px ${activeClass.color}80` }}>
            {activeClass.name}
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.7)" mb={4}>
            {activeClass.description}
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
             {CLASSES.map((c, i) => (
                <Button key={c.id} variant="outlined" onClick={() => setSelected(i)} sx={{ 
                    borderColor: selected === i ? c.color : 'rgba(255,255,255,0.2)', 
                    color: selected === i ? c.color : 'rgba(255,255,255,0.5)', 
                    borderRadius: 4, px: 3
                }}>
                  {c.name}
                </Button>
             ))}
          </Box>

          <Button 
            variant="contained" 
            onClick={handleContinue}
            sx={{ 
              mt: 5, bgcolor: activeClass.color, color: 'white', fontWeight: 900, fontSize: '1.2rem', py: 1.5, px: 8, borderRadius: 8,
              boxShadow: `0 10px 30px ${activeClass.color}50`, '&:hover': { bgcolor: activeClass.color, opacity: 0.9 }
            }}
          >
            CONFIRM SELECTION
          </Button>
        </Box>
      </Box>

    </Box>
  );

  function isSelected(i) {
    return selected === i;
  }
}

// Helper Light
function PointLight({color, ...props}) {
  return <pointLight color={color} {...props} />
}
