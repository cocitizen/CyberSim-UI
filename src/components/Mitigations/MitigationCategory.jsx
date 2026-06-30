import { Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import {
  FiShield,
  FiServer,
  FiUsers,
  FiLock,
  FiMonitor,
  FiDatabase,
  FiGlobe,
  FiHome,
  FiMail,
  FiSettings,
  FiSearch,
  FiEye,
  FiAlertTriangle,
  FiRefreshCw,
} from 'react-icons/fi';
import classNames from 'classnames';
import { useCallback } from 'react';

import { numberToUsd } from '../../util';
import { useStaticData } from '../StaticDataProvider';

// Pick an icon by what the category *is* (first keyword match wins), so e.g.
// "Devices" reads as a computer no matter where it falls in the list.
const ICON_RULES = [
  [/devices?|laptop|computer|endpoint|phone|mobile/, FiMonitor],
  [/recover|backup|restore|continuity/, FiRefreshCw],
  [/respond|incident/, FiAlertTriangle],
  [/detect|monitor|threat/, FiEye],
  [/identif|inventory|asset/, FiSearch],
  [/protect|harden|defen/, FiShield],
  [/account|access|password|credential|login/, FiLock],
  [/voter|database|\bdata\b|records?/, FiDatabase],
  [/contact|crm|customer|member|constituent/, FiUsers],
  [/website|web\b|online|portal/, FiGlobe],
  [/network|systems?|infrastructure|server/, FiServer],
  [/physical|office|facilit|building|premis/, FiHome],
  [/email|mail|phish|message/, FiMail],
  [/train|aware|staff|people|human/, FiUsers],
  [/operation|process|procedure|govern|policy/, FiSettings],
];

const getCategoryIcon = (name) => {
  const key = (name || '').toLowerCase();
  const rule = ICON_RULES.find(([re]) => re.test(key));
  return rule ? rule[1] : FiShield;
};

// Colour-banded headers, cycled for variety. All bands are dark enough to
// carry white text (accessible) and differ in luminance, not hue alone.
const ACCENTS = [
  'cs-catcard--purple',
  'cs-catcard--coral',
  'cs-catcard--teal',
  'cs-catcard--violet',
];

const MitigationCategory = ({
  name,
  mitigations,
  toggledMitigations,
  toggleMitigation,
  allocatedBudget,
  budget,
  isSummary,
  allowSell = false,
  card = false,
  index = 0,
}) => {
  const { getTextWithSynonyms } = useStaticData();

  const confirmBuy = useCallback(
    (mitigation, event) => {
      const { checked } = event.target;

      if (!allowSell) {
        if (
          checked &&
          window.confirm(
            `Are you sure you want to buy ${mitigation.description}?`,
          )
        ) {
          toggleMitigation({ id: mitigation.id, value: checked });
        }
      } else {
        toggleMitigation({ id: mitigation.id, value: checked });
      }
    },
    [toggleMitigation, allowSell],
  );

  const getTooltipMessage = useCallback(
    (mitigation) => {
      if (
        !toggledMitigations[mitigation.id] &&
        budget < mitigation.cost
      ) {
        return "You don't have the budget to purchase this item.";
      }
      if (toggledMitigations[mitigation.id]) {
        return 'You have already purchased this item.';
      }
      return 'Click to purchase this item.';
    },
    [toggledMitigations, budget],
  );

  const rows = mitigations.map((mitigation) => {
    const bought = !!toggledMitigations[mitigation.id];
    return (
      <div
        className={classNames('cs-buy-row', {
          'cs-buy-row--bought': !isSummary && bought,
        })}
        key={mitigation.id}
      >
        <span className="cs-buy-row__name">{mitigation.description}</span>
        <span className="cs-chip">{numberToUsd(mitigation.cost)}</span>
        {isSummary ? (
          <span aria-hidden="true">
            {bought ? (
              <AiOutlineCheck className="text-success" fontSize="20px" />
            ) : (
              <AiOutlineClose className="text-muted" fontSize="20px" />
            )}
          </span>
        ) : (
          <OverlayTrigger
            placement="left"
            overlay={(props) => (
              <Tooltip {...props}>
                {getTooltipMessage(mitigation)}
              </Tooltip>
            )}
          >
            {/* wrapping div keeps the tooltip working on a disabled switch */}
            <div>
              <Form.Check
                type="switch"
                className="custom-switch-center"
                id={mitigation.id}
                disabled={!bought && budget < mitigation.cost}
                checked={bought}
                onChange={(e) => confirmBuy(mitigation, e)}
              />
            </div>
          </OverlayTrigger>
        )}
      </div>
    );
  });

  // Purchase page: each category is its own colour-banded card in a board.
  if (card) {
    const Icon = getCategoryIcon(name);
    const boughtCount = mitigations.filter(
      (m) => toggledMitigations[m.id],
    ).length;
    return (
      <section
        className={classNames('cs-catcard', ACCENTS[index % ACCENTS.length])}
      >
        <div className="cs-catcard__head">
          <span className="cs-catcard__icon" aria-hidden="true">
            <Icon />
          </span>
          <h3 className="cs-catcard__title">{name}</h3>
          <span className="cs-catcard__count">
            {boughtCount}/{mitigations.length}
          </span>
        </div>
        <div className="cs-catcard__body">
          {rows}
          <div className="cs-catcard__foot">
            {numberToUsd(allocatedBudget)} allocated
          </div>
        </div>
      </section>
    );
  }

  // Inventory / log summary: a plain sub-section (lives inside another room).
  return (
    <div className="cs-cat">
      <div className="cs-cat__head">
        <h3 className="cs-subsection-title">{name}</h3>
        <span className="cs-meta">
          {getTextWithSynonyms('Budget allocated')} ·{' '}
          {numberToUsd(allocatedBudget)}
        </span>
      </div>
      {rows}
    </div>
  );
};

export default MitigationCategory;
