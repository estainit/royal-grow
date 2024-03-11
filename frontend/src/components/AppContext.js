import React, { createContext, useState, useEffect } from "react";
import Web3 from "web3";

import contractsAddress from "../contracts/contract-address.json";
import RoyalGrow from "../contracts/RoyalGrow.json";

// Create a context
export const AppContext = createContext();

// Create a provider
export const AppProvider = ({ children }) => {
  const [globData, setGlobData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
          
          const royalGrowContractAddress = contractsAddress.RoyalGrow;
          const royalGrowcontract = new web3Instance.eth.Contract(
            RoyalGrow.abi,
            royalGrowContractAddress
          );

          try {
            setGlobData({
              web3: web3Instance,
              RoyalGrow: RoyalGrow,
              royalGrowContractAddress: royalGrowContractAddress,
              royalGrowcontractInstance: royalGrowcontract,
            });
          } catch (error) {
            console.error("Error fetching contract data:", error);
          }
        } catch (error) {
          console.error("Error while initializing web3", error);
          setError(error.message); // Set error state
        }
      } else {
        console.error("Web3 not found");
        setError("Web3 not found. Please install a wallet extension."); // Informative error message
      }
    };

    initWeb3();
  }, []);

  return (
    <AppContext.Provider value={{ globData }}>{children}</AppContext.Provider>
  );
};
