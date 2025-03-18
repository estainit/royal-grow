import React, { useContext, useState } from "react";
import { ethers } from "ethers";

import { AppContext } from "../AppContext";
import { getWalletSelectedAccountByWalletSigner } from "../CUtils";
import "./Deposit.css";

const SendMoney = () => {
  const { globData } = useContext(AppContext);
  const [isVisible, setIsVisible] = useState(false);

  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to send money to the contract
  const sendMoney = async () => {
    if (!globData) return;

    setIsLoading(true);
    try {
      const selectedAccount = await getWalletSelectedAccountByWalletSigner(globData);
      const weiAmount = ethers.parseEther(amount);

      console.log("Sending money from selected account:", selectedAccount);
      console.log("Sending money weiAmount:", weiAmount);
      console.log(
        "Sending money to contract:",
        globData.royalGrowContractAddress
      );

      const signer = await globData.provider.getSigner();
      const tx = await signer.sendTransaction({
        to: globData.royalGrowContractAddress,
        value: weiAmount,
      });
      // const tx = await globData.web 3.eth.sendTransaction({
      //   from: selectedAccount.address,
      //   to: globData.royalGrowContractAddress,
      //   value: weiAmount,
      // });
      console.log("Transaction successful tx:", tx);

      await tx.wait();
      //const receipt = await web 3.eth.waitForTransaction(tx.hash, 1); // Wait for 1 confirmation

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
      const selectedAccount = await getWalletSelectedAccountByWalletSigner(
        globData
      );
      const weiAmount = ethers.parseEther(amount);

      console.log("Sending money from selected account:", selectedAccount);
      console.log("Sending money weiAmount:", weiAmount);
      console.log(
        "Sending money to contract:",
        globData.royalGrowContractAddress
      );

      const tx = await globData.royalGrowcontractInstance.payToContract({
        value: weiAmount, // Send ETH along with the transaction
      });
      const receipt = await tx.wait(); // Wait for confirmation

      // await globData.royalGrowcontractInstanc e.methods.payToContract().send({
      //   from: selectedAccount.address,
      //   value: weiAmount,
      // });

      console.log("Transaction successful receipt: ", receipt);
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
      <div className="depos-money-header" onClick={() => setIsVisible(!isVisible)}>
        <h2>
          <i className="fas fa-wallet"></i> Charge your account
        </h2>
        <i className={`fas ${isVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
      </div>
      <div className={`depos-money-content ${isVisible ? 'visible' : 'hidden'}`}>
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
    </div>
  );
};

export default SendMoney;
