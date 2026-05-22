import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Container,
  Spinner,
  Alert,
  Row,
  Col,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from '../GameStore';
import AARTimeline from './AARTimeline';
import AARPrepSection from './AARPrepSection';

const API = process.env.REACT_APP_API_URL;

export const aarLocations = {
  HQ: 'hq',
  Local: 'local',
};

const AfterActionReview = view(() => {
  const gameId = gameStore.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // null = all selected (avoids stale empty array before async data loads)
  const [filterValue, setFilterValue] = useState(null);

  useEffect(() => {
    if (!gameId) return;
    setLoading(true);
    axios
      .get(`${API}/games/${gameId}/aar`)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || 'Failed to load after action review.');
        setLoading(false);
      });
  }, [gameId]);

  const allChains = useMemo(() => data?.chains || [], [data]);

  const availableCategories = useMemo(
    () => [...new Set(allChains.map((c) => c.handbook_category).filter(Boolean))].sort(),
    [allChains],
  );

  const allFilterValues = useMemo(
    () => [...Object.values(aarLocations), ...availableCategories],
    [availableCategories],
  );

  const activeFilter = filterValue ?? allFilterValues;

  const prepChains = useMemo(
    () =>
      allChains.filter(
        (c) => c.category === 'prevented' && c.skipper_mitigation?.purchased_in_preparation === true,
      ),
    [allChains],
  );

  const gameChains = useMemo(
    () =>
      allChains.filter(
        (c) => !(c.category === 'prevented' && c.skipper_mitigation?.purchased_in_preparation === true),
      ),
    [allChains],
  );

  const passesFilter = useMemo(
    () => (c) =>
      (!c.location || activeFilter.includes(c.location)) &&
      (!c.handbook_category || activeFilter.includes(c.handbook_category)),
    [activeFilter],
  );

  const filteredPrepChains = useMemo(
    () => prepChains.filter(passesFilter),
    [prepChains, passesFilter],
  );

  const filteredGameChains = useMemo(
    () => gameChains.filter(passesFilter),
    [gameChains, passesFilter],
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="aar-page py-4">
      <div className="aar-page__header mb-4">
        <h2 className="aar-page__title">After Action Review</h2>
        <p className="text-muted mb-0">Game ID: {gameId}</p>
        {data?.game && (
          <div className="aar-page__summary mt-2">
            <span className="mr-4">
              Final Budget: <strong>${data.game.budget}</strong>
            </span>
            <span>
              Final Support: <strong>{data.game.poll}%</strong>
            </span>
          </div>
        )}
      </div>
      <Row className="my-5 align-items-center aar-filter">
        <Col xs="auto">
          <h5 className="font-weight-bold mb-0">FILTER:</h5>
        </Col>
        <Col xs={2} className="px-1 ml-auto">
          <Button
            variant="outline-primary"
            className="rounded-pill w-100 d-flex justify-content-center"
            style={{ whiteSpace: 'nowrap' }}
            type="button"
            onClick={() => setFilterValue(null)}
          >
            SHOW ALL
          </Button>
        </Col>
        <Col xs={2} className="px-1 mr-3">
          <Button
            variant="outline-primary"
            className="rounded-pill w-100 d-flex justify-content-center"
            type="button"
            onClick={() => setFilterValue([])}
          >
            HIDE ALL
          </Button>
        </Col>
        <Col xs={12} className="mt-2">
          <ToggleButtonGroup
            type="checkbox"
            value={activeFilter}
            onChange={setFilterValue}
            className="d-flex log-filter"
            style={{ zIndex: 0, flexWrap: 'wrap', rowGap: '2px' }}
          >
            <ToggleButton
              value={aarLocations.HQ}
              variant="outline-primary"
              className="p-1 d-flex align-items-center justify-content-center mr-1 rounded"
            >
              HQ
            </ToggleButton>
            <ToggleButton
              value={aarLocations.Local}
              variant="outline-primary"
              className="p-1 d-flex align-items-center justify-content-center mr-1 rounded"
            >
              Local
            </ToggleButton>
            {availableCategories.map((cat) => (
              <ToggleButton
                key={cat}
                value={cat}
                variant="outline-primary"
                className="p-1 d-flex align-items-center justify-content-center mr-1 rounded"
              >
                {cat}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Col>
      </Row>
      <AARPrepSection chains={filteredPrepChains} />
      <AARTimeline chains={filteredGameChains} />
    </Container>
  );
});

export default AfterActionReview;
