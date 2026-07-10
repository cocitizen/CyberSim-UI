import React from 'react';

import Threats from './Threats';
import EventLogs from '../../EventLogs/EventLogs';

const ActionTable = () => (
  <>
    <Threats className="my-4" />
    <EventLogs className="my-4" asc={false} />
  </>
);

export default ActionTable;
