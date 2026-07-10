import React from 'react';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiCheckCircle } from 'react-icons/fi';

import Injection from './Injection';

const ResolvedInjections = view(
  ({ className, resolvedInjections }) => (
    <section
      className={classNames('cs-card', className)}
      id="resolved_injects"
    >
      <div className="cs-card__head">
        <div className="cs-card__heading">
          <span className="cs-card__icon" aria-hidden="true">
            <FiCheckCircle />
          </span>
          <h2 className="cs-section-title">Resolved events</h2>
        </div>
      </div>
      {resolvedInjections.length ? (
        resolvedInjections.map(
          ({
            injection,
            upcoming,
            canDeliver,
            canMakeResponse,
            prevented,
            delivered,
            isDanger,
            resolved,
            gameInjection,
            isBackground,
          }) => (
            <Injection
              injection={injection}
              key={injection.id}
              prevented={prevented}
              delivered={delivered}
              isDanger={isDanger}
              upcoming={upcoming}
              canDeliver={canDeliver}
              canMakeResponse={canMakeResponse}
              resolved={resolved}
              gameInjection={gameInjection}
              isBackground={isBackground}
            />
          ),
        )
      ) : (
        <p className="cs-actions-empty">No event resolved.</p>
      )}
    </section>
  ),
);

export default ResolvedInjections;
