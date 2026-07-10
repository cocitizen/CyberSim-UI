import React, { useState } from 'react';
import { Container, Button, Nav, Modal } from 'react-bootstrap';
import { FiPlay, FiBarChart2, FiClipboard } from 'react-icons/fi';
import { AiOutlinePause } from 'react-icons/ai';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from '../GameStore';
import { GameStates } from '../../constants';
import BPT from '../BPT';
import { gameViewPath } from '../../util/gameSlug';

const Footer = view(() => {
  const {
    id,
    paused,
    state: gameState,
    actions: { resumeSimulation, pauseSimulation, finishSimulation },
  } = gameStore;

  const [showFinishConfirmation, setShowFinishConfirmation] =
    useState(false);

  return (
    <>
      <div className="cs-statusbar">
        <Container fluid="md" className="cs-statusbar__inner">
          <BPT />
          <div className="cs-statusbar__controls">
            <Button
              variant="primary"
              className="rounded-circle cs-chunky d-flex justify-content-center align-items-center"
              type="button"
              style={{
                fontSize: '22px',
                width: '44px',
                height: '44px',
                padding: 0,
                paddingLeft: paused ? '4px' : 0,
              }}
              onClick={paused ? resumeSimulation : pauseSimulation}
              aria-label={paused ? 'Resume simulation' : 'Pause simulation'}
            >
              {paused ? <FiPlay /> : <AiOutlinePause />}
            </Button>
            {gameState !== GameStates.ASSESSMENT && (
              <Button
                variant="primary"
                className="cs-chunky"
                type="button"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setShowFinishConfirmation(true)}
              >
                Finish
                <span className="d-none d-lg-inline"> simulation</span>
              </Button>
            )}
            <Nav.Link
              href={gameViewPath(id, 'projector')}
              className="btn btn-light cs-chunky d-flex align-items-center projector-button"
              target="_blank"
            >
              <FiBarChart2 fontSize="20px" />
              <span className="ml-1">Projector</span>
            </Nav.Link>
            {gameState === GameStates.ASSESSMENT && (
              <Nav.Link
                href={gameViewPath(id, 'review')}
                className="btn btn-light cs-chunky d-flex align-items-center"
                target="_blank"
              >
                <FiClipboard fontSize="20px" />
                <span className="ml-1">AAR</span>
              </Nav.Link>
            )}
          </div>
        </Container>
      </div>
      <Modal
        show={showFinishConfirmation}
        onHide={() => setShowFinishConfirmation(false)}
        centered
        dialogClassName="finish-confirmation-modal"
      >
        <Modal.Body className="py-4 text-center">
          <h4 className="m-0">
            Are you sure you want to finish this simulation?
          </h4>
        </Modal.Body>
        <Modal.Footer className="border-primary">
          <Button
            variant="outline-primary"
            onClick={() => setShowFinishConfirmation(false)}
          >
            Close
          </Button>
          <Button variant="primary" onClick={finishSimulation}>
            Finish simulation
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default Footer;
