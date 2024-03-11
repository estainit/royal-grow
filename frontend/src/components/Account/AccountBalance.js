import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import { Row, Col } from "react-bootstrap";
import {
  getWalletSelectedAccountByWalletSigner,
  getFromBE,
  weiToEther,
} from "../CUtils";

import "./AccountBalance.css";

const AccountBalance = () => {
  const { globData } = useContext(AppContext);

  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [payedToContract, setPayedToContract] = useState(0);
  const [onchainCredit, setOnchainCredit] = useState(0);
  const [spent, setSpent] = useState(0);
  const [rgCredit, setRgCredit] = useState(0);
  const [error, setError] = useState(null);

  const fetchOffchainPayedToContract = async () => {
    const selectedAccount_ = await getWalletSelectedAccountByWalletSigner(
      globData
    );
    setSelectedAccount(selectedAccount_.address);

    const paymentInfo = await getFromBE("getTotalPaymentsToContract", {
      payer: selectedAccount_.address,
    });
    console.log("paymentInfo", paymentInfo);

    let totalPayment = 0;
    if (paymentInfo.data.totalPayment)
      totalPayment = paymentInfo.data.totalPayment;
    setPayedToContract(weiToEther(totalPayment));
  };

  const fetchRGCredit = async () => {
    const selectedAccount_ = await getWalletSelectedAccountByWalletSigner(
      globData
    );
    setSelectedAccount(selectedAccount_.address);

    const paymentInfo = await getFromBE("dc/getRGCredit", {
      creditor: selectedAccount_.address,
    });
    console.log("RG Credit", paymentInfo);
    
    let rgCredit = 0;
    if (paymentInfo.data.rgCredit) rgCredit = paymentInfo.data.rgCredit;
    console.log("rgCredit::::::", rgCredit);
    setRgCredit(weiToEther(rgCredit));
  };

  const fetchOnchainBalance = async () => {
    if (!globData) return;

    const selectedAccount = await getWalletSelectedAccountByWalletSigner(
      globData
    );

    setIsLoading(true);
    try {
      const balance = await globData.royalGrowcontractInstance.methods
        .getCreditorBalance()
        .call({ from: selectedAccount.address });
      const balanceInEther = globData.web3.utils.fromWei(
        balance.toString(),
        "ether"
      );
      setOnchainCredit(balanceInEther);
    } catch (error) {
      console.error("Error fetching user Balance:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!globData) return;

    const init = async () => {
      setIsLoading(true);
      try {
        await fetchOffchainPayedToContract();
        await fetchRGCredit();
        await fetchOnchainBalance();
      } catch (error) {
        console.error("Error sending money:", error);
        // Handle error appropriately (e.g., display error message)
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [globData]);

  return (
    <div className="transaction-container">
      <div className="account-info">
        <p>Selected Account: {selectedAccount}</p>
        <div className="balance-breakdown">
          <p onClick={() => fetchOnchainBalance()}>
            Credited (On chain): {onchainCredit} Eth
          </p>

          <p onClick={() => fetchOffchainPayedToContract()}>
            Total payed to contract: {payedToContract} Eth
          </p>
          <p>Spent: {spent} Eth</p>
          <p onClick={() => fetchRGCredit()}>RG Credit: {rgCredit} Eth = 5.09 $</p>
        </div>
      </div>
      <div className="transaction-history">
        <Row className="txHistory header">
          <Col xs={1} sm={1} md={1} lg={1} xl={1}>
            No
          </Col>
          <Col xs={1} sm={1} md={1} lg={1} xl={1}>
            Direction
          </Col>
          <Col xs={1} sm={1} md={1} lg={1} xl={1}>
            From/To
          </Col>
          <Col xs={1} sm={1} md={1} lg={1} xl={1}>
            Amount
          </Col>
          <Col xs={1} sm={1} md={1} lg={1} xl={1}>
            Date
          </Col>
        </Row>
        {/* Your transaction list items go here */}
      </div>
    </div>
  );
};

export default AccountBalance;
