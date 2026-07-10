import React, { useCallback, useMemo, useRef } from 'react';
import { Form, Button } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';
import { gameStore } from '../GameStore';
import { reduce as _reduce } from 'lodash';
import { numberToUsd } from '../../util';
import { useStaticData } from '../StaticDataProvider';

const AvailableActionItems = view(({ actionList, role }) => {
  const {
    budget,
    actions: { performAction },
    popError,
    closeError,
  } = gameStore;

  const { getTextWithSynonyms } = useStaticData();

  const formRef = useRef();

  const submitAction = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isValid =
        event.target.checkValidity() && event.target?.actions?.value;
      if (isValid) {
        closeError();
        performAction({
          actionId: event.target.actions.value,
        });
        formRef.current.reset();
      } else {
        popError('Please select an action.');
      }
    },
    [popError, closeError, performAction],
  );

  const actionResultDescriptions = useMemo(
    () =>
      _reduce(
        actionList,
        (descriptions, action) => {
          const resultDescription = [];
          if (action.cost !== 0)
            resultDescription.push(
              `Cost: ${numberToUsd(action.cost)}`,
            );
          if (action.poll_increase !== 0)
            resultDescription.push(
              `Gain ${action.poll_increase}% in ${getTextWithSynonyms(
                'poll',
              )}`,
            );
          if (action.budget_increase !== 0)
            resultDescription.push(
              `Raise: ${numberToUsd(action.budget_increase)}`,
            );

          descriptions[action.id] = resultDescription.join(', ');
          return descriptions;
        },
        {},
      ),
    [actionList, getTextWithSynonyms],
  );

  return (
    <div className="cs-actions">
      <Form onSubmit={submitAction} noValidate ref={formRef}>
        <span className="cs-meta d-block mb-2">Available actions</span>
        {actionList.length ? (
          actionList.map((action) => (
            <Form.Check
              custom
              required
              type="radio"
              key={`${role}_${action.id}`}
              label={
                <span className="cs-action-row cs-action-row--selectable">
                  <span className="cs-action-row__name">
                    {action.description}
                  </span>
                  {actionResultDescriptions[action.id] && (
                    <span className="cs-action-row__meta">
                      {actionResultDescriptions[action.id]}
                    </span>
                  )}
                </span>
              }
              name="actions"
              disabled={action.cost > 0 && budget < action.cost}
              id={`${role}_${action.id}`}
              value={action.id}
            />
          ))
        ) : (
          <p className="cs-actions-empty">
            No action item is available to purchase.
          </p>
        )}
        <Button
          variant="outline-primary"
          size="sm"
          className="rounded-pill cs-perform mt-2"
          type="submit"
          disabled={actionList.length === 0}
        >
          Perform action
        </Button>
      </Form>
    </div>
  );
});

export default AvailableActionItems;
