import React from "react";

const DetailedCredits = ({ fullDC }) => {
  return (
    <div className="detailed-credits">
      <h2>Full Records ({fullDC.root})</h2>
      <ul className="record-list">
        {fullDC.records.map((aRecord) => (
          <li key={aRecord.uniqKey} className="record-item">
            <div className="record-item-label">
              <p>Creditor:</p>
              <p>{aRecord.creditor}</p>
            </div>
            <div className="record-item-label">
              <p>Handler Hash:</p>
              <p>{aRecord.handlerHash}</p>
            </div>
            <div className="record-item-label">
              <p>Clear Record:</p>
              <p>{aRecord.clearRecord}</p>
            </div>
            <div className="record-item-label">
              <p>Obf Record:</p>
              <p>{aRecord.obfRecord}</p>
            </div>
            <div className="record-item-label">
              <p>Proofs:</p>
              <p>{aRecord.proofs}</p>
            </div>
            <div className="record-item-label">
              <p>Amount:</p>
              <p>{aRecord.amount}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetailedCredits;
