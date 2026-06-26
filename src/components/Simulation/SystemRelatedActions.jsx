import React, { useMemo, useCallback } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { filter as _filter } from 'lodash';
import { view } from '@risingstack/react-easy-state';

import { useStaticData } from '../StaticDataProvider';
import { gameStore } from '../GameStore';
import { numberToUsd } from '../../util';

const SystemRelatedActions = view(({ location, className, embedded }) => {
  const {
    budget,
    mitigations: gameMitigations,
    systems: gameSystems,
    popError,
    closeError,
    actions: { restoreSystem },
  } = gameStore;
  const { responses, systems } = useStaticData();

  const systemRelatedActions = useMemo(
    () =>
      _filter(
        responses,
        ({
          systems_to_restore,
          required_mitigation: requiredMitigationId,
        }) =>
          // has system to restore
          systems_to_restore?.length &&
          // location specific restorable system is down
          systems_to_restore.some(
            (key) =>
              !gameSystems[key] &&
              (!location ||
                systems[key].type === 'party' ||
                systems[key].type === location),
          ) &&
          // required mitigation met
          (!requiredMitigationId ||
            gameMitigations[requiredMitigationId]),
      ),
    [responses, gameMitigations, gameSystems, location, systems],
  );

  const submitAction = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isValid =
        event.target.checkValidity() &&
        event.target?.systemRelatedActions?.value;
      if (isValid) {
        closeError();
        restoreSystem({
          responseId: event.target.systemRelatedActions.value,
        });
      } else {
        popError('Please select an action.');
      }
    },
    [popError, closeError, restoreSystem],
  );

  const actionList = systemRelatedActions.length
    ? systemRelatedActions.map((action) => (
        <Form.Check
          custom
          required
          type="radio"
          className="custom-radio-right"
          key={action.id}
          label={
            <Row className="py-1 select-row align-items-center">
              <Col xs={10}>
                {`${
                  action.description
                } (Restores:${action.systems_to_restore.map(
                  (systemId) => ` ${systems[systemId].name}`,
                )})`}
              </Col>
              <Col
                xs={2}
                className="justify-content-end d-flex align-items-center"
              >
                {numberToUsd(action.cost)}
              </Col>
            </Row>
          }
          name="systemRelatedActions"
          disabled={action.cost > 0 && budget < action.cost}
          id={action.id}
          value={action.id}
        />
      ))
    : 'No system related action is available.';

  // Embedded: a "System restore" sub-section inside the Technical systems
  // card (Action Table). No card chrome or big heading of its own.
  if (embedded) {
    return (
      <Form onSubmit={submitAction} noValidate id="system_actions">
        <div className="cs-subsection">
          <div className="cs-subsection__head">
            <h3 className="cs-subsection-title">System restore</h3>
            <Button
              variant="outline-primary"
              className="rounded-pill"
              type="submit"
              disabled={!systemRelatedActions.length}
            >
              Perform action
            </Button>
          </div>
          <Row>
            <Col>{actionList}</Col>
          </Row>
        </div>
      </Form>
    );
  }

  // Original layout — unchanged — used standalone in the HQ/Local tabs.
  return (
    <Form onSubmit={submitAction} noValidate id="system_actions">
      <Row className={className}>
        <Col xs={9}>
          <h2 className="font-weight-bold">
            ACTIONS RELATED TO TECHNICAL SYSTEMS:
          </h2>
        </Col>
        <Col xs={3}>
          <Button
            variant="outline-primary"
            className="rounded-pill w-100"
            type="submit"
            disabled={!systemRelatedActions.length}
          >
            PERFORM ACTION
          </Button>
        </Col>
        <Col>{actionList}</Col>
      </Row>
    </Form>
  );
});

export default SystemRelatedActions;
