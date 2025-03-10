import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../AppContext";
import "./Withdraw.css";
import "../../styles/components/forms.css";

import {
  getWalletSelectedAccount,
  etherToWei,
  clearRecordParser,
  getWalletSelectedAccountByWalletSigner,
  weiToEther,
  getFromBE,
  parseClearRecord,
} from "../CUtils";

import { ethers } from "ethers";

const Withdraw = () => {
  const { globData } = useContext(AppContext);

  const textAreaRefEnc = useRef(null);
  const textAreaRefClr = useRef(null);

  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);
  const [withdrowedIndex, setWithdrowedIndex] = useState(0);
  const [encryotedDC, setEncryotedDC] = useState();
  const [clearDC, setClearDC] = useState();
  const [isShowingClearData, setIsShowingClearData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [errors, setErrors] = useState({
    message: "",
    amount: ""
  });

  function hexStringToBytes(hexString) {
    // Remove '0x' prefix if present
    if (hexString.slice(0, 2) === "0x") {
      hexString = hexString.slice(2);
    }

    // Define an array to store the byte values
    var bytes = [];

    // Loop through the hex string, two characters at a time
    for (var i = 0; i < hexString.length; i += 2) {
      // Convert each pair of characters to a byte value and push to the array
      bytes.push(parseInt(hexString.slice(i, i + 2), 16));
    }

    // Return the resulting byte array
    return bytes;
  }

  const getWithdrowedByIndex = async () => {
    const tx = await globData.royalGrowcontractInstance.methods
      .getWithdrawedInfoByIndex(withdrowedIndex)
      .call();
    console.log("get Withdrowed By Index res:", tx);
  };

  const applyFullWithdraw = async () => {
    // console.log("b64 encoded DC", encryotedDC);
    let decodedString = atob(encryotedDC);
    // console.log("b64 decoded DC", decodedString);
    let toProcessDecodedString = decodedString.replace("withdraw", "");
    console.log("cleared decoded DC", toProcessDecodedString);
    let records = toProcessDecodedString.split("+");
    // console.log("records DC", records);
    let totalAmount = 0;
    for (let inx = 0; inx < records.length; inx = inx + 2) {
      const aClear = records[inx];
      const aProof = records[inx + 1];
      // console.log("aClear DC", aClear);
      // console.log("aProof DC", aProof);
      const recInfo = parseClearRecord(aClear);
      totalAmount += recInfo.amount;
    }
    console.log("totalAmount DC", totalAmount);

    const msgToBeSigned = decodedString;
    const signer = await getWalletSelectedAccountByWalletSigner(globData);
    const address = await signer.getAddress();
    const signature = await window.ethereum.request({
      method: "personal_sign",
      params: [globData.web3.utils.keccak256(msgToBeSigned), address],
    });

    const tx = await globData.royalGrowcontractInstance.methods
      .withdrawDummy(
        toProcessDecodedString,
        totalAmount,
        address.toString().toLowerCase(),
        signature
      )
      .send({ from: address.toLowerCase() });
    console.log("Full Withdrow res:", tx);

  };

  const safeUpdateTextArea = (ref, value) => {
    if (ref.current) {
      ref.current.value = value;
    }
  };

  const handleEncryptedChange = (e) => {
    if (textAreaRefEnc.current) {
      textAreaRefEnc.current.value = e.target.value;
      setEncryotedDC(e.target.value);
    }
  };

  const handleClearChange = (e) => {
    if (textAreaRefClr.current) {
      textAreaRefClr.current.value = e.target.value;
      setClearDC(e.target.value);
    }
  };

  const getLatestGuaranteeDC = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let currentSerialNumber = await globData.royalGrowcontractInstance.methods
        .getDCCurrentSerialNumber()
        .call();

      const selectedAccount = await getWalletSelectedAccountByWalletSigner(globData);
      const paymentInfo = await getFromBE("dc/getLatestGuaranteeDC", {
        creditor: selectedAccount.address.toLowerCase(),
        serialNumber: currentSerialNumber,
      });
      
      setEncryotedDC(paymentInfo.data.encryotedDC);
      setClearDC(paymentInfo.data.clearDC);
      
      safeUpdateTextArea(textAreaRefEnc, paymentInfo.data.encryotedDC);
      safeUpdateTextArea(textAreaRefClr, paymentInfo.data.clearDC);
    } catch (error) {
      console.error('Error fetching guarantee DC:', error);
      setError('Failed to fetch guarantee data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetWithdrawed = async () => {
    const tx = await globData.royalGrowcontractInstance.methods
      .resetWithdrawed()
      .call();
    console.log("reset Withdrawed res:", tx);
  };

  const validateForm = () => {
    const newErrors = {
      message: "",
      amount: ""
    };

    // Validate message
    if (!message) {
      newErrors.message = "Message is required";
    }

    // Validate amount
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleWithdraw = async () => {
    if (!globData.web3 || !validateForm()) return;

    try {
      setIsLoading(true);
      const signer = await getWalletSelectedAccountByWalletSigner(globData);
      const address = await signer.getAddress();

      const msgToBeSigned = "withdraw" + message;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [globData.web3.utils.keccak256(msgToBeSigned), address],
      });

      const tx = await globData.royalGrowcontractInstance.methods
        .withdrawDummy(
          message,
          amount,
          address.toString().toLowerCase(),
          signature
        )
        .send({ from: address.toLowerCase() });

      // Show success message
      console.log("Withdrawal initiated successfully!");
      
      // Reset form
      setMessage("");
      setAmount("");
      setErrors({
        message: "",
        amount: ""
      });
    } catch (error) {
      console.error("Error signing or sending transaction:", error);
      alert("Error processing withdrawal: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const investigateOnWithdraw = async (user, amount, timestamp) => {
    const balancesRefreshCost = etherToWei(1);
    const userInfo = await updateFromBackend(user, amount);
    await setCreditorBalance(user, userInfo.amount - balancesRefreshCost);
  };

  const updateFromBackend = async (user) => {};

  const setCreditorBalance = async (user, amount) => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    const tx = await globData.royalGrowcontractInstance.methods
      .setCreditorBalance(message, etherToWei(amount))
      .send({
        from: address,
      });
    console.log("Transaction hash:", tx.transactionHash);
  };

  const handleWithdrawalEvent = async (event) => {
    console.log(
      ` User: ${event.returnValues.user}, Amount: ${event.returnValues.amount} ⏱️ Timestamp: ${event.returnValues.timestamp} Stage: ${event.returnValues.stage}`
    );
    console.log(` Event: ${event}`);

    if (event.returnValues.stage === 1) {
      await investigateOnWithdraw(
        event.returnValues.user,
        event.returnValues.amount,
        event.returnValues.timestamp
      );
    }
  };

  // Unsubscribe from event on component unmount (optional)
  useEffect(() => {
    const unsubscribe = async () => {
      // Implement logic to unsubscribe from the event (if subscription is stored)
    };
    return unsubscribe;
  }, []); // Re-subscribe on web3/address change

  // Initialize web3 and subscribe to event on component mount
  useEffect(() => {
    const subscribeToEvent = async () => {
      if (globData.royalGrowcontractInstance.events.WithdrawalEvent) {
        const subscription =
          await globData.royalGrowcontractInstance.events.WithdrawalEvent({
            fromBlock: "latest",
          });

        subscription.on("data", async (event) => {
          await handleWithdrawalEvent(event);
        });

        subscription.on("error", console.error);
      }
    };

    if (!globData) return;

    const init = async () => {
      await subscribeToEvent();
    };

    init();
  }, [globData]);

  return (
    <div className="withdraw-container">
      <div className="withdrow-fund">
        <h2 className="withdraw-title">Withdraw Funds</h2>
        <div className="withdraw-form">
          <div className="form-group">
            <label className="form-label">
              Message
              <input
                type="text"
                className={`form-input ${errors.message ? 'error' : ''}`}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (errors.message) {
                    setErrors(prev => ({ ...prev, message: "" }));
                  }
                }}
                placeholder="Enter withdrawal message"
                disabled={isLoading}
              />
              {errors.message && (
                <span className="error-message">{errors.message}</span>
              )}
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Amount
              <div className="amount-input-wrapper">
                <input
                  type="number"
                  className={`form-input amount-input ${errors.amount ? 'error' : ''}`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: "" }));
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                  step="0.000000000000000001"
                  disabled={isLoading}
                />
                <span className="currency-label">ETH</span>
              </div>
              {errors.amount && (
                <span className="error-message">{errors.amount}</span>
              )}
            </label>
          </div>

          <button 
            className={`withdraw-button ${isLoading ? 'loading' : ''}`}
            onClick={handleWithdraw}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              'Withdraw Funds'
            )}
          </button>
        </div>
      </div>
      
      <div className="guarantee-container">
        <div className="guarantee-section">
          <div 
            className="guarantee-title"
            onClick={() => setIsShowingClearData(!isShowingClearData)}
          >
            <span>Guarantee DC</span>
            <span className="toggle-icon">{isShowingClearData ? '▼' : '▶'}</span>
          </div>
          
          {isShowingClearData && (
            <div className="guarantee-content">
              <button 
                className="withdraw-button"
                onClick={getLatestGuaranteeDC}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Loading...
                  </>
                ) : (
                  'Refresh Guarantee DC'
                )}
              </button>

              <div className="guarantee-field">
                <label className="form-label">Encrypted Data</label>
                <textarea
                  ref={textAreaRefEnc}
                  value={encryotedDC}
                  onChange={handleEncryptedChange}
                  placeholder="Encrypted data will appear here..."
                  disabled={isLoading}
                />
              </div>
              
              <div className="guarantee-field">
                <label className="form-label">Clear Data</label>
                <textarea
                  ref={textAreaRefClr}
                  value={clearDC}
                  onChange={handleClearChange}
                  placeholder="Clear data will appear here..."
                  disabled={isLoading}
                />
              </div>

              <button 
                className={`withdraw-button ${isLoading ? 'loading' : ''}`}
                onClick={applyFullWithdraw}
                disabled={isLoading || !encryotedDC || !clearDC}
              >
                {isLoading ? (
                  <>
                    <span className="spinner"></span>
                    Processing...
                  </>
                ) : (
                  'Apply Full Withdrawal'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
