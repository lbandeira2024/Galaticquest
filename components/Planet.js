// src/components/Planet.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';

export default function Planet({ textureUrl, size, position = [0, 0, 0], rotationSpeed = 0.01, orbitRadius, orbitSpeed, onClick, isSun, name }) {
  const meshRef = useRef();
  const texture = useLoader(TextureLoader, textureUrl);
  const angle = useRef(Math.random() * Math.PI * 2);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
      if (!isSun && orbitRadius && orbitSpeed) {
        angle.current += orbitSpeed;
        const x = orbitRadius * Math.cos(angle.current);
        const z = orbitRadius * Math.sin(angle.current);
        meshRef.current.position.set(x, 0, z);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} onClick={onClick}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
