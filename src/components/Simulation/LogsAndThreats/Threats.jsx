import React, { useMemo } from 'react';
import { Row, Col, Spinner } from 'react-bootstrap';
import { reduce as _reduce } from 'lodash';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { FiShield, FiAlertTriangle } from 'react-icons/fi';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from '../../GameStore';
import { msToMinutesSeconds } from '../../../util';
import { useStaticData } from '../../StaticDataProvider';

const Threats = view(({ className }) => {
  const { injections: gameInjections } = gameStore;
  const { injections } = useStaticData();

  const { threats, notThreats } = useMemo(
    () =>
      injections
        ? _reduce(
            injections,
            (
              acc,
              { trigger_time: triggerTime, title, id, location },
            ) => {
              const entry = {
                desc:
                  msToMinutesSeconds(triggerTime) + ' - ' + (title || id),
                location: location?.toUpperCase() || 'PARTY',
              };
              if (gameInjections[id]?.prevented) {
                acc.notThreats.push(entry);
              } else {
                acc.threats.push(entry);
              }
              return acc;
            },
            { threats: [], notThreats: [] },
          )
        : { threats: [], notThreats: [] },
    [gameInjections, injections],
  );

  return (
    <Row className={className} id="threats">
      <Col lg={6} className="mb-4 mb-lg-0">
        <section className="cs-card h-100">
          <div className="cs-card__head">
            <div className="cs-card__heading">
              <span
                className="cs-card__icon cs-card__icon--success"
                aria-hidden="true"
              >
                <FiShield />
              </span>
              <h3 className="cs-section-title">Mitigated threats</h3>
            </div>
          </div>
          <div className="threats-body">
            {notThreats.length > 0 ? (
              notThreats.map(({ desc, location }, i) => (
                <div className="cs-action-row" key={i}>
                  <span className="cs-action-row__name">
                    <AiOutlineCheck
                      className="text-success mr-2"
                      fontSize="18px"
                    />
                    {desc}
                  </span>
                  <span className="cs-action-row__meta">{location}</span>
                </div>
              ))
            ) : (
              <p className="cs-actions-empty">No threat mitigated.</p>
            )}
            {!injections && (
              <div className="d-flex justify-content-center">
                <Spinner animation="border" />
              </div>
            )}
          </div>
        </section>
      </Col>
      <Col lg={6}>
        <section className="cs-card h-100">
          <div className="cs-card__head">
            <div className="cs-card__heading">
              <span
                className="cs-card__icon cs-card__icon--coral"
                aria-hidden="true"
              >
                <FiAlertTriangle />
              </span>
              <h3 className="cs-section-title">Not mitigated threats</h3>
            </div>
          </div>
          <div className="threats-body">
            {threats.length > 0 ? (
              threats.map(({ desc, location }, i) => (
                <div className="cs-action-row" key={i}>
                  <span className="cs-action-row__name">
                    <AiOutlineClose
                      className="text-danger mr-2"
                      fontSize="18px"
                    />
                    {desc}
                  </span>
                  <span className="cs-action-row__meta">{location}</span>
                </div>
              ))
            ) : (
              <p className="cs-actions-empty">Every threat mitigated.</p>
            )}
            {!injections && (
              <div className="d-flex justify-content-center">
                <Spinner animation="border" />
              </div>
            )}
          </div>
        </section>
      </Col>
    </Row>
  );
});

export default Threats;
