import React, { useMemo } from 'react';
import { Row, Col, Button, Form } from 'react-bootstrap';
import { view, store } from '@risingstack/react-easy-state';
import { AiOutlineCheck, AiOutlineLock } from 'react-icons/ai';

import { gameStore } from '../../GameStore';
import { useStaticData } from '../../StaticDataProvider';
import { msToMinutesSeconds } from '../../../util';

const InjectionResponseForm = view(
  ({ injection, disabled, gameInjection }) => {
    const {
      actions: { respondToInjection, nonCorrectRespondToInjection },
      mitigations: gameMitigations,
    } = gameStore;
    const { responses, systems, mitigations } = useStaticData();

    const madeResponses = useMemo(
      () =>
        gameInjection &&
        gameInjection.response_made_at && {
          none:
            !gameInjection.predefined_responses_made?.length &&
            !gameInjection.is_response_correct &&
            !gameInjection.custom_response,
          selectedResponses: new Set(
            gameInjection.predefined_responses_made?.length
              ? gameInjection.predefined_responses_made
              : [],
          ),
          customCorrectResponse:
            (gameInjection.is_response_correct &&
              gameInjection.custom_response) ||
            '',
          customIncorrectResponse:
            (!gameInjection.is_response_correct &&
              gameInjection.custom_response) ||
            '',
        },
      [gameInjection],
    );

    const formStore = store({
      none: false,
      selectedResponses: new Set(),
      isCustomCorrectResponse: false,
      customCorrectResponse: '',
      isCustomIncorrectResponse: false,
      customIncorrectResponse: '',
      deselectIncorrects: () => {
        formStore.none = false;
        formStore.isCustomIncorrectResponse = false;
        formStore.customIncorrectResponse = '';
      },
      selectCustomIncorrect: () => {
        formStore.selectedResponses = new Set();
        formStore.isCustomCorrectResponse = false;
        formStore.customCorrectResponse = '';
        formStore.none = false;
        formStore.isCustomIncorrectResponse = true;
      },
      selectNone: () => {
        formStore.selectedResponses = new Set();
        formStore.isCustomCorrectResponse = false;
        formStore.customCorrectResponse = '';
        formStore.isCustomIncorrectResponse = false;
        formStore.customIncorrectResponse = '';
        formStore.none = true;
      },
      submitResponses: () => {
        if (formStore.none) {
          nonCorrectRespondToInjection({
            injectionId: injection.id,
          });
        } else if (
          formStore.isCustomIncorrectResponse &&
          formStore.customIncorrectResponse
        ) {
          nonCorrectRespondToInjection({
            injectionId: injection.id,
            customResponse: formStore.customIncorrectResponse,
          });
        } else {
          respondToInjection({
            responseIds: [...formStore.selectedResponses],
            injectionId: injection.id,
            ...(formStore.isCustomCorrectResponse &&
            formStore.customCorrectResponse
              ? { customResponse: formStore.customCorrectResponse }
              : {}),
          });
        }
      },
      get responseAllowed() {
        if (formStore.isCustomIncorrectResponse) {
          return formStore.customIncorrectResponse;
        }
        if (formStore.isCustomCorrectResponse) {
          return formStore.customCorrectResponse;
        }
        return formStore.none || formStore.selectedResponses.size;
      },
      get responseCost() {
        return [...formStore.selectedResponses].reduce(
          (acc, id) => acc + (responses[id]?.cost || 0),
          0,
        );
      },
      get restoredSystems() {
        return [...formStore.selectedResponses].reduce(
          (acc, id) =>
            responses[id]?.systems_to_restore?.length
              ? [
                  ...acc,
                  ...responses[id].systems_to_restore.map(
                    (systemId) => systems[systemId]?.name || systemId,
                  ),
                ]
              : acc,
          [],
        );
      },
    });

    const allResponses = useMemo(
      () =>
        injection.responses?.map((response) => {
          const requiredMitigationId = response.required_mitigation;
          const isLocked =
            !!requiredMitigationId &&
            !gameMitigations[requiredMitigationId];
          return {
            ...response,
            isLocked,
            requiredMitigationName: isLocked
              ? mitigations[requiredMitigationId]?.description
              : null,
          };
        }),
      [injection, gameMitigations, mitigations],
    );

    return (
      <Row>
        <Col xs={12}>
          {!gameInjection?.response_made_at ? (
            <Row>
              <Col xs={8} lg={9} className="font-weight-bold">
                Select correct responses implemented:
              </Col>
              <Col xs={4} lg={3}>
                <Button
                  variant="outline-primary"
                  className="rounded-pill w-100"
                  type="button"
                  disabled={disabled || !formStore.responseAllowed}
                  onClick={formStore.submitResponses}
                >
                  RESOLVE EVENT
                </Button>
              </Col>
            </Row>
          ) : (
            <Row>
              <Col xs={12} lg={12} className="font-weight-bold">
                Correct responses implemented (at{' '}
                {msToMinutesSeconds(gameInjection.response_made_at)})
              </Col>
            </Row>
          )}
        </Col>
        <Col xs={12} className="mb-3">
          {allResponses?.map((response) => (
            <Form.Check
              type="switch"
              className={`py-1${
                response.isLocked ? ' locked-response' : ''
              }`}
              style={{ width: 'fit-content' }}
              key={`${injection.id}_${response.id}`}
              id={`${injection.id}_${response.id}`}
              label={
                <span>
                  {response.isLocked && (
                    <AiOutlineLock
                      className="mr-1"
                      fontSize="14px"
                      title={`Requires mitigation: ${response.requiredMitigationName}`}
                    />
                  )}
                  {response.description} (Cost: $
                  {responses[response.id]?.cost ?? 'Unknown'})
                  {response.isLocked && (
                    <span className="locked-response-hint">
                      {' '}
                      — Requires: {
                        response.requiredMitigationName
                      }{' '}
                      (Cost: ${''}
                      {
                        mitigations[response.required_mitigation]
                          ?.cost
                      }
                      )
                    </span>
                  )}
                </span>
              }
              disabled={disabled || response.isLocked}
              checked={
                madeResponses
                  ? madeResponses.selectedResponses.has(response.id)
                  : formStore.selectedResponses.has(response.id)
              }
              onChange={(e) => {
                if (e.target.checked) {
                  formStore.deselectIncorrects();
                  formStore.selectedResponses.add(response.id);
                } else {
                  formStore.selectedResponses.delete(response.id);
                }
              }}
            />
          ))}
          <Form.Check
            type="switch"
            className="py-1"
            style={{ width: 'fit-content' }}
            id={`${injection.id}_custom_corrrect`}
            label={
              <div
                className="d-flex"
                style={{ whiteSpace: 'nowrap' }}
              >
                CUSTOM CORRECT (will prevent follow up):
                <Form.Control
                  type="text"
                  maxLength={250}
                  disabled={
                    !formStore.isCustomCorrectResponse ||
                    gameInjection?.response_made_at
                  }
                  placeholder="Correct response"
                  onChange={(event) => {
                    formStore.customCorrectResponse =
                      event.target.value;
                  }}
                  value={
                    madeResponses
                      ? madeResponses.customCorrectResponse
                      : formStore.customCorrectResponse || ''
                  }
                  autoComplete="off"
                  style={{ fontSize: '1rem' }}
                />
              </div>
            }
            disabled={disabled}
            checked={
              madeResponses
                ? madeResponses.customCorrectResponse
                : formStore.isCustomCorrectResponse
            }
            onChange={(e) => {
              if (e.target.checked) {
                formStore.deselectIncorrects();
                formStore.isCustomCorrectResponse = true;
              } else {
                formStore.isCustomCorrectResponse = false;
              }
            }}
          />
          <Form.Check
            type="switch"
            className="custom-switch-red py-1"
            style={{ width: 'fit-content' }}
            id={`${injection.id}_custom_incorrrect`}
            label={
              <div
                className="d-flex"
                style={{ whiteSpace: 'nowrap' }}
              >
                CUSTOM INCORRECT:
                <Form.Control
                  type="text"
                  maxLength={250}
                  disabled={
                    !formStore.isCustomIncorrectResponse ||
                    gameInjection?.response_made_at
                  }
                  placeholder="Incorrect response"
                  onChange={(event) => {
                    formStore.customIncorrectResponse =
                      event.target.value;
                  }}
                  value={
                    madeResponses
                      ? madeResponses.customIncorrectResponse
                      : formStore.customIncorrectResponse || ''
                  }
                  autoComplete="off"
                  style={{ fontSize: '1rem' }}
                />
              </div>
            }
            disabled={disabled}
            checked={
              madeResponses
                ? madeResponses.customIncorrectResponse
                : formStore.isCustomIncorrectResponse
            }
            onChange={(e) => {
              if (e.target.checked) {
                formStore.selectCustomIncorrect();
              } else {
                formStore.isCustomIncorrectResponse = false;
              }
            }}
          />
          <Form.Check
            type="switch"
            className="custom-switch-red py-1"
            style={{ width: 'fit-content' }}
            id={`${injection.id}_none`}
            label={<span>NO RESPONSE</span>}
            disabled={disabled}
            checked={
              madeResponses ? madeResponses.none : formStore.none
            }
            onChange={(e) => {
              if (e.target.checked) {
                formStore.selectNone();
              } else {
                formStore.none = false;
              }
            }}
          />
        </Col>
        <Col xs={12} className="my-2 font-weight-bold">
          Effect of implemented responses:
        </Col>
        <Col xs={4}>
          <AiOutlineCheck className="mr-2" fontSize="20px" />$
          {formStore.responseCost} spent
        </Col>
        <Col xs={8}>
          <AiOutlineCheck className="mr-2" fontSize="20px" />
          {formStore.restoredSystems.length
            ? formStore.restoredSystems
            : 'No system restored'}
        </Col>
      </Row>
    );
  },
);

export default InjectionResponseForm;
