import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import { Row, Col } from "react-bootstrap";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {
  getWalletSelectedAccountByWalletSigner,
  getFromBE,
  weiToEther,
  doKeccak256,
  numberWithCommas,
  clearRecordParser,
} from "../CUtils";
import "./AccountBalance.css";

import Withdraw from "./Withdraw";
import TransferFund from "./TransferFund";

const AccountBalance = () => {
  const { globData } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [payedToContract, setPayedToContract] = useState(0);
  const [onchainCredit, setOnchainCredit] = useState(0);
  const [spent, setSpent] = useState(0);
  const [rgCredit, setRgCredit] = useState(0);
  const [error, setError] = useState(null);
  const [fullDC, setFullDC] = useState({ root: "", records: [] });
  const [proofVerifiyResults, setProofVerifiyResults] = useState({});
  const [creditVerifiyResults, setCreditVerifiyResults] = useState({});
  const [withdrawed, setWithdrawed] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isDetailedCreditsVisible, setIsDetailedCreditsVisible] = useState(false);
  const [isTransactionHistoryVisible, setIsTransactionHistoryVisible] = useState(true);

  const fetchOffchainPayedToContract = async () => {
    const selectedAccount_ = await getWalletSelectedAccountByWalletSigner(
      globData
    );
    setSelectedAccount(selectedAccount_.address);

    const paymentInfo = await getFromBE("payment/getTotalPaymentsToContract", {
      payer: selectedAccount_.address.toLowerCase(),
    });
    console.log("paymentInfo", paymentInfo);

    let totalPayment = 0;
    if (paymentInfo.data.totalPayment)
      totalPayment = paymentInfo.data.totalPayment;
    setPayedToContract(totalPayment);
  };

  const fetchRGCredit = async () => {
    const selectedAccount_ = await getWalletSelectedAccountByWalletSigner(
      globData
    );
    const theAddress = selectedAccount_.address.toLowerCase();
    setSelectedAccount(theAddress);
    console.log("fetch RG Credit for ", theAddress);
    const paymentInfo = await getFromBE("dc/getRGCredit", {
      creditor: theAddress,
    });

    let rgCredit = 0;
    if (paymentInfo.data.currentBalance)
      rgCredit = paymentInfo.data.currentBalance;
    setRgCredit(rgCredit);
  };

  const fetchOnchainBalance = async () => {
    if (!globData) return;

    const selectedAccount = await getWalletSelectedAccountByWalletSigner(
      globData
    );

    setIsLoading(true);
    try {
      console.log(
        "xxx ... ... xxx. ... .. xx...  . royalGrowcontract 2",
        globData.royalGrowcontractInstance
      );
      const balance = await globData.royalGrowcontractInstance.getCreditorBalance({
        args: [selectedAccount.address.toLowerCase()]
      });
      console.log("get Creditor Balance: ", balance, " wei");
      const balanceInEther = weiToEther(balance);
      setOnchainCredit(balance);
    } catch (error) {
      console.error("Error fetching user Balance:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    if (!globData) return;
    
    setIsLoadingTransactions(true);
    try {
      const selectedAccount_ = await getWalletSelectedAccountByWalletSigner(globData);
      const address = selectedAccount_.address.toLowerCase();
      
      // Fetch transactions from backend
      const response = await getFromBE("payment/transaction/history", {
        address: address
      });

      if (response && response.data) {
        setTransactions(response.data);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setError("Failed to load transaction history");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (!globData) return;

    const init = async () => {
      setIsLoading(true);
      try {
        await fetchOffchainPayedToContract();
        await fetchRGCredit();
        await fetchOnchainBalance();
        await fetchTransactionHistory();
      } catch (error) {
        console.error("Error initializing:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [globData]);

  const verifyProof = async (uniqKey, leave, proof) => {
    proof = proof.split(",");
    let validateDCProofRes = await globData.royalGrowcontractInstance.validateDCProof({
      args: [leave, proof, 1]
    });
    console.log("validate DC Proof Res: ", validateDCProofRes);
    setProofVerifiyResults((prevResults) => ({
      ...prevResults,
      [uniqKey]: validateDCProofRes[0],
    }));
  };

  const alreadyWithdrawed = async (obfRecord) => {
    let alreadyWithdrawedRes = await globData.royalGrowcontractInstance.alreadyWithdrawed({
      args: [obfRecord]
    });
    console.log("Control already Withdrawed Res: ", alreadyWithdrawedRes);
    setWithdrawed((prevResults) => ({
      ...prevResults,
      [obfRecord]: alreadyWithdrawedRes,
    }));
  };

  const verifyCredit = async (clearRecord, proof) => {
    proof = proof.split(",");
    console.log("clearRecord: ", clearRecord);
    let clearRecordInfo = clearRecordParser(clearRecord);
    console.log("clearRecordInfo: ", clearRecordInfo);
    let validateDCCreditRes = await globData.royalGrowcontractInstance.validateDCCredit({
      args: [clearRecord, proof]
    });
    console.log("validate DC Credit Res: ", validateDCCreditRes);
    setCreditVerifiyResults((prevResults) => ({
      ...prevResults,
      [clearRecord]: validateDCCreditRes[0],
    }));
  };

  const makeFullRGCD = async () => {
    const selectedAccount = await getWalletSelectedAccountByWalletSigner(
      globData
    );

    let currentSerialNumber = await globData.royalGrowcontractInstance.getDCCurrentSerialNumber({
      args: []
    });
    console.log("currentSerialNumber=", currentSerialNumber);

    const rGCD = await getFromBE("dc/makeFullRGCD", {
      serialNumber: currentSerialNumber,
      account: selectedAccount.address,
    });
    console.log("make Full RGCD info", rGCD);
    if (rGCD) {
      setFullDC(rGCD.data);
      setIsDetailedCreditsVisible(true);
    }
  };

  return (
    <div className="transaction-container">
      <div className="account-info">
        <div className="balance-breakdown">
          <div className="onchain-records-header">
            <h6 onClick={makeFullRGCD}>Onchain Records</h6>
            <i 
              className={`fas ${isDetailedCreditsVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}
              onClick={() => setIsDetailedCreditsVisible(!isDetailedCreditsVisible)}
            ></i>
          </div>
          <p
            onClick={() => fetchOnchainBalance()}
            title={onchainCredit + " wei"}
            className="clickable-balance"
            style={{cursor: 'pointer'}}
          >
            Credited (On chain): {weiToEther(onchainCredit)} Eth
          </p>

          <p
            onClick={() => fetchOffchainPayedToContract()}
            title={numberWithCommas(payedToContract) + " wei"}
            className="clickable-balance"
            style={{cursor: 'pointer'}}
          >
            Total payed to contract: {weiToEther(payedToContract)} Eth
          </p>
          <p>Spent: {spent} Eth</p>
          <p 
            onClick={() => fetchRGCredit()} 
            title={rgCredit + " wei"}
            className="clickable-balance"
            style={{cursor: 'pointer'}}
          >
            RG Credit: {weiToEther(rgCredit)} ETH
          </p>
        </div>
      </div>

      <div className={`detailed-credits ${fullDC.records.length > 0 && isDetailedCreditsVisible ? 'visible' : ''}`}>
        <div className="detailed-credits-header">
          <h5>Your crdits for ({fullDC.root})</h5>
        </div>
        <ul className="record-list">
          <li key={"0000"} className="record-item-head1">
            <div className="record-item-label">
              <p> </p>
            </div>
            <div className="record-item-label">
              <p>Records:</p>
            </div>
            <div className="record-item-label">
              <p>Amount:</p>
            </div>
            <div className="record-item-label">
              <p>Prove Proof:</p>
            </div>
            <div className="record-item-label">
              <p>Prove Credit:</p>
            </div>
          </li>

          {fullDC.records.map((aRecord, index) => (
            <li
              key={`${aRecord.uniqKey}-${index}`}
              className="record-item"
              title={`proofs: ${aRecord.proofs}, Clear Record: ${aRecord.clearRecord}`}
            >
              <div className="record-item-label">
                <p>{index + 1}</p>
              </div>
              <div className="record-item-label">
                <p>{aRecord.obfRecord}</p>
              </div>
              <div className="record-item-label">
                <p>{aRecord.amount}</p>
              </div>
              <div className="record-item-label">
                <p>
                  <button
                    onClick={() =>
                      verifyProof(
                        aRecord.uniqKey,
                        aRecord.obfRecord,
                        aRecord.proofs
                      )
                    }
                    className={
                      proofVerifiyResults[aRecord.uniqKey] === true
                        ? "green-button"
                        : proofVerifiyResults[aRecord.uniqKey] === false
                        ? "red-button"
                        : ""
                    }
                  >
                    <i className="fas fa-check-circle"></i>
                    Verify Proof
                  </button>
                </p>
              </div>
              <div className="record-item-label">
                <p>
                  <button
                    onClick={() =>
                      verifyCredit(aRecord.clearRecord, aRecord.proofs)
                    }
                    className={
                      creditVerifiyResults[aRecord.clearRecord] === true
                        ? "green-button"
                        : creditVerifiyResults[aRecord.clearRecord] === false
                        ? "red-button"
                        : ""
                    }
                  >
                    <i className="fas fa-file-invoice-dollar"></i> Verify Credit
                  </button>
                  <button
                    onClick={() => alreadyWithdrawed(aRecord.obfRecord)}
                    className={
                      withdrawed[aRecord.obfRecord] === false
                        ? "green-button"
                        : withdrawed[aRecord.obfRecord] === true
                        ? "red-button"
                        : ""
                    }
                  >
                    <i className="fas fa-wallet"></i> Available
                  </button>
                </p>
              </div>
            </li>
          ))}
          <li key={"0000end"} className="record-item-head1">
            <div className="record-item-label">
              <p> </p>
            </div>
            <div className="record-item-label">
              <p>Amount:</p>
            </div>
            <div className="record-item-label">
              <p>
                {numberWithCommas(
                  fullDC.records.reduce(
                    (accumulator, currentRecord) =>
                      accumulator + parseInt(currentRecord.amount),
                    0
                  )
                )}{" "}
                wei ={" "}
                {weiToEther(
                  fullDC.records.reduce(
                    (accumulator, currentRecord) =>
                      accumulator + parseInt(currentRecord.amount),
                    0
                  )
                )}{" "}
                ETH
              </p>
            </div>
            <div className="record-item-label">
              <p> </p>
            </div>
            <div className="record-item-label">
              <p> </p>
            </div>
          </li>
        </ul>
      </div>

      <div className="transaction-history-header">
        <h5>Transaction History</h5>
        <i 
          className={`fas ${isTransactionHistoryVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}
          onClick={() => setIsTransactionHistoryVisible(!isTransactionHistoryVisible)}
        ></i>
      </div>

      <div className={`transaction-history ${isTransactionHistoryVisible ? 'visible' : ''}`}>
        {isLoadingTransactions ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : transactions.length === 0 ? (
          <p>No transactions found</p>
        ) : (
          <ul className="record-list">
            <li className="record-item-head1">
              <div className="record-item-label">
                <p>Date</p>
              </div>
              <div className="record-item-label">
                <p>Type</p>
              </div>
              <div className="record-item-label">
                <p>Amount</p>
              </div>
              <div className="record-item-label">
                <p>Status</p>
              </div>
              <div className="record-item-label">
                <p>Details</p>
              </div>
            </li>
            {transactions.map((transaction, index) => (
              <li key={transaction.id || index} className="record-item">
                <div className="record-item-label">
                  <p>{new Date(transaction.timestamp).toLocaleDateString()}</p>
                </div>
                <div className="record-item-label">
                  <p>{transaction.type}</p>
                </div>
                <div className="record-item-label">
                  <p>{weiToEther(transaction.amount)} ETH</p>
                </div>
                <div className="record-item-label">
                  <p>
                    <span className={`status-badge ${transaction.status.toLowerCase()}`}>
                      {transaction.status}
                    </span>
                  </p>
                </div>
                <div className="record-item-label">
                  <p>{transaction.details || '-'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="user-mgmt">
        <div>
          <Row>
            <Col xs={6} sm={6} md={6} lg={6} xl={6}>
            <TransferFund />
            </Col>
            <Col xs={6} sm={6} md={6} lg={6} xl={6}>
              <Withdraw />
            </Col>
          </Row>
        </div>
        <div>
        </div>
      </div>
    </div>
  );
};

export default AccountBalance;
