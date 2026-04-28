import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { view } from '@risingstack/react-easy-state';

import { gameStore } from '../GameStore';
import AARTimeline from './AARTimeline';

const API = process.env.REACT_APP_API_URL;

const AfterActionReview = view(() => {
  const gameId = gameStore.id;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <AARTimeline chains={data?.chains || []} />
    </Container>
  );
});

export default AfterActionReview;
