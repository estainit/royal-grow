import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { AppContext } from "./AppContext";

const ContractBalance = () => {
  const { globData } = useContext(AppContext);

  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch contract balance using Ether
  const getContractBalance = async () => {
    setIsLoading(true);
    try {
      const contractBalance = await globData.provider.getBalance(
        globData.royalGrowContractAddress
      );
      //      const contractBalance = await globData.web 3.eth.getBalance(
      //        globData.royalGrowContractAddress
      //      );
      const balanceInEther = ethers.formatEther(contractBalance);
      setBalance(balanceInEther);
    } catch (error) {
      console.error("Error fetching contract balance:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance on component mount
  useEffect(() => {
    if (globData != null) getContractBalance();
  }, []);

  return (
    <div>
      <h2>Contract Balance</h2>
      {isLoading ? (
        <p>Fetching balance...</p>
      ) : balance !== null ? (
        <p>Balance: {balance} ETH</p>
      ) : (
        <p>No balance information available.</p>
      )}
      <button onClick={getContractBalance} disabled={isLoading}>
        Refresh Balance
      </button>
    </div>
  );
};

export default ContractBalance;
