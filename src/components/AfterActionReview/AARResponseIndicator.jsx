import React from 'react';
import { BsCheckCircle, BsExclamationCircle, BsXCircle, BsSlashCircle } from 'react-icons/bs';

export default function AARResponseIndicator({ isCorrect, isLate, responseName, label, topOnly, grey }) {
  const correct = isCorrect === true;
  const late = correct && isLate === true;
  const noResponse = !responseName;

  const badgeColor = grey
    ? 'aar-connector__icon-badge--grey'
    : late
    ? 'aar-connector__icon-badge--yellow'
    : correct
    ? 'aar-connector__icon-badge--green'
    : 'aar-connector__icon-badge--red';

  return (
    <div className="aar-connector">
      <div className="aar-connector__chevrons">&#8249;&#8249;</div>
      <div className="aar-connector__indicator">
        <span className={`aar-connector__icon-badge ${badgeColor}`}>
          {late ? <BsExclamationCircle /> : correct ? <BsCheckCircle /> : noResponse ? <BsSlashCircle /> : <BsXCircle />}
        </span>
        <span className="aar-connector__text">
          {label || (late ? 'Correct late response' : correct ? 'Correct response' : 'Incorrect response')}:{' '}
          <strong>{responseName || 'No response'}</strong>
        </span>
      </div>
      {!topOnly && <div className="aar-connector__chevrons">&#8249;&#8249;</div>}
    </div>
  );
}
