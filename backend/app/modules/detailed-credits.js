const { breakDown, getRandomInt } = require("../cutils");
const { generate_m, doKeccak256 } = require("../merkle-engine");

const {
  insertToDetailedCredits,
  getRecordsBySerialNumber,
} = require("../entity/rg_detailed_credits");

const {
  insertToObfDetailedCredits,
  getObfRecordsBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated");

const {
  insertToObfDetailedCreditsProfile,
  getRecordsProfileBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated_profile");

async function generateRGCD(serialNumber = 0) {
  const { detailedCredits, obfuscatedDetailedCredits } = await prepareRGCDInfo(
    serialNumber
  );

  // save detailedCredits
  for (const aDetailedCredits of detailedCredits) {
    console.log("aDetailedCredits: ", aDetailedCredits);
    insertToDetailedCredits(
      aDetailedCredits.serialNumber,
      aDetailedCredits.creditor,
      aDetailedCredits.clearRecord,
      aDetailedCredits.amount,
      aDetailedCredits.internalUniqKey,
      aDetailedCredits.handlerHash
    );
  }

  let obfLeaves = obfuscatedDetailedCredits.map((obj) => obj.obfuscatedRecord);
  console.log("obfLeaves ", obfLeaves);
  const { root, proofs, version, levels, leaves } = generate_m(obfLeaves);
  console.log("root: ", root);
  console.log("proofs: ", proofs);
  console.log("version: ", version);
  console.log("levels: ", levels);
  console.log("leaves: ", leaves);

  // save obfDetailedCredits
  let serializedRecords = [];
  for (const aDetailedObfCredits of obfuscatedDetailedCredits) {
    console.log("\n aDetailedObfCredits: ", aDetailedObfCredits);

    const clearLeave = aDetailedObfCredits.obfuscatedRecord;
    serializedRecords.push(clearLeave);
    let proof_hashes = getProofByLeave(proofs, clearLeave);
    console.log("Final Proof: ", proof_hashes);

    // dummy proof tests
    let proved = validateProof(root, clearLeave, proof_hashes, "string");
    console.log("Final proved: ", proved);
    if (!proved) throw new Error("Invalid Merkle prove!");

    insertToObfDetailedCredits(
      aDetailedObfCredits.serialNumber,
      aDetailedObfCredits.creditor,
      aDetailedObfCredits.obfuscatedRecord,
      aDetailedObfCredits.internalUniqKey,
      aDetailedObfCredits.handlerHash,
      aDetailedObfCredits.amount,
      JSON.stringify(proof_hashes)
    );
  }
  serializedRecords = JSON.stringify(serializedRecords);
  insertToObfDetailedCreditsProfile(serialNumber, root, serializedRecords);
  const publicRGCD = await getRecordsProfileBySerialNumber(serialNumber);

  return publicRGCD;
}

async function prepareRGCDInfo(serialNumber = 0) {
  let creditorsSum = await getSumAllCreditors();
  let creditors = await getAllCreditors();
  console.log("creditors", creditors);
  let detailedCredits = [];
  let obfuscatedDetailedCredits = [];
  let recalculatingTotalAmountByCreditor = BigInt(0);
  let recalculatingTotalAmountByChips = BigInt(0);
  for (let aCreditor of creditors) {
    let amount = aCreditor.amount;
    if (typeof amount !== "bigint") {
      amount = BigInt(amount); // Convert to BigInt if necessary
    }
    recalculatingTotalAmountByCreditor += amount;
    console.log("aCreditor", amount);

    let chips = breakDown(amount);
    let chipinx = {};
    for (const aChip of chips) {
      if (!chipinx[aChip]) chipinx[aChip] = 0;
      chipinx[aChip] += 1;
      recalculatingTotalAmountByChips += BigInt(aChip);

      let internalUniqKey = `${serialNumber}:${aCreditor.creditor}:${aChip}:${chipinx[aChip]}`;
      console.log("internalUniqKey; ", internalUniqKey);

      const randomNumber = getRandomInt(10, 100000000);
      let clearRecord = `${serialNumber}:${
        aCreditor.creditor
      }:${aChip}:${doKeccak256(randomNumber)}`;
      const handlerHash = doKeccak256(clearRecord);
      detailedCredits.push({
        serialNumber,
        creditor: aCreditor.creditor,
        clearRecord,
        amount: aChip,
        internalUniqKey,
        handlerHash,
      });
      let obfuscatedRecord = `${serialNumber}:${aChip}:${handlerHash}`;
      obfuscatedDetailedCredits.push({
        serialNumber,
        creditor: aCreditor.creditor,
        internalUniqKey,
        obfuscatedRecord,
        handlerHash,
        amount: aChip,
      });
    }
  }
  console.log(
    "recalculatingTotalAmountByCreditor: ",
    recalculatingTotalAmountByCreditor
  );
  console.log(
    "recalculatingTotalAmountByChips: ",
    recalculatingTotalAmountByChips
  );
  console.log("detailedCredits: ", detailedCredits.length, detailedCredits);
  console.log(
    "obfuscatedDetailedCredits: ",
    obfuscatedDetailedCredits.length,
    obfuscatedDetailedCredits
  );

  if (recalculatingTotalAmountByCreditor != recalculatingTotalAmountByChips)
    throw new Error("Invalid Chips 1!");

  if (creditorsSum != recalculatingTotalAmountByChips)
    throw new Error("Invalid Chips 2!");

  //let obfuscatedRecords = obfuscatedDetailedCredits.map(    (innerArray) => innerArray[1]);
  let obfuscatedRecords = obfuscatedDetailedCredits.map(
    (obj) => obj.obfuscatedRecord
  );
  obfuscatedRecords = obfuscatedRecords.sort(); // create more obfuscativity
  console.log("obfuscatedRecords: ", obfuscatedRecords);
  //const { root, proofs, version, levels, leaves } =    generate_m(obfuscatedRecords);

  return {
    detailedCredits,
    obfuscatedDetailedCredits,
  };
}

async function printRGCD(serialNumber = 0) {
  let records = {};
  const clearRecordsBySerialNumber = await getRecordsBySerialNumber(
    serialNumber
  );
  for (const aRec of clearRecordsBySerialNumber) {
    records[aRec.handler_hash] = { 
        handlerHash: aRec.handler_hash, 
        creditor: aRec.creditor, 
        amount: aRec.amount, 
        clearRecord: aRec.record_line, 
        uniqKey: aRec.internal_uniq_key, 
    };
  }
  const obfRecordsBySerialNumber = await getObfRecordsBySerialNumber(
    serialNumber
  );
  const publicRGCD = await getRecordsProfileBySerialNumber(serialNumber);

  return {
    root: publicRGCD.root_hash,
    records
  };
}

module.exports = {
  generateRGCD,
  printRGCD,
};
