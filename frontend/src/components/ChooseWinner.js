import React, { useContext, useState } from "react";
import { AppContext } from "./AppContext";
import { getWalletSelectedAccountByWalletSigner } from "./CUtils";

const ChooseWinner = ({ contractAddress }) => {
  const { globData } = useContext(AppContext);

  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to call contract.choseWinner() and retrieve the winner
  const callChooseWinner = async () => {
    setIsLoading(true);
    try {
      const selectedAccount = await getWalletSelectedAccountByWalletSigner(globData);

      const tx = await globData.royalGrowcontractInstance.methods
        .getDepositsBalance()
        .send({ from: selectedAccount.address }); // Replace with your account address
      console.log("...........tx: ", tx);
      const receipt = await tx.wait();
      // Parse winner address from transaction events (assuming an event is emitted with winner details)
      const winnerAddress = parseWinnerAddressFromEvents(receipt.events); // Implement parseWinnerAddressFromEvents
      setWinner(winnerAddress);
    } catch (error) {
      console.error("Error calling choseWinner:", error);
      // Handle error appropriately (e.g., display error message)
    } finally {
      setIsLoading(false);
    }
  };

  // Implement a function to parse the winner address from transaction events (replace placeholder)
  const parseWinnerAddressFromEvents = (events) => {
    // Iterate through events and find the relevant event (assuming an event is emitted with winner details)
    // Extract the winner address from the event data
    // Return the winner address
    return "Winner parsing logic not implemented"; // Placeholder
  };

  return (
    <div>
      <h2>Choose Winner</h2>
      {isLoading ? (
        <p>Choosing winner...</p>
      ) : winner !== null ? (
        <p>Winner: {winner}</p>
      ) : (
        <p>No winner chosen yet.</p>
      )}
      <button onClick={callChooseWinner} disabled={isLoading}>
        Choose Winner
      </button>
    </div>
  );
};

export default ChooseWinner;
