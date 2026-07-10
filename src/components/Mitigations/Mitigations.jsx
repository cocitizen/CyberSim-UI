import React, { useMemo } from 'react';
import { Container, Button, Nav } from 'react-bootstrap';
import { FiBarChart2, FiShield } from 'react-icons/fi';
import { reduce as _reduce } from 'lodash';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';

import { gameStore } from '../GameStore';
import { useStaticData } from '../StaticDataProvider';
import MitigationCategory from './MitigationCategory';
import { numberToUsd } from '../../util';
import logo from '../../assets/img/cybersim-logo.svg';
import { gameViewPath } from '../../util/gameSlug';

const Mitigations = view(
  ({
    isLog = false,
    className,
    isInventory = false,
    allowSell = false,
  }) => {
    const {
      id,
      budget,
      mitigations: gameMitigations,
      preparationMitigations,
      actions: { toggleMitigation, startSimulation },
    } = gameStore;
    const { mitigations, getTextWithSynonyms, scenarioName } =
      useStaticData();

    const mitigationsByCategory = useMemo(
      () =>
        _reduce(
          mitigations,
          (categories, item) => ({
            ...categories,
            [item.category]: [
              ...(categories[item.category] || []),
              item,
            ],
          }),
          {},
        ),
      [mitigations],
    );

    const toggledMitigations = useMemo(
      () => (isLog ? preparationMitigations : gameMitigations),
      [isLog, preparationMitigations, gameMitigations],
    );

    const allocatedCategoryBudgets = useMemo(
      () =>
        mitigationsByCategory
          ? _reduce(
              mitigationsByCategory,
              (acc, category, categoryKey) => {
                const categorySum = _reduce(
                  category,
                  (sum, { id, cost }) => {
                    let newSum = sum;
                    if (toggledMitigations[id] && cost) {
                      newSum += cost;
                    }
                    return newSum;
                  },
                  0,
                );
                return {
                  ...acc,
                  [categoryKey]: categorySum,
                  sum: (acc.sum || 0) + categorySum,
                };
              },
              {},
            )
          : { sum: 0 },
      [toggledMitigations, mitigationsByCategory],
    );

    const categoryNodes = (asCard) =>
      Object.entries(mitigationsByCategory).map(([key, category], idx) => (
        <MitigationCategory
          key={key}
          name={key}
          mitigations={category}
          toggledMitigations={toggledMitigations}
          allocatedBudget={allocatedCategoryBudgets[key]}
          toggleMitigation={toggleMitigation}
          budget={budget}
          isSummary={isLog}
          allowSell={allowSell}
          card={asCard}
          index={idx}
        />
      ));

    // Action Table: a contained "Item inventory" room.
    if (isInventory) {
      return (
        <section
          className={classNames('cs-card', className)}
          id="mitigations"
        >
          <div className="cs-card__head">
            <div className="cs-card__heading">
              <span
                className="cs-card__icon cs-card__icon--cyan"
                aria-hidden="true"
              >
                <FiShield />
              </span>
              <h2 className="cs-section-title">Item inventory</h2>
            </div>
          </div>
          {categoryNodes(false)}
        </section>
      );
    }

    // Event-log summary (PreparationsLog): just the categories, no buy bars.
    if (isLog) {
      return (
        <Container fluid="md" className={className} id="mitigations">
          {categoryNodes(false)}
        </Container>
      );
    }

    // Preparation phase: the buy-items board, wearing the same command-bar
    // header and instrument status bar as the facilitator Simulation screen.
    return (
      <div className="cs-facilitator">
        <div className="position-sticky simulation-menu bg-white shadow-sm">
          <div className="cs-commandbar">
            <Container
              fluid="md"
              className="cs-commandbar__inner cs-commandbar__inner--preparation"
            >
              <div className="cs-preparation-title">
                <span>Preparation</span>
                <strong>Security investments</strong>
              </div>
              <div className="cs-commandbar__right">
                <div className="cs-gamectx">
                  <div className="cs-gamectx__id">{id}</div>
                  {scenarioName && (
                    <div className="cs-gamectx__scenario">
                      <span>Scenario</span>
                      <strong>{scenarioName}</strong>
                    </div>
                  )}
                </div>
                <a
                  href="/"
                  className="cs-brand cs-brand--lockup"
                  aria-label="CyberSim home"
                >
                  <img src={logo} alt="" />
                </a>
              </div>
            </Container>
          </div>
          <div className="cs-budgetbar">
            <Container fluid="md" className="cs-budgetbar__inner">
              <div className="cs-budgetbar__metrics">
                <div className="cs-budgetbar__metric">
                  <span>{getTextWithSynonyms('Budget Allocated')}</span>
                  <strong>
                    {numberToUsd(allocatedCategoryBudgets.sum)}
                  </strong>
                </div>
                <div className="cs-budgetbar__metric">
                  <span>{getTextWithSynonyms('Remaining Budget')}</span>
                  <strong
                    className={classNames({
                      'cs-budgetbar__value--bad': budget < 0,
                    })}
                  >
                    {numberToUsd(budget)}
                  </strong>
                </div>
              </div>
            </Container>
          </div>
        </div>

        <Container fluid="md" className={className} id="mitigations">
          <div className="cs-buy-grid">{categoryNodes(true)}</div>
        </Container>

        <div className="cs-statusbar">
          <Container
            fluid="md"
            className="cs-statusbar__inner cs-statusbar__inner--actions"
          >
            <div className="cs-statusbar__controls">
              <Button
                variant="primary"
                className="cs-chunky"
                type="button"
                disabled={!mitigationsByCategory}
                onClick={startSimulation}
              >
                Save items &amp; start simulation
              </Button>
              <Nav.Link
                href={gameViewPath(id, 'projector')}
                className="btn btn-light cs-chunky d-flex align-items-center projector-button"
                target="_blank"
              >
                <FiBarChart2 fontSize="20px" />
                <span className="ml-1">Projector</span>
              </Nav.Link>
            </div>
          </Container>
        </div>
      </div>
    );
  },
);

export default Mitigations;
