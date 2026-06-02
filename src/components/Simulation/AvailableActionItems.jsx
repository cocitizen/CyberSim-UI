import React, { useCallback, useMemo, useRef } from 'react';
import { Row, Col, Form, Button, Container } from 'react-bootstrap';
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
    <Container className="p-0 m-0 pl-3">
      <Form
        onSubmit={submitAction}
        noValidate
        className="mb-4"
        ref={formRef}
      >
        <Row className="d-flex align-items-center mb-1">
          <Col xs={8} lg={9}>
            <h6 className="m-0 font-weight-bold">
              AVAILABLE ACTIONS:
            </h6>
          </Col>
          <Col xs={4} lg={3}>
            <Button
              variant="outline-primary"
              className="rounded-pill w-100"
              type="submit"
              disabled={actionList.length === 0}
            >
              PERFORM ACTION
            </Button>
          </Col>
        </Row>
        <Row>
          <Col>
            {actionList.length
              ? actionList.map((action) => (
                  <Form.Check
                    custom
                    required
                    type="radio"
                    className="custom-radio-right"
                    key={`${role}_${action.id}`}
                    label={
                      <Row className="py-1 select-row align-items-center">
                        <Col xs={9}>{action.description}</Col>
                        <Col className="flex-grow-1 text-right">
                          {actionResultDescriptions[action.id]}
                        </Col>
                      </Row>
                    }
                    name="actions"
                    disabled={action.cost > 0 && budget < action.cost}
                    id={`${role}_${action.id}`}
                    value={action.id}
                  />
                ))
              : 'No action item is available to purchase.'}
          </Col>
        </Row>
      </Form>
    </Container>
  );
});

export default AvailableActionItems;
