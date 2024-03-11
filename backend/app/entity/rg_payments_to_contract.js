const dbPool = require("../db-pool");

async function payToContract(sender, amount, uniqueId) {
  const ifExist = await doesExist(uniqueId);
  if (ifExist) {
    return {};
  }
  return await insertPayment(sender, amount, uniqueId);
}

async function insertPayment(payer, amount, uniqueId) {
  try {
    const query = `
      INSERT INTO rg_payments_to_contract (payer, amount, payment_id, payment_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const payment_time = new Date().toISOString(); // Returns an ISO 8601 formatted string
    const values = [payer, amount, uniqueId, payment_time];
    const result = await dbPool.query(query, values);
  } catch (err) {
    console.error("Error inserting payment:", err);
  }
  return await getPaymentByUniqueId(uniqueId);
}

async function getPaymentByUniqueId(uniqueId) {
  try {
    const query = `
      SELECT * FROM rg_payments_to_contract WHERE payment_id = $1;
    `;
    const values = [uniqueId];
    const result = await dbPool.query(query, values);
    return result;
  } catch (err) {
    console.error("Error get PaymentByUniqueId:", err);
    throw err; // Re-throw the error for handling in the calling code
  }
}

async function getTotalPaymentsToContract(payer) {
  try {
    const query = `
      SELECT SUM(amount) FROM rg_payments_to_contract WHERE payer = $1 GROUP BY payer;
    `;
    const values = [payer];
    const result = await dbPool.query(query, values);
    if (result.rows.length > 0) return result.rows[0].sum;
    return 0;
  } catch (err) {
    console.error("Error get TotalPaymentsToContract:", err);
    //throw err; // Re-throw the error for handling in the calling code
    return null;
  }
}

async function doesExist(uniqueId) {
  const payment = await getPaymentByUniqueId(uniqueId);
  const ifExist = payment.rowCount > 0;
  console.log("doesExist ", uniqueId, ifExist);
  return ifExist;
}

module.exports = {
  payToContract,
  getPaymentByUniqueId,
  getTotalPaymentsToContract,
};
