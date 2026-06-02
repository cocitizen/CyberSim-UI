import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Badge,
  Alert,
  Spinner,
  Modal,
  Form,
  Row,
  Col,
} from 'react-bootstrap';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const STATE_VARIANTS = {
  PREPARATION: 'secondary',
  SIMULATION: 'primary',
  ASSESSMENT: 'success',
};

export default function GameManagement({ password }) {
  const [games, setGames] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Confirmation modal state
  const [modal, setModal] = useState(null); // { type: 'finish'|'delete', game }

  const headers = { 'x-admin-password': password };

  const fetchGames = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = scenarioFilter ? { scenarioSlug: scenarioFilter } : {};
    axios
      .get(`${API}/admin/games`, { headers, params })
      .then(({ data }) => setGames(data.games || []))
      .catch(() => setError('Failed to load games. Check admin password.'))
      .finally(() => setLoading(false));
  }, [scenarioFilter, password]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    axios
      .get(`${API}/admin/scenarios`)
      .then(({ data }) => setScenarios(data.scenarios || []));
  }, []);

  useEffect(() => {
    if (password) fetchGames();
  }, [fetchGames, password]);

  const handleFinish = async () => {
    setActionError(null);
    try {
      await axios.post(
        `${API}/admin/games/${modal.game.id}/finish`,
        {},
        { headers },
      );
      setModal(null);
      fetchGames();
    } catch (err) {
      setActionError(
        err?.response?.data?.message || 'Action failed.',
      );
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    try {
      await axios.delete(`${API}/admin/games/${modal.game.id}`, { headers });
      setModal(null);
      fetchGames();
    } catch (err) {
      setActionError(
        err?.response?.data?.message || 'Action failed.',
      );
    }
  };

  return (
    <>
      <Row className="mb-3 align-items-end">
        <Col xs={12} md={4}>
          <Form.Group>
            <Form.Label className="mb-1">Filter by scenario</Form.Label>
            <Form.Control
              as="select"
              size="sm"
              value={scenarioFilter}
              onChange={(e) => setScenarioFilter(e.target.value)}
            >
              <option value="">All scenarios</option>
              {scenarios.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.slug}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
        <Col xs="auto">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={fetchGames}
            disabled={!password}
          >
            Refresh
          </Button>
        </Col>
      </Row>

      {!password && (
        <Alert variant="info">Enter admin password above to view and manage games.</Alert>
      )}

      {password && loading && (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      )}

      {password && error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {password && !loading && !error && (
        <>
          {games.length === 0 ? (
            <Alert variant="info">No games found.</Alert>
          ) : (
            <Table bordered hover responsive size="sm">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Scenario</th>
                  <th>State</th>
                  <th>Budget</th>
                  <th>Poll %</th>
                  <th>Started</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <code style={{ fontSize: '0.8em' }}>{g.id}</code>
                    </td>
                    <td>{g.scenarioSlug}</td>
                    <td>
                      <Badge variant={STATE_VARIANTS[g.state] || 'secondary'}>
                        {g.state}
                      </Badge>
                    </td>
                    <td>{g.budget}</td>
                    <td>{g.poll}</td>
                    <td>
                      {g.started_at
                        ? new Date(g.started_at).toLocaleString()
                        : '—'}
                    </td>
                    <td>
                      <Button
                        variant="outline-warning"
                        size="sm"
                        className="me-1"
                        disabled={g.state === 'ASSESSMENT'}
                        onClick={() => {
                          setActionError(null);
                          setModal({ type: 'finish', game: g });
                        }}
                        title={
                          g.state === 'ASSESSMENT'
                            ? 'Game already finished'
                            : 'Force to Assessment'
                        }
                      >
                        Finish
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          setActionError(null);
                          setModal({ type: 'delete', game: g });
                        }}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </>
      )}

      {/* Confirmation modal */}
      <Modal
        show={!!modal}
        onHide={() => setModal(null)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modal?.type === 'finish' ? 'Finish game' : 'Delete game'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modal?.type === 'finish' ? (
            <p>
              Force game <code>{modal.game.id}</code> to{' '}
              <strong>ASSESSMENT</strong> state? The game will end immediately.
              Connected players will see the assessment screen on their next
              action.
            </p>
          ) : (
            <p>
              Permanently delete game <code>{modal?.game?.id}</code> and all
              its logs, injections, and system state? This cannot be undone.
            </p>
          )}
          {actionError && (
            <Alert variant="danger" className="mb-0">
              {actionError}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModal(null)}>
            Cancel
          </Button>
          <Button
            variant={modal?.type === 'finish' ? 'warning' : 'danger'}
            onClick={modal?.type === 'finish' ? handleFinish : handleDelete}
          >
            {modal?.type === 'finish' ? 'Finish game' : 'Delete game'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
