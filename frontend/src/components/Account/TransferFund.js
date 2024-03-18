import React, { useContext, useState } from "react";
import { AppContext } from "../AppContext";

import {
  getNow,
  postToBE,
  doKeccak256,
  getWalletSelectedAccountByWalletSigner,
  etherToWei,
} from "../CUtils";

function TransferFund() {
  const { globData } = useContext(AppContext);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState();
  const [textMessage, setTextMessage] = useState("");

  const handleTransfer = async () => {
    if (!globData) return;

    try {
      setAmount(parseFloat(amount));
      const signer = await getWalletSelectedAccountByWalletSigner(globData);

      console.log(" ......... signer:", signer);
      const signerAddress = await signer.getAddress();
      console.log(" ......... signer address:", signerAddress);

      let timestamp = getNow();
      let toBeSignedMessage =
        timestamp +
        "," +
        signerAddress.toLowerCase() +
        "," +
        recipientAddress.toLowerCase() +
        "," +
        etherToWei(amount) +
        "," +
        textMessage;
      const hashedMessage = doKeccak256(globData, toBeSignedMessage);
      console.log(" ......... hashedMessage:", hashedMessage);
      const signature = await signer.signMessage(hashedMessage);
      console.log(" ......... signature:", signature);

      // send to backend
      let transferRes = await postToBE("payment/doTransferFund", {
        timestamp,
        sender: signerAddress.toLowerCase(),
        amount: etherToWei(amount),
        recipientAddress: recipientAddress.toLowerCase(),
        textMessage,
        signature,
      });
    } catch (error) {
      console.error("Error transferring premium:", error);
      alert("Error transferring premium: " + error.message);
    } finally {
      // Reset form fields
      setRecipientAddress("");
      setAmount(0.0);
      setTextMessage("");
    }
  };

  //const handleTransferx = async () => {
  const setAmount_ = (value) => {
    setAmount(parseFloat(value));
  };

  return (
    <div className="transfer-funds">
      <h2>Transfer</h2>
      <label>
        Recipient Address:
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value.toLowerCase())}
        />
      </label>
      <br />
      <label>
        Amount:
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount_(e.target.value)}
        />{" "}
        ETH
      </label>
      <br />
      <label>
        Text Message:
        <input
          type="text"
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
        />
      </label>
      <br />
      <button onClick={handleTransfer}>Send</button>
    </div>
  );
}

export default TransferFund;
