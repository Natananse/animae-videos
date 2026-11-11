import React from 'react';
import {Player3D} from '../components/Player3D';
import {Stadium} from '../components/Stadium';
import {bicycleAction, bootPosition, childStory, CHILD_SCALE, poseAction} from '../animation/football';
import {FootballActor, ReactionActor} from './ActionCharacters';
import {LockerRoom, MadeiraStreet} from './Environments';
import {Goalkeeper} from './Goalkeeper';
import {Goal, SceneProps, SceneWorld, shotAt, useSceneTime} from './SceneWorld';

/** Contact, silence, memory: the story starts before the title. */
export default function Scene01({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 3) {
    const sample = bicycleAction(seconds, 'hook');
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 1.02
      ? shotAt(seconds, [{from: 0, to: 1.02, position: [2.8, 1.6, 5.8], endPosition: [2.4, 1.7, 5.3], target: [0, 1.65, -.4], fov: 40}])
      : seconds < 1.58
        ? {position: [toe[0] + 1.35, toe[1] + .35, toe[2] + 2.25] as [number, number, number],
          target: [toe[0], toe[1] + .05, toe[2] - .2] as [number, number, number], fov: 43}
        : {position: [3.8, 1.5, 2.3] as [number, number, number], target: [0, 1.5, -5] as [number, number, number], fov: 45};
    return <SceneWorld progress={progress} shot={shot} mood="madrid" background="#081424" faceFill={false}
      action={Math.abs(seconds - 1.22) < .12}>
      <Stadium mood="madrid" /><Goal /><FootballActor sample={sample} outfit="madrid" />
      <Goalkeeper seconds={seconds} variant="hook" />
    </SceneWorld>;
  }
  if (seconds < 4.5) return <SceneWorld progress={progress} mood="farewell" background="#06101a"
    shot={{position: [.3, 2.48, 2.65], target: [0, 2.4, .06], fov: 35}}>
    <LockerRoom accent="#3f6658" />
    <ReactionActor seconds={seconds - 3} outfit="portugal" emotion="proud" emotionFrom="sad"
      emotionBlend={(seconds - 3) / 4} gaze={[-.2, -.12]} />
  </SceneWorld>;
  if (seconds < 6) return <SceneWorld progress={progress} mood="farewell" background="#06101a"
    shot={shotAt(seconds, [{from: 4.5, to: 6, position: [.24, 1.96, 3.3], endPosition: [.1, 1.96, 3.1], target: [0, 1.94, 0], fov: 35}])}>
    <LockerRoom accent="#3f6658" /><Player3D outfit="portugal" pose="shirt" />
  </SceneWorld>;
  if (seconds < 6.4) {
    const sample = poseAction('run', seconds - 6);
    const toe = bootPosition(sample.motion, 1);
    return <SceneWorld progress={progress} mood="farewell" background="#06101a"
      shot={{position: [toe[0] + .55, .32, toe[2] + 1.6], target: [toe[0], .18, toe[2]], fov: 38}}>
      <LockerRoom /><FootballActor sample={sample} outfit="portugal" ball={false} />
    </SceneWorld>;
  }
  const sample = childStory(seconds - 6);
  const toe = bootPosition(sample.motion, 1, CHILD_SCALE);
  const p = sample.motion.position;
  const shot = seconds < 7.65
    ? {position: [toe[0] + .55, .3, toe[2] + 1.6] as [number, number, number], target: [toe[0], .17, toe[2]] as [number, number, number], fov: 38}
    : {position: [p[0] + 1.6, 1.15, p[2] + 5.8] as [number, number, number], target: [p[0], .95, p[2]] as [number, number, number], fov: 41};
  return <SceneWorld progress={progress} shot={shot} warm mood="childhood" background="#c19075" fog={[24, 100]}>
    <MadeiraStreet /><FootballActor sample={sample} outfit="sporting" child worn />
  </SceneWorld>;
}
