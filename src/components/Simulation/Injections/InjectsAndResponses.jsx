import React from 'react';
import { view } from '@risingstack/react-easy-state';
import classNames from 'classnames';
import { FiBell } from 'react-icons/fi';

import Injection from './Injection';

const InjectsAndResponses = view(
  ({ className, injectionsToResponse }) => (
    <section className={classNames('cs-card', className)} id="injects">
      <div className="cs-card__head">
        <div className="cs-card__heading">
          <span className="cs-card__icon" aria-hidden="true">
            <FiBell />
          </span>
          <h2 className="cs-section-title">Events &amp; responses</h2>
        </div>
      </div>
      {injectionsToResponse.length ? (
        injectionsToResponse.map(
          ({
            injection,
            upcoming,
            canDeliver,
            canMakeResponse,
            prevented,
            delivered,
            isDanger,
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
              isBackground={isBackground}
            />
          ),
        )
      ) : (
        <p className="cs-actions-empty">No upcoming event.</p>
      )}
    </section>
  ),
);

export default InjectsAndResponses;
