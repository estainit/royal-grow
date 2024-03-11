import React, { useContext, useState } from "react";
import { AppContext } from "./AppContext";
import { getWalletSelectedAccount } from "./CUtils";

function Footer() {
  const { globData } = useContext(AppContext);

  const [userBalance, setUserBalance] = useState(0);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const fetchUserBalance = async () => {
    if (!globData) return;

    const selectedAccount = await getWalletSelectedAccount(globData);

    setIsLoading(true); // Set loading state to true
    try {
      const balance = await globData.royalGrowcontractInstance.methods
        .getCreditorBalance()
        .call({ from: selectedAccount });
      const balanceInEther = globData.web3.utils.fromWei(balance.toString(), "ether");
      setUserBalance(balanceInEther);

    } catch (error) {
      console.error("Error fetching user Balance:", error);
      setError(error.message); 
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <footer>
      {error && <p className="error-message">{error}</p>}
      {isLoading ? (
        <p>Loading balance...</p>
      ) : (
        userBalance !== null && (
          <div>
            <p>Your balance: {userBalance} ETH = 5.00$ </p>
            <button onClick={fetchUserBalance} disabled={isLoading}>
              Refresh Balance
            </button>
          </div>
        )
      )}
    </footer>
  );
}

export default Footer;
