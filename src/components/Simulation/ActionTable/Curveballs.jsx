import React, { useRef, useCallback } from 'react';
import { Button, Form } from 'react-bootstrap';
import { map as _map } from 'lodash';
import classNames from 'classnames';
import { FiZap } from 'react-icons/fi';

import { useStaticData } from '../../StaticDataProvider';
import { gameStore } from '../../GameStore';
import { numberToUsd } from '../../../util';

const Curveballs = ({ className }) => {
  const { curveballs, getTextWithSynonyms } = useStaticData();
  const {
    actions: { performCurveball },
    popError,
    closeError,
  } = gameStore;

  const formRef = useRef();

  const submitCurveball = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isValid =
        event.target.checkValidity() &&
        event.target?.curveballs?.value;
      if (isValid) {
        closeError();
        performCurveball({
          curveballId: event.target.curveballs.value,
        });
        formRef.current.reset();
      } else {
        popError('Please select an action.');
      }
    },
    [popError, closeError, performCurveball],
  );

  return (
    <section className={classNames('cs-card', className)} id="curveball">
      <Form onSubmit={submitCurveball} noValidate ref={formRef}>
        <div className="cs-card__head">
          <div className="cs-card__heading">
            <span
              className="cs-card__icon cs-card__icon--coral"
              aria-hidden="true"
            >
              <FiZap />
            </span>
            <h2 className="cs-section-title">Curveball events</h2>
          </div>
        </div>
        {_map(curveballs, (curveball) => {
          const meta = [];
          if (curveball.budget_change || curveball.lose_all_budget) {
            meta.push(
              `${getTextWithSynonyms('Budget')}: ${
                curveball.lose_all_budget
                  ? 'Party loses all its money'
                  : `${
                      curveball.budget_change > 0 ? '+' : ''
                    }${numberToUsd(curveball.budget_change)}`
              }`,
            );
          }
          if (curveball.poll_change) {
            meta.push(
              `${getTextWithSynonyms('Poll')}: ${
                curveball.poll_change > 0 ? '+' : ''
              }${curveball.poll_change}%`,
            );
          }
          return (
            <Form.Check
              custom
              required
              type="radio"
              key={curveball.id}
              label={
                <span className="cs-action-row cs-action-row--selectable">
                  <span className="cs-action-row__name">
                    {curveball.description}
                  </span>
                  {meta.length > 0 && (
                    <span className="cs-action-row__meta">
                      {meta.join(' · ')}
                    </span>
                  )}
                </span>
              }
              name="curveballs"
              id={curveball.id}
              value={curveball.id}
            />
          );
        })}
        <Button
          variant="outline-primary"
          size="sm"
          className="rounded-pill cs-perform mt-2"
          type="submit"
        >
          Trigger event
        </Button>
      </Form>
    </section>
  );
};

export default Curveballs;
