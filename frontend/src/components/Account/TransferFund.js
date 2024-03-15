import React, { useContext, useState } from "react";
import { AppContext } from "../AppContext";

import {
  getNow,
  postToBE,
  doKeccak256,
  getWalletSelectedAccountByWalletSigner,
} from "../CUtils";

function TransferFund() {
  const { globData } = useContext(AppContext);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState();
  const [textMessage, setTextMessage] = useState("");

  const handleTransfer = async () => {
    if (!globData) return;

    try {
      setAmount(parseInt(amount));
      const signer = await getWalletSelectedAccountByWalletSigner(globData);

      console.log(" ......... signer:", signer);
      const signerAddress = await signer.getAddress();
      console.log(" ......... signer address:", signerAddress);

      let timestamp = getNow();
      let toBeSignedMessage =
        timestamp +
        "," +
        signerAddress +
        "," +
        recipientAddress +
        "," +
        amount +
        "," +
        textMessage;
      const hashedMessage = doKeccak256(globData, toBeSignedMessage);
      console.log(" ......... hashedMessage:", hashedMessage);
      const signature = await signer.signMessage(hashedMessage);
      console.log(" ......... signature:", signature);

      // send to backend
      let transferRes = postToBE("payment/doTransferFund", {
        timestamp,
        sender: signerAddress,
        amount,
        recipientAddress,
        textMessage,
        signature,
      });

      // Reset form fields
      setRecipientAddress("");
      setAmount(0);
      setTextMessage("");
    } catch (error) {
      console.error("Error transferring premium:", error);
      alert("Error transferring premium: " + error.message);
    }
  };

  //const handleTransferx = async () => {
  const setAmount_ = (value) => {
    setAmount(parseInt(value));
  };

  return (
    <div className="transfer-funds">
      <h2>Transfer</h2>
      <label>
        Recipient Address:
        <input
          type="text"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
      </label>
      <br />
      <label>
        Amount:
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount_(e.target.value)}
        />
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
