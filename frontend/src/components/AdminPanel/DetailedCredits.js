import React from "react";

const DetailedCredits = ({ fullDC }) => {
  return (
    <div className="detailed-credits">
      <h2>Full Records ({fullDC.root})</h2>
      <ul className="record-list">
        <li key="0i0i" className="record-item">
          <div className="record-item-label">
            <p> </p>
          </div>
          <div className="record-item-label">
            <p>Creditor:</p>
          </div>
          <div className="record-item-label">
            <p>Clear Record:</p>
          </div>
          <div className="record-item-label">
            <p>Obf Record:</p>
          </div>
          <div className="record-item-label">
            <p>Proofs:</p>
          </div>
          <div className="record-item-label">
            <p>Amount:</p>
          </div>
        </li>
        {fullDC.records.map((aRecord, index) => (
          <li key={aRecord.uniqKey} className="record-item">
            <div className="record-item-label">
              <p>{index + 1}</p>
            </div>
            <div className="record-item-label">
              <p>{aRecord.creditor}</p>
            </div>
            <div className="record-item-label">
              <p>{aRecord.clearRecord}</p>
            </div>
            <div className="record-item-label">
              <p>{aRecord.obfRecord}</p>
            </div>
            <div className="record-item-label">
              <p>{aRecord.proofs}</p>
            </div>
            <div className="record-item-label">
              <p>{aRecord.amount}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetailedCredits;
