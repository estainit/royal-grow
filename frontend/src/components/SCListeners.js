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
    setLogContent(msg);
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
      dspEvent(msg);

      postToBE("payToContract", {
        sender: event.returnValues.sender,
        amount: String(event.returnValues.amount),
        uniqueId: String(event.returnValues.uniqueId),
      });
    };

    const subscribeToEvent = async () => {
      const subscription =
        await globData.royalGrowcontractInstance.events.PayToContractEvent({
          fromBlock: "latest",
        });
      subscription.on("data", (event) => {
        handlePayToContractEvent(event);
      });
      subscription.on("error", dspEvent(console.error, "err"));
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
