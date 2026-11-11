import React from 'react';
import {bootPosition, childStory, CHILD_SCALE} from '../animation/football';
import {FootballActor} from './ActionCharacters';
import {MadeiraStreet} from './Environments';
import {SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

/** A complete illustrative attempt, mistake, decision and earned small smile. */
export default function Scene02({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  const sample = childStory(seconds + 4);
  const p = sample.motion.position;
  const toe = bootPosition(sample.motion, 1, CHILD_SCALE);
  const face: [number, number, number] = [p[0], 1.67, p[2] + .02];
  const shot = seconds < 2.65
    ? {position: [p[0] + 1.5, 1.08, p[2] + 5.25] as [number, number, number], target: [p[0], .88, p[2] + .25] as [number, number, number], fov: 40}
    : seconds < 5.35
      ? {position: [p[0] + .65, 1.76, p[2] + 2.75] as [number, number, number], target: face, fov: 36}
      : seconds < 11.35
        ? {position: [p[0] - 3.6, 1.2, p[2] + 5.7] as [number, number, number], target: [p[0] + .3, .9, p[2] + .6] as [number, number, number], fov: 43}
        : seconds < 14.5
          ? {position: [toe[0] + 1.15, .52, toe[2] + 2.45] as [number, number, number], target: [toe[0], .28, toe[2] + .16] as [number, number, number], fov: 42}
          : seconds < 19.3
            ? {position: [p[0] - 2.25, 1.08, p[2] + 4.8] as [number, number, number], target: [p[0], .82, p[2] + .65] as [number, number, number], fov: 41}
            : seconds < 22.1
              ? {position: [sample.ball[0] + 2, .6, sample.ball[2] + 3.1] as [number, number, number], target: [sample.ball[0], .25, sample.ball[2]] as [number, number, number], fov: 43}
              : {position: [p[0] + .5, 1.79, p[2] + 2.7] as [number, number, number], target: face, fov: 35};
  return <SceneWorld progress={progress} shot={shot} warm mood="childhood" background="#c19075" fog={[24, 100]}>
    <MadeiraStreet /><FootballActor sample={sample} outfit="portugal" child worn />
  </SceneWorld>;
}
