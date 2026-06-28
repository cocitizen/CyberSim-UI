import React, { useMemo } from 'react';
import { Row, Col, Card } from 'react-bootstrap';

import Log from './Log';
import { logTypeLabels } from './EventLogs';
import { useStaticData } from '../StaticDataProvider';
import { msToMinutesSeconds, numberToUsd } from '../../util';

const CampaignActionLog = ({ game_timer, type, action_id }) => {
  const { actions } = useStaticData();
  const action = useMemo(() => actions[action_id], [
    actions,
    action_id,
  ]);
  const description = action?.description || 'Unknown campaign action';

  return (
    <Log
      title={
        <div className="d-flex align-items-center">
          {`${msToMinutesSeconds(game_timer)} -`}
          <span className="cs-pill cs-pill--brand mx-1">
            {logTypeLabels[type] || type}
          </span>
          {description}
        </div>
      }
    >
      <Card.Body>
        <Row>
          <Col xs={6}>{description}</Col>
          <Col xs={2} className="text-right">
            <span className="font-weight-bold">Cost: </span>
            {action ? numberToUsd(action.cost) : 'Unknown'}
          </Col>
          <Col xs={2} className="text-right">
            <span className="font-weight-bold">Poll: </span>
            {action ? `+${action.poll_increase}%` : 'Unknown'}
          </Col>
          <Col xs={2} className="text-right">
            <span className="font-weight-bold">Raise: </span>
            {action ? numberToUsd(action.budget_increase) : 'Unknown'}
          </Col>
        </Row>
      </Card.Body>
    </Log>
  );
};

export default CampaignActionLog;
