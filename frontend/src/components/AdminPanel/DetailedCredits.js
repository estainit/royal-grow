import React from "react";

const DetailedCredits = ({ fullDC }) => {
  return (
    <div className="detailedCrdReport">
      <h2>Full Records ({fullDC.root})</h2>
      <ul className="record-list">
        <li key="0i0i" className="record-header">
          <div className="record-header-index">
            <p> </p>
          </div>
          <div className="record-header-creditor">
            <p>Creditor:</p>
          </div>
          <div className="record-header-clear-record">
            <p>Clear Record:</p>
          </div>
          <div className="record-header-obf-record">
            <p>Obf Record:</p>
          </div>
          <div className="record-header-proofs">
            <p>Proofs:</p>
          </div>
          <div className="record-header-amount">
            <p>Amount:</p>
          </div>
        </li>
        {fullDC.records.map((aRecord, index) => (
          <li key={aRecord.uniqKey} className="record-item">
            <div className="record-item-label-index">
              <p>{index + 1}</p>
            </div>
            <div className="record-item-label-creditor">
              <p>{aRecord.creditor.slice(0,6)}...{aRecord.creditor.slice(-4)}</p>
            </div>
            <div className="record-item-label-clear-record">
              <p>{aRecord.clearRecord}</p>
            </div>
            <div className="record-item-label-obf-record">
              <p>{aRecord.obfRecord}</p>
            </div>
            <div className="record-item-label-proofs">
              <p>{aRecord.proofs}</p>
            </div>
            <div className="record-item-label-amount">
              <p>{aRecord.amount}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DetailedCredits;
