import React from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames';
import { BsClock } from 'react-icons/bs';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from './GameStore';
import { numberToUsd } from '../util';
import useTimeTaken from '../hooks/useTimeTaken';
import { useStaticData } from './StaticDataProvider';

const TimeTaken = view(({ big }) => {
  const { paused } = gameStore;
  const timeTaken = useTimeTaken({ formatted: true });

  // Projector layout — unchanged.
  if (big) {
    return (
      <h4
        className={classNames(
          'bpt-item font-weight-normal mb-0 d-flex align-items-center',
          { 'text-danger': paused },
        )}
      >
        <BsClock className="mr-3 pr-1" />
        {timeTaken}
      </h4>
    );
  }

  // Facilitator instrument readout.
  return (
    <div
      className={classNames(
        'cs-metric__value d-flex align-items-center',
        { 'cs-metric__value--bad': paused },
      )}
    >
      <BsClock className="mr-2" style={{ fontSize: '1.1rem' }} />
      {timeTaken}
    </div>
  );
});

// BudgetPollTimer
const BPT = view(({ big }) => {
  const { budget, poll } = gameStore;
  const { getTextWithSynonyms } = useStaticData();

  // Projector (big): unchanged centered layout with large headings.
  if (big) {
    return (
      <Row className="bpt-big">
        <Col
          xs={6}
          md={4}
          style={{ whiteSpace: 'nowrap' }}
          className="px-2 d-flex flex-column align-items-center"
        >
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Available Budget')}
          </h2>
          <h4
            className="bpt-item font-weight-normal mb-0"
            style={budget < 0 ? { color: 'red' } : undefined}
          >
            {numberToUsd(budget).replace('$', '$ ')}
          </h4>
        </Col>
        <Col
          xs={6}
          md={4}
          className="px-2 d-flex flex-column align-items-center"
        >
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Support')}
          </h2>
          <h4 className="bpt-item font-weight-normal mb-0">{poll} %</h4>
        </Col>
        <Col
          xs={12}
          md={4}
          className="px-2 d-flex flex-column align-items-center"
        >
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Time Elapsed')}
          </h2>
          <TimeTaken big />
        </Col>
      </Row>
    );
  }

  // Facilitator: a compact instrument panel of labelled, semantic-coloured
  // readouts. Support thresholds are deliberately simple and easy to tune.
  let supportClass = 'cs-metric__value--good';
  if (poll < 25) supportClass = 'cs-metric__value--bad';
  else if (poll < 50) supportClass = 'cs-metric__value--warn';

  return (
    <div className="cs-instrument">
      <div className="cs-metric">
        <div className="cs-metric__label">
          {getTextWithSynonyms('Available Budget')}
        </div>
        <div
          className={classNames('cs-metric__value', {
            'cs-metric__value--bad': budget < 0,
          })}
        >
          {numberToUsd(budget).replace('$', '$ ')}
        </div>
      </div>
      <div className="cs-metric">
        <div className="cs-metric__label">
          {getTextWithSynonyms('Support')}
        </div>
        <div className={classNames('cs-metric__value', supportClass)}>
          {poll} %
        </div>
      </div>
      <div className="cs-metric">
        <div className="cs-metric__label">
          {getTextWithSynonyms('Time Elapsed')}
        </div>
        <TimeTaken />
      </div>
    </div>
  );
});

export default BPT;
