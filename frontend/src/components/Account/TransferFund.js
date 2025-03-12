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
  const [amount, setAmount] = useState("");
  const [textMessage, setTextMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    recipientAddress: "",
    amount: "",
    textMessage: ""
  });

  const validateForm = () => {
    const newErrors = {
      recipientAddress: "",
      amount: "",
      textMessage: ""
    };

    // Validate recipient address
    if (!recipientAddress) {
      newErrors.recipientAddress = "Recipient address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(recipientAddress)) {
      newErrors.recipientAddress = "Invalid Ethereum address format";
    }

    // Validate amount
    if (!amount) {
      newErrors.amount = "Amount is required";
    } else if (isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    // Validate message (optional)
    if (textMessage && textMessage.length > 100) {
      newErrors.textMessage = "Message must be less than 100 characters";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleTransfer = async () => {
    if (!globData || !validateForm()) return;

    try {
      setIsLoading(true);
      const signer = await getWalletSelectedAccountByWalletSigner(globData);
      const signerAddress = await signer.getAddress();

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
      const signature = await signer.signMessage(hashedMessage);

      // send to backend
      let transferRes = await postToBE("payment/doTransferFund", {
        timestamp,
        sender: signerAddress.toLowerCase(),
        amount: etherToWei(amount),
        recipientAddress: recipientAddress.toLowerCase(),
        textMessage,
        signature,
      });

      // Show success message
      console.log("Transfer initiated successfully!");
      
      // Reset form
      setRecipientAddress("");
      setAmount("");
      setTextMessage("");
      setErrors({
        recipientAddress: "",
        amount: "",
        textMessage: ""
      });
    } catch (error) {
      console.error("Error transferring premium:", error);
      alert("Error transferring premium: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setAmount_ = (value) => {
    setAmount(value);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: "" }));
    }
  };

  return (
    <div className="transfer-funds">
      <h2 className="transfer-title">Transfer Funds</h2>
      <div className="transfer-form">
        <div className="form-group">
          <label className="form-label">
            Recipient Address
            <input
              type="text"
              className={`form-input ${errors.recipientAddress ? 'error' : ''}`}
              value={recipientAddress}
              onChange={(e) => {
                setRecipientAddress(e.target.value.toLowerCase());
                if (errors.recipientAddress) {
                  setErrors(prev => ({ ...prev, recipientAddress: "" }));
                }
              }}
              placeholder="Enter recipient address"
              disabled={isLoading}
            />
            {errors.recipientAddress && (
              <span className="error-message">{errors.recipientAddress}</span>
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
                onChange={(e) => setAmount_(e.target.value)}
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

        <div className="form-group">
          <label className="form-label">
            Message
            <input
              type="text"
              className={`form-input ${errors.textMessage ? 'error' : ''}`}
              value={textMessage}
              onChange={(e) => {
                setTextMessage(e.target.value);
                if (errors.textMessage) {
                  setErrors(prev => ({ ...prev, textMessage: "" }));
                }
              }}
              placeholder="Add a message (optional)"
              maxLength="100"
              disabled={isLoading}
            />
            {errors.textMessage && (
              <span className="error-message">{errors.textMessage}</span>
            )}
          </label>
        </div>

        <button 
          className={`transfer-button ${isLoading ? 'loading' : ''}`}
          onClick={handleTransfer}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Processing...
            </>
          ) : (
            'Send Money'
          )}
        </button>
      </div>
    </div>
  );
}

export default TransferFund;
