import React, {useEffect, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, interpolate, Sequence,
  staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FrameContext} from './components/FrameAudit';
import {AudioMix} from './components/AudioMix';
import {Subtitles} from './components/Subtitles';
import Scene01 from './scenes/Scene01';
import Scene02 from './scenes/Scene02';
import Scene03 from './scenes/Scene03';
import Scene04 from './scenes/Scene04';
import Scene05 from './scenes/Scene05';
import Scene06 from './scenes/Scene06';
import Scene07 from './scenes/Scene07';
import Scene08 from './scenes/Scene08';
import type {TimedScene, Timing} from './types';

const scenes = [Scene01, Scene02, Scene03, Scene04, Scene05, Scene06, Scene07, Scene08];
const chapters = [
  ['PORTUGAL', 'THE SHIRT'],
  ['MADEIRA', 'AN ISLAND. A DREAM.'],
  ['LISBON', 'THE FIRST STAGE'],
  ['MANCHESTER', 'THE WEIGHT OF SEVEN'],
  ['MADRID', 'ABOVE THE GAME'],
  ['COLOURS CHANGE', 'COLOURS CHANGE'],
  ['PORTUGAL', 'A COUNTRY, TOGETHER'],
  ['THE PORTUGAL ERA', 'THE LIGHT REMAINS'],
];
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const SceneOverlay: React.FC<{index: number; duration: number; scene: TimedScene}> =
({index, duration, scene}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const seconds = frame / fps;
  const length = duration / fps;
  const s = width / 1920;
  const labelStart = .3;
  const opacity = index === 0 || index === 7 ? 0 : interpolate(seconds,
    [labelStart, labelStart + .15, labelStart + 1.85, labelStart + 2], [0, 1, 1, 0], clamp);
  return <>
    <div style={{position: 'absolute', left: 90 * s, top: 103 * s, opacity,
      color: '#fff7e9', transform: `translateY(${(1 - opacity) * 12 * s}px)`}}>
      <div style={{fontSize: 22 * s, letterSpacing: 2 * s, fontWeight: 600, color: '#e3bc7d', marginBottom: 9 * s}}>
        {chapters[index][0]}
      </div>
    </div>
    {index === 0 && seconds < 3 && <div style={{position: 'absolute', left: 90 * s, top: 47 * s,
      color: '#fff7e9', fontSize: 24 * s, letterSpacing: .4 * s}}>
      Animated tribute, not real footage
    </div>}
    <Subtitles scene={scene} />
  </>;
};

const FilmFinish: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();
  const time = frame / fps;
  const s = width / 1920;
  const bar = (height - width / 2.39) / 2;
  const end = durationInFrames / fps;
  const title = interpolate(time, [end - 2.6, end - 2.1, end - .7, end - .1], [0, 1, 1, 0], clamp);
  const finalFade = 0; // Hold the child through the final frame; no background-only black pause.
  const grainOffset = (Math.floor(frame / 2) % 4) * 19;
  return <>
    <AbsoluteFill style={{pointerEvents: 'none',
      background: 'radial-gradient(ellipse at 50% 43%, transparent 30%, rgba(0,0,0,.22) 64%, rgba(0,0,0,.7) 100%)'}} />
    <AbsoluteFill style={{pointerEvents: 'none', opacity: .022,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Cpath fill='%23ffffff' filter='url(%23n)' d='M0 0h160v160H0z'/%3E%3C/svg%3E")`,
      backgroundPosition: `${grainOffset}px ${grainOffset * 2}px`, mixBlendMode: 'screen'}} />
    <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: bar, background: '#000'}} />
    <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: bar, background: '#000'}} />
    {title > 0 && <AbsoluteFill style={{opacity: title, alignItems: 'center',
      justifyContent: 'flex-end', paddingBottom: 180 * s, color: '#fff4d8'}}>
      <div style={{fontSize: 42 * s, letterSpacing: 2 * s, fontWeight: 700}}>THE SHIRT</div>
      <div style={{fontSize: 16 * s, letterSpacing: 4 * s, marginTop: 10 * s}}>A RONALDO STORY</div>
    </AbsoluteFill>}
    <AbsoluteFill style={{background: '#000', opacity: finalFade}} />
  </>;
};

export const Documentary: React.FC<{audioOnly?: boolean}> = ({audioOnly = false}) => {
  const [handle] = useState(() => delayRender('Loading measured voice timing'));
  const [timing, setTiming] = useState<Timing | null>(null);
  const {fps} = useVideoConfig();
  useEffect(() => {
    fetch(staticFile('timing.json')).then((res) => {
      if (!res.ok) throw new Error('Generate narration first with npm run voice.');
      return res.json();
    }).then((data: Timing) => {
      if (data.totalFrames <= 0 || data.scenes.length !== 8 || data.fps !== 30) throw new Error('Invalid film timing.');
      setTiming(data); continueRender(handle);
    }).catch(cancelRender);
  }, [handle]);
  if (!timing) return null;
  if (audioOnly) return <AudioMix timing={timing} />;
  return <AbsoluteFill style={{background: '#000', fontFamily: 'Inter, sans-serif'}}>
    {timing.scenes.map((scene, i) => {
      const Scene = scenes[i];
      const duration = Math.round(scene.durationInFrames / timing.fps * fps);
      return <Sequence key={scene.id} from={Math.round(scene.from / timing.fps * fps)} durationInFrames={duration}>
        <FrameContext.Provider value={{sceneId: scene.id, fromSeconds: scene.from / timing.fps}}>
          <Scene durationInFrames={duration} />
        </FrameContext.Provider>
      </Sequence>;
    })}
    <FilmFinish />
    {timing.scenes.map((scene, i) => <Sequence key={`overlay-${scene.id}`}
      from={Math.round(scene.from / timing.fps * fps)}
      durationInFrames={Math.round(scene.durationInFrames / timing.fps * fps)}>
      <SceneOverlay index={i} duration={Math.round(scene.durationInFrames / timing.fps * fps)} scene={scene} />
    </Sequence>)}
    <AudioMix timing={timing} />
  </AbsoluteFill>;
};
