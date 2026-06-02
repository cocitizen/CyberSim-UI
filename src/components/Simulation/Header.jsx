import React from 'react';
import { Row, Col } from 'react-bootstrap';
import classNames from 'classnames';
import { view } from '@risingstack/react-easy-state';

import { SimulationTabs } from '../../constants';
import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';

const Header = view(({ activeTab, setActiveTab }) => {
  const { id } = gameStore;
  const { getLocationNameByType, scenarioName } = useStaticData();

  return (
    <div className="position-sticky bg-white text-center simulation-menu shadow">
      <Row className="m-0">
        <Col xs={12} className="p-0 d-flex justify-content-center">
          <h4 className="my-1 font-weight-bold">
            {id}{scenarioName && ` — ${scenarioName}`}
          </h4>
        </Col>
      </Row>
      <Row className="m-0 border-primary border-bottom border-top shadow-sm">
        <Col
          xs={3}
          className={classNames(
            'simulation-menu-item cursor-pointer border-primary border-right p-0',
            {
              active: activeTab === SimulationTabs.ACTION_TABLE,
            },
          )}
          onClick={() => setActiveTab(SimulationTabs.ACTION_TABLE)}
        >
          <h5 className="my-2">ACTION TABLE</h5>
        </Col>
        <Col
          xs={3}
          className={classNames(
            'simulation-menu-item cursor-pointer border-primary border-right p-0',
            {
              active: activeTab === SimulationTabs.CAMPAIGN_HQ,
            },
          )}
          onClick={() => setActiveTab(SimulationTabs.CAMPAIGN_HQ)}
        >
          <h5 className="my-2">
            {getLocationNameByType('hq', 'HQ').toUpperCase()}
          </h5>
        </Col>
        <Col
          xs={3}
          className={classNames(
            'simulation-menu-item cursor-pointer border-primary border-right p-0',
            {
              active: activeTab === SimulationTabs.LOCAL_BRANCH,
            },
          )}
          onClick={() => setActiveTab(SimulationTabs.LOCAL_BRANCH)}
        >
          <h5 className="my-2">
            {getLocationNameByType('local', 'LOCAL').toUpperCase()}
          </h5>
        </Col>
        <Col
          xs={3}
          className={classNames(
            'simulation-menu-item cursor-pointer p-0',
            {
              active: activeTab === SimulationTabs.LOGS_AND_THREATS,
            },
          )}
          onClick={() =>
            setActiveTab(SimulationTabs.LOGS_AND_THREATS)
          }
        >
          <h5 className="my-2">EVENT LOGS</h5>
        </Col>
      </Row>
      <Row className="m-0 border-primary border-bottom">
        {activeTab === SimulationTabs.ACTION_TABLE && (
          <>
            <Col
              md={2}
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document
                  .querySelector('#hq_actions')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >
              <p className="my-0">
                {`${getLocationNameByType(
                  'hq',
                  'HQ',
                )} ACTIONS`.toUpperCase()}
              </p>
            </Col>
            <Col
              md={2}
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document
                  .querySelector('#local_actions')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >
              <p className="my-0">
                {`${getLocationNameByType(
                  'local',
                  'LOCAL',
                )} ACTIONS`.toUpperCase()}
              </p>
            </Col>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document
                  .querySelector('#mitigations')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >
              <p className="my-0">ITEM INVENTORY</p>
            </Col>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document.querySelector('#systems')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              <p className="my-0">TECHNICAL SYSTEMS</p>
            </Col>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer p-0"
              onClick={() =>
                document.querySelector('#curveball')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              <p className="my-0">CURVEBALL EVENTS</p>
            </Col>
          </>
        )}
        {(activeTab === SimulationTabs.CAMPAIGN_HQ ||
          activeTab === SimulationTabs.LOCAL_BRANCH) && (
          <>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document.querySelector('#injects')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              <p className="my-0">EVENTS & RESPONSES</p>
            </Col>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document
                  .querySelector('#system_actions')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >
              <p className="my-0">SYSTEM RESTORE</p>
            </Col>
            <Col
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer p-0"
              onClick={() =>
                document
                  .querySelector('#resolved_injects')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }
            >
              <p className="my-0">RESOLVED EVENTS</p>
            </Col>
          </>
        )}
        {activeTab === SimulationTabs.LOGS_AND_THREATS && (
          <>
            <Col
              xs={6}
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer border-primary border-right p-0"
              onClick={() =>
                document.querySelector('#threats')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              <p className="my-0">THREATS</p>
            </Col>
            <Col
              xs={6}
              className="d-flex justify-content-center align-items-center simulation-menu-item--small cursor-pointer p-0"
              onClick={() =>
                document.querySelector('#logs')?.scrollIntoView({
                  behavior: 'smooth',
                })
              }
            >
              <p className="my-0">EVENT LOG</p>
            </Col>
          </>
        )}
      </Row>
    </div>
  );
});

export default Header;
