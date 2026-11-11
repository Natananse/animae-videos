import React from 'react';
import {Audio, staticFile} from 'remotion';
import type {Timing} from '../types';

// Prepared by scripts/prepare_clear_audio.py. One sample-aligned master gives
// the preview, full export and review clips the same narration-first balance.
// Its continuous gain envelope is independent of the video frame rate.
export const AudioMix: React.FC<{timing: Timing}> = () =>
  <Audio src={staticFile('audio/clear_master.wav')} volume={1} />;
