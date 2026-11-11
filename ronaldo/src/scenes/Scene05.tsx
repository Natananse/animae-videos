import React from 'react';
import {Stadium} from '../components/Stadium';
import {bicycleAction, bootPosition, poseAction} from '../animation/football';
import {FootballActor, GENERIC_CAST, ReactionActor} from './ActionCharacters';
import {LockerRoom} from './Environments';
import {Goalkeeper} from './Goalkeeper';
import {Goal, SceneProps, SceneWorld, useSceneTime} from './SceneWorld';

/** One readable six-second play; the airborne part lasts under two seconds. */
export default function Scene05({durationInFrames}: SceneProps) {
  const {progress, seconds} = useSceneTime(durationInFrames);
  if (seconds < 12) {
    const sample = poseAction('dribble', seconds);
    if (seconds > 8.5) {
      sample.motion.head = [-.12, .15, 0];
      sample.motion.gaze = [.35, .25];
    }
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 3.2
      ? {position: [4.2, 2, p[2] + 7] as [number, number, number], target: [0, 1.3, p[2] - 1.2], fov: 44}
      : seconds < 5.7
        ? {position: [toe[0] + 1.4, .5, toe[2] + 2.4] as [number, number, number], target: [toe[0], .3, toe[2] - .4], fov: 42}
        : seconds < 8.5
          ? {position: [5.2, 1.5, p[2] - .4] as [number, number, number], target: [0, 1.4, p[2]], fov: 40}
          : {position: [p[0] + 1.6, 2.4, p[2] - 3.2] as [number, number, number], target: [0, 2.4, p[2]], fov: 37};
    return <SceneWorld progress={progress} mood="madrid" background="#0b1427"
      shot={{...shot, target: shot.target as [number, number, number]}}>
      <Stadium mood="madrid" /><Goal /><FootballActor sample={sample} outfit="madrid" />
    </SceneWorld>;
  }
  if (seconds < 18.4) {
    const t = seconds - 12;
    const sample = bicycleAction(t);
    const toe = bootPosition(sample.motion, 1);
    const shot = t < 1.6
      ? {position: [3.7, 1.65, 6.2] as [number, number, number], target: [.4, 2, -.9], fov: 48}
      : t < 2.15
        ? {position: [5.4, 1.45, 3.8] as [number, number, number], target: [0, 1.7, -.3], fov: 44}
        : t < 2.95
          ? {position: [toe[0] + 2.3, toe[1] + .65, toe[2] + 2.4] as [number, number, number],
            target: [toe[0], toe[1] + .05, toe[2] - .35], fov: 43}
          : t < 3.85
            ? {position: [6.1, 1.8, 3] as [number, number, number], target: [0, 1.2, -1.4], fov: 47}
            : t < 4.5
              ? {position: [4.8, 1.7, -1.8] as [number, number, number], target: [0, 1.3, -7.2], fov: 46}
              : {position: [.7, 2.47, 3] as [number, number, number], target: [0, 2.38, 0], fov: 36};
    return <SceneWorld progress={progress} mood="madrid" background="#0b1427" faceFill={false}
      action={Math.abs(t - 2.6) < .12} shot={{...shot, target: shot.target as [number, number, number]}}>
      <Stadium mood="madrid" /><Goal netTime={Math.max(0, t - 4.05)} />
      <FootballActor sample={sample} outfit="madrid" />
      <Goalkeeper seconds={t} />
    </SceneWorld>;
  }
  if (seconds < 23.3) return <SceneWorld progress={progress} mood="madrid" background="#0b1427"
    shot={seconds < 20.7 ? {position: [.55, 2.48, 2.7], target: [0, 2.4, 0], fov: 35}
      : {position: [2.1, 3.5, -13.8], target: [1.7, 3.4, -17], fov: 39}}>
    <Stadium mood="madrid" />
    {seconds < 20.7
      ? <ReactionActor seconds={seconds - 18.4} outfit="madrid" emotion="relieved" emotionFrom="smile"
        emotionBlend={(seconds - 18.4) / 1.25} gaze={[.1, .01]} />
      : <ReactionActor seconds={seconds - 20.7} outfit="juventus" position={[1.7, 1, -17]}
        emotion="smile" gaze={[-.15, -.04]} gesture="clap" character={GENERIC_CAST.supporter} />}
  </SceneWorld>;
  if (seconds < 33) {
    const sample = poseAction('training', seconds - 23.3);
    const p = sample.motion.position;
    const toe = bootPosition(sample.motion, 1);
    const shot = seconds < 26.4
      ? {position: [4.5, 1.5, p[2] + 5.8] as [number, number, number], target: [0, 1.2, p[2] - .6], fov: 42}
      : seconds < 29
        ? {position: [toe[0] + 1.2, .5, toe[2] + 2.2] as [number, number, number], target: [toe[0], .3, toe[2] - .3], fov: 43}
        : {position: [4.7, 1.6, p[2] - .6] as [number, number, number], target: [0, 1.45, p[2]], fov: 40};
    return <SceneWorld progress={progress} shot={{...shot, target: shot.target as [number, number, number]}}
      mood="madrid" background="#0b1427">
      <Stadium mood="madrid" /><Goal /><FootballActor sample={sample} outfit="madrid" />
    </SceneWorld>;
  }
  return <SceneWorld progress={progress} mood="madrid" background="#08121b"
    shot={seconds < 35.1 ? {position: [-1.2, 1.9, 1], target: [-2.45, 1.5, -2.2], fov: 37}
      : {position: [.55, 2.5, 2.8], target: [0, 2.4, 0], fov: 36}}>
    <LockerRoom accent="#b8a05d" awards />
    <ReactionActor seconds={seconds - 33} outfit="madrid" emotion="proud" gaze={[-.18, -.08]} />
  </SceneWorld>;
}
