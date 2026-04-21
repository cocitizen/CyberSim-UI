import React from 'react';
import { Row, Col, Card, Container } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';

import { GameStates } from '../constants';
import { gameStore } from './GameStore';
import BPT from './BPT';
import Systems from './Systems';
import EventLogs from './EventLogs/EventLogs';
import PurchasedMitigations from './Projector/PurchasedMitigations';

const Projector = view(() => {
  const { id, state: gameState } = gameStore;

  return (
    <>
      <div
        className="position-sticky bg-white shadow"
        style={{ top: 0, zIndex: 10 }}
      >
        <Row className="m-0">
          <Col
            xs={12}
            className="simulation-menu-item--big active p-2 d-flex justify-content-center"
          >
            <h1 className="my-2">{id}</h1>
          </Col>
        </Row>
      </div>
      <Container>
        <div className="my-5 py-5 border-bottom border-primary thick-border">
          <BPT big />
        </div>
        {gameState === GameStates.ASSESSMENT ? (
          <EventLogs />
        ) : (
          <Systems big centerHeader />
        )}
        {gameState !== GameStates.ASSESSMENT && (
          <Row className="mt-3 mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <strong>Purchased Budget Items</strong>
                </Card.Header>
                <Card.Body>
                  <PurchasedMitigations />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </>
  );
});

export default Projector;
