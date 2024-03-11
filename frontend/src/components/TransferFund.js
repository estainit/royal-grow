import React, { useContext, useState } from "react";
import { AppContext } from "./AppContext";

function TransferFund({ contractInstance, account }) {
  const { globData } = useContext(AppContext);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState(0);
  const [textMessage, setTextMessage] = useState("");

  const handleTransfer = async () => {
    if (!globData) return;

    try {
      // Encode the text message to base64
      const encodedMessage = Buffer.from(textMessage).toString("base64");

      // Call the smart contract method
      await globData.royalGrowcontractInstance.methods
        .transferCoin(recipientAddress, amount, encodedMessage)
        .send({ from: account });

      // Reset form fields
      setRecipientAddress("");
      setAmount(0);
      setTextMessage("");

      // Alert the user about successful transfer
      alert("Premium transfer successful!");
    } catch (error) {
      console.error("Error transferring premium:", error);
      alert("Error transferring premium: " + error.message);
    }
  };

  return (
    <div>
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
          onChange={(e) => setAmount(e.target.value)}
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
