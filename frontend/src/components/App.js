import React, { useContext, useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { ethers } from "ethers";

import { AppContext } from "./AppContext";
import "./App.css";
import { checkConnection } from "./CUtils";
import AccountBalance from "./Account/AccountBalance";
import AdminPanel from "./AdminPanel/AdminPanel";
import ContractBalance from "./ContractBalance";
import TransactionInfo from "./TransactionInfo";
import ChooseWinner from "./ChooseWinner";

import SCListeners from "./SCListeners";

//import { BLOCKCHAIN_PROVIDER_URL } from "../config";

import { getNow } from "./CUtils";

function App() {
  const { globData } = useContext(AppContext);

  const [totalCredited, setTotalCredited] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState("");

  const now = getNow();

  const getContractBalance = async () => {
    if (!globData) return;

    await window.ethereum.request({ method: "eth_requestAccounts" });
    try {
      if (!globData || !globData.provider) {
        console.error("Ether is not initialized!");
      } else {
        console.log("Ether is ready.");
      }

      if (!ethers.isAddress(globData.royalGrowContractAddress)) {
        console.error("Invalid contract address!");
      } else {
        console.log("Valid contract address.");
      }

      await checkConnection(globData.provider);
      // globData.web 3.eth.net
      //   .isListening()
      //   .then(() => console.log("Connected to a Blockchain"))
      //   .catch((err) => console.error("Not connected:", err));

      const contractBalance = await globData.provider.getBalance(
        globData.royalGrowContractAddress
      );
      // const contractBalance = await globData.web 3.eth.getBalance(
      //   globData.royalGrowContractAddress
      // );
      const balanceInEther = ethers.formatEther(contractBalance);
      setTotalCredited(balanceInEther);
    } catch (error) {
      console.error("Error fetching contract balance:", error);
    } finally {
    }
  };

  useEffect(() => {
    if (globData) {
      getContractBalance();
    } else {
      setTimeout(() => getContractBalance(), 1000);
    }
  }, []);

  useEffect(() => {
    const initSelectedAccount = async () => {
      try {
        console.log("Initializing account...");
        if (!globData || !globData.provider) {
          console.log("No provider available");
          return;
        }

        // First request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });
        
        // Get the current accounts
        const accounts = await globData.provider.listAccounts();

        // If accounts exist, use the first one
        if (accounts && accounts.length > 0) {
          // accounts[0] is already the address string
          setSelectedAccount(accounts[0].address);
          // Use a timeout to verify the state update
          setTimeout(() => {
            console.log("Selected account after update:", selectedAccount);
          }, 100);
        } else {
          console.log("No accounts available");
        }

        // Listen for account changes
        globData.provider.on("accountsChanged", async (newAccounts) => {
          console.log("Account changed to:", newAccounts);
          if (newAccounts && newAccounts.length > 0) {
            setSelectedAccount(newAccounts[0].address);
          } else {
            setSelectedAccount("");
          }
        });

        // Listen for chain changes
        globData.provider.on("chainChanged", () => {
          console.log("Chain changed, reloading...");
          window.location.reload();
        });
      } catch (error) {
        console.error("Error getting selected account:", error);
        setSelectedAccount("");
      }
    };

    initSelectedAccount();

    // Cleanup function to remove event listeners
    return () => {
      if (globData && globData.provider) {
        globData.provider.removeAllListeners("accountsChanged");
        globData.provider.removeAllListeners("chainChanged");
      }
    };
  }, [globData]);

  useEffect(() => {
    console.log("Selected account state changed to:", selectedAccount);
  }, [selectedAccount]);

  return (
    <div className="App">
      <header className="App-header">
        <p onClick={() => getContractBalance()} className="topLogoAndAccount">
          <span className="logo-text">Royal GrowTh!</span>
          <span className="account-info">
            {selectedAccount && typeof selectedAccount === 'string' && selectedAccount.length >= 10 
              ? `${selectedAccount.slice(0, 6)}...${selectedAccount.slice(-4)}`
              : 'No Account'}
          </span>
          {totalCredited && parseFloat(totalCredited) >= 0 && (
            <span className="eth-amount">{totalCredited} ETH</span>
          )}
          <span className="timestamp">{now}</span>
        </p>
      </header>

      <main className="main-content">
        <div className="dashboard-section balance-section">
          <AccountBalance />
        </div>

        <div className="dashboard-section transactions-section">
          <TransactionInfo />
        </div>

        <div
          className="dashboard-section winner-section"
          style={{ display: "none" }}
        >
          <ChooseWinner />
        </div>
      </main>

      <Row>
        <Col xs={8} sm={8} md={8} lg={8} xl={8}>
          <SCListeners />
        </Col>
        <Col xs={4} sm={4} md={4} lg={4} xl={4}>
          nothing for now
        </Col>
      </Row>

      <AdminPanel />
    </div>
  );
}

export default App;
