import React from 'react';
import {Box, Goal, Trophy} from './SceneWorld';

/** An illustrative street, not a reconstruction of a documented childhood event. */
export function MadeiraStreet({towardLight = false}: {towardLight?: boolean}) {
  return <group>
    <Box position={[0, -.15, -9]} size={[11, .3, 45]} color="#8b7561" />
    <Box position={[0, -.24, -38]} size={[140, .12, 65]} color={towardLight ? '#cfba91' : '#779eaa'} roughness={.25} />
    {[-1, 1].map((side) => <group key={side}>
      {[0, 1, 2, 3].map((i) => {
        const height = 3.7 + (i % 3) * .65;
        return <group key={i} position={[side * 6, 0, 4 - i * 7]}>
          <Box position={[0, height / 2, 0]} size={[3.4, height, 5.6]}
            color={['#d5b088', '#ded0ab', '#c78e79', '#b8c0b0'][(i + (side > 0 ? 1 : 0)) % 4]} />
          <Box position={[0, height + .12, 0]} size={[3.7, .25, 5.8]} color="#a96e50" />
          {[1.2, 2.8].map((y) => <Box key={y} position={[-side * 1.72, y, -.8]}
            size={[.07, .88, .72]} color="#496975" />)}
          <Box position={[-side * 1.73, .9, 1]} size={[.07, 1.8, .9]} color="#806449" />
        </group>;
      })}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <Box key={i} position={[side * 4.25, -.01, 6 - i * 5]}
        size={[.16, .04, 2]} color="#c6b195" />)}
    </group>)}
    <mesh position={towardLight ? [0, 5, -36] : [-8, 9, -43]}><sphereGeometry args={[towardLight ? 4.5 : 3.7, 20, 12]} />
      <meshBasicMaterial color="#ffe3aa" /></mesh>
  </group>;
}

export function TrainingGround() {
  return <group>
    <Box position={[0, -.1, -8]} size={[32, .2, 38]} color="#28513f" />
    <Box position={[0, .005, -6]} size={[.045, .012, 24]} color="#c5d2bf" />
    <Box position={[0, .006, -7]} size={[14, .012, .04]} color="#c5d2bf" />
    <Goal position={[0, 0, -7]} />
    {[-1, 1].map((side) => <group key={side}>
      <Box position={[side * 9, 1.5, -7]} size={[.09, 3, 27]} color="#48695a" />
      {[0, 1, 2].map((i) => <group key={i} position={[side * 8.8, 0, 1 - i * 8]}>
        <Box position={[0, 2.5, 0]} size={[.08, 5, .08]} color="#b0b6af" />
        <Box position={[-side * .4, 4.3, 0]} size={[.8, 1.1, .035]} color={i % 2 ? '#efeee1' : '#2b8c68'} />
      </group>)}
    </group>)}
    <Box position={[0, 3.5, -21]} size={[20, 7, 3]} color="#49685d" />
    {[-6, -3, 0, 3, 6].map((x) => <Box key={x} position={[x, 3.5, -19.4]}
      size={[1.7, 3.4, .06]} color="#173b36" />)}
    {[-2, 0, 2].map((x, i) => <mesh key={x} position={[x, .2, -2.6 - i * .8]} castShadow>
      <coneGeometry args={[.18, .4, 10]} /><meshStandardMaterial color="#e0b46b" />
    </mesh>)}
  </group>;
}

/** Quiet off-pitch space for departure and reaction shots. */
export function LockerRoom({accent = '#345b59', awards = false, awardStage = false}: {accent?: string; awards?: boolean; awardStage?: boolean}) {
  return <group>
    <Box position={[0, -.1, -2]} size={[16, .2, 17]} color="#343b3d" roughness={.55} />
    <Box position={[0, 2.3, -3.5]} size={[12, 4.6, .3]} color="#1c2a33" />
    {[-1, 1].map((side) => <group key={side}>
      <Box position={[side * 3.9, 1.6, -1.8]} size={[.25, 3.2, 6]} color="#172630" />
      {!awardStage && <Box position={[side * 2.65, .53, -1.1]} size={[1.3, .14, 4]} color="#8d6e50" />}
      <Box position={[side * 2.65, .24, -2.2]} size={[.12, .5, .12]} color="#46535a" />
      <Box position={[side * 2.65, .24, .15]} size={[.12, .5, .12]} color="#46535a" />
      <Box position={[side * 3.7, 2.9, -1.8]} size={[.035, .05, 5.6]} color={accent} emissive={accent} />
    </group>)}
    <Box position={[0, 3.35, -3.28]} size={[5.4, .07, .035]} color="#b9c6c4" emissive={accent} />
    {awards && <group position={[-2.45, 0, -2.2]}>
      <Box position={[0, .46, 0]} size={[1.1, .92, .8]} color="#121b22" />
      <Trophy position={[0, .92, 0]} scale={.58} />
    </group>}
  </group>;
}

/** The athlete's route to the pitch has a depth and purpose of its own. */
export function PlayerTunnel({accent = '#ac293e'}: {accent?: string}) {
  return <group>
    <Box position={[0, -.125, -7]} size={[9, .25, 30]} color="#252f37" />
    {[-1, 1].map((side) => <group key={side}>
      <Box position={[side * 3.2, 2.2, -5]} size={[.3, 4.4, 24]} color="#1b2733" />
      <Box position={[side * 3.03, 1.2, -5]} size={[.035, .16, 23]} color={accent} />
      {[-1, -5, -9, -13].map((z) => <Box key={z} position={[side * 2.98, 2.8, z]}
        size={[.04, 1.8, .08]} color="#e2d5b9" emissive="#b7b7a2" />)}
    </group>)}
    <Box position={[0, 4.4, -5]} size={[6.6, .25, 24]} color="#172430" />
    <Box position={[0, 2.2, -16.9]} size={[6.1, 4.2, .1]} color="#8eaab4" emissive="#9ac2d4" />
  </group>;
}
