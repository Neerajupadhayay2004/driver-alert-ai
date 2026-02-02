import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';

interface HeadModelProps {
  pitch: number;
  yaw: number;
  roll: number;
}

// Enhanced head geometry with more detail
function HeadModel({ pitch, yaw, roll }: HeadModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0, z: 0 });
  const eyeLeftRef = useRef<THREE.Mesh>(null);
  const eyeRightRef = useRef<THREE.Mesh>(null);
  
  // Alert color based on pitch (looking down = drowsy)
  const alertColor = useMemo(() => {
    if (Math.abs(pitch) > 20 || Math.abs(yaw) > 25) {
      return new THREE.Color('#ff4444');
    } else if (Math.abs(pitch) > 10 || Math.abs(yaw) > 15) {
      return new THREE.Color('#ffaa00');
    }
    return new THREE.Color('#00d4ff');
  }, [pitch, yaw]);

  useEffect(() => {
    targetRotation.current = {
      x: THREE.MathUtils.degToRad(pitch),
      y: THREE.MathUtils.degToRad(-yaw),
      z: THREE.MathUtils.degToRad(-roll),
    };
  }, [pitch, yaw, roll]);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        5 * delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current.y,
        5 * delta
      );
      groupRef.current.rotation.z = THREE.MathUtils.lerp(
        groupRef.current.rotation.z,
        targetRotation.current.z,
        5 * delta
      );
    }

    // Subtle eye glow animation
    if (eyeLeftRef.current && eyeRightRef.current) {
      const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
      (eyeLeftRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
      (eyeRightRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={groupRef}>
        {/* Main head - slightly elongated sphere */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial 
            color="#1a2f4a"
            metalness={0.4}
            roughness={0.6}
            envMapIntensity={0.8}
          />
        </mesh>

        {/* Face plate with gradient effect */}
        <mesh position={[0, 0, 0.85]} castShadow>
          <circleGeometry args={[0.75, 64]} />
          <meshStandardMaterial 
            color="#2a4a6a"
            metalness={0.3}
            roughness={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Forehead detail */}
        <mesh position={[0, 0.5, 0.7]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.8, 0.15, 0.1]} />
          <meshStandardMaterial 
            color="#0a1525"
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>

        {/* Left eye socket */}
        <mesh position={[-0.32, 0.15, 0.9]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#0a1525" />
        </mesh>

        {/* Right eye socket */}
        <mesh position={[0.32, 0.15, 0.9]}>
          <circleGeometry args={[0.18, 32]} />
          <meshStandardMaterial color="#0a1525" />
        </mesh>

        {/* Left eye - glowing */}
        <mesh ref={eyeLeftRef} position={[-0.32, 0.15, 0.95]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial 
            color={alertColor}
            emissive={alertColor}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Left eye inner glow */}
        <mesh position={[-0.32, 0.15, 1.0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Right eye - glowing */}
        <mesh ref={eyeRightRef} position={[0.32, 0.15, 0.95]}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial 
            color={alertColor}
            emissive={alertColor}
            emissiveIntensity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Right eye inner glow */}
        <mesh position={[0.32, 0.15, 1.0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial 
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={1}
          />
        </mesh>

        {/* Nose bridge */}
        <mesh position={[0, 0, 0.95]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[0.08, 0.25, 0.15]} />
          <meshStandardMaterial 
            color="#2a4a6a"
            metalness={0.4}
            roughness={0.5}
          />
        </mesh>

        {/* Nose tip */}
        <mesh position={[0, -0.12, 1.05]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#3a5a7a"
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* Mouth line */}
        <mesh position={[0, -0.35, 0.88]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.05]} />
          <meshStandardMaterial 
            color="#0a1525"
            metalness={0.5}
            roughness={0.4}
          />
        </mesh>

        {/* Chin */}
        <mesh position={[0, -0.55, 0.6]}>
          <sphereGeometry args={[0.25, 32, 32]} />
          <meshStandardMaterial 
            color="#1a2f4a"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Left ear */}
        <mesh position={[-0.95, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.08, 16]} />
          <meshStandardMaterial 
            color="#1a2f4a"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Right ear */}
        <mesh position={[0.95, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.15, 0.12, 0.08, 16]} />
          <meshStandardMaterial 
            color="#1a2f4a"
            metalness={0.4}
            roughness={0.6}
          />
        </mesh>

        {/* Direction indicator arrow */}
        <group position={[0, 0, 1.3]}>
          <mesh>
            <coneGeometry args={[0.06, 0.25, 8]} />
            <meshStandardMaterial 
              color={alertColor}
              emissive={alertColor}
              emissiveIntensity={0.6}
              transparent
              opacity={0.9}
            />
          </mesh>
          {/* Arrow glow ring */}
          <mesh position={[0, -0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.1, 0.02, 8, 16]} />
            <meshStandardMaterial 
              color={alertColor}
              emissive={alertColor}
              emissiveIntensity={0.5}
              transparent
              opacity={0.7}
            />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, -0.9, -0.1]} rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.35, 0.4, 16]} />
          <meshStandardMaterial 
            color="#152535"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Tech lines on head */}
        {[0.3, 0.5, 0.7].map((y, i) => (
          <mesh key={i} position={[0, y, 0.92]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.5 - i * 0.1, 0.01, 0.02]} />
            <meshStandardMaterial 
              color={alertColor}
              emissive={alertColor}
              emissiveIntensity={0.4}
              transparent
              opacity={0.5}
            />
          </mesh>
        ))}

        {/* Side tech accents */}
        <mesh position={[-0.7, 0.2, 0.4]} rotation={[0, -0.5, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshStandardMaterial 
            color={alertColor}
            emissive={alertColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
        <mesh position={[0.7, 0.2, 0.4]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[0.02, 0.3, 0.15]} />
          <meshStandardMaterial 
            color={alertColor}
            emissive={alertColor}
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      </group>
    </Float>
  );
}

// Enhanced grid with perspective
function Grid() {
  const gridRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (gridRef.current) {
      gridRef.current.rotation.z += 0.0005;
    }
  });

  return (
    <group>
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[20, 20, 40, 40]} />
        <meshBasicMaterial 
          color="#00d4ff" 
          wireframe 
          transparent 
          opacity={0.08}
        />
      </mesh>
      {/* Concentric circles */}
      {[1, 2, 3, 4].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <ringGeometry args={[r * 1.5, r * 1.5 + 0.02, 64]} />
          <meshBasicMaterial 
            color="#00d4ff" 
            transparent 
            opacity={0.1 - i * 0.02}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Animated particles around head
function HeadParticles() {
  return (
    <Sparkles
      count={50}
      scale={4}
      size={2}
      speed={0.3}
      opacity={0.3}
      color="#00d4ff"
    />
  );
}

// Angle display component
function AngleDisplay({ pitch, yaw, roll }: HeadModelProps) {
  const { camera } = useThree();
  
  // Position in front of camera
  return null; // We'll handle this in React overlay instead
}

interface Head3DViewerProps {
  pitch: number;
  yaw: number;
  roll: number;
}

export function Head3DViewer({ pitch, yaw, roll }: Head3DViewerProps) {
  // Determine alert state for border color
  const isWarning = Math.abs(pitch) > 10 || Math.abs(yaw) > 15;
  const isCritical = Math.abs(pitch) > 20 || Math.abs(yaw) > 25;

  return (
    <motion.div 
      className="w-full h-full min-h-[200px] relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 3D Canvas */}
      <div className={`w-full h-full rounded-xl overflow-hidden border-2 transition-colors duration-300 ${
        isCritical ? 'border-critical shadow-critical/30 shadow-lg' :
        isWarning ? 'border-warning shadow-warning/20 shadow-md' :
        'border-primary/30 shadow-primary/10 shadow-sm'
      }`}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 0.5, 4.5]} fov={45} />
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 1.5}
            autoRotate={false}
          />
          
          {/* Lighting setup */}
          <ambientLight intensity={0.2} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" castShadow />
          <pointLight position={[-5, 5, 5]} intensity={0.5} color="#ff6b6b" />
          <pointLight position={[0, -5, 5]} intensity={0.3} color="#00ff88" />
          <spotLight
            position={[0, 8, 8]}
            angle={0.4}
            penumbra={1}
            intensity={1.5}
            color="#ffffff"
            castShadow
            shadow-mapSize={[512, 512]}
          />
          
          <HeadModel pitch={pitch} yaw={yaw} roll={roll} />
          <Grid />
          <HeadParticles />
          <Stars radius={50} depth={50} count={200} factor={2} saturation={0} fade speed={1} />
          
          <fog attach="fog" args={['#0a1628', 6, 20]} />
        </Canvas>
      </div>

      {/* Overlay UI - Angle indicators */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
        {/* Pitch indicator */}
        <motion.div 
          className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50"
          animate={{ 
            borderColor: Math.abs(pitch) > 15 ? 'hsl(var(--warning))' : 'hsl(var(--border) / 0.5)'
          }}
        >
          <div className="text-[10px] text-muted-foreground uppercase">Pitch</div>
          <div className={`text-sm font-mono font-bold ${
            Math.abs(pitch) > 20 ? 'text-critical' :
            Math.abs(pitch) > 10 ? 'text-warning' : 'text-primary'
          }`}>
            {pitch > 0 ? '↓' : '↑'} {Math.abs(pitch).toFixed(0)}°
          </div>
        </motion.div>

        {/* Yaw indicator */}
        <motion.div 
          className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50"
          animate={{ 
            borderColor: Math.abs(yaw) > 20 ? 'hsl(var(--warning))' : 'hsl(var(--border) / 0.5)'
          }}
        >
          <div className="text-[10px] text-muted-foreground uppercase">Yaw</div>
          <div className={`text-sm font-mono font-bold ${
            Math.abs(yaw) > 25 ? 'text-critical' :
            Math.abs(yaw) > 15 ? 'text-warning' : 'text-primary'
          }`}>
            {yaw > 0 ? '←' : '→'} {Math.abs(yaw).toFixed(0)}°
          </div>
        </motion.div>

        {/* Roll indicator */}
        <motion.div 
          className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-border/50"
          animate={{ 
            borderColor: Math.abs(roll) > 15 ? 'hsl(var(--warning))' : 'hsl(var(--border) / 0.5)'
          }}
        >
          <div className="text-[10px] text-muted-foreground uppercase">Roll</div>
          <div className={`text-sm font-mono font-bold ${
            Math.abs(roll) > 20 ? 'text-critical' :
            Math.abs(roll) > 10 ? 'text-warning' : 'text-primary'
          }`}>
            {roll > 0 ? '↻' : '↺'} {Math.abs(roll).toFixed(0)}°
          </div>
        </motion.div>
      </div>

      {/* Center indicator for large deviations */}
      {(isCritical || isWarning) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isCritical ? 'bg-critical/90 text-white' : 'bg-warning/90 text-foreground'
          }`}
        >
          {isCritical ? '⚠️ Look Ahead!' : '⚡ Attention'}
        </motion.div>
      )}
    </motion.div>
  );
}
