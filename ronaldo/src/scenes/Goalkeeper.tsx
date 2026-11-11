import React from 'react';
import {Player3D} from '../components/Player3D';
import {GENERIC_CAST} from './ActionCharacters';
import {goalkeeperMotion} from './goalkeeperMotion';

export {goalkeeperMotion} from './goalkeeperMotion';

export function Goalkeeper({seconds, variant = 'full'}: {seconds: number; variant?: 'full' | 'hook'}) {
  return <Player3D outfit="keeper" character={GENERIC_CAST.keeper} motion={goalkeeperMotion(seconds, variant)} />;
}
