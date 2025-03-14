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
  dspEvent,
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
    try {
        setIsLoading(true);
        setError(null);

        // Decode and process the encrypted data
        let decodedString = atob(encryotedDC);
        let toProcessDecodedString = decodedString.replace("withdraw", "");
        let records = toProcessDecodedString.split("+");
        let totalAmount = "0";
        
        // Verify records and calculate total
        for (let inx = 0; inx < records.length; inx = inx + 2) {
            const aClear = records[inx];
            const aProof = records[inx + 1];
            if (!aClear || !aProof) {
                throw new Error("Invalid record format");
            }
            const recInfo = parseClearRecord(aClear);
            if (!recInfo || !recInfo.amount) {
                throw new Error("Invalid record data");
            }
            // Convert amount to wei and add to total
            const amountInWei = globData.web3.utils.toWei(recInfo.amount.toString(), 'ether');
            const currentTotal = globData.web3.utils.fromWei(totalAmount, 'ether');
            const newAmount = globData.web3.utils.fromWei(amountInWei, 'ether');
            const sum = (parseFloat(currentTotal) + parseFloat(newAmount)).toString();
            totalAmount = globData.web3.utils.toWei(sum, 'ether');
        }

        if (totalAmount === "0") {
            throw new Error("No valid withdrawal amount found");
        }

        // Get signer and create signature
        const signer = await getWalletSelectedAccountByWalletSigner(globData);
        const address = await signer.getAddress();
        const msgToBeSigned = "withdraw" + toProcessDecodedString;
        console.log("Full withdraw msgToBeSigned", msgToBeSigned);
        const signature = await window.ethereum.request({
            method: "personal_sign",
            params: [globData.web3.utils.keccak256(msgToBeSigned), address],
        });

        // Check merkle root maturity before proceeding
        try {
            console.log("Checking merkle root maturity...");
            const lastUpdate = await globData.royalGrowcontractInstance.methods
                .lastUpdateDCMerkleRoot()
                .call();
            console.log("Last update timestamp:", lastUpdate);
            
            const coolDownWindow = await globData.royalGrowcontractInstance.methods
                .dCMerkleRootCoolDownWindowTime()
                .call();
            console.log("Cool down window (minutes):", coolDownWindow);
            
            const currentTime = Math.floor(Date.now() / 1000);
            console.log("Current time:", currentTime);
            
            const maturityTime = parseInt(lastUpdate) + (parseInt(coolDownWindow) * 60);
            console.log("Maturity time:", maturityTime);
            
            if (currentTime < maturityTime) {
                const waitTime = maturityTime - currentTime;
                const waitMinutes = Math.ceil(waitTime / 60);
                throw new Error(`Merkle root not matured yet. Please wait ${waitMinutes} minutes. Last update: ${new Date(parseInt(lastUpdate) * 1000).toLocaleString()}`);
            }
            
            console.log("Merkle root is matured, proceeding with withdrawal...");
        } catch (error) {
            console.error("Error checking merkle root maturity:", error);
            throw new Error(`Failed to check merkle root maturity: ${error.message}`);
        }

        // Send transaction
        console.log("Sending withdraw transaction... toProcessDecodedString", toProcessDecodedString);
        console.log("Sending withdraw transaction... totalAmount", totalAmount);
        
        // First try to estimate gas
        try {
            const gasEstimate = await globData.royalGrowcontractInstance.methods
                .withdrawDummy(
                    toProcessDecodedString,
                    totalAmount,
                    address.toString().toLowerCase(),
                    signature
                )
                .estimateGas({ from: address.toLowerCase() });
            
            console.log("Estimated gas:", gasEstimate);
            
            // Add 20% buffer to gas estimate
            const gasLimit = Math.floor(Number(gasEstimate) * 1.2);
            
            // Send transaction with gas limit
            const tx = await globData.royalGrowcontractInstance.methods
                .withdrawDummy(
                    toProcessDecodedString,
                    totalAmount,
                    address.toString().toLowerCase(),
                    signature
                )
                .send({ 
                    from: address.toLowerCase(),
                    gas: gasLimit
                });

            // Wait for confirmation using Web3.js method
            await new Promise((resolve, reject) => {
                globData.web3.eth.getTransactionReceipt(tx.transactionHash, (error, receipt) => {
                    if (error) {
                        reject(error);
                    } else if (receipt) {
                        resolve(receipt);
                    } else {
                        // If no receipt yet, poll every 2 seconds
                        const interval = setInterval(() => {
                            globData.web3.eth.getTransactionReceipt(tx.transactionHash, (error, receipt) => {
                                if (error) {
                                    clearInterval(interval);
                                    reject(error);
                                } else if (receipt) {
                                    clearInterval(interval);
                                    resolve(receipt);
                                }
                            });
                        }, 2000);
                    }
                });
            });

            if (tx.status) {
                // Show success message
                dspEvent("Withdrawal successful!", "success");
                // Clear the form
                setEncryotedDC("");
                setClearDC("");
                safeUpdateTextArea(textAreaRefEnc, "");
                safeUpdateTextArea(textAreaRefClr, "");
            } else {
                throw new Error("Transaction failed");
            }
        } catch (gasError) {
            console.error("Gas estimation error:", gasError);
            throw new Error(`Transaction would fail: ${gasError.message}`);
        }
    } catch (error) {
        console.error("Withdrawal error:", error);
        // Extract error message from contract if available
        let errorMessage = error.message;
        if (error.message.includes("execution reverted")) {
            errorMessage = error.message.split("execution reverted:")[1].trim();
        } else if (error.message.includes("Transaction reverted")) {
            errorMessage = "Transaction reverted. Please check your input data and try again.";
        }
        dspEvent(`Withdrawal failed: ${errorMessage}`, "error");
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
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
      dspEvent('Failed to fetch guarantee data. Please try again.', "error");
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

      // Wait for confirmation
      await tx.wait();

      // Show success message
      dspEvent("Withdrawal initiated successfully!", "success");
      
      // Reset form
      setMessage("");
      setAmount("");
      setErrors({
        message: "",
        amount: ""
      });
    } catch (error) {
      console.error("Error signing or sending transaction:", error);
      dspEvent(`Error processing withdrawal: ${error.message}`, "error");
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
