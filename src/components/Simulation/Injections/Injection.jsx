import React, { useMemo, useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { AiOutlineDown } from 'react-icons/ai';
import {
  Accordion,
  Card,
  Row,
  Col,
  Form,
  Modal,
  Button,
  Badge,
} from 'react-bootstrap';

import InjectionBody from './InjectionBody';
import { gameStore } from '../../GameStore';
import { msToMinutesSeconds } from '../../../util';

const Injection = view(
  ({
    injection,
    prevented,
    delivered,
    isDanger,
    upcoming,
    canDeliver,
    canMakeResponse,
    resolved,
    gameInjection,
    isBackground,
  }) => {
    const [
      showDeliverConfirmation,
      setShowDeliverConfirmation,
    ] = useState(false);

    const {
      actions: { deliverInjection },
    } = gameStore;

    const bgColor = useMemo(() => {
      if (resolved || isBackground) {
        return 'bg-light';
      }
      if (prevented) {
        return 'bg-success-light';
      }
      if (isDanger) {
        return 'bg-danger-light';
      }
      if (upcoming) {
        return 'bg-warning-light';
      }
      return 'bg-white';
    }, [upcoming, isDanger, prevented, resolved, isBackground]);

    return (
      <>
        <Accordion className="my-4">
          <Card
            className="border-primary injection"
            style={{ borderRadius: '1rem' }}
          >
            <Accordion.Toggle
              as={Card.Header}
              eventKey="0"
              className={classNames(
                'cursor-pointer border-primary py-3 injection-header',
                bgColor,
              )}
            >
              <Row className="align-items-center">
                <Col xs={6} className="font-weight-bold">
                  {`${msToMinutesSeconds(injection.trigger_time)} - ${
                    injection.title
                  }`}
                </Col>
                <Col
                  xs={6}
                  className="d-flex justify-content-end align-items-center pl-1"
                >
                  {canMakeResponse && (
                    <Badge pill variant="info" className="py-1 mx-1">
                      NEEDS RESPONSE
                    </Badge>
                  )}
                  {prevented && (
                    <Badge
                      pill
                      variant="success"
                      className="py-1 mx-1"
                    >
                      AVOIDED
                    </Badge>
                  )}
                  {isBackground && (
                    <Badge
                      pill
                      variant="primary"
                      className="py-1 mx-1"
                    >
                      BACKGROUND
                    </Badge>
                  )}
                  {!upcoming && !delivered && !prevented && (
                    <Badge
                      pill
                      variant="danger"
                      className="py-1 mx-1"
                    >
                      AVAILABLE
                    </Badge>
                  )}
                  {!prevented && upcoming && (
                    <Badge
                      pill
                      variant={isDanger ? 'danger' : 'warning'}
                      className="py-1 mr-1 text-white"
                    >
                      {isDanger ? 'COMING SOON' : 'UPCOMING'}
                    </Badge>
                  )}
                  {!resolved && (canDeliver || delivered) && (
                    <Form.Check
                      type="switch"
                      className={classNames(
                        'custom-switch-right rounded-pill px-2 py-1',
                        { 'select-row': canDeliver },
                      )}
                      style={{ width: 'fit-content' }}
                      id={injection.id}
                      label={
                        isBackground ? (
                          <span>Activate background event:</span>
                        ) : (
                          <span>
                            Delivered to table (trigger effects):
                          </span>
                        )
                      }
                      checked={delivered}
                      disabled={delivered}
                      onChange={(e) =>
                        e.target.checked &&
                        setShowDeliverConfirmation(true)
                      }
                    />
                  )}
                  <AiOutlineDown
                    className="ml-1 text-primary"
                    fontSize="25px"
                  />
                </Col>
              </Row>
            </Accordion.Toggle>
            <Accordion.Collapse eventKey="0">
              <InjectionBody
                injection={injection}
                prevented={prevented}
                canMakeResponse={canMakeResponse}
                bgColor={bgColor}
                gameInjection={gameInjection}
                isBackground={isBackground}
              />
            </Accordion.Collapse>
          </Card>
        </Accordion>
        <Modal
          show={showDeliverConfirmation}
          onHide={() => setShowDeliverConfirmation(false)}
          centered
          dialogClassName="finish-confirmation-modal"
        >
          <Modal.Body className="py-4 text-center">
            <h4 className="m-0">
              Are you sure you want to trigger the effects of the
              event?
            </h4>
          </Modal.Body>
          <Modal.Footer className="border-primary">
            <Button
              variant="outline-primary"
              onClick={() => setShowDeliverConfirmation(false)}
            >
              CLOSE
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                deliverInjection({ injectionId: injection.id });
                setShowDeliverConfirmation(false);
              }}
            >
              TRIGGER EFFECTS
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  },
);

export default Injection;
