const dbPool = require("../db-pool");

const { breakDown, getRandomInt } = require("../cutils");
const { generate_m, doKeccak256 } = require("../merkle-engine");

async function getAllCreditors() {
  try {
    const query = `
        SELECT creditor, amount FROM rg_balances;
      `;
    const values = [];
    const result = await dbPool.query(query, values);
    if (result.rows.length > 0) return result.rows;
    return 0;
  } catch (err) {
    console.error("Error get AllCreditors:", err);
    //throw err; // Re-throw the error for handling in the calling code
    return 0;
  }
}

async function getSumAllCreditors() {
  try {
    const query = `
        SELECT SUM(amount) FROM rg_balances;
      `;
    const values = [];
    const result = await dbPool.query(query, values);
    if (result.rows.length > 0) return result.rows[0].sum;
    return 0;
  } catch (err) {
    console.error("Error get SumAllCreditors:", err);
    //throw err; // Re-throw the error for handling in the calling code
    return 0;
  }
}


async function getRGCredit(creditor) {
  try {
    const query = `
        SELECT amount FROM rg_balances WHERE creditor = $1;
      `;
    const values = [creditor];
    const result = await dbPool.query(query, values);
    if (result.rows.length > 0) return result.rows[0].amount;
    return 0;
  } catch (err) {
    console.error("Error get RGCredit:", err);
    //throw err; // Re-throw the error for handling in the calling code
    return 0;
  }
}

async function upsertCredit(payer, amount, uniqueId) {
  //    try {
  //      const query = `
  //        INSERT INTO rg_balances (payer, amount, payment_id, payment_time)
  //        VALUES ($1, $2, $3, $4)
  //        RETURNING *;
  //      `;
  //      const payment_time = new Date().toISOString(); // Returns an ISO 8601 formatted string
  //      const values = [payer, amount, uniqueId, payment_time];
  //      console.log("inserting payment values", values);
  //      const result = await dbPool.query(query, values);
  //    } catch (err) {
  //      console.error("Error inserting payment:", err);
  //    }
  //    return await getPaymentByUniqueId(uniqueId);
}

async function insertCredit(payer, amount, uniqueId) {
  //    try {
  //      const query = `
  //        INSERT INTO rg_balances (payer, amount, payment_id, payment_time)
  //        VALUES ($1, $2, $3, $4)
  //        RETURNING *;
  //      `;
  //      const payment_time = new Date().toISOString(); // Returns an ISO 8601 formatted string
  //      const values = [payer, amount, uniqueId, payment_time];
  //      console.log("inserting payment values", values);
  //      const result = await dbPool.query(query, values);
  //    } catch (err) {
  //      console.error("Error inserting payment:", err);
  //    }
  //    return await getPaymentByUniqueId(uniqueId);
}

module.exports = {
  getRGCredit,
  getAllCreditors,
  getSumAllCreditors,
  insertCredit,
  upsertCredit,
};
