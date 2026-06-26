import React from 'react';
import { AiOutlineStop } from 'react-icons/ai';

const NotAvailableActionItems = ({ systems, actionList, role }) => (
  <div className="cs-actions">
    <span className="cs-meta d-block mb-2">Unavailable actions</span>

    {actionList.length ? (
      actionList.map((action) => (
        <div
          className="cs-action-row cs-action-row--blocked"
          key={`${role}_${action.id}`}
        >
          <span className="cs-action-row__name">
            {action.description}
          </span>
          <span className="cs-action-row__needs">
            <AiOutlineStop className="text-danger" fontSize="18px" />
            {action.unavailableSystems
              .map((system) => systems[system].name)
              .join(', ')}
          </span>
        </div>
      ))
    ) : (
      <p className="cs-actions-empty">All actions are available.</p>
    )}
  </div>
);

export default NotAvailableActionItems;
