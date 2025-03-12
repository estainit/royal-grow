import React, { useState } from 'react';
import { ethers } from 'ethers';
import { postToBE } from '../CUtils';
import './ActualBalances.css';

const ActualBalances = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState([]);
  const [totalBalance, setTotalBalance] = useState('0');

  const fetchActualBalances = async () => {
    try {
      setIsLoading(true);
      const response = await postToBE('payment/getActualBalances');
      if (response && response.stat) {
        setBalances(response.balances);
        setTotalBalance(response.total);
      } else {
        console.error('Failed to fetch balances:', response?.msg);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (weiAmount) => {
    const ethAmount = ethers.formatEther(weiAmount.toString());
    return `${ethAmount} ETH (${weiAmount} wei)`;
  };

  return (
    <div className="actual-balances">
      <div className="actual-balances-header" onClick={() => {
        if (!isVisible) {
          fetchActualBalances();
        }
        setIsVisible(!isVisible);
      }}>
        <h2>
          <i className="fas fa-balance-scale"></i> Actual Balances
        </h2>
        <i className={`fas ${isVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
      </div>
      <div className={`actual-balances-content ${isVisible ? 'visible' : 'hidden'}`}>
        {isLoading ? (
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Loading balances...</span>
          </div>
        ) : (
          <>
            <div className="total-balance">
              <h3>Total Balance</h3>
              <p>{formatAmount(totalBalance)}</p>
            </div>
            <div className="balances-table">
              <table>
                <thead>
                  <tr>
                    <th>Creditor</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((balance, index) => (
                    <tr key={index}>
                      <td>{balance.creditor.slice(0,6)}...{balance.creditor.slice(-4)}</td>
                      <td>{formatAmount(balance.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActualBalances; 