import React, {useMemo} from 'react';
import {createTikTokStyleCaptions} from '@remotion/captions';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import type {TimedScene} from '../types';

export const Subtitles: React.FC<{scene: TimedScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const time = frame / fps * 1000 - scene.voiceFrom / 30 * 1000;
  const {pages} = useMemo(() => createTikTokStyleCaptions({
    captions: scene.words.map((word, i) => ({...word, text: `${i ? ' ' : ''}${word.text}`,
      timestampMs: word.startMs, confidence: null})),
    combineTokensWithinMilliseconds: 1100,
    breakOnSilenceAfterMilliseconds: 300,
  }), [scene.words]);
  const page = pages.find((p) => time >= p.startMs && time < p.startMs + p.durationMs);
  const speaking = !scene.speechRanges || scene.speechRanges.some((range) => time >= range.start * 1000 && time < range.end * 1000);
  if (!page || !speaking || time > scene.voiceDuration * 1000 || time > page.tokens.at(-1)!.toMs + 180) return null;
  const scale = width / 1920;
  return <div style={{position: 'absolute', bottom: 155 * scale, left: '12%', right: '12%',
    display: 'flex', justifyContent: 'center', pointerEvents: 'none'}}>
    <div style={{fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 48 * scale,
      lineHeight: 1.45, textAlign: 'center', whiteSpace: 'pre-wrap', color: '#f9fafb',
      background: 'rgba(3, 9, 18, 0.76)', borderRadius: 10 * scale,
      padding: `${10 * scale}px ${24 * scale}px`, boxShadow: '0 8px 35px #0006',
      textShadow: '0 2px 5px #0009'}}>
      {page.tokens.map((token, i) => <span key={i} style={{
        color: time >= token.fromMs && time < token.toMs ? '#ffd58c' : '#f9fafb',
      }}>{token.text}</span>)}
    </div>
  </div>;
};
