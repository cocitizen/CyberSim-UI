import React, { useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap';

import Log from './Log';
import { logTypeLabels } from './EventLogs';
import { useStaticData } from '../StaticDataProvider';
import { msToMinutesSeconds, numberToUsd } from '../../util';

const BudgetItemLog = ({ game_timer, type, mitigation_id }) => {
  const { mitigations } = useStaticData();
  const mitigation = useMemo(
    () => mitigations[mitigation_id],
    [mitigations, mitigation_id],
  );
  const description = mitigation?.description || 'Unknown budget item';

  return (
    <Log
      title={
        <div className="d-flex align-items-center">
          {`${msToMinutesSeconds(game_timer)} -`}
          <span className="cs-pill cs-pill--muted mx-1">
            {logTypeLabels[type] || type}
          </span>
          {mitigation?.category || 'Unknown'}
        </div>
      }
    >
      <Card.Body>
        <Row>
          <Col xs={10}>{description}</Col>
          <Col xs={2} className="text-right">
            <span className="font-weight-bold">Cost: </span>
            {mitigation ? numberToUsd(mitigation.cost) : 'Unknown'}
          </Col>
        </Row>
      </Card.Body>
    </Log>
  );
};

export default BudgetItemLog;
