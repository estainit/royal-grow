import React, { useContext, useState } from "react";
import { AppContext } from "../AppContext";
import { getWalletSelectedAccountByWalletSigner } from "../CUtils";
import "./Deposit.css";

const SendMoney = () => {
  const { globData } = useContext(AppContext);

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to send money to the contract
  const sendMoney = async () => {
    if (!globData) return;

    setIsLoading(true);
    try {
      const selectedAccount = await getWalletSelectedAccountByWalletSigner(globData);
      const weiAmount = globData.web3.utils.toWei(amount, "ether");

      console.log("Sending money from selected account:", selectedAccount);
      console.log("Sending money weiAmount:", weiAmount);
      console.log(
        "Sending money to contract:",
        globData.royalGrowContractAddress
      );

      const tx = await globData.web3.eth.sendTransaction({
        from: selectedAccount.address,
        to: globData.royalGrowContractAddress,
        value: weiAmount,
      });
      console.log("Transaction successful tx:", tx);

      await tx.wait();
      //const receipt = await web3.eth.waitForTransaction(tx.hash, 1); // Wait for 1 confirmation

      //console.log('Transaction successful 1:', receipt);
      console.log("Transaction successful 2:", tx.transactionHash);
      // Clear input field after successful transaction (optional)
      setAmount("");
    } catch (error) {
      console.error("Error sending money:", error);
      // Handle error appropriately (e.g., display error message)
    } finally {
      setIsLoading(false);
    }
  };

  const payToContract = async () => {
    if (!globData) return;

    setIsLoading(true);
    try {
      const selectedAccount = await getWalletSelectedAccountByWalletSigner(globData);
      const weiAmount = globData.web3.utils.toWei(amount, "ether");

      console.log("Sending money from selected account:", selectedAccount);
      console.log("Sending money weiAmount:", weiAmount);
      console.log(
        "Sending money to contract:",
        globData.royalGrowContractAddress
      );

      await globData.royalGrowcontractInstance.methods.payToContract().send({
        from: selectedAccount.address,
        value: weiAmount,
      });

      console.log("Transaction successful");
      setAmount("");
    } catch (error) {
      console.error("Error sending money:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (event) => {
    setAmount(event.target.value);
  };

  return (
    <div className="depos-money">
      <h2>
        <i className="fas fa-wallet"></i> Charge your account
      </h2>
      <input
        type="number"
        value={amount}
        onChange={handleChange}
        placeholder="Enter amount in ETH"
        min="0"
        step="0.000000000000000001"
      />
      {/* <button onClick={sendMoney} disabled={isLoading} >
        Send Money
      </button> */}
      {error && <div className="error-message">{error}</div>}
      <button 
        onClick={payToContract} 
        disabled={isLoading}
        className={isLoading ? 'loading' : ''}
      >
        {isLoading ? (
          <>
            <i className="fas fa-spinner"></i>
            Processing...
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane"></i>
            Pay To Contract
          </>
        )}
      </button>
    </div>
  );
};

export default SendMoney;
