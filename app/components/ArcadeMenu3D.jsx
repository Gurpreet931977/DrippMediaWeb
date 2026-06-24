"use client";

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const GAMES = [
  { id: 'dripp', title: 'DRIPP DROP', color: '#ebd73f', desc: 'Catch elements, avoid bombs.' },
  { id: 'breaker', title: 'NEON BREAKER', color: '#33ccff', desc: 'Smash glowing capsules.' },
  { id: 'scope', title: 'SCOPE CREEP', color: '#ff3366', desc: 'Defend the core.' },
  { id: 'snake', title: 'CYBER SNAKE', color: '#33ff33', desc: 'Grow the neon trail.' },
  { id: 'pong', title: 'RETRO PONG', color: '#ff00ff', desc: 'Beat the AI.' },
  { id: 'runner', title: 'VOID RUNNER', color: '#ff9900', desc: 'Endless neon run.' },
  { id: 'invaders', title: 'INVADERS', color: '#cc33ff', desc: 'Shoot the bugs.' },
  { id: 'simon', title: 'NEON SIMON', color: '#ffffff', desc: 'Match the pattern.' },
];

function CDCase({ game, index, total, isSelected, onSelect }) {
  const meshRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  
  // Carousel positioning
  const radius = 6;
  const angle = (index / total) * Math.PI * 2;
  
  const targetPosition = useMemo(() => {
    return new THREE.Vector3(
      Math.sin(angle) * radius,
      isSelected ? 1 : 0,
      Math.cos(angle) * radius
    );
  }, [angle, isSelected]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Smoothly interpolate position and rotation
    meshRef.current.position.lerp(targetPosition, 0.1);
    
    if (isSelected) {
      // Bring selected CD to front center
      meshRef.current.position.lerp(new THREE.Vector3(0, 0, 4), 0.1);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0.2, 0.1);
    } else {
      // Normal carousel rotation looking out
      const targetRotationY = angle;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, targetRotationY, 0.1);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, hovered ? -0.2 : 0, 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh 
          onClick={(e) => { e.stopPropagation(); onSelect(game.id); }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          castShadow
        >
          <boxGeometry args={[3, 3, 0.2]} />
          <meshStandardMaterial 
            color={hovered || isSelected ? game.color : '#111'} 
            roughness={0.2} 
            metalness={0.8}
            emissive={game.color}
            emissiveIntensity={hovered || isSelected ? 0.5 : 0.1}
          />
        </mesh>

        {/* CD Disc sticking out slightly */}
        <mesh position={[1.2, 0, -0.05]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[1.4, 1.4, 0.05, 32]} />
            <meshStandardMaterial color="#fff" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Title Text */}
        <Text
          position={[0, 0, 0.11]}
          fontSize={0.4}
          color="#000"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/outfit/v11/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a0Ew.woff"
          maxWidth={2.8}
          textAlign="center"
        >
          {game.title}
        </Text>
        <Text
          position={[0, -0.6, 0.11]}
          fontSize={0.15}
          color="#222"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.5}
          textAlign="center"
        >
          {game.desc}
        </Text>
      </Float>
    </group>
  );
}

function Carousel({ onStartGame }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const groupRef = useRef(null);

  useFrame((state, delta) => {
    if (groupRef.current && selectedIndex === -1) {
      // Slowly rotate the whole carousel if nothing is selected
      groupRef.current.rotation.y -= delta * 0.2;
    } else if (groupRef.current) {
      // Rotate carousel so selected is in front
      const targetAngle = -(selectedIndex / GAMES.length) * Math.PI * 2;
      // We want to smoothly rotate the group to face the camera
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
         groupRef.current.rotation.y,
         targetAngle,
         0.05
      );
    }
  });

  return (
    <group ref={groupRef}>
      {GAMES.map((game, i) => (
        <CDCase 
          key={game.id} 
          game={game} 
          index={i} 
          total={GAMES.length} 
          isSelected={selectedIndex === i}
          onSelect={() => {
            if (selectedIndex === i) {
               // Double click starts game
               onStartGame(game.id);
            } else {
               setSelectedIndex(i);
            }
          }} 
        />
      ))}
    </group>
  );
}

export default function ArcadeMenu3D({ onStartGame }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 20 }}>
      {/* HTML Overlay text */}
      <div style={{ position: 'absolute', top: '10%', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 30 }}>
        <h1 style={{ fontFamily: "'Panchang', sans-serif", fontSize: "clamp(2rem, 5vw, 4rem)", color: "var(--brand-yellow)", textShadow: "0 0 30px rgba(235, 215, 63, 0.5)", margin: 0 }}>ARCADE MODE</h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'Clash Display', sans-serif", letterSpacing: "2px" }}>SELECT A CARTRIDGE. CLICK AGAIN TO PLAY.</p>
      </div>

      <Canvas camera={{ position: [0, 2, 10], fov: 50 }}>
        <color attach="background" args={['#050505']} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ebd73f" />
        
        <Carousel onStartGame={onStartGame} />

        <ContactShadows position={[0, -3, 0]} opacity={0.4} scale={20} blur={2} far={4} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
