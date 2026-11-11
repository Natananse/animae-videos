import React from 'react';
import {Player3D} from '../components/Player3D';
import {childExit} from '../animation/football';
import {FootballActor, ReactionActor} from './ActionCharacters';
import {LockerRoom, MadeiraStreet} from './Environments';
import {SceneProps, SceneWorld, shotAt, useSceneTime} from './SceneWorld';

/** The shirt is left behind; the child takes the ball and carries the movement on. */
export default function Scene08({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 2) return <SceneWorld progress={progress} mood="farewell" background="#06121a"
    shot={shotAt(seconds, [{from: 0, to: 2, position: [.2, 1.96, 3.4], endPosition: [.05, 1.96, 3.12],
      target: [0, 1.94, 0], fov: 35}])}>
    <LockerRoom accent="#3c6258" /><Player3D outfit="portugal" pose="shirt" />
  </SceneWorld>;
  if (seconds < 5) return <SceneWorld progress={progress} mood="farewell" background="#06121a"
    shot={shotAt(seconds, [{from: 2, to: 5, position: [.55, 2.48, 2.9], endPosition: [.4, 2.48, 2.7],
      target: [0, 2.4, .02], fov: 35}])}>
    <LockerRoom accent="#3c6258" />
    <ReactionActor seconds={seconds - 2} outfit="portugal" emotion="proud" emotionFrom="sad"
      emotionBlend={(seconds - 2) / 2.3} gaze={[-.1, -.02]} gazeFrom={[-.25, -.14]} />
  </SceneWorld>;
  const sample = childExit(seconds - 5);
  const p = sample.motion.position;
  const shot = seconds < 6.9
    ? {position: [2.6, 1.18, 4.3] as [number, number, number], target: [p[0], .85, p[2]], fov: 41}
    : seconds < 9.6
      ? {position: [p[0] + 3.6, 1.25, p[2] + 2.6] as [number, number, number], target: [p[0], .95, p[2]], fov: 41}
      : {position: [p[0] + 1.25, 1.2, p[2] + 3.9] as [number, number, number],
        target: [p[0], .96, p[2]], fov: 39};
  return <SceneWorld progress={progress} shot={{...shot, target: shot.target as [number, number, number]}}
    warm mood="childhood" background="#d8bb8b" fog={[18, 70]}>
    <MadeiraStreet towardLight /><FootballActor sample={sample} outfit="portugal" child worn />
  </SceneWorld>;
}
