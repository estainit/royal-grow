const dbPool = require("../db-pool");

async function insertToObfDetailedCredits(
  serialNumber,
  creditor,
  obfRecordLine,
  internalUniqKey,
  handlerHash,
  amount,
  proofs
) {
  try {
    const query = `
        INSERT INTO rg_detailed_credits_obfuscated 
        (serial_number, creditor, obf_record, 
            internal_uniq_key, handler_hash, amount, proofs)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *;
      `;
    const values = [
      serialNumber,
      creditor,
      obfRecordLine,
      internalUniqKey,
      handlerHash,
      amount,
      proofs,
    ];
    console.log("inserting creditor obf detailed: ", values);
    const result = await dbPool.query(query, values);
  } catch (err) {
    console.error("Error insert ToObfDetailedCredits:", err);
  }
}

async function getObfRecordsBySerialNumber(serialNumber, creditor = null) {
  try {
    let query = `
        SELECT * FROM rg_detailed_credits_obfuscated WHERE serial_number = $1 ORDER BY amount DESC;
      `;
    let values = [serialNumber];
    if (creditor) {
      query = `
        SELECT * FROM rg_detailed_credits_obfuscated WHERE serial_number = $1 AND creditor= $2 ORDER BY amount DESC;
      `;
      values = [serialNumber, creditor];
    }
    const result = await dbPool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error("Error get ObfRecordsBySerialNumber:", err);
    throw err; // Re-throw the error for handling in the calling code
  }
}

module.exports = {
  insertToObfDetailedCredits,
  getObfRecordsBySerialNumber,
};
