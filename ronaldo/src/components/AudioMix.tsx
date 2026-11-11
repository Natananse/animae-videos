import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import type {Timing} from '../types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));
export const musicVolume = (seconds: number, timing: Timing) => {
  let duck = 0;
  for (const scene of timing.scenes) {
    const ranges = scene.speechRanges ?? [{start: scene.voiceFrom / timing.fps, end: scene.voiceFrom / timing.fps + scene.voiceDuration}];
    for (const range of ranges) {
      const start = scene.from / timing.fps + range.start;
      const end = scene.from / timing.fps + range.end;
      const attack = clamp((seconds - start + .16) / .16);
      const release = clamp((end + .3 - seconds) / .3);
      duck = Math.max(duck, Math.min(attack, release));
    }
  }
  const duration = timing.totalFrames / timing.fps;
  const farewell = seconds >= 172 && seconds < 190 ? .32 : seconds >= 190 ? .32 + .5 * clamp((seconds - 190) / 7) : 1;
  const opening = seconds >= 3 && seconds < 6.4 ? .22 : 1;
  const fade = clamp(seconds / .18) * clamp((duration - seconds) / 1.3);
  return (.38 - .28 * duck) * fade * farewell * opening;
};

export const AudioMix: React.FC<{timing: Timing}> = ({timing}) => {
  const {fps} = useVideoConfig();
  return <>
    <Audio src={staticFile('music/bg.mp3')} volume={(frame) => musicVolume(frame / fps, timing)} />
    <Audio src={staticFile('sfx/action_mix.wav')} volume={.9} />
    {timing.scenes.map((scene) => <Sequence key={scene.id}
      from={Math.round((scene.from + scene.voiceFrom) / timing.fps * fps)}
      durationInFrames={Math.round(scene.durationInFrames / timing.fps * fps)}>
      <Audio src={staticFile(`voice/${scene.id}.mp3`)} volume={1} />
    </Sequence>)}
  </>;
};
