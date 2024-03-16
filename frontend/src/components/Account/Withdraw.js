import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import {
  getWalletSelectedAccount,
  etherToWei,
  clearRecordParser,
  getWalletSelectedAccountByWalletSigner,
  weiToEther,
} from "../CUtils";

import { ethers } from "ethers";

const Withdraw = () => {
  const { globData } = useContext(AppContext);

  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(0);

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
        .call({ from: address.toLowerCase() });
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
  );
};

export default Withdraw;