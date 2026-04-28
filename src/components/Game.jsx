import React, { useEffect } from 'react';
import qs from 'query-string';
import { view } from '@risingstack/react-easy-state';
import { Spinner } from 'react-bootstrap';

import { GameStates } from '../constants';
import EnterGame from './EnterGame';
import Mitigations from './Mitigations/Mitigations';
import Simulation from './Simulation/Simulation';
import Projector from './Projector';
import AfterActionReview from './AfterActionReview/AfterActionReview';
import { gameStore } from './GameStore';
import { useStaticData } from './StaticDataProvider';

const queryParams = qs.parse(window.location.search);

const Game = view(() => {
  const { state: gameState, socketConnected } = gameStore;
  const { loading: loadingStaticData } = useStaticData();

  useEffect(() => {
    gameStore.ensureSocket();
  }, []);

  if (loadingStaticData || !socketConnected) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '100vh' }}
      >
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!gameState) {
    return <EnterGame />;
  }

  if (queryParams.aar && gameState === GameStates.ASSESSMENT) {
    return <AfterActionReview />;
  }

  if (queryParams.isProjectorView) {
    return <Projector />;
  }

  if (gameState === GameStates.PREPARATION) {
    return <Mitigations className="mb-5 pb-5" allowSell={true} />;
  }

  if (gameState === GameStates.SIMULATION || GameStates.ASSESSMENT) {
    return <Simulation />;
  }

  return <>Unknown game state</>;
});

export default Game;
