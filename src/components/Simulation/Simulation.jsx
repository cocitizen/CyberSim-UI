import React, { useState, useMemo } from 'react';
import { Container } from 'react-bootstrap';

import Header from './Header';
import Footer from './Footer';
import ActionTable from './ActionTable/ActionTable';
import LogsAndThreats from './LogsAndThreats/LogsAndThreats';
import FacilitatorTable from './FacilitatorTable';
import { SimulationTabs } from '../../constants';

const Simulation = () => {
  const [activeTab, setActiveTab] = useState(
    SimulationTabs.ACTION_TABLE,
  );

  const body = useMemo(() => {
    switch (activeTab) {
      case SimulationTabs.LOGS_AND_THREATS:
        return <LogsAndThreats />;
      case SimulationTabs.ACTION_TABLE:
        return <ActionTable />;
      case SimulationTabs.EVENTS:
        return <FacilitatorTable />;
      default:
        return 'Unknown page.';
    }
  }, [activeTab]);

  return (
    <div className="cs-facilitator">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <Container fluid="md" className="mb-5 pb-5">
        {body}
      </Container>
      <Footer />
    </div>
  );
};

export default Simulation;
