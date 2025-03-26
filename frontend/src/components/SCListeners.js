import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { AppContext } from "./AppContext";
import {
  postToBE,
  subscribeToMessageEvents,
  unsubscribeFromMessageEvents,
} from "./CUtils";

import "./SCListeners.css";

const SCListeners = () => {
  const { globData } = useContext(AppContext);

  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const dspEvent = async (msg, msgType = "info") => {
    if (msg === "" || msg === null || msg === undefined) return;

    setMessageType(msgType);
    setMessage(msg);
    setIsVisible(true);

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    const handleMessage = (msg, msgType) => {
      setMessageType(msgType);
      setMessage(msg);
      setIsVisible(true);

      // Auto-hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 4000);
    };

    // Subscribe to message events
    subscribeToMessageEvents(handleMessage);

    // Cleanup subscription on unmount
    return () => {
      unsubscribeFromMessageEvents(handleMessage);
    };
  }, []);

  useEffect(() => {
    const handlePayToContractEvent = (sender, amount, uniqueId, event) => {
      let msg = `Payment to contract by ${sender} ${ethers.formatEther(
        amount
      )} Eth ID: ${uniqueId}`;
      console.log(msg);
      dspEvent(msg);

      postToBE("payment/payToContract", {
        sender: String(sender).toLowerCase(),
        amount: String(amount),
        uniqueId: String(uniqueId),
      });
    };
    const handleWithdrawEvent = (
      withdrawer,
      withdrawMsg,
      signature,
      amount,
      timestamp,
      event
    ) => {
      let msg = `Withdraw by ${withdrawer} ${ethers.formatEther(
        amount
      )} Eth ID: ${event.uniqueId}`;
      console.log("handle Withdraw Event: ", event);
      console.log(msg);
      dspEvent(msg);

      postToBE("payment/logWithdraw", {
        withdrawer: String(withdrawer).toLowerCase(),
        amount: String(amount),
        withdrawMsg: String(withdrawMsg),
        signature: String(signature),
        timestamp: String(timestamp),
      });
    };

    const handleWithdrawAttempt = (event) => {
      let msg = `Withdraw Attempt by ${
        event.returnValues.sender
      } ${ethers.formatEther(event.returnValues.amount)} Eth ID: ${
        event.returnValues.uniqueId
      }`;
      console.log(msg);
      dspEvent(msg);

      postToBE("payment/logWithdraw", {
        withdrawer: String(event.returnValues.withdrawer).toLowerCase(),
        amount: String(event.returnValues.amount),
        withdrawMsg: String(event.returnValues.withdrawMsg),
        signature: "event.returnValues.signature",
        timestamp: String(event.returnValues.timestamp),
      });
    };

    const handleCreditsMerkleRootUpdatedEvent = (
      serialNumber,
      creditsMerkleRoot,
      event
    ) => {
      let msg = `Updating DCRootHash by ${event.sender} Serial number (${serialNumber}) root hash(${creditsMerkleRoot})`;
      dspEvent(msg);
    };

    const handleInvalidDCProfEvent = (event) => {
      let msg = `Invalid DC Prof Event by ${event.returnValues.sender}
      Serial number (${event.returnValues.serialNumber}) 
      root hash(${event.returnValues.rootHash})
      calculatedRoot(${event.returnValues.calculatedRoot})
      leave(${event.returnValues.leave})
      proofHashes(${event.returnValues.proofHashes})
      `;
      dspEvent(msg);
      console.log(msg);
    };

    const handleObfBurntEvent = (obfRecord, event) => {
      let msg = `Obf Burnt Event by ${event}
      Burnt Obf Record (${obfRecord}) 
      `;
      dspEvent(msg);
      console.log(msg);
    };

    const subscribeToEvent = async () => {
      try {
        // Listen for ObfBurntEvent
        globData.royalGrowcontractInstance.on(
          "ObfBurntEvent",
          (obfRecord, event) => {
            console.log("Obf Burnt Event received!");
            handleObfBurntEvent(obfRecord, event);
          }
        );
        console.log("subs Obf Burnt Event is registered!");

        // Listen for InvalidDCProfEvent
        globData.royalGrowcontractInstance.on(
          "InvalidDCProfEvent",
          (arg1, arg2, event) => {
            console.log("Invalid DC Prof Event received!");
            handleInvalidDCProfEvent(event);
          }
        );
        console.log("Invalid DC Prof Event is registered!");

        // Listen for PayToContractEvent
        console.log("Setting up PayToContractEvent listener...");
        console.log("Contract instance with provider:", globData.royalGrowcontractWithProvider);
        console.log("Contract address:", globData.royalGrowContractAddress);
        
        globData.royalGrowcontractWithProvider.on(
          "PayToContractEvent",
          (sender, sentAmount, uniqueId, event) => {
            console.log("PayToContractEvent received!");
            console.log("Sender:", sender);
            console.log("Amount:", sentAmount.toString());
            console.log("UniqueId:", uniqueId.toString());
            console.log("Event:", event);
            handlePayToContractEvent(sender, sentAmount, uniqueId, event);
          }
        );
        console.log("PayToContractEvent listener setup complete!");

        // Add error handler for the contract
        globData.royalGrowcontractWithProvider.on("error", (error) => {
          console.error("Contract error:", error);
        });

        // Listen for WithdrawEvent
        globData.royalGrowcontractInstance.on(
          "WithdrawEvent",
          (withdrawer, withdrawMsg, signature, amount, timestamp, event) => {
            console.log("Withdraw Event received!");
            handleWithdrawEvent(
              withdrawer,
              withdrawMsg,
              signature,
              amount,
              timestamp,
              event
            );
          }
        );
        console.log("Withdraw Event is registered!");

        // Listen for WithdrawAttempt event
        globData.royalGrowcontractInstance.on(
          "WithdrawAttempt",
          (arg1, arg2, event) => {
            console.log("Withdraw Attempt event received!");
            handleWithdrawAttempt(event);
          }
        );
        console.log("Withdraw Attempt event is registered!");

        // Listen for CreditsMerkleRootUpdatedEvent
        globData.royalGrowcontractInstance.on(
          "CreditsMerkleRootUpdatedEvent",
          (serialNumber, creditsMerkleRoot, event) => {
            console.log("Credits Merkle Root Updated Event received!");
            handleCreditsMerkleRootUpdatedEvent(
              serialNumber,
              creditsMerkleRoot,
              event
            );
          }
        );
        console.log("Credits Merkle Root Updated Event is registered!");
      } catch (error) {
        console.error("Error setting up event listeners:", error);
        dspEvent("Error setting up event listeners: " + error.message, "error");
      }
    };

    if (!globData) return;

    const init = async () => {
      await subscribeToEvent();
    };
    init();
  }, [globData]);

  /**
  useEffect(() => {
    const handleAccountsChanged = async (accounts) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0];
        setAccount(newAccount);

        // Fetch balance for the new account
        const provider = new ethers.providers.Web 3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contractInstance = new ethers.Contract(...); // Replace with your contract details

        const newBalance = await contractInstance.getBalance(newAccount); // Replace with appropriate method
        setBalance(newBalance.toString());
      } else {
        // Handle case where no account is connected
        setAccount(null);
        setBalance(null);
      }
    };

    // Add event listener on component mount
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    // Clean up event listener on component unmount
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);
 */

  return (
    <>
      {isVisible && (
        <div id="scListContainer">
          <div className={`message-modal ${messageType}`}>
            <p className="message-content">{message}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default SCListeners;
