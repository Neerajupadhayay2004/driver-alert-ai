import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface HeadModelProps {
  pitch: number;
  yaw: number;
  roll: number;
}

function HeadModel({ pitch, yaw, roll }: HeadModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    targetRotation.current = {
      x: THREE.MathUtils.degToRad(pitch),
      y: THREE.MathUtils.degToRad(-yaw),
      z: THREE.MathUtils.degToRad(-roll),
    };
  }, [pitch, yaw, roll]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        0.1
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current.y,
        0.1
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRotation.current.z,
        0.1
      );
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial 
          color="#1e3a5f" 
          metalness={0.3}
          roughness={0.7}
        />
      </mesh>

      {/* Face plane */}
      <mesh position={[0, 0, 0.9]}>
        <planeGeometry args={[1.2, 1.4]} />
        <meshStandardMaterial 
          color="#2d5a87" 
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>

      {/* Left eye */}
      <mesh position={[-0.3, 0.2, 1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Right eye */}
      <mesh position={[0.3, 0.2, 1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0, 1.1]}>
        <coneGeometry args={[0.1, 0.3, 8]} />
        <meshStandardMaterial color="#3d6a97" />
      </mesh>

      {/* Direction indicator */}
      <mesh position={[0, 0, 1.5]}>
        <coneGeometry args={[0.05, 0.4, 8]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          emissive="#00d4ff" 
          emissiveIntensity={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Axis lines */}
      <axesHelper args={[2]} />
    </group>
  );
}

function Grid() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
      <planeGeometry args={[10, 10, 20, 20]} />
      <meshBasicMaterial 
        color="#00d4ff" 
        wireframe 
        transparent 
        opacity={0.1}
      />
    </mesh>
  );
}

interface Head3DViewerProps {
  pitch: number;
  yaw: number;
  roll: number;
}

export function Head3DViewer({ pitch, yaw, roll }: Head3DViewerProps) {
  return (
    <div className="w-full h-full min-h-[200px]">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff6b6b" />
        <spotLight
          position={[0, 5, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1}
          color="#ffffff"
        />
        
        <HeadModel pitch={pitch} yaw={yaw} roll={roll} />
        <Grid />
        
        <fog attach="fog" args={['#0a1628', 5, 15]} />
      </Canvas>
    </div>
  );
}
