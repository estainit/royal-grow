import React, { useContext, useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";

import { AppContext } from "./AppContext";
import "./App.css";
import AccountBalance from "./Account/AccountBalance";
import AdminPanel from "./AdminPanel/AdminPanel";
import ContractBalance from "./ContractBalance";
import TransactionInfo from "./TransactionInfo";
import ChooseWinner from "./ChooseWinner";
import SendMoney from "./SendMoney";
import TransferFund from "./TransferFund";
import Withdraw from "./Withdraw";
import LatestPayment from "./LatestPayment";
import SCListeners from "./SCListeners";

//import { BLOCKCHAIN_PROVIDER_URL } from "../config";

import { getNow } from "./CUtils";

function App() {
  const { globData } = useContext(AppContext);

  const [totalCredited, setTotalCredited] = useState(null);

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

  return (
    <div className="App">
      <header className="App-header">
        <p onClick={() => getContractBalance()}>
          Royal Grow! {totalCredited} ETH
          <br />
          {now}.
        </p>
      </header>

      <AccountBalance />

      <TransactionInfo />
      <ChooseWinner />
      
      <TransferFund />

      
      
      <Row>
        <Col xs={6} sm={6} md={6} lg={6} xl={6}>
        <SendMoney />
        </Col>
        <Col xs={6} sm={6} md={6} lg={6} xl={6}>
        <Withdraw />
        </Col>
      </Row>

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
