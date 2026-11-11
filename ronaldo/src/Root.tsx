import React from 'react';
import {Composition} from 'remotion';
import {Documentary} from './Documentary';
import story from '../script/script.json';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/900.css';

const seconds = story.scenes.reduce((sum, scene) => sum + scene.duration, 0);
export const Root: React.FC = () => <>
  <Composition id="Ronaldo" component={Documentary} durationInFrames={Math.round(seconds * 30)}
    fps={30} width={1920} height={1080} />
  <Composition id="RonaldoPreview" component={Documentary} durationInFrames={Math.round(seconds * 15)}
    fps={15} width={960} height={540} />
  <Composition id="RonaldoReview" component={Documentary} durationInFrames={Math.round(seconds * 30)}
    fps={30} width={960} height={540} />
  <Composition id="RonaldoAudio" component={Documentary} durationInFrames={Math.round(seconds * 30)}
    fps={30} width={1920} height={1080} defaultProps={{audioOnly: true}} />
</>;
