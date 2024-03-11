const dbPool = require("../db-pool");

async function insertToDetailedCredits(
  serialNumber,
  creditor,
  recordLine,
  amount,
  internalUniqKey,
  handlerHash
) {
  try {
    const query = `
        INSERT INTO rg_detailed_credits (serial_number, creditor, record_line, 
          internal_uniq_key,
          handler_hash, amount)
        VALUES ($1, $2, $3, $4,$5,$6)
        RETURNING *;
      `;
    const values = [
      serialNumber,
      creditor,
      recordLine,
      internalUniqKey,
      handlerHash,
      amount,
    ];
    console.log("inserting creditor clear detailed: ", values);
    const result = await dbPool.query(query, values);
  } catch (err) {
    console.error("Error insert ToDetailedCredits:", err);
  }
}

async function getRecordsBySerialNumber(serialNumber) {
  try {
    const query = `
      SELECT * FROM rg_detailed_credits WHERE serial_number = $1 ORDER BY amount DESC;
    `;
    const values = [serialNumber];
    const result = await dbPool.query(query, values);
    return result.rows;
  } catch (err) {
    console.error("Error get ObfRecordsBySerialNumber:", err);
    throw err; // Re-throw the error for handling in the calling code
  }
}

module.exports = {
  insertToDetailedCredits,
  getRecordsBySerialNumber
};
