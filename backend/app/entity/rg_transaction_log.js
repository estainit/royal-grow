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

async function getTransactionHistory(address) {
  try {
    const query = `
      SELECT 
        id,
        creditor,
        recipient,
        amount,
        insert_time as timestamp,
        CASE 
          WHEN creditor = $1 THEN 'sent'
          WHEN recipient = $1 THEN 'received'
          ELSE 'unknown'
        END as type,
        CASE 
          WHEN creditor = $1 THEN recipient
          WHEN recipient = $1 THEN creditor
          ELSE 'unknown'
        END as counterparty,
        'completed' as status
      FROM rg_transaction_log
      WHERE creditor = $1 OR recipient = $1
      ORDER BY insert_time DESC
      LIMIT 50;
    `;
    
    const result = await dbPool.query(query, [address.toLowerCase()]);
    return result.rows;
  } catch (err) {
    console.error("Error fetching transaction history:", err);
    throw err;
  }
}

module.exports = {
  insertTxLog,
  getTransactionHistory,
};
