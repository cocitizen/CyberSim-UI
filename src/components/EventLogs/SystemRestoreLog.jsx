import React, { useMemo } from 'react';
import { Row, Col, Card, Badge } from 'react-bootstrap';

import Log from './Log';
import { useStaticData } from '../StaticDataProvider';
import { msToMinutesSeconds, numberToUsd } from '../../util';

const SystemRestoreLog = ({ game_timer, type, response_id, action_id }) => {
  const { responses, systems } = useStaticData();
  const response = useMemo(
    () => responses[response_id] || responses[action_id],
    [responses, response_id, action_id],
  );
  const description = response?.description || 'Unknown restore action';

  return (
    <Log
      title={
        <div className="d-flex align-items-center">
          {`${msToMinutesSeconds(game_timer)} -`}
          <Badge
            pill
            variant="light"
            className="py-1 mx-1 text-dark border-dark border"
          >
            {type}
          </Badge>
          {description}
        </div>
      }
    >
      <Card.Body>
        <Row>
          <Col xs={6}>{description}</Col>
          <Col xs={4}>
            <span className="font-weight-bold">Restores: </span>
            <span className="text-uppercase">
              {response?.systems_to_restore
                ?.map((systemId) => systems[systemId]?.name)
                .filter(Boolean)
                .join(', ') || 'Unknown'}
            </span>
          </Col>
          <Col xs={2} className="text-right">
            <span className="font-weight-bold">Cost: </span>
            {response ? numberToUsd(response.cost) : 'Unknown'}
          </Col>
        </Row>
      </Card.Body>
    </Log>
  );
};

export default SystemRestoreLog;
