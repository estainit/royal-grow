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

  const handleWithdraw = async () => {
    if (!globData.web3 || !message || !amount) {
      console.error("Missing required data");
      return;
    }

    // Request user confirmation to sign message
    try {
      const signer = await getWalletSelectedAccountByWalletSigner(globData);

      console.log("iiii   amount wei: ", amount);
      console.log("iiii   amount eth: ", weiToEther(amount));

      const msgToBeSigned = "withdraw" + message;
      const address = await signer.getAddress();
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
      console.log("Withdrow res:", tx);

      /**
      const tx = await globData.royalGrowcontractInstance.methods
        .withdraw(message, etherToWei(amount), signature)
        .send({
          from: address,
        });
      console.log("Transaction hash:", tx.transactionHash);
       */
    } catch (error) {
      console.error("Error signing or sending transaction:", error);
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
    <div className="withdrow-fund">
      <div>
        <input
          type="text"
          placeholder="Enter message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleWithdraw}>Withdraw</button>
      </div>
      <div>
        <input
          type="text"
          placeholder="Enter index"
          value={withdrowedIndex}
          onChange={(e) => setWithdrowedIndex(e.target.value)}
        />
        <button onClick={getWithdrowedByIndex}>Withdraw info</button>
        <button onClick={resetWithdrawed}>reset Withdrawed</button>
      </div>
      <div className={`guaranteeDC form-container ${isLoading ? 'is-loading' : ''}`}>
        <div className="guarantee-header">
          <button 
            className="guarantee-refresh-button"
            onClick={getLatestGuaranteeDC}
          >
            <span className="button-text">Your Guarantee DC</span>
            <span className="button-icon">↻</span>
          </button>
        </div>

        {error && (
          <div className="guarantee-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="guarantee-content">
          <div className="guarantee-field">
            <label className="guarantee-label">
              <span className="label-text">Encrypted Data</span>
              <div className="field-container">
                <textarea
                  id="wrappedTextInputEnc"
                  className="guarantee-textarea"
                  rows="2"
                  value={encryotedDC || ''}
                  placeholder="Encrypted guarantee data will appear here..."
                  onChange={handleEncryptedChange}
                  ref={textAreaRefEnc}
                />
                <button 
                  className="guarantee-button button-primary"
                  onClick={applyFullWithdraw}
                >
                  Apply Full Withdraw
                </button>
              </div>
            </label>
          </div>

          <div className="guarantee-field clear-data-section">
            <button 
              className={`toggle-clear-data-button ${isShowingClearData ? 'active' : ''}`}
              onClick={() => setIsShowingClearData(!isShowingClearData)}
            >
              <span className="button-text">Clear Data</span>
              <span className="toggle-icon">{isShowingClearData ? '−' : '+'}</span>
            </button>
            
            {isShowingClearData && (
              <div className="clear-data-content animate-slide-down">
                <label className="guarantee-label">
                  <textarea
                    id="wrappedTextInputClear"
                    className="guarantee-textarea"
                    rows="2"
                    value={clearDC || ''}
                    placeholder="Clear guarantee data will appear here..."
                    onChange={handleClearChange}
                    ref={textAreaRefClr}
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
