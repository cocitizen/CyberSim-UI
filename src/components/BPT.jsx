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

  return (
    <h4
      className={classNames(
        'bpt-item font-weight-normal mb-0 d-flex align-items-center',
        {
          'text-danger': paused,
        },
      )}
    >
      <BsClock className={big ? 'mr-3 pr-1' : 'mr-2'} />
      {timeTaken}
    </h4>
  );
});

// BudgetPollTimer
const BPT = view(({ big }) => {
  const { budget, poll } = gameStore;
  const { getTextWithSynonyms } = useStaticData();

  return (
    <Row
      className={classNames({
        'bpt-big': big,
      })}
    >
      <Col
        xs={6}
        md={4}
        style={{ whiteSpace: 'nowrap' }}
        className={classNames('px-2', {
          'd-flex flex-column align-items-center': big,
        })}
      >
        {big && (
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Available Budget')}
          </h2>
        )}
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
        className={classNames('px-2 d-flex', {
          'justify-content-center': !big,
          'flex-column align-items-center': big,
        })}
      >
        {big && (
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Support')}
          </h2>
        )}
        <h4 className="bpt-item font-weight-normal mb-0">{poll} %</h4>
      </Col>
      <Col
        xs={12}
        md={4}
        className={classNames('px-2 d-flex', {
          'justify-content-end': !big,
          'flex-column align-items-center': big,
        })}
      >
        {big && (
          <h2 className="font-weight-bold my-2">
            {getTextWithSynonyms('Time Elapsed')}
          </h2>
        )}
        <TimeTaken big={big} />
      </Col>
    </Row>
  );
});

export default BPT;
