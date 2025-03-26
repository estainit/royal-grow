import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

import contractsAddress from "../deployed-contracts/contract-address.json";
import RoyalGrow from "../deployed-contracts/RoyalGrow.json";

// Create a context
export const AppContext = createContext();

// Create a provider
export const AppProvider = ({ children }) => {
  const [globData, setGlobData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initEthers = async () => {
      if (window.ethereum) {
        // const web 3Instance = new Web 3(window.ethereum);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner(); 

        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });

          const royalGrowContractAddress = contractsAddress.RoyalGrow;
          // const royalGrowcontract = new web 3Instance.eth.Contract(
          //   RoyalGrow.abi,
          //   royalGrowContractAddress
          // );
          const royalGrowcontract = new ethers.Contract(
            royalGrowContractAddress,
            RoyalGrow.abi,
            signer
          );
          console.log("xxx ... ... xxx. ... .. xx...  . royalGrowcontract 1", royalGrowcontract);

          // Create contract instance with provider for event listening
          const royalGrowcontractWithProvider = new ethers.Contract(
            royalGrowContractAddress,
            RoyalGrow.abi,
            provider
          );
          
          console.log("Contract instance created with signer:", royalGrowcontract);
          console.log("Contract instance created with provider:", royalGrowcontractWithProvider);

          try {
            const getContractBalance = async () => {
              try {
                // First check if we're connected to the right network
                // const networkId = await web 3Instance.eth.net.getId();
                const network = await provider.getNetwork();
                const networkId = network.chainId;
                console.log("Connected to network:", network);

                // Check if contract is deployed at the address
                const code = await provider.getCode(royalGrowContractAddress);
                // const code = await web 3Instance.eth.getCode(
                //   royalGrowContractAddress
                // );
                if (code === "0x" || code === "") {
                  console.error(
                    "No contract deployed at address:",
                    royalGrowContractAddress
                  );
                  return "0.0";
                }

                // Try to get the balance
                const balance = await royalGrowcontract.balance();
                console.log("Raw balance:", balance);

                // If balance is null, undefined, or empty string, return 0.0
                if (!balance || balance === "0" || balance === "") {
                  return "0.0";
                }

                // Convert balance from Wei to Ether
                // return web 3Instance.utils.fromWei(balance, "ether");
                return ethers.formatEther(balance);
              } catch (error) {
                console.error("Error getting contract balance:", error);
                // Log more details about the error
                if (error.data) {
                  console.error("Error data:", error.data);
                }
                if (error.message) {
                  console.error("Error message:", error.message);
                }
                return "0.0";
              }
            };

            setGlobData({
              provider: provider,
              RoyalGrow: RoyalGrow,
              royalGrowContractAddress: royalGrowContractAddress,
              royalGrowcontractInstance: royalGrowcontract,
              royalGrowcontractWithProvider: royalGrowcontractWithProvider,
            });
          } catch (error) {
            console.error("Error fetching contract data:", error);
          }
        } catch (error) {
          console.error("Error while initializing Ether", error);
          setError(error.message); // Set error state
        }
      } else {
        console.error("No Ethereum provider found");
        setError(
          "No Ethereum provider found. Please install a wallet extension."
        );
      }
    };

    initEthers();
  }, []);

  return (
    <AppContext.Provider value={{ globData }}>{children}</AppContext.Provider>
  );
};
