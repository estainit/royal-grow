const dbPool = require("../db-pool");

const { getDateStr } = require("../cutils");

async function logWithdraw(
  withdrawer,
  amount,
  withdrawMsg,
  signature,
  timestamp
) {
  try {
    const query = `
            INSERT INTO rg_withdraw_logs 
            (withdrawer, amount, the_msg, the_signature, the_timestamp)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *;
          `;
    const values = [
      withdrawer,
      amount,
      withdrawMsg,
      signature,
      getDateStr(parseInt(timestamp), true),
    ];
    console.log("inserting (timestamp)", (timestamp));
    console.log("inserting parseInt(timestamp)", parseInt(timestamp));
    console.log("inserting withdraw log values", values);
    await dbPool.query(query, values);
    return true;
  } catch (err) {
    console.error("Error inserting withdraw log:", err);
    return false;
  }
}

module.exports = {
  logWithdraw,
};
