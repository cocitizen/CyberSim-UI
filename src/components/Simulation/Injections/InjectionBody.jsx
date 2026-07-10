import React from 'react';
import { Row, Col } from 'react-bootstrap';
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
    gameInjection,
    isBackground,
  }) => {
    const { systems, injections, getTextWithSynonyms } =
      useStaticData();

    const recommendations = Array.isArray(injection.recommendations)
      ? injection.recommendations
      : [];
    const hasRecommendations = recommendations.length > 0;

    return (
      <div className="cs-inject__detail">
        <div className="cs-inject__detail-section">
          <Row>
            <Col xs={12} className="my-2">
              <span className="font-weight-bold">Description: </span>
              {injection.description}
            </Col>
            <Col xs={12} className="my-2">
              <Row>
                <Col xs={6} md={4}>
                  <span className="font-weight-bold">Recipient: </span>
                  {injection.recipient_role || '-'}
                </Col>
                <Col
                  xs={6}
                  md={4}
                  className={classNames({ 'text-disabled': prevented })}
                >
                  <span className="font-weight-bold">
                    Systems disabled:{' '}
                  </span>
                  {injection.systems_to_disable?.length
                    ? injection.systems_to_disable
                        .map((id) => systems[id]?.name || id)
                        .join(', ')
                    : '-'}
                </Col>
                <Col
                  xs={6}
                  md={2}
                  className={classNames({ 'text-disabled': prevented })}
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
                  {prevented ? 'Yes' : 'No'}
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
                {injection.followup_injection && (
                  <Col>
                    <span className="font-weight-bold">Follow up: </span>
                    {injections[injection.followup_injection]
                      ? `${msToMinutesSeconds(
                          injections[injection.followup_injection]
                            .trigger_time,
                        )} - ${
                          injections[injection.followup_injection].title
                        } (${
                          injections[
                            injection.followup_injection
                          ].location?.toUpperCase() || 'PARTY'
                        })`
                      : 'Unknown follow up'}
                  </Col>
                )}
              </Row>
            </Col>
          </Row>
        </div>

        {!prevented && !isBackground && (
          <div className="cs-inject__detail-section">
            <InjectionResponseForm
              injection={injection}
              gameInjection={gameInjection}
              disabled={!canMakeResponse}
            />
          </div>
        )}

        {hasRecommendations && (
          <div className="cs-inject__detail-section">
            <span className="font-weight-bold">
              Security recommendations:{' '}
            </span>
            <ul className="mb-0">
              {recommendations.map((recommendation, i) => (
                <li key={i}>{recommendation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
);

export default InjectionBody;
