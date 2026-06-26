import React from 'react';
import { FiServer } from 'react-icons/fi';

import Mitigations from '../../Mitigations/Mitigations';
import Curveballs from './Curveballs';
import SystemRelatedActions from '../SystemRelatedActions';
import ActionItems from '../ActionItems';
import Systems from '../../Systems';

const ActionTable = () => (
  <>
    <ActionItems className="my-4" location="hq" />
    <ActionItems className="my-4" location="local" />
    <Mitigations isInventory className="my-4" />

    {/* Technical systems room: status grid + the restore actions that act
        on that status, merged into one card. */}
    <section className="cs-card my-4" id="systems">
      <div className="cs-card__head">
        <div className="cs-card__heading">
          <span className="cs-card__icon" aria-hidden="true">
            <FiServer />
          </span>
          <h2 className="cs-section-title">Technical systems</h2>
        </div>
      </div>
      <Systems bare />
      <SystemRelatedActions embedded />
    </section>

    <Curveballs className="my-4" />
  </>
);

export default ActionTable;
