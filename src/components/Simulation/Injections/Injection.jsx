import React, { useMemo, useState } from 'react';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { AiOutlineDown } from 'react-icons/ai';
import { Accordion, Form, Modal, Button } from 'react-bootstrap';

import InjectionBody from './InjectionBody';
import { gameStore } from '../../GameStore';
import { msToMinutesSeconds } from '../../../util';
import { useStaticData } from '../../StaticDataProvider';

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
    const [showDeliverConfirmation, setShowDeliverConfirmation] =
      useState(false);
    const [open, setOpen] = useState(false);

    const {
      actions: { deliverInjection },
    } = gameStore;
    const { getLocationNameByType } = useStaticData();
    const locationLabel = injection.location
      ? getLocationNameByType(
          injection.location,
          injection.location.toUpperCase(),
        )
      : 'Shared';

    // State shows via a left-accent bar + subtle tint on the row itself,
    // rather than a nested colored card.
    const stateClass = useMemo(() => {
      if (resolved || isBackground) return 'cs-inject--resolved';
      if (prevented) return 'cs-inject--prevented';
      if (isDanger) return 'cs-inject--danger';
      if (upcoming) return 'cs-inject--upcoming';
      return '';
    }, [upcoming, isDanger, prevented, resolved, isBackground]);

    return (
      <>
        <Accordion as="div" className={classNames('cs-inject', stateClass)}>
          <Accordion.Toggle
            as="div"
            eventKey="0"
            className="cs-inject__header"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="cs-inject__title">
              {`${msToMinutesSeconds(injection.trigger_time)} - ${
                injection.title
              }`}
            </span>
            <div className="cs-inject__meta">
              <span className="cs-pill cs-pill--location">
                {locationLabel}
              </span>
              {canMakeResponse && (
                <span className="cs-pill cs-pill--brand">
                  Needs response
                </span>
              )}
              {prevented && (
                <span className="cs-pill cs-pill--success">Avoided</span>
              )}
              {isBackground && (
                <span className="cs-pill cs-pill--muted">Background</span>
              )}
              {!upcoming && !delivered && !prevented && (
                <span className="cs-pill cs-pill--danger">Available</span>
              )}
              {!prevented && upcoming && (
                <span
                  className={classNames(
                    'cs-pill',
                    isDanger ? 'cs-pill--danger' : 'cs-pill--warning',
                  )}
                >
                  {isDanger ? 'Coming soon' : 'Upcoming'}
                </span>
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
                  label={<span>Trigger Effects</span>}
                  checked={delivered}
                  disabled={delivered}
                  onChange={(e) =>
                    e.target.checked && setShowDeliverConfirmation(true)
                  }
                />
              )}
              <AiOutlineDown
                className={classNames('cs-inject__chevron', {
                  'cs-inject__chevron--open': open,
                })}
                fontSize="20px"
              />
            </div>
          </Accordion.Toggle>
          <Accordion.Collapse eventKey="0">
            <div>
              <InjectionBody
                injection={injection}
                prevented={prevented}
                canMakeResponse={canMakeResponse}
                gameInjection={gameInjection}
                isBackground={isBackground}
              />
            </div>
          </Accordion.Collapse>
        </Accordion>
        <Modal
          show={showDeliverConfirmation}
          onHide={() => setShowDeliverConfirmation(false)}
          centered
          dialogClassName="finish-confirmation-modal"
        >
          <Modal.Body className="py-4 text-center">
            <h4 className="m-0">
              Are you sure you want to trigger the effects of the event?
            </h4>
          </Modal.Body>
          <Modal.Footer className="border-primary">
            <Button
              variant="outline-primary"
              onClick={() => setShowDeliverConfirmation(false)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                deliverInjection({ injectionId: injection.id });
                setShowDeliverConfirmation(false);
              }}
            >
              Trigger effects
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  },
);

export default Injection;
