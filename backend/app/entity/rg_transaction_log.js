const dbPool = require("../db-pool");

async function insertTxLog(
  creditor,
  recipient,
  amount,
  request,
  request_signature
) {
  try {
    const query = `
            INSERT INTO rg_transaction_log 
            (creditor, recipient, amount, request, request_signature, insert_time)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
          `;
    const payment_time = new Date().toISOString();
    const values = [
      creditor,
      recipient,
      amount,
      request,
      request_signature,
      payment_time,
    ];
    console.log("inserting ttx log values", values);
    await dbPool.query(query, values);
    return true;
  } catch (err) {
    console.error("Error inserting payment:", err);
    return false;
  }
}

module.exports = {
  insertTxLog,
};
