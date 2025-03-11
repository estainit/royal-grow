import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "../AppContext";
import { getWalletSelectedAccountByWalletSigner } from "../CUtils";

import { getFromBE, bytesToString, doKeccak256 } from "../CUtils";
import "./AdminPanel.css";

import DetailedCredits from "./DetailedCredits";
import "./DetailedCredits.css";

function AdminPanel() {
  const { globData } = useContext(AppContext);

  const [error, setError] = useState(null);
  const [serialNumber, setSerialNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [fullDC, setFullDC] = useState({ root: "", records: [] });
  const [last10DCRoots, setLast10DCRoots] = useState([]);

  const generateRGCD = async (serialNumber_) => {
    const rGCD = await getFromBE("dc/generateRGCD", {
      serialNumber: serialNumber_,
    });
    console.log("generateRGCD info", serialNumber_, rGCD);
  };

  const makeFullRGCD = async () => {
    console.log("makeFullRGCD called with serialNumber:", serialNumber);
    const rGCD = await getFromBE("dc/makeFullRGCD", { serialNumber });
    console.log("makeFullRGCD response:", rGCD);
    if (rGCD) {
      console.log("Setting fullDC with data:", rGCD.data);
      setFullDC(rGCD.data);
    }
  };

  const getDCDetail = async (theSerialNumber) => {
    console.log("getDCDetail called with serialNumber:", theSerialNumber);
    setSerialNumber(theSerialNumber);
    await makeFullRGCD();
  };

  const getLast10DCRoots = async () => {
    if (!globData) return;
    setIsLoading(true);
    setError(null); // Reset error state

    try {
      let last10DCRoots_ = await globData.royalGrowcontractInstance.methods
        .getLast10DCRoots()
        .call();
      let localElems = [];
      console.log("last10DCRoots_", last10DCRoots_);
      
      for (const inx of Object.keys(last10DCRoots_).sort()) {
        if (last10DCRoots_[inx].serialNumber.toString() !== "0") {
          localElems.push({
            serialNumber: last10DCRoots_[inx].serialNumber.toString(),
            rootHash: bytesToString(last10DCRoots_[inx].rootHash),
          });
        }
      }
      
      console.log("Processed DC roots:", localElems);
      setLast10DCRoots(localElems);

      let currentSerialNumber = await globData.royalGrowcontractInstance.methods
        .getDCCurrentSerialNumber()
        .call();
      console.log("current Serial Number=", currentSerialNumber);
    } catch (error) {
      console.error("Error fetching last 10 DC Roots:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateCreditsMerkleRoot = async () => {
    if (!globData) return;
    setIsLoading(true);

    const selectedAccount = await getWalletSelectedAccountByWalletSigner(
      globData
    );

    // retrieve the current serial number of DC
    let currentSerialNumber;
    let futureSerialNumber;
    try {
      currentSerialNumber = await globData.royalGrowcontractInstance.methods
        .getDCCurrentSerialNumber()
        .call();
      console.log("currentSerialNumber=", currentSerialNumber);
      futureSerialNumber = currentSerialNumber + 1n;
      console.log("futureSerialNumber=", futureSerialNumber);
      setSerialNumber(currentSerialNumber);
    } catch (error) {
      console.error("Error fetching user Balance:", error);
      setError(error.message);
    } finally {
    }

    // generate new Detailed Credits Document
    await generateRGCD(futureSerialNumber);

    // extract the merkle root
    const obfProfile = await getFromBE("dc/getRecordsProfileBySerialNumber", {
      serialNumber: futureSerialNumber,
    });
    console.log("obfProfile: ", futureSerialNumber, obfProfile.data);

    const dcMerkleRoot = obfProfile.data.root_hash;
    console.log("dcMerkleRoot:", dcMerkleRoot);
    const encoder = new TextEncoder();
    const byte8Data = encoder.encode(dcMerkleRoot);
    console.log("byte8Data:", byte8Data);

    // Call the smart contract method
    const tx = await globData.royalGrowcontractInstance.methods
      .updateCreditsMerkleRoot(byte8Data)
      .send({ from: selectedAccount.address });

    console.log("update Credits Merkle Root:", tx);

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
    <div className="adminPanelContainer">
      <div className="getLast10DCRoots">
        <button onClick={getLast10DCRoots} disabled={isLoading}>
          {isLoading ? "Loading..." : "get last 10 DC Roots"}
        </button>
        <div className="last10DCContainer">
          {last10DCRoots.map((elm) => (
            <span
              key={elm.serialNumber}
              onClick={() => getDCDetail(elm.serialNumber)}
            >
              {elm.serialNumber}: {elm.rootHash}{" "}
            </span>
          ))}
        </div>
      </div>

      <div className="button-container">
        <button onClick={updateCreditsMerkleRoot} disabled={isLoading}>
          {isLoading
            ? "Loading..."
            : "Update Credit Details Merkle Root (Every 5 minute)"}
        </button>
        <button onClick={makeFullRGCD} disabled={isLoading}>
          {isLoading ? "Loading..." : "Print RGCD"}
        </button>
        <input
          type="number"
          value={serialNumber}
          onChange={handleChangeSerialNumber}
          placeholder="serialNumber"
        />
      </div>

      <div className="detailed-credits-container">
        {console.log("AdminPanel rendering with fullDC:", {
          fullDC,
          hasRecords: fullDC?.records?.length > 0,
          recordsLength: fullDC?.records?.length,
          records: fullDC?.records
        })}
        <DetailedCredits fullDC={fullDC} />
      </div>
    </div>
  );
}

export default AdminPanel;
