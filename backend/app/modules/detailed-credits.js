const { breakDown, getRandomInt } = require("../cutils");
const {
  generate_m,
  doKeccak256,
  getProofByLeave,
  validateProof,
} = require("../merkle-engine");

const {
  insertToDetailedCredits,
  getRecordsBySerialNumber,
} = require("../entity/rg_detailed_credits");

const {
  getSumAllCreditors,
  getAllCreditors,
} = require("../entity/rg_balances");

const {
  insertToObfDetailedCredits,
  getObfRecordsBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated");

const {
  insertToObfDetailedCreditsProfile,
  getRecordsProfileBySerialNumber,
} = require("../entity/rg_detailed_credits_obfuscated_profile");
const { getDateStr } = require("../cutils");

async function generateRGCD(serialNumber = 0) {
  const { detailedCredits, obfuscatedDetailedCredits } = await prepareRGCDInfo(
    serialNumber
  );

  // save detailedCredits
  for (const aDetailedCredits of detailedCredits) {
    console.log("aDetailedCredits: ", aDetailedCredits);
    await insertToDetailedCredits(
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

  const docInfoLeaves = [serialNumber, getDateStr()];
  const lotteryTicketsLeaves = [];
  const lotteryRevealTicketsLeaves = [];
  const lotteryOracleLeaves = [];
  const crowdFundingLeaves = [];

  const finalMerkleLeaves = [
    ...docInfoLeaves,
    ...obfLeaves,
    ...lotteryTicketsLeaves,
    ...lotteryRevealTicketsLeaves,
    ...lotteryOracleLeaves,
    ...crowdFundingLeaves,
  ];

  const { root, proofs, version, levels, leaves } =
    generate_m(finalMerkleLeaves);
  console.log("root: ", root);
  console.log("proofs: ", proofs);
  console.log("version: ", version);
  console.log("levels: ", levels);
  console.log("leaves: ", leaves);

  // save obfDetailedCredits
  // let obfLeaves2 = [];
  for (const aDetailedObfCredits of obfuscatedDetailedCredits) {
    console.log("\n aDetailedObfCredits: ", aDetailedObfCredits);

    const obfLeave = aDetailedObfCredits.obfuscatedRecord;
    // obfLeaves2.push(obfLeave);
    let proofsArray = getProofByLeave(proofs, obfLeave);
    console.log("Final Proof: ", proofsArray);

    // dummy proof tests
    let proved = validateProof(root, obfLeave, proofsArray, "string");
    console.log("Final proved: ", proved);
    if (!proved) throw new Error("Invalid Merkle prove!");

    await insertToObfDetailedCredits(
      aDetailedObfCredits.serialNumber,
      aDetailedObfCredits.creditor,
      aDetailedObfCredits.obfuscatedRecord,
      aDetailedObfCredits.internalUniqKey,
      aDetailedObfCredits.handlerHash,
      aDetailedObfCredits.amount,
      customSerializeProofs(proofsArray)
    );
  }
  let serializedRecords = JSON.stringify(finalMerkleLeaves);
  let serialNumberProofsArray = getProofByLeave(proofs, docInfoLeaves[0]);
  let creationDateProofsArray = getProofByLeave(proofs, docInfoLeaves[1]);
  insertToObfDetailedCreditsProfile(
    serialNumber,
    root,
    serializedRecords,
    JSON.stringify({ serialNumberProofsArray, creationDateProofsArray })
  );
  const publicRGCD = await getRecordsProfileBySerialNumber(serialNumber);

  return publicRGCD;
}

function customSerializeProofs(proofs) {
  let out = "";
  for (const aProof of proofs) out += "," + aProof;
  return out.substring(1);
}

async function prepareRGCDInfo(serialNumber = 0) {
  let creditorsSum = await getSumAllCreditors();
  if (!creditorsSum) creditorsSum = 0;
  console.log("creditors Sum", creditorsSum);
  let creditors = await getAllCreditors();
  console.log("creditors", creditors);
  let detailedCredits = [];
  let obfuscatedDetailedCredits = [];
  let recalculatingTotalAmountByCreditor = BigInt(0);
  let recalculatingTotalAmountByChips = BigInt(0);
  if (creditors)
    for (let aCreditor of creditors) {
      let amount = aCreditor.amount;
      if (typeof amount !== "bigint") {
        amount = BigInt(amount); // Convert to BigInt if necessary
      }
      recalculatingTotalAmountByCreditor += amount;
      console.log("aCreditor", amount);

      let chips = breakDown(amount);
      let chipInx = {};
      for (const aChip of chips) {
        if (!chipInx[aChip]) chipInx[aChip] = 0;
        chipInx[aChip] += 1;
        recalculatingTotalAmountByChips += BigInt(aChip);

        let internalUniqKey = `${serialNumber}:${aCreditor.creditor}:${aChip}:${chipInx[aChip]}`;
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
    "recalculated Total Amount By Creditor: ",
    recalculatingTotalAmountByCreditor
  );
  console.log(
    "recalculated Total Amount By Chips: ",
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

  return {
    detailedCredits,
    obfuscatedDetailedCredits,
  };
}

async function makeFullRGCD(serialNumber, account = null) {
  let records = {};
  console.log("makeFullRGCD: ", serialNumber, account);
  const clearRecordsBySerialNumber = await getRecordsBySerialNumber(
    serialNumber,
    account
  );
  for (const aRec of clearRecordsBySerialNumber) {
    records[aRec.handler_hash] = {
      handlerHash: aRec.handler_hash,
      creditor: aRec.creditor,
      amount: aRec.amount,
      clearRecord: aRec.clear_record,
      uniqKey: aRec.internal_uniq_key,
    };
  }

  const obfRecordsBySerialNumber = await getObfRecordsBySerialNumber(
    serialNumber,
    account
  );
  for (const aRec of obfRecordsBySerialNumber) {
    let prvRec = records[aRec.handler_hash];
    prvRec["obfRecord"] = aRec.obf_record;
    prvRec["proofs"] = aRec.proofs;
    records[aRec.handler_hash] = prvRec;
  }

  let arrayRecords = [];
  for (const key of Object.keys(records)) {
    arrayRecords.push(records[key]);
  }

  const publicRGCD = await getRecordsProfileBySerialNumber(serialNumber);
  if (!publicRGCD)
    return {
      serialNumber: 0,
      root: "No profile for serial number " + serialNumber,
      records: [],
    };
  return {
    serialNumber,
    root: publicRGCD.root_hash,
    records: arrayRecords,
  };
}

module.exports = {
  generateRGCD,
  makeFullRGCD,
};
