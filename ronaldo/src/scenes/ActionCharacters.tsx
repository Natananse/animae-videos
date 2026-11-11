import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {Player3D, Outfit, CharacterAppearance} from '../components/Player3D';
import {ActionSample, ActorMotion, CHILD_SCALE, Emotion, Vec3} from '../animation/football';
import {livingPose, reactionMotion} from '../animation/continuousMotion';
import {Ball, smooth} from './SceneWorld';

/** Anonymous supporting cast; none is intended to portray a named player. */
export const GENERIC_CAST: Record<'teammateUnited' | 'teammatePortugal' | 'opponent' | 'supporter' | 'keeper', CharacterAppearance> = {
  teammateUnited: {number: 12, hair: 'crop', face: 'round', build: 1.1, height: .95,
    skin: '#d0a080', hairColor: '#614438'},
  teammatePortugal: {number: 6, hair: 'short', face: 'long', build: .92, height: 1.06,
    skin: '#9b6b50', hairColor: '#473028'},
  opponent: {number: 4, hair: 'curls', face: 'square', build: 1.12, height: 1.02,
    skin: '#8a5d46', hairColor: '#2c2420'},
  supporter: {number: 24, hair: 'curls', face: 'round', build: 1.16, height: .94,
    skin: '#9f7257', hairColor: '#513a2a'},
  keeper: {number: 1, hair: 'crop', face: 'long', build: 1.04, height: 1.04,
    skin: '#8d6049', hairColor: '#352a24', gloves: '#d8ded7'},
};

export function FootballActor({sample, outfit, child = false, ball = true, worn = false, character}: {
  sample: ActionSample; outfit: Outfit; child?: boolean; ball?: boolean; worn?: boolean; character?: CharacterAppearance;
}) {
  const {fps} = useVideoConfig();
  const clock = useCurrentFrame() / fps;
  const radius = .235 * (child ? CHILD_SCALE : 1);
  const held = sample.phase === 'collect' || sample.phase === 'run-into-light';
  const quiet = ['celebrate', 'farewell', 'reaction', 'smile', 'success', 'mistake', 'focus', 'attempt', 'retry', 'set-ball', 'prepare', 'watch'].includes(sample.phase);
  const motion = quiet ? livingPose(sample.motion, clock, sample.phase === 'mistake' ? .65 : 1) : sample.motion;
  return <>
    <Player3D outfit={outfit} child={child} visualAction={sample.phase} motion={motion} character={character} />
    {ball && <Ball position={sample.ball} worn={worn} scale={child ? CHILD_SCALE : 1}
      rotation={held ? [0, 0, 0] : [sample.ball[2] / radius, 0, -sample.ball[0] / radius]} />}
  </>;
}

export function ReactionActor({seconds, outfit, position = [0, 0, 0], yaw = 0,
  emotion = 'relieved', gaze = [0, -.05], gesture, character, emotionFrom, emotionBlend = 1, gazeFrom}: {
    seconds: number; outfit: Outfit; position?: Vec3; yaw?: number; emotion?: Emotion;
    gaze?: [number, number]; gesture?: 'clap'; character?: CharacterAppearance;
    emotionFrom?: Emotion; emotionBlend?: number; gazeFrom?: [number, number];
  }) {
  const {fps} = useVideoConfig();
  const clock = useCurrentFrame() / fps + position[0] * .37;
  const source = reactionMotion(seconds, emotion, clock);
  const blend = smooth(emotionBlend);
  const previous = emotionFrom ?? emotion;
  const headPitch = (feeling: Emotion) => feeling === 'sad' || feeling === 'frustrated' ? .15 : feeling === 'focus' ? .08 : -.025;
  const shoulders = (feeling: Emotion) => feeling === 'frustrated' ? .09 : feeling === 'sad' ? .07 : feeling === 'relieved' ? .035 : 0;
  const eyes: [number, number] = gazeFrom
    ? [gazeFrom[0] + (gaze[0] - gazeFrom[0]) * blend, gazeFrom[1] + (gaze[1] - gazeFrom[1]) * blend]
    : gaze;
  const motion: ActorMotion = {...source, position, yaw, emotion, emotionFrom: previous, emotionBlend: blend,
    gaze: [eyes[0] + source.gaze[0], eyes[1] + source.gaze[1]],
    head: [headPitch(previous) + (headPitch(emotion) - headPitch(previous)) * blend + source.head[0] - headPitch(emotion),
      eyes[0] * .4 + source.head[1], source.head[2]],
    shoulderDrop: shoulders(previous) + (shoulders(emotion) - shoulders(previous)) * blend};
  if (gesture === 'clap') {
    const close = .5 + .5 * Math.cos(seconds * Math.PI * 2 * 2.2);
    const inward = .32 + .18 * close;
    motion.shoulderDrop = 0;
    motion.arms = [
      {shoulder: [-.95, inward, -.015], elbow: -1.15, wrist: .1},
      {shoulder: [-.95, -inward, .015], elbow: -1.15, wrist: -.1},
    ];
    motion.head = [-.015 + Math.sin(seconds * 3) * .015, -.05, 0];
  }
  return <Player3D outfit={outfit} motion={motion} character={character} visualAction={gesture === 'clap' ? 'clap' : 'reaction'} />;
}
