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
    const handleWithdrawEvent = (event) => {
      let msg = `Withdraw by ${event.returnValues.sender} ${ethers.formatEther(
        event.returnValues.amount
      )} Eth ID: ${event.returnValues.uniqueId}`;
      console.log(msg);
      dspEvent(msg);

      postToBE("payment/logWithdraw", {
        withdrawer: String(event.returnValues.withdrawer).toLowerCase(),
        amount: String(event.returnValues.amount),
        withdrawMsg: String(event.returnValues.withdrawMsg),
        signature: String(event.returnValues.signature),
        timestamp: String(event.returnValues.timestamp),
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

    const handleCreditsMerkleRootUpdatedEvent = (event) => {
      let msg = `Updating DCRootHash by ${event.returnValues.sender} Serial number (${event.returnValues.serialNumber}) root hash(${event.returnValues.creditsMerkleRoot})`;
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

    const handleObfBurntEvent = (event) => {
      let msg = `Obf Burnt Event by ${event.returnValues.sender}
      Burnt Obf Record (${event.returnValues.obfRecord}) 
      `;
      dspEvent(msg);
      console.log(msg);
    };

    const subscribeToEvent = async () => {
      //   // Obf Burnt Event
      //   const subsObfBurntEvent =
      //     await globData.royalGrowcontractInstance.events.ObfBurntEvent({
      //       fromBlock: "latest",
      //     });
      //   console.log("subs Obf Burnt Event is registered!");
      //   subsObfBurntEvent.on("data", (event) => {
      //     handleObfBurntEvent(event);
      //   });
      //   subsObfBurntEvent.on("error", dspEvent(console.error, "err"));

      //   // Invalid DC Prof Event
      //   const subsInvalidDCProfEvent =
      //     await globData.royalGrowcontractInstance.events.InvalidDCProfEvent({
      //       fromBlock: "latest",
      //     });
      //   console.log("Invalid DC Prof Event is registered!");
      //   subsInvalidDCProfEvent.on("data", (event) => {
      //     handleInvalidDCProfEvent(event);
      //   });
      //   subsInvalidDCProfEvent.on("error", dspEvent(console.error, "err"));

      // Pay To Contract Event
      // const subsPayToContractEvent =
      //   await globData.royalGrowcontractInstanc e.events.PayToContractEvent({
      //     fromBlock: "latest",
      //   });
      // subsPayToContractEvent.on("data", (event) => {
      //   handlePayToContractEvent(event);
      // });
      // subsPayToContractEvent.on("error", dspEvent(console.error, "err"));
      // Listen for PayToContractEvent
      globData.royalGrowcontractInstance.on(
        "PayToContractEvent",
        (sender, sentAmount, uniqueId, event) => {
          console.log("Pay To Contract Event sender", sender);
          console.log("Pay To Contract Event sentAmount", sentAmount);
          console.log("Pay To Contract Event uniqueId", uniqueId);
          console.log("Pay To Contract Event event", event);
          handlePayToContractEvent(sender, sentAmount, uniqueId, event);
        }
      );
      // Listen for error event
      globData.royalGrowcontractInstance.on("error", (error) => {
        dspEvent(console.error, "err", error);
      });

      console.log("PayToContractEvent subscription is active!");

      //   // Withdraw Event
      //   const subsWithdrawEvent =
      //     await globData.royalGrowcontractInstance.events.WithdrawEvent({
      //       fromBlock: "latest",
      //     });
      //   subsWithdrawEvent.on("data", (event) => {
      //     handleWithdrawEvent(event);
      //   });
      //   subsWithdrawEvent.on("error", dspEvent(console.error, "err"));

      //   // Pay To Contract Event
      //   const subsWithdrawAttempt =
      //     await globData.royalGrowcontractInstance.events.WithdrawAttempt({
      //       fromBlock: "latest",
      //     });
      //   subsWithdrawAttempt.on("data", (event) => {
      //     handleWithdrawAttempt(event);
      //   });
      //   subsWithdrawAttempt.on("error", dspEvent(console.error, "err"));

      //   // Credits Merkle Root Updated Event
      //   const subsCreditsMerkleRootUpdatedEvent =
      //     await globData.royalGrowcontractInstance.events.CreditsMerkleRootUpdatedEvent(
      //       {
      //         fromBlock: "latest",
      //       }
      //     );
      //   subsCreditsMerkleRootUpdatedEvent.on("data", (event) => {
      //     handleCreditsMerkleRootUpdatedEvent(event);
      //   });
      //   subsCreditsMerkleRootUpdatedEvent.on(
      //     "error",
      //     dspEvent(console.error, "err")
      //   );
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
