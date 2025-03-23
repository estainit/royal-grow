import React, { useState, useMemo } from 'react';
import { ethers } from 'ethers';
import './CreditorTree.css';

const CreditorTree = ({ records }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Process records to group by creditor and calculate totals
  const creditorData = useMemo(() => {
    const creditorMap = new Map();
    
    records.forEach(record => {
      const [serialNumber, creditor, amount, salt] = record.clearRecord.split(':');
      const amountNum = parseInt(amount);
      
      if (!creditorMap.has(creditor)) {
        creditorMap.set(creditor, {
          creditor,
          amounts: [],
          total: 0
        });
      }
      
      const creditorInfo = creditorMap.get(creditor);
      creditorInfo.amounts.push(amountNum);
      creditorInfo.total += amountNum;
    });

    return Array.from(creditorMap.values());
  }, [records]);

  // Calculate grand total
  const grandTotal = useMemo(() => {
    return creditorData.reduce((sum, creditor) => sum + creditor.total, 0);
  }, [creditorData]);

  // Format amount to show both ETH and Wei
  const formatAmount = (weiAmount) => {
    const ethAmount = ethers.formatEther(weiAmount.toString());
    return `${ethAmount} ETH (${weiAmount} wei)`;
  };

  // Generate ASCII tree
  const generateTree = () => {
    let tree = '└── Total Credits: ' + formatAmount(grandTotal) + '\n';
    
    creditorData.forEach((creditor, index) => {
      const isLast = index === creditorData.length - 1;
      const prefix = isLast ? '    ' : '│   ';
      
      // Creditor line
      tree += `${isLast ? '└── ' : '├── '}${creditor.creditor.slice(0,6)}...${creditor.creditor.slice(-4)} (Total: ${formatAmount(creditor.total)})\n`;
      
      // Amounts
      creditor.amounts.forEach((amount, amountIndex) => {
        const isLastAmount = amountIndex === creditor.amounts.length - 1;
        const amountPrefix = isLast ? '    ' : '│   ';
        const amountSymbol = isLastAmount ? '└── ' : '├── ';
        
        tree += `${amountPrefix}${amountSymbol}${formatAmount(amount)}\n`;
      });
    });
    
    return tree;
  };

  return (
    <div className="creditor-tree">
      <div className="creditor-tree-header" onClick={() => setIsVisible(!isVisible)}>
        <h2>
          <i className="fas fa-sitemap"></i> Onchain Creditor Tree
        </h2>
        <i className={`fas ${isVisible ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
      </div>
      <div className={`creditor-tree-content ${isVisible ? 'visible' : 'hidden'}`}>
        <pre className="tree-visualization">
          {generateTree()}
        </pre>
      </div>
    </div>
  );
};

export default CreditorTree; 