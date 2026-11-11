import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {BufferGeometry, Float32BufferAttribute, InstancedMesh, Object3D, Color} from 'three';

export type StadiumProps = {mood?: string; warm?: boolean; empty?: boolean};

function PitchLines() {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const line = (x1: number, z1: number, x2: number, z2: number) => points.push(x1, 0.014, z1, x2, 0.014, z2);
    line(-13, -20, 13, -20); line(13, -20, 13, 20); line(13, 20, -13, 20); line(-13, 20, -13, -20);
    line(-13, 0, 13, 0);
    for (let i = 0; i < 80; i++) {
      const a = i / 80 * Math.PI * 2, b = (i + 1) / 80 * Math.PI * 2;
      line(Math.cos(a) * 3.1, Math.sin(a) * 3.1, Math.cos(b) * 3.1, Math.sin(b) * 3.1);
    }
    for (const side of [-1, 1]) {
      line(-7, side * 20, -7, side * 13); line(-7, side * 13, 7, side * 13); line(7, side * 13, 7, side * 20);
      line(-3.3, side * 20, -3.3, side * 17); line(-3.3, side * 17, 3.3, side * 17); line(3.3, side * 17, 3.3, side * 20);
    }
    const result = new BufferGeometry();
    result.setAttribute('position', new Float32BufferAttribute(points, 3));
    return result;
  }, []);
  return <lineSegments geometry={geometry}><lineBasicMaterial color="#b4c6b4" transparent opacity={0.5} /></lineSegments>;
}

function Crowd({warm, empty}: {warm: boolean; empty: boolean}) {
  const ref = useRef<InstancedMesh>(null);
  const count = empty ? 0 : 1600;
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new Object3D();
    const palette = warm ? ['#c89c6b', '#b85741', '#d9c49b', '#424e49'] : ['#7d3042', '#b3ac9f', '#284c62', '#72615a', '#a54845'];
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / 80), column = i % 80;
      const x = (column - 39.5) * 0.48;
      const jitter = Math.sin(i * 17.3) * 0.065;
      object.position.set(x, 0.8 + row * 0.23 + jitter, -16.8 - row * 0.35);
      object.scale.set(0.14, 0.2 + (i % 3) * 0.015, 0.14);
      object.rotation.set(0, i * 0.17, 0);
      object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
      ref.current.setColorAt(i, new Color(palette[i % palette.length]));
    }
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, [count, warm]);
  return count ? <instancedMesh ref={ref} args={[undefined, undefined, count]}>
    <icosahedronGeometry args={[1, 0]} /><meshStandardMaterial roughness={0.95} />
  </instancedMesh> : null;
}

function StructuralPosts() {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const object = new Object3D();
    for (let i = 0; i < 10; i++) {
      object.position.set((i - 4.5) * 4.8, 3.6, -24);
      object.scale.set(0.15, 7.2, 0.15); object.updateMatrix();
      ref.current.setMatrixAt(i, object.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
    ref.current.computeBoundingSphere();
  }, []);
  return <instancedMesh ref={ref} args={[undefined, undefined, 10]}><boxGeometry /><meshStandardMaterial color="#39424e" roughness={0.7} metalness={0.2} /></instancedMesh>;
}

export function Stadium({mood = 'stadium', warm = false, empty = false}: StadiumProps) {
  const isDark = /hook|legacy|dark|farewell/.test(mood);
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[120, 120]} /><meshStandardMaterial color={isDark ? '#101e25' : warm ? '#455a39' : '#233e3b'} roughness={0.98} />
    </mesh>
    {!isDark && <>
      {[0, 1, 2, 3, 4].map(i => <mesh key={`grass${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, .004, (i - 2) * 8]} receiveShadow>
        <planeGeometry args={[26, 4]} /><meshStandardMaterial color={warm ? '#4d6240' : '#294941'} roughness={0.98} />
      </mesh>)}
      <PitchLines />
    </>}
    <mesh position={[0, -0.16, -23]} receiveShadow><boxGeometry args={[50, 0.3, 14]} /><meshStandardMaterial color="#172630" roughness={0.9} /></mesh>
    {[0, 1, 2].map(tier => <group key={`tier${tier}`}>
      <mesh position={[-11, 0.5 + tier * 1.5, -18.3 - tier * 2.05]}><boxGeometry args={[18, 1, 3.6]} /><meshStandardMaterial color={tier % 2 ? '#243441' : '#1b2a36'} roughness={0.85} /></mesh>
      <mesh position={[11, 0.5 + tier * 1.5, -18.3 - tier * 2.05]}><boxGeometry args={[18, 1, 3.6]} /><meshStandardMaterial color={tier % 2 ? '#243441' : '#1b2a36'} roughness={0.85} /></mesh>
      <mesh position={[0, 1.1 + tier * 1.5, -16.8 - tier * 2.05]}><boxGeometry args={[44, 0.07, 0.1]} /><meshStandardMaterial color="#596270" metalness={0.4} roughness={0.5} /></mesh>
    </group>)}
    <Crowd warm={warm} empty={empty} />
    <StructuralPosts />
    <mesh position={[0, 7.1, -24]} rotation={[0.05, 0, 0]}><boxGeometry args={[48, 0.25, 7]} /><meshStandardMaterial color="#202c3c" metalness={0.25} roughness={0.6} /></mesh>
    <mesh position={[0, 6.9, -20.45]}><boxGeometry args={[47, 0.09, 0.08]} /><meshBasicMaterial color={warm ? '#cd9a5d' : '#6c90b5'} toneMapped={false} /></mesh>
    <mesh position={[0, 1.25, -17]}><boxGeometry args={[3.65, 2.5, 0.2]} /><meshStandardMaterial color="#060c14" roughness={1} /></mesh>
    <mesh position={[0, 2.53, -16.8]}><boxGeometry args={[4, 0.18, 0.5]} /><meshStandardMaterial color="#4b5966" roughness={0.7} /></mesh>
    {[-1, 1].map(side => <group key={`pylon${side}`} position={[side * 17, 0, -10]}>
      <mesh position={[0, 5, 0]}><cylinderGeometry args={[0.07, 0.16, 10, 7]} /><meshStandardMaterial color="#354254" roughness={0.7} metalness={0.45} /></mesh>
      <mesh position={[0, 10, 0]} rotation={[0.2, 0, 0]}><boxGeometry args={[2.3, 0.55, 0.25]} /><meshStandardMaterial color="#a1b2c6" roughness={0.35} metalness={0.4} /></mesh>
      <mesh position={[0, 9.97, 0.15]} rotation={[0.2, 0, 0]}><planeGeometry args={[2.1, 0.37]} /><meshBasicMaterial color={warm ? '#ffe1aa' : '#c4d8ff'} toneMapped={false} /></mesh>
    </group>)}
    <mesh position={[0, 0.28, -14.8]}><boxGeometry args={[40, 0.48, 0.15]} /><meshStandardMaterial color="#101b25" emissive={warm ? '#6e3f26' : '#17384c'} emissiveIntensity={0.4} roughness={0.7} /></mesh>
  </group>;
}

export default Stadium;
