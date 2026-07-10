import React, { useMemo, useCallback } from 'react';
import { Button, Form } from 'react-bootstrap';
import { filter as _filter } from 'lodash';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiServer } from 'react-icons/fi';

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
                systems[key]?.type === 'party' ||
                systems[key]?.type === location),
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

  const actionList = systemRelatedActions.length ? (
    systemRelatedActions.map((action) => (
      <Form.Check
        custom
        required
        type="radio"
        key={action.id}
        label={
          <span className="cs-action-row cs-action-row--selectable">
            <span className="cs-action-row__name">
              {action.description}
            </span>
            <span className="cs-action-row__meta">
              Restores:{' '}
              {action.systems_to_restore
                .map((systemId) => systems[systemId]?.name || systemId)
                .join(', ')}{' '}
              · {numberToUsd(action.cost)}
            </span>
          </span>
        }
        name="systemRelatedActions"
        disabled={action.cost > 0 && budget < action.cost}
        id={action.id}
        value={action.id}
      />
    ))
  ) : (
    <p className="cs-actions-empty">
      No system related action is available.
    </p>
  );

  // Embedded: a "System restore" sub-section inside the Technical systems
  // card (Action Table). No card chrome or big heading of its own.
  if (embedded) {
    return (
      <Form onSubmit={submitAction} noValidate id="system_actions">
        <div className="cs-subsection">
          <h3 className="cs-subsection-title mb-2">System restore</h3>
          {actionList}
          <Button
            variant="outline-primary"
            size="sm"
            className="rounded-pill cs-perform mt-2"
            type="submit"
            disabled={!systemRelatedActions.length}
          >
            Perform action
          </Button>
        </div>
      </Form>
    );
  }

  // Standalone room — used in the HQ/Local facilitator tabs.
  return (
    <section className={classNames('cs-card', className)} id="system_actions">
      <Form onSubmit={submitAction} noValidate>
        <div className="cs-card__head">
          <div className="cs-card__heading">
            <span className="cs-card__icon" aria-hidden="true">
              <FiServer />
            </span>
            <h2 className="cs-section-title">System restore</h2>
          </div>
        </div>
        {actionList}
        <Button
          variant="outline-primary"
          size="sm"
          className="rounded-pill cs-perform mt-2"
          type="submit"
          disabled={!systemRelatedActions.length}
        >
          Perform action
        </Button>
      </Form>
    </section>
  );
});

export default SystemRelatedActions;
