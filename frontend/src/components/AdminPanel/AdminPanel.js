import React, { useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
import { AppContext } from "../AppContext";
import { getWalletSelectedAccountByWalletSigner } from "../CUtils";

import { getFromBE, bytesToString, doKeccak256 } from "../CUtils";
import "./AdminPanel.css";

import DetailedCredits from "./DetailedCredits";
import "./DetailedCredits.css";

import Deposit from "../Account/Deposit";
import CreditorTree from "./CreditorTree";
import OfflineBalances from "./OfflineBalances";

function AdminPanel() {
  const { globData } = useContext(AppContext);

  const [error, setError] = useState(null);
  const [serialNumber, setSerialNumber] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Track loading state
  const [fullDC, setFullDC] = useState({ root: "", records: [] });
  const [last10DCRoots, setLast10DCRoots] = useState([]);
  const [isLast10DCVisible, setIsLast10DCVisible] = useState(false);

  const generateRGCD = async (serialNumber_) => {
    const rGCD = await getFromBE("dc/generateRGCD", {
      serialNumber: serialNumber_,
    });
    console.log("generateRGCD info", serialNumber_, rGCD);
  };

  const makeFullRGCD = async () => {
    console.log("makeFullRGCD called with serialNumber:", serialNumber);
    try {
      const rGCD = await getFromBE("dc/makeFullRGCD", { serialNumber });
      console.log("makeFullRGCD response:", rGCD);
      if (rGCD) {
        console.log("Setting fullDC with data:", rGCD.data);
        setFullDC(rGCD.data);
      }
    } catch (error) {
      console.error("Error in makeFullRGCD:", error);
      setError(error.message);
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
    setIsLast10DCVisible(true); // Make container visible when button is clicked

    try {
      let last10DCRoots_ =
        await globData.royalGrowcontractInstance.getLast10DCRoots();
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

      let currentSerialNumber =
        await globData.royalGrowcontractInstance.getDCCurrentSerialNumber();
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
      currentSerialNumber =
        await globData.royalGrowcontractInstance.getDCCurrentSerialNumber();
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
    const tx = await globData.royalGrowcontractInstance.updateCreditsMerkleRoot(
      byte8Data,
      {
        gasLimit: ethers.toBigInt(300000), // Optional: Adjust gas if needed
      }
    );
    const receipt = await tx.wait(); // Wait for transaction confirmation

    // const tx = await globData.royalGrowcontractInstanc e.methods
    //   .updateCreditsMerkleRoot(byte8Data)
    //   .send({ from: selectedAccount.address });

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
        <div className="dc-roots-header">
          <button
            onClick={getLast10DCRoots}
            disabled={isLoading}
            className="update-button history-button dc-history-btn"
            title="Get the last 10 Detailed Credit roots"
          >
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Loading...
              </>
            ) : (
              <>
                <i className="fas fa-history"></i>
                Get Last 10 DC Roots
              </>
            )}
          </button>
          {last10DCRoots.length > 0 && (
            <div
              className="dc-roots-toggle"
              onClick={() => setIsLast10DCVisible(!isLast10DCVisible)}
              title={isLast10DCVisible ? "Hide DC Roots" : "Show DC Roots"}
            >
              <i
                className={`fas ${
                  isLast10DCVisible ? "fa-chevron-up" : "fa-chevron-down"
                }`}
              ></i>
            </div>
          )}
        </div>
        <div
          className={`last10DCContainer ${
            isLast10DCVisible ? "visible" : "hidden"
          }`}
        >
          {last10DCRoots.map((elm) => (
            <span
              key={elm.serialNumber}
              onClick={() => getDCDetail(elm.serialNumber)}
            >
              the DC {elm.serialNumber}: {elm.rootHash}{" "}
            </span>
          ))}
        </div>
      </div>

      <div className="detailed-credits-container">
        {console.log("AdminPanel rendering with fullDC:", {
          fullDC,
          hasRecords: fullDC?.records?.length > 0,
          recordsLength: fullDC?.records?.length,
          records: fullDC?.records,
        })}
        <DetailedCredits fullDC={fullDC} />
      </div>

      <OfflineBalances />

      <div className="button-container">
        <button
          onClick={updateCreditsMerkleRoot}
          disabled={isLoading}
          className="update-button"
          title="Update the merkle root of credit details (runs every 5 minutes)"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Updating...
            </>
          ) : (
            <>
              <i className="fas fa-sync"></i>
              Update Credits Root
            </>
          )}
        </button>
        <button
          style={{ visibility: "hidden" }}
          onClick={makeFullRGCD}
          disabled={isLoading}
          className="print-button"
          title="Generate and print Royal Grow Credit Details"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Generating...
            </>
          ) : (
            <>
              <i className="fas fa-print"></i>
              Generate RGCD Report
            </>
          )}
        </button>
        <input
          style={{ visibility: "hidden" }}
          type="number"
          value={serialNumber}
          onChange={handleChangeSerialNumber}
          placeholder="serialNumber"
        />
      </div>
      <Deposit />
    </div>
  );
}

export default AdminPanel;
