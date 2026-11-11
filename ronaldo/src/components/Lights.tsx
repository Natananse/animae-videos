import React from 'react';

export type LightsProps = {warm?: boolean; mood?: string; faceFill?: boolean; fillPosition?: [number, number, number]};

/** One reusable rig: broad cool key, gold rim, a soft long shadow and haze shafts. */
export function Lights({warm = false, mood = 'stadium', faceFill = false, fillPosition = [0, 3, 4]}: LightsProps) {
  const hushed = /hook|legacy|dark|farewell/.test(mood);
  const gold = warm ? '#ffb968' : '#f2bc70';
  const blue = warm ? '#ffe0ad' : '#95bdff';
  return <group>
    <ambientLight intensity={hushed ? 0.22 : 0.43} color={warm ? '#b7a2a0' : '#819ab6'} />
    <hemisphereLight args={[warm ? '#f3c892' : '#91b4dd', '#17282b', hushed ? 0.42 : 0.72]} />
    <directionalLight position={[-5, 7, 5]} color={blue} intensity={hushed ? 1.5 : 2.8} castShadow
      shadow-mapSize-width={1024} shadow-mapSize-height={1024}
      shadow-camera-left={-11} shadow-camera-right={11} shadow-camera-top={10} shadow-camera-bottom={-9}
      shadow-camera-near={0.5} shadow-camera-far={35} shadow-bias={-0.0002} shadow-normalBias={0.012} shadow-radius={4} />
    <directionalLight position={[3.5, 4.5, -5]} color={gold} intensity={warm ? 3.8 : 4.5} />
    <spotLight position={[0, 8, 1]} angle={0.34} penumbra={0.85} intensity={hushed ? 65 : 35} distance={24}
      decay={2} color={warm ? '#ffe0a2' : '#cfdbff'} />
    <pointLight position={[-5, 1.5, -2]} intensity={2} color={warm ? '#ffa554' : '#4679e5'} distance={12} />
    <pointLight position={fillPosition} intensity={faceFill ? (hushed ? 8 : 5) : 0}
      color={warm ? '#fff0d9' : '#ffe5d1'} distance={6.5} decay={2} />
    {[0, 1, 2].map(i => <mesh key={i} position={[(i - 1) * 6, 4, -3 - i * 1.2]} rotation={[0, 0, (i - 1) * 0.11]}>
      <coneGeometry args={[1.6, 8, 20, 1, true]} />
      <meshBasicMaterial color={warm ? '#ffc77d' : '#a4c8ff'} transparent opacity={hushed ? 0.035 : 0.018}
        depthWrite={false} side={2} toneMapped={false} />
    </mesh>)}
  </group>;
}

export default Lights;
