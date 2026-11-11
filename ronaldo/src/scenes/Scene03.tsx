import React from 'react';
import {bootPosition, poseAction} from '../animation/football';
import {FootballActor, ReactionActor} from './ActionCharacters';
import {PlayerTunnel, TrainingGround} from './Environments';
import {SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

export default function Scene03({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 11) {
    const sample = poseAction('training', seconds);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 3.2
      ? {position: [p[0] + 3.5, 1.8, p[2] + 6.7] as [number, number, number], target: [p[0], 1.3, p[2] - 1], fov: 43}
      : seconds < 5.6
        ? {position: [toe[0] + 1.5, .55, toe[2] + 2.4] as [number, number, number], target: [toe[0], .3, toe[2] - .4], fov: 43}
        : seconds < 8.5
          ? {position: [p[0] - 4.8, 1.6, p[2] - .7] as [number, number, number], target: [p[0], 1.42, p[2]], fov: 40}
          : {position: [p[0] + 1.7, 2.35, p[2] - 3.2] as [number, number, number], target: [p[0], 2.3, p[2]], fov: 37};
    return <SceneWorld progress={progress} shot={{...shot, target: shot.target as [number, number, number]}}
      mood="academy" background="#123333" fog={[20, 70]}>
      <TrainingGround /><FootballActor sample={sample} outfit="sporting" />
    </SceneWorld>;
  }
  if (seconds < 14.2) return <SceneWorld progress={progress} mood="academy" background="#123333"
    shot={{position: [.6, 2.5, 2.8], target: [0, 2.4, 0], fov: 36}}>
    <TrainingGround /><ReactionActor seconds={seconds - 11} outfit="sporting" emotion="determined" gaze={[.2, -.05]} />
  </SceneWorld>;
  const sample = poseAction('run', (seconds - 14.2) * .45);
  const p = sample.motion.position;
  const toe = bootPosition(sample.motion, 1);
  const shot = seconds < 17.4
    ? {position: [1.8, 1.5, p[2] + 6] as [number, number, number], target: [p[0], 1.5, p[2]], fov: 39}
    : {position: [toe[0] + .7, .3, toe[2] + 1.8] as [number, number, number], target: [toe[0], .18, toe[2]], fov: 39};
  return <SceneWorld progress={progress} mood="academy" background="#07151c"
    shot={{...shot, target: shot.target as [number, number, number]}}>
    <PlayerTunnel accent="#4e8d70" /><FootballActor sample={sample} outfit="sporting" ball={false} />
  </SceneWorld>;
}
