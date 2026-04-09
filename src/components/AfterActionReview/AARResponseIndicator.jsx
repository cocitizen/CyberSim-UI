import React from 'react';
import { BsCheckCircle, BsXCircle } from 'react-icons/bs';

export default function AARResponseIndicator({ isCorrect, responseName, label }) {
  const correct = isCorrect === true;

  return (
    <div className="aar-connector">
      <div className="aar-connector__chevrons">&#8249;&#8249;</div>
      <div className="aar-connector__indicator">
        <span
          className={`aar-connector__icon-badge ${
            correct
              ? 'aar-connector__icon-badge--green'
              : 'aar-connector__icon-badge--red'
          }`}
        >
          {correct ? <BsCheckCircle /> : <BsXCircle />}
        </span>
        <span className="aar-connector__text">
          {label || (correct ? 'Correct response' : 'Incorrect response')}:{' '}
          <strong>{responseName || 'No response'}</strong>
        </span>
      </div>
      <div className="aar-connector__chevrons">&#8249;&#8249;</div>
    </div>
  );
}
