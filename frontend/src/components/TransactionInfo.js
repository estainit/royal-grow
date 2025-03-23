import React, { useState, useEffect } from 'react';
import { JsonRpcProvider } from '@ethersproject/providers';
import { BLOCKCHAIN_PROVIDER_URL } from '../config'; 

const TransactionInfo = () => {
  const [transactionHash, setTransactionHash] = useState('');
  const [transactionInfo, setTransactionInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const provider = new JsonRpcProvider(BLOCKCHAIN_PROVIDER_URL);

  const fetchTransactionInfo = async () => {
    setIsLoading(true);
    try {
      if (!transactionHash) {
        setError('Please enter a transaction hash.');
        return;
      }

      const receipt = await provider.getTransactionReceipt(transactionHash);
      if (receipt) {
        setTransactionInfo({
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          from: receipt.from,
          to: receipt.to,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'Success' : 'Failed',
        });
      } else {
        setError('Transaction not found.');
      }
    } catch (error) {
      console.error('Error fetching transaction info:', error);
      setError('An error occurred while fetching transaction info.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App-header" >
      <h2>Transaction Info</h2>
      <input
        type="text"
        placeholder="Enter transaction hash"
        value={transactionHash}
        onChange={(e) => setTransactionHash(e.target.value)}
        disabled={isLoading} // Disable input while loading
      />
      <button onClick={fetchTransactionInfo} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Get Info'}
      </button>
      {error && <p className="error-message">{error}</p>}
      {transactionInfo && (
        <div>
          <p>Transaction Hash: {transactionInfo.hash}</p>
          <p>Block Number: {transactionInfo.blockNumber}</p>
          <p>From: {transactionInfo.from}</p>
          <p>To: {transactionInfo.to}</p>
          <p>Gas Used: {transactionInfo.gasUsed}</p>
          <p>Status: {transactionInfo.status}</p>
        </div>
      )}
    </div>
  );
};

export default TransactionInfo;
