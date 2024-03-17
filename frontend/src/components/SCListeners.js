import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "./AppContext";
import { postToBE } from "./CUtils";

import "./SCListeners.css";

const SCListeners = () => {
  const { globData } = useContext(AppContext);

  const [isVisible, setIsVisible] = useState(false);
  const [logContent, setLogContent] = useState("");

  const dspEvent = async (msg, msgType) => {
    if (msgType === "err") {
    }
    setTimeout(() => setIsVisible(true), 200);
    setLogContent(logContent + " " + msg);
    setTimeout(() => setIsVisible(false), 15000);
  };

  useEffect(() => {
    const handlePayToContractEvent = (event) => {
      let msg = `Payment to contract by ${
        event.returnValues.sender
      } ${globData.web3.utils.fromWei(
        event.returnValues.amount,
        "ether"
      )} Eth ID: ${event.returnValues.uniqueId}`;
      console.log(msg);
      dspEvent(msg);

      postToBE("payment/payToContract", {
        sender: String(event.returnValues.sender).toLowerCase(),
        amount: String(event.returnValues.amount),
        uniqueId: String(event.returnValues.uniqueId),
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
      const subsObfBurntEvent =
        await globData.royalGrowcontractInstance.events.ObfBurntEvent({
          fromBlock: "latest",
        });
      console.log("subs Obf Burnt Event is registered!");
      subsObfBurntEvent.on("data", (event) => {
        handleObfBurntEvent(event);
      });
      subsObfBurntEvent.on("error", dspEvent(console.error, "err"));

      const subsInvalidDCProfEvent =
        await globData.royalGrowcontractInstance.events.InvalidDCProfEvent({
          fromBlock: "latest",
        });
      console.log("Invalid DC Prof Event is registered!");
      subsInvalidDCProfEvent.on("data", (event) => {
        handleInvalidDCProfEvent(event);
      });
      subsInvalidDCProfEvent.on("error", dspEvent(console.error, "err"));

      const subsPayToContractEvent =
        await globData.royalGrowcontractInstance.events.PayToContractEvent({
          fromBlock: "latest",
        });
      subsPayToContractEvent.on("data", (event) => {
        handlePayToContractEvent(event);
      });
      subsPayToContractEvent.on("error", dspEvent(console.error, "err"));

      const subsCreditsMerkleRootUpdatedEvent =
        await globData.royalGrowcontractInstance.events.CreditsMerkleRootUpdatedEvent(
          {
            fromBlock: "latest",
          }
        );
      subsCreditsMerkleRootUpdatedEvent.on("data", (event) => {
        handleCreditsMerkleRootUpdatedEvent(event);
      });
      subsCreditsMerkleRootUpdatedEvent.on(
        "error",
        dspEvent(console.error, "err")
      );
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
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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
    <div id="scListContainer" style={{ display: isVisible ? "block" : "none" }}>
      {logContent}
    </div>
  );
};

export default SCListeners;
