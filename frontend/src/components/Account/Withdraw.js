import React, { useContext, useEffect, useState, useRef } from "react";
import { ethers } from "ethers";
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
  const [isResetting, setIsResetting] = useState(false);
  const [pastEvents, setPastEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [errors, setErrors] = useState({
    message: "",
    amount: "",
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
    const tx =
      await globData.royalGrowcontractInstance.getWithdrawedInfoByIndex(
        withdrowedIndex
      );
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
        // Convert string amount to BigInt and add to total
        totalAmount = BigInt(totalAmount) + BigInt(recInfo.amount);
      }
      console.log("apply Full Withdraw -> total Amount: ", totalAmount);

      if (totalAmount === "0") {
        throw new Error("No valid withdrawal amount found");
      }

      // Get signer and create signature
      const signer = await getWalletSelectedAccountByWalletSigner(globData);
      const address = await signer.getAddress();
      const msgToBeSigned = "withdraw" + toProcessDecodedString;
      console.log("Full withdraw msgToBeSigned", msgToBeSigned);
      // Convert string to bytes before hashing
      const messageBytes = ethers.toUtf8Bytes(msgToBeSigned);
      const messageHash = ethers.keccak256(messageBytes);
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [messageHash, address],
      });
      console.log("apply Full Withdraw -> signature: ", signature);

      // Check merkle root maturity before proceeding
      try {
        console.log("Checking merkle root maturity...");
        const lastUpdate =
          await globData.royalGrowcontractInstance.lastUpdateDCMerkleRoot();
        console.log("Last update timestamp:", lastUpdate);

        const coolDownWindow =
          await globData.royalGrowcontractInstance.dCMerkleRootCoolDownWindowTime();
        console.log("Cool down window (minutes):", coolDownWindow);

        const currentTime = Math.floor(Date.now() / 1000);
        console.log("Current time:", currentTime);

        const maturityTime =
          parseInt(lastUpdate) + parseInt(coolDownWindow) * 60;
        console.log("Maturity time:", maturityTime);

        if (currentTime < maturityTime) {
          const waitTime = maturityTime - currentTime;
          const waitMinutes = Math.ceil(waitTime / 60);
          throw new Error(
            `Merkle root not matured yet. Please wait ${waitMinutes} minutes. Last update: ${new Date(
              parseInt(lastUpdate) * 1000
            ).toLocaleString()}`
          );
        }

        console.log(
          "apply Full Withdraw -> Merkle root is matured, proceeding with withdrawal..."
        );
      } catch (error) {
        console.error("Error checking merkle root maturity:", error);
        throw new Error(
          `Failed to check merkle root maturity: ${error.message}`
        );
      }

      // Send transaction
      console.log(
        "Sending withdraw transaction... toProcessDecodedString",
        toProcessDecodedString
      );
      console.log("Sending withdraw transaction... totalAmount", totalAmount);

      // Format parameters properly
      const formattedAddress = address.toString().toLowerCase();
      const formattedAmount = BigInt(totalAmount);
      const formattedSignature = signature.startsWith('0x') ? signature : `0x${signature}`;

      console.log("Formatted parameters: ", {
        msg: toProcessDecodedString,
        amount: formattedAmount.toString(),
        address: formattedAddress,
        signature: formattedSignature,
      });

      try {
        // First try to estimate gas
        const gasEstimate = await globData.royalGrowcontractInstance.doWithdraw.estimateGas(
          toProcessDecodedString,
          formattedAmount,
          formattedAddress,
          formattedSignature
        );
        
        // Add 20% buffer to gas estimate
        const gasLimit = Math.floor(Number(gasEstimate) * 1.2);

        console.log("Estimated gas:", gasEstimate.toString());
        console.log("Gas limit with buffer:", gasLimit);

        // Send transaction with estimated gas
        const tx = await globData.royalGrowcontractInstance.doWithdraw(
          toProcessDecodedString,
          formattedAmount,
          formattedAddress,
          formattedSignature,
          {
            gasLimit: BigInt(gasLimit)
          }
        );

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Transaction receipt:", receipt);

        if (receipt.status === 1) {
          dspEvent("Withdrawal successful!", "success");
          // Clear the form
          setEncryotedDC("");
          setClearDC("");
          safeUpdateTextArea(textAreaRefEnc, "");
          safeUpdateTextArea(textAreaRefClr, "");
        } else {
          throw new Error("Transaction failed");
        }
      } catch (txError) {
        console.error("Transaction error details:", {
          error: txError,
          message: txError.message,
          code: txError.code,
          data: txError.data
        });
        
        // Try to get more specific error information
        let errorMessage = txError.message;
        if (txError.data) {
          try {
            const errorData = JSON.parse(txError.data);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Error parsing error data:", e);
          }
        }
        
        throw new Error(`Transaction failed: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Withdrawal error:", error.reason);
      console.error("Withdrawal error:", error);
      // Extract error message from contract if available
      let errorMessage = error.message;
      if (error.message.includes("execution reverted")) {
        errorMessage = error.message.split("execution reverted:")[1].trim();
      } else if (error.message.includes("Transaction reverted")) {
        errorMessage =
          "Transaction reverted. Please check your input data and try again.";
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
      let currentSerialNumber =
        await globData.royalGrowcontractInstance.getDCCurrentSerialNumber();

      const selectedAccount = await getWalletSelectedAccountByWalletSigner(
        globData
      );
      const paymentInfo = await getFromBE("dc/getLatestGuaranteeDC", {
        creditor: selectedAccount.address.toLowerCase(),
        serialNumber: currentSerialNumber,
      });

      setEncryotedDC(paymentInfo.data.encryotedDC);
      setClearDC(paymentInfo.data.clearDC);

      safeUpdateTextArea(textAreaRefEnc, paymentInfo.data.encryotedDC);
      safeUpdateTextArea(textAreaRefClr, paymentInfo.data.clearDC);
    } catch (error) {
      console.error("Error fetching guarantee DC:", error);
      setError("Failed to fetch guarantee data. Please try again.");
      dspEvent("Failed to fetch guarantee data. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const resetWithdrawed = async () => {
    const tx = await globData.royalGrowcontractInstance.resetWithdrawed();
    console.log("reset Withdrawed res:", tx);
  };

  const validateForm = () => {
    const newErrors = {
      message: "",
      amount: "",
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
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleWithdraw = async () => {
    if (!globData.provider || !validateForm()) return;

    try {
      setIsLoading(true);
      const signer = await getWalletSelectedAccountByWalletSigner(globData);
      const address = await signer.getAddress();

      const msgToBeSigned = "withdraw" + message;
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [ethers.keccak256(msgToBeSigned), address],
      });

      // Send transaction and get response
      // const tx = await globData.royalGrowcontractInstanc e.methods
      //   .doWithdraw(
      //     message,
      //     amount,
      //     address.toString().toLowerCase(),
      //     signature
      //   )
      //   .send({ from: address.toLowerCase() });
      const tx = await globData.royalGrowcontractInstance.doWithdraw(
        message,
        amount,
        address.toString().toLowerCase(),
        signature
      );

      // Wait for transaction confirmation
      const receipt3 = await tx.wait();

      console.log("Transaction confirmed:", receipt3);

      async function getTransactionReceipt(txHash) {
        try {
          const receipt = await globData.provider.getTransactionReceipt(txHash);
          return receipt;
        } catch (error) {
          throw error; // Handle error appropriately
        }
      }
      const receipt = await getTransactionReceipt(tx.hash);
      console.log("Transaction Receipt:", receipt);

      // // Wait for confirmation using Web 3.js method
      // const receipt = await new Promise((resolve, reject) => {
      //   globData.web 3.eth.getTransactionReceipt(
      //     tx.transactionHash,
      //     (error, receipt) => {
      //       if (error) {
      //         reject(error);
      //       } else if (receipt) {
      //         resolve(receipt);
      //       } else {
      //         // If no receipt yet, poll every 2 seconds
      //         const interval = setInterval(() => {
      //           globData.web 3.eth.getTransactionReceipt(
      //             tx.transactionHash,
      //             (error, receipt) => {
      //               if (error) {
      //                 clearInterval(interval);
      //                 reject(error);
      //               } else if (receipt) {
      //                 clearInterval(interval);
      //                 resolve(receipt);
      //               }
      //             }
      //           );
      //         }, 2000);
      //       }
      //     }
      //   );
      // });

      // Get the return data from the transaction receipt
      if (!receipt || !receipt.logs || receipt.logs.length === 0) {
        throw new Error("Transaction receipt not found or no logs available");
      }

      // The return value is in the first log's data
      const returnData = receipt.logs[0].data;

      // Decode the tuple (bool, string) from the return data
      const decodedData = ethers.AbiCoder.decode(
        ["bool", "string"],
        returnData
      );
      // const decodedReturn = globData.web 3.eth.abi.decodeParameters(
      //   ["bool", "string"],
      //   returnData
      // );

      const [success, responseMessage] = decodedData;

      if (success) {
        dspEvent(`Withdrawal successful! ${responseMessage}`, "success");
        // Reset form
        setMessage("");
        setAmount("");
        setErrors({
          message: "",
          amount: "",
        });
      } else {
        dspEvent(`Withdrawal failed: ${responseMessage}`, "error");
      }
    } catch (error) {
      console.error("Error signing or sending transaction:", error);
      let errorMessage = error.message;
      if (error.message.includes("execution reverted")) {
        errorMessage = error.message.split("execution reverted:")[1].trim();
      } else if (error.message.includes("Transaction reverted")) {
        errorMessage =
          "Transaction reverted. Please check your input data and try again.";
      }
      dspEvent(`Error processing withdrawal: ${errorMessage}`, "error");
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
    // const tx = await globData.royalGrowcontractInstanc e.methods
    //   .setCreditorBalance(message, etherToWei(amount))
    //   .send({
    //     from: address,
    //   });
    // console.log("Transaction hash:", tx.transactionHash);
    const tx = await globData.royalGrowcontractInstance.setCreditorBalance(
      message,
      ethers.parseUnits(amount, "ether")
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    console.log("Transaction hash:", receipt.hash);
  };

  const handleWithdrawEvent = async (
    withdrawer,
    withdrawMsg,
    signature,
    amount,
    timestamp,
    event
  ) => {
    console.log(
      ` User: ${withdrawer}, Amount: ${amount} ⏱️ Timestamp: ${timestamp} Stage: ${event.stage}`
    );
    console.log(` Event: ${event}`);

    if (event.stage === 1) {
      await investigateOnWithdraw(withdrawer, amount, timestamp);
    }
  };

  // Unsubscribe from event on component unmount (optional)
  useEffect(() => {
    const unsubscribe = async () => {
      // Implement logic to unsubscribe from the event (if subscription is stored)
    };
    return unsubscribe;
  }, []); // Re-subscribe on Ether/address change

  // Initialize Ether and subscribe to event on component mount
  useEffect(() => {
    // const subscribeToEvent = async () => {
    //   if (
    //     globData &&
    //     globData.royalGrowcontractInstanc e.events &&
    //     globData.royalGrowcontractInstanc e.events.WithdrawEvent
    //   ) {
    //     const subscription =
    //       await globData.royalGrowcontractInstanc e.events.WithdrawEvent({
    //         fromBlock: "latest",
    //       });

    //     subscription.on("data", async (event) => {
    //       await handleWithdrawEvent(event);
    //     });

    //     subscription.on("error", console.error);
    //   }
    // };
    const subscribeToEvent = async () => {
      try {
        // Listen for WithdrawEvent using ethers.js v6 syntax
        globData.royalGrowcontractInstance.on(
          "WithdrawEvent",
          async (withdrawer, withdrawMsg, signature, amount, timestamp, event) => {
            console.log("Withdrawal Event received!");
            await handleWithdrawEvent(
              withdrawer,
              withdrawMsg,
              signature,
              amount,
              timestamp,
              event
            );
          }
        );
        console.log("Withdrawal Event is registered!");
      } catch (error) {
        console.error("Error setting up event listener:", error);
      }
    };

    if (!globData) return;

    const init = async () => {
      await subscribeToEvent();
    };

    init();
  }, [globData]);

  const resetDatabase = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all database tables? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsResetting(true);
    setError(null);
    try {
      const response = await getFromBE("dc/resetDatabase", {});
      if (response.success) {
        dspEvent("Database reset successful!", "success");
      } else {
        throw new Error(response.message || "Failed to reset database");
      }
    } catch (error) {
      console.error("Database reset error:", error);
      dspEvent(`Database reset failed: ${error.message}`, "error");
      setError(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchPastEvents = async () => {
    if (!globData || !globData.royalGrowcontractInstance) {
      console.log("Contract instance not initialized yet");
      return;
    }

    try {
      setIsLoadingEvents(true);
      // Get the current block number
      const currentBlock = await globData.royalGrowcontractInstance.runner.provider.getBlockNumber();
      // Get events from the last 1000 blocks (adjust this number as needed)
      const fromBlock = Math.max(0, currentBlock - 1000);
      
      const filter = globData.royalGrowcontractInstance.filters.WithdrawEvent();
      const events = await globData.royalGrowcontractInstance.queryFilter(
        filter,
        fromBlock,
        currentBlock
      );
      
      console.log("Fetched past events:", events);
      setPastEvents(events);
    } catch (error) {
      console.error("Error fetching past events:", error);
      dspEvent("Failed to fetch past withdrawal attempts", "error");
    } finally {
      setIsLoadingEvents(false);
    }
  };

  // Add this useEffect to handle initialization
  useEffect(() => {
    if (globData && globData.royalGrowcontractInstance) {
      setIsInitialized(true);
      fetchPastEvents();
    }
  }, [globData]);

  return (
    <div className="withdraw-container">
      {!isInitialized ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Initializing contract connection...</p>
        </div>
      ) : (
        <>
          <div className="withdrow-fund">
            <h2 className="withdraw-title">Withdraw Funds</h2>
            <div className="withdraw-form">
              <div className="form-group">
                <label className="form-label">
                  Message
                  <input
                    type="text"
                    className={`form-input ${errors.message ? "error" : ""}`}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (errors.message) {
                        setErrors((prev) => ({ ...prev, message: "" }));
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
                      className={`form-input amount-input ${
                        errors.amount ? "error" : ""
                      }`}
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) {
                          setErrors((prev) => ({ ...prev, amount: "" }));
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

              <div className="button-group">
                <button
                  className={`withdraw-button ${isLoading ? "loading" : ""}`}
                  onClick={handleWithdraw}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Processing...
                    </>
                  ) : (
                    "Withdraw Funds"
                  )}
                </button>

                <button
                  className="reset-button"
                  onClick={resetDatabase}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <>
                      <span className="spinner"></span>
                      Resetting...
                    </>
                  ) : (
                    "Reset Database"
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="guarantee-container">
            <div className="guarantee-section">
              <div
                className="guarantee-title"
                onClick={() => setIsShowingClearData(!isShowingClearData)}
              >
                <span>Guarantee DC</span>
                <span className="toggle-icon">
                  {isShowingClearData ? "▼" : "▶"}
                </span>
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
                      "Refresh Guarantee DC"
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
                    className={`withdraw-button ${isLoading ? "loading" : ""}`}
                    onClick={applyFullWithdraw}
                    disabled={isLoading || !encryotedDC || !clearDC}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner"></span>
                        Processing...
                      </>
                    ) : (
                      "Apply Full Withdrawal"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="past-events-container">
            <div className="past-events-header">
              <h2 className="withdraw-title">Past Withdrawal Attempts</h2>
              <button
                className="refresh-button"
                onClick={fetchPastEvents}
                disabled={isLoadingEvents || !isInitialized}
                style={{ backgroundColor: "#3b82f6", color: "white" }}
              >
                {isLoadingEvents ? (
                  <>
                    <span className="spinner"></span>
                    Refreshing...
                  </>
                ) : (
                  "Refresh Events"
                )}
              </button>
            </div>

            <div className="events-list">
              {!isInitialized ? (
                <div className="loading-message">
                  Initializing contract connection...
                </div>
              ) : isLoadingEvents ? (
                <div className="loading-message">Loading past events...</div>
              ) : pastEvents.length === 0 ? (
                <div className="no-events">No withdrawal attempts found</div>
              ) : (
                pastEvents.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-header">
                      <span className="event-timestamp">
                        {new Date(
                          event.returnValues.timestamp * 1000
                        ).toLocaleString()}
                      </span>
                      <span className="event-status">
                        {event.returnValues.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    <div className="event-details">
                      <p>
                        <strong>User:</strong> {event.returnValues.user}
                      </p>
                      <p>
                        <strong>Amount:</strong>{" "}
                        {weiToEther(event.returnValues.amount)} ETH
                      </p>
                      <p>
                        <strong>Message:</strong> {event.returnValues.message}
                      </p>
                      {!event.returnValues.success && (
                        <p className="error-message">
                          <strong>Error:</strong> {event.returnValues.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Withdraw;
