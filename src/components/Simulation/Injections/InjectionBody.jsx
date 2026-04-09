import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';

import InjectionResponseForm from './InjectionResponseForm';
import { useStaticData } from '../../StaticDataProvider';
import { msToMinutesSeconds, numberToUsd } from '../../../util';

const InjectionBody = view(
  ({
    injection,
    prevented,
    canMakeResponse,
    bgColor = '',
    gameInjection,
    isBackground,
  }) => {
    const { systems, injections, getTextWithSynonyms } =
      useStaticData();

    return (
      <div>
        <Card.Body
          className={classNames(
            'border-top border-primary injection-body',
            bgColor,
            {
              'border-bottom':
                injection.recommendations ||
                (!prevented && !isBackground),
            },
          )}
        >
          <Row>
            <Col xs={12} className="my-2">
              <span className="font-weight-bold">Description: </span>
              {injection.description}
            </Col>
            <Col xs={12} className="my-2">
              <Row>
                <Col xs={6} md={4}>
                  <span className="font-weight-bold">
                    Recipient:{' '}
                  </span>
                  {injection.recipient_role || '-'}
                </Col>
                <Col
                  xs={6}
                  md={4}
                  className={classNames({
                    'text-disabled': prevented,
                  })}
                >
                  <span className="font-weight-bold">
                    Systems disabled:{' '}
                  </span>
                  {injection.systems_to_disable?.length
                    ? injection.systems_to_disable.map(
                        (id) => systems[id].name,
                      )
                    : '-'}
                </Col>
                <Col
                  xs={6}
                  md={2}
                  className={classNames({
                    'text-disabled': prevented,
                  })}
                >
                  <span className="font-weight-bold">
                    {getTextWithSynonyms('Poll')}:{' '}
                  </span>
                  {injection.poll_change
                    ? `${injection.poll_change}%`
                    : '-'}
                </Col>
                {injection.budget_change != null && (
                  <Col
                    xs={6}
                    md={2}
                    className={classNames({
                      'text-disabled': prevented,
                    })}
                  >
                    <span className="font-weight-bold">Budget: </span>
                    {numberToUsd(injection.budget_change)}
                    {prevented && ' (avoided)'}
                  </Col>
                )}
                <Col xs={6} md={2}>
                  <span className="font-weight-bold">Avoided: </span>
                  {prevented ? 'YES' : 'NO'}
                </Col>
              </Row>
            </Col>
            <Col xs={12} className="my-2">
              <Row>
                <Col xs={6} md={4}>
                  <span className="font-weight-bold">
                    Asset to deliver to table:{' '}
                  </span>
                  {injection.asset_code}
                </Col>
                {injection.followup_injecion && (
                  <Col>
                    <span className="font-weight-bold">
                      Follow up:{' '}
                    </span>
                    {`${msToMinutesSeconds(
                      injections[injection.followup_injecion]
                        .trigger_time,
                    )} - ${
                      injections[injection.followup_injecion].title
                    } (${
                      injections[
                        injection.followup_injecion
                      ].location?.toUpperCase() || 'PARTY'
                    })`}
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </Card.Body>
        {!prevented && !isBackground && (
          <Card.Body
            className={classNames(
              'border-primary injection-body',
              bgColor,
              { 'border-bottom': injection.recommendations },
            )}
          >
            <InjectionResponseForm
              injection={injection}
              gameInjection={gameInjection}
              disabled={!canMakeResponse}
            />
          </Card.Body>
        )}
        {injection.recommendations && (
          <Card.Body
            className={classNames('injection-body', bgColor)}
          >
            <Row>
              <Col xs={12}>
                <span className="font-weight-bold">
                  Security Recommendations:{' '}
                </span>
                {injection.recommendations}
              </Col>
            </Row>
          </Card.Body>
        )}
      </div>
    );
  },
);

export default InjectionBody;
