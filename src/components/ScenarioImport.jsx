import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';
import { getScenarioSlug } from '../util/scenario';

const baseState = {
  scenarioSlug: '',
};

// Always rendered inside AdminApp which provides the shared password.
export default function ScenarioImport({ password }) {
  const [state, setState] = useState(baseState);
  const [availableScenarios, setAvailableScenarios] = useState([]);
  const [scenariosLoading, setScenariosLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationError, setValidationError] = useState({});
  const [isLoading, setLoading] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [validateCounts, setValidateCounts] = useState(null);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/admin/scenarios`)
      .then(({ data }) => {
        // API returns objects with { slug, name, ... }; extract just the slug
        const slugs = (data.scenarios || []).map((s) =>
          typeof s === 'string' ? s : s.slug,
        );
        setAvailableScenarios(slugs);
        if (slugs.length === 1) {
          setState((prev) => ({ ...prev, scenarioSlug: slugs[0] }));
        } else {
          const slug = getScenarioSlug();
          if (slugs.includes(slug)) {
            setState((prev) => ({ ...prev, scenarioSlug: slug }));
          }
        }
      })
      .catch(() => {
        setAvailableScenarios([]);
      })
      .finally(() => {
        setScenariosLoading(false);
      });
  }, []);

  const onChange = useCallback(
    (ev) => {
      setIsSuccess(false);
      setIsValidated(false);
      const { name, value } = ev.target;
      setState((previousState) => ({
        ...previousState,
        [name]: value,
      }));
      if (errors?.[name]) {
        setErrors((previousErrors) => ({
          ...previousErrors,
          [name]: undefined,
        }));
      }
    },
    [errors],
  );

  const onSubmit = useCallback(
    async (ev) => {
      try {
        setLoading(true);
        ev.preventDefault();
        ev.stopPropagation();

        await axios.post(
          `${process.env.REACT_APP_API_URL}/admin/scenarios/import`,
          {
            scenarioSlug: state.scenarioSlug.trim(),
            password,
          },
        );

        setValidationError({});
        setErrors({});
        setIsSuccess(true);
      } catch (err) {
        const error = err?.response?.data;

        if (error?.validation) {
          setValidationError(error);
          setErrors({});
        } else {
          if (error) {
            setErrors(error);
          }
          setValidationError({});
        }

        setIsSuccess(false);
      } finally {
        setLoading(false);
      }
    },
    [state, password],
  );

  const onValidate = useCallback(async () => {
    try {
      setLoading(true);
      setIsSuccess(false);
      setIsValidated(false);

      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/scenarios/validate`,
        {
          scenarioSlug: state.scenarioSlug.trim(),
          password,
        },
      );

      setValidationError({});
      setErrors({});
      setValidateCounts(data?.counts || null);
      setIsValidated(true);
    } catch (err) {
      const error = err?.response?.data;

      if (error?.validation) {
        setValidationError(error);
        setErrors({});
      } else {
        if (error) {
          setErrors(error);
        }
        setValidationError({});
      }

      setIsValidated(false);
    } finally {
      setLoading(false);
    }
  }, [state, password]);

  const noScenariosConfigured =
    !scenariosLoading && availableScenarios.length === 0;

  return (
    <Row>
      <Col xs={12} md={{ span: 8, offset: 2 }}>
        <h5 className="mb-3">Import Scenario from Airtable</h5>

        <Form onSubmit={onSubmit}>
          <Form.Group>
            <Form.Label>
              <h5 className="font-weight-normal mb-0">Scenario:</h5>
            </Form.Label>
            {noScenariosConfigured ? (
              <Form.Control
                as="select"
                disabled
                style={{ fontSize: '1.125rem' }}
              >
                <option>No scenarios configured on this server</option>
              </Form.Control>
            ) : (
              <Form.Control
                as="select"
                name="scenarioSlug"
                value={state.scenarioSlug}
                onChange={onChange}
                disabled={scenariosLoading}
                style={{ fontSize: '1.125rem' }}
                isInvalid={errors?.scenarioSlug}
              >
                {availableScenarios.length > 1 && (
                  <option value="">
                    {scenariosLoading ? 'Loading…' : '— select a scenario —'}
                  </option>
                )}
                {availableScenarios.map((slug) => (
                  <option key={slug} value={slug}>
                    {slug}
                  </option>
                ))}
              </Form.Control>
            )}
            <Form.Control.Feedback type="invalid" tooltip>
              {errors?.scenarioSlug}
            </Form.Control.Feedback>
          </Form.Group>

          <Row className="my-4">
            <Col xs={12} md={6}>
              <Button
                variant="outline-secondary"
                className="rounded-pill w-100"
                type="button"
                onClick={onValidate}
                disabled={
                  !state.scenarioSlug ||
                  !password ||
                  isLoading ||
                  noScenariosConfigured
                }
              >
                <h4 className="font-weight-normal mb-0">
                  {isLoading ? 'Working…' : 'Validate'}
                </h4>
              </Button>
            </Col>
            <Col xs={12} md={6}>
              <Button
                variant="outline-primary"
                className="rounded-pill w-100"
                type="submit"
                disabled={
                  !state.scenarioSlug ||
                  !password ||
                  isLoading ||
                  noScenariosConfigured
                }
              >
                <h4 className="font-weight-normal mb-0">
                  {isLoading
                    ? 'Import in process...'
                    : isSuccess
                    ? 'Import the Scenario Again'
                    : 'Import Scenario'}
                </h4>
              </Button>
            </Col>
          </Row>
        </Form>

        <div className="pt-3">
          {errors?.message && (
            <h3 className="text-danger text-center">{errors.message}</h3>
          )}

          {isSuccess && (
            <h3 className="text-success text-center">
              Scenario successfully imported from Airtable
            </h3>
          )}

          {isValidated && (
            <>
              <h3 className="text-success text-center">
                Airtable schema is valid. No changes were made.
              </h3>
              {validateCounts && (
                <p className="text-center text-muted">
                  Ready to import:{' '}
                  {Object.entries(validateCounts)
                    .map(([table, count]) => `${count} ${table}`)
                    .join(', ')}
                </p>
              )}
            </>
          )}

          {Boolean(validationError.errors?.length) && (
            <>
              <h3 className="text-danger text-center">
                {validationError.message ??
                  'Unexpected error. Please contact system administrators with this information.'}
              </h3>
              <div>
                {validationError.errors.map((error, index) => (
                  <Alert
                    key={index}
                    variant="danger"
                    dismissible
                    onClose={() =>
                      setValidationError((previousValidationErrors) => ({
                        ...previousValidationErrors,
                        errors: previousValidationErrors.errors.filter(
                          (err) => err !== error,
                        ),
                      }))
                    }
                  >
                    <Alert.Heading>{error.message}</Alert.Heading>
                    {error.value && (
                      <div className="pre">
                        {JSON.stringify(error.value, null, 2)}
                      </div>
                    )}
                  </Alert>
                ))}
              </div>
            </>
          )}
        </div>
      </Col>
    </Row>
  );
}
