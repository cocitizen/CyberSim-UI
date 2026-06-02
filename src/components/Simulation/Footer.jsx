import React, { useState } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Nav,
  Modal,
} from 'react-bootstrap';
import { FiPlay, FiBarChart2, FiClipboard } from 'react-icons/fi';
import { AiOutlinePause } from 'react-icons/ai';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from '../GameStore';
import { GameStates } from '../../constants';
import BPT from '../BPT';

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
      <div
        className="border-primary border-top position-fixed w-100 bg-white shadow-lg"
        style={{
          bottom: 0,
          paddingBottom: '0.75rem',
          paddingTop: '0.75rem',
          zIndex: 10,
        }}
      >
        <Container fluid="md">
          <Row className="d-flex align-items-center justify-content-center">
            <Col xs={4} md={5}>
              <BPT />
            </Col>
            <Col xs={2} className="p-0 d-flex justify-content-center">
              <Button
                variant="primary"
                className="rounded-circle d-flex justify-content-center align-items-center shadow-none"
                type="button"
                style={{
                  fontSize: '25px',
                  padding: paused ? '6px 4px 6px 8px' : '6px',
                }}
                onClick={paused ? resumeSimulation : pauseSimulation}
              >
                {paused ? <FiPlay /> : <AiOutlinePause />}
              </Button>
            </Col>
            <Col
              xs={7}
              md={5}
              className="pl-0 pr-md-0 d-flex justify-content-end"
            >
              {gameState !== GameStates.ASSESSMENT && (
                <Button
                  variant="outline-primary"
                  className="rounded-pill ml-1 ml-lg-3"
                  type="button"
                  onClick={() => setShowFinishConfirmation(true)}
                >
                  <h4
                    className="font-weight-normal mb-0"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    FINISH
                    <span className="d-none d-lg-inline">
                      {' '}
                      SIMULATION
                    </span>
                  </h4>
                </Button>
              )}
              <Nav.Link
                href={`?gameId=${id}&isProjectorView=true`}
                className="btn btn-outline-primary rounded-pill ml-1 ml-lg-3 d-flex align-items-center projector-button"
                target="_blank"
              >
                <div>
                  <FiBarChart2 fontSize="25px" />
                </div>
                <h4 className="font-weight-normal mb-0 ml-1">
                  PROJECTOR
                </h4>
              </Nav.Link>
              {gameState === GameStates.ASSESSMENT && (
                <Nav.Link
                  href={`?gameId=${id}&aar=true`}
                  className="btn btn-outline-primary rounded-pill ml-1 ml-lg-3 d-flex align-items-center"
                  target="_blank"
                >
                  <div>
                    <FiClipboard fontSize="25px" />
                  </div>
                  <h4 className="font-weight-normal mb-0 ml-1">
                    AAR
                  </h4>
                </Nav.Link>
              )}
            </Col>
          </Row>
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
            CLOSE
          </Button>
          <Button variant="primary" onClick={finishSimulation}>
            FINISH SIMULATION
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default Footer;
