import React, { useContext, useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";

import { AppContext } from "./AppContext";
import "./App.css";
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
  const [selectedAccount, setSelectedAccount] = useState('');

  const now = getNow();

  const getContractBalance = async () => {
    if (!globData) return;
    try {
      const contractBalance = await globData.web3.eth.getBalance(
        globData.royalGrowContractAddress
      );
      const balanceInEther = globData.web3.utils.fromWei(
        contractBalance.toString(),
        "ether"
      );
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
        if (!globData || !globData.web3) return;
        
        // Get the current accounts
        const accounts = await globData.web3.eth.getAccounts();
        
        // If accounts exist, use the first one
        if (accounts && accounts.length > 0) {
          setSelectedAccount(accounts[0]);
        }

        // Listen for account changes
        globData.web3.eth.on('accountsChanged', (newAccounts) => {
          if (newAccounts && newAccounts.length > 0) {
            setSelectedAccount(newAccounts[0]);
          } else {
            setSelectedAccount('');
          }
        });

        // Listen for chain changes
        globData.web3.eth.on('chainChanged', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('Error getting selected account:', error);
        setSelectedAccount('');
      }
    };

    initSelectedAccount();

    // Cleanup function to remove event listeners
    return () => {
      if (globData && globData.web3) {
        globData.web3.eth.removeAllListeners('accountsChanged');
        globData.web3.eth.removeAllListeners('chainChanged');
      }
    };
  }, [globData]);

  return (
    <div className="App">
      <header className="App-header">
        <p onClick={() => getContractBalance()} className="topLogoAndAccount">
          <span className="logo-text">Royal GrowTh!</span>
          <span className="account-info">({selectedAccount.slice(0, 6)}...{selectedAccount.slice(-4)})</span>
          {totalCredited && parseFloat(totalCredited) > 0 && (
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

        <div className="dashboard-section winner-section" style={{ display: 'none' }}>
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
