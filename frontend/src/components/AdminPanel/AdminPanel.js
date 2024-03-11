import React, { useContext, useState } from "react";
import { AppContext } from "../AppContext";
import { getWalletSelectedAccount } from "../CUtils";
import { keccak256 } from "keccak256";

import { getFromBE } from "../CUtils";

import "./AdminPanel.css";

function AdminPanel() {
  const { globData } = useContext(AppContext);

  const [error, setError] = useState(null);
  const [serialNumber, setSerialNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  const generateRGCD = async () => {
    const rGCD = await getFromBE("dc/generateRGCD", { serialNumber});
    console.log("generateRGCD info", rGCD);
  };

  const printRGCD = async () => {
    const rGCD = await getFromBE("dc/printRGCD", { serialNumber});
    console.log("printRGCD info", rGCD);
  };

  const updateCreditsMerkleRoot = async () => {
    if (!globData) return;

    // calculate the merkle root
    const dataToHash = "This is some data to hash";
    const hashedData = keccak256(dataToHash);
    console.log("Keccak-256 hash:", hashedData);

    const selectedAccount = await getWalletSelectedAccount(globData);

    setIsLoading(true); // Set loading state to true
    try {
    } catch (error) {
      console.error("Error Update Credit Merkle Root:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeSerialNumber = (event) => {
    setSerialNumber(event.target.value);
  };

  return (
<div className="button-container">
  <button onClick={updateCreditsMerkleRoot} disabled={isLoading}>
    {isLoading ? "Loading..." : "Update Credit Merkle Root (Every 5 minute)"}
  </button>
  <button onClick={generateRGCD} disabled={isLoading}>
    {isLoading ? "Loading..." : "Generate RGCD"}
  </button>
  <button onClick={printRGCD} disabled={isLoading}>
    {isLoading ? "Loading..." : "Print RGCD"}
  </button>
  <input
    type="number"
    value={serialNumber}
    onChange={handleChangeSerialNumber}
    placeholder="serialNumber"
  />
</div>
  );
}

export default AdminPanel;
