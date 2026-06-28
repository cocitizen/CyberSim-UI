import React, { useState, useEffect } from 'react';
import { Accordion } from 'react-bootstrap';
import classNames from 'classnames';
import { AiOutlineDown } from 'react-icons/ai';

import { accordionOpeners } from './EventLogs';

// A log entry with no expandable body — just a titled row.
const SimpleLog = ({ title }) => (
  <div className="cs-inject">
    <div className="cs-inject__header" style={{ cursor: 'default' }}>
      <span className="cs-inject__title">{title}</span>
    </div>
  </div>
);

// A log entry that expands to reveal a body (flat row + recessed drawer,
// matching the injection events — no nested card).
const AccordionLog = ({ children, title }) => {
  const [isOpen, changeIsOpen] = useState(false);

  useEffect(() => {
    accordionOpeners.push((newState) => changeIsOpen(newState));
  }, [changeIsOpen]);

  return (
    <Accordion
      as="div"
      className="cs-inject"
      activeKey={isOpen ? '0' : '1'}
    >
      <Accordion.Toggle
        as="div"
        eventKey="0"
        className="cs-inject__header"
        onClick={() => changeIsOpen(!isOpen)}
      >
        <span className="cs-inject__title">{title}</span>
        <div className="cs-inject__meta">
          <AiOutlineDown
            className={classNames('cs-inject__chevron', {
              'cs-inject__chevron--open': isOpen,
            })}
            fontSize="20px"
          />
        </div>
      </Accordion.Toggle>
      <Accordion.Collapse eventKey="0">
        <div className="cs-inject__detail cs-inject__detail--flush">
          {children}
        </div>
      </Accordion.Collapse>
    </Accordion>
  );
};

const Log = ({ children, title }) =>
  children ? (
    <AccordionLog title={title}>{children}</AccordionLog>
  ) : (
    <SimpleLog title={title} />
  );

export default Log;
