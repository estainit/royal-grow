const dbPool = require("../db-pool");

async function insertToObfDetailedCreditsProfile(
  serialNumber,
  rootHash,
  serializedRecords,
  serializedMetaInfo
) {
  try {
    const query = `
        INSERT INTO rg_detailed_credits_obfuscated_profile 
        (serial_number, root_hash, records_str, meta_str)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
    const values = [serialNumber, rootHash, serializedRecords, serializedMetaInfo];
    console.log("inserting creditor obf detailed: ", values);
    const result = await dbPool.query(query, values);
  } catch (err) {
    console.error("Error insertToObfDetailedCreditsProfile:", err);
  }
}

async function getRecordsProfileBySerialNumber(serialNumber) {
  try {
    const query = `
        SELECT * FROM rg_detailed_credits_obfuscated_profile WHERE serial_number = $1;
      `;
    const values = [serialNumber];
    const result = await dbPool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error("Error get RecordsProfileBySerialNumber:", err);
    throw err; // Re-throw the error for handling in the calling code
  }
}

module.exports = {
  insertToObfDetailedCreditsProfile,
  getRecordsProfileBySerialNumber,
};
