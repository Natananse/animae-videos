import React from 'react';
import {Stadium} from '../components/Stadium';
import {bootPosition, poseAction} from '../animation/football';
import {FootballActor, ReactionActor} from './ActionCharacters';
import {PlayerTunnel, TrainingGround} from './Environments';
import {Box, Goal, SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

export default function Scene06({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 6.7) {
    const sample = poseAction('training', seconds);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 2.6
      ? {position: [3.3, 1.6, p[2] + 6.5] as [number, number, number], target: [0, 1.3, p[2] - .8], fov: 42}
      : seconds < 4.8
        ? {position: [p[0] + 1.7, 2.45, p[2] - 3] as [number, number, number], target: [p[0], 2.4, p[2]], fov: 37}
        : {position: [toe[0] + .65, .33, toe[2] - 1.8] as [number, number, number], target: [toe[0], .2, toe[2]], fov: 39};
    return <SceneWorld progress={progress} shot={{...shot, target: shot.target as [number, number, number]}}
      mood="juventus" background="#25333b" fog={[22, 72]}>
      <TrainingGround /><FootballActor sample={sample} outfit="juventus" />
    </SceneWorld>;
  }
  if (seconds < 13.2) {
    const sample = poseAction('run', (seconds - 6.7) * .48);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 8.1
      ? {position: [toe[0] + .65, .33, toe[2] + 1.8] as [number, number, number], target: [toe[0], .2, toe[2]], fov: 39}
      : seconds < 10.6
        ? {position: [1.4, 2.5, p[2] + 3] as [number, number, number], target: [0, 2.4, p[2]], fov: 36}
        : {position: [2.1, 1.4, p[2] + 6.2] as [number, number, number], target: [0, 1.45, p[2]], fov: 40};
    return <SceneWorld progress={progress} mood="united" background="#09131b"
      shot={{...shot, target: shot.target as [number, number, number]}}>
      <PlayerTunnel accent="#ae3044" /><FootballActor sample={sample} outfit="united" ball={false} />
    </SceneWorld>;
  }
  const sample = poseAction('dribble', seconds - 13.2);
  const p = sample.motion.position;
  const toe = bootPosition(sample.motion, 1);
  const shot = seconds < 15.7
    ? {position: [3.9, 1.8, p[2] + 6.5] as [number, number, number], target: [0, 1.3, p[2] - .6], fov: 42}
    : seconds < 18
      ? {position: [toe[0] + 1.2, .5, toe[2] + 2.4] as [number, number, number], target: [toe[0], .28, toe[2] - .3], fov: 43}
      : {position: [p[0] + 1.5, 2.42, p[2] - 3] as [number, number, number], target: [0, 2.4, p[2]], fov: 36};
  return <SceneWorld progress={progress} warm mood="alnassr" background="#8f8c78" fog={[24, 95]}
    shot={{...shot, target: shot.target as [number, number, number]}}>
    <Stadium mood="alnassr" warm /><Goal /><FootballActor sample={sample} outfit="alnassr" />
    {[-1, 0, 1].map((side) => <Box key={side} position={[side * 15, 6 + side, -36]}
      size={[6, 12 + side * 2, 5]} color="#8f8b78" />)}
  </SceneWorld>;
}
