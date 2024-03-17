const dbPool = require("../db-pool");

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
        SELECT id, amount FROM rg_balances WHERE creditor = $1;
      `;
    const values = [creditor];
    const result = await dbPool.query(query, values);
    if (result.rows.length > 0) {
      const resu = {
        rowId: result.rows[0].id,
        currentBalance: parseInt(result.rows[0].amount),
      };
      console.log("+++++++ resu", resu);
      return resu;
    }

    return {
      id: null,
      currentBalance: 0,
    };
  } catch (err) {
    console.error("Error get RGCredit:", err);
    //throw err; // Re-throw the error for handling in the calling code
    return {
      id: null,
      currentBalance: 0,
    };
  }
}

async function upsertCredit(creditor, amount) {
  try {
    const { rowId, _ } = await getRGCredit(creditor);
    if (rowId) {
      updateCredit(creditor, amount);
    } else {
      insertCredit(creditor, amount);
    }

    // const query = `
    //       INSERT INTO
    //       rg_balances (creditor, amount)
    //       VALUES ($1, $2)
    //       ON CONFLICT (id)
    //       DO UPDATE SET amount = EXCLUDED.amount;
    //     `;
    // const values = [creditor, amount];
    // console.log("Upserting payment values", values);
    // await dbPool.query(query, values);
    return true;
  } catch (err) {
    console.error("Error upserting payment:", err);
    return false;
  }
}

async function updateCredit(creditor, amount) {
  try {
    const query = `
          UPDATE rg_balances SET amount=$1, update_time=$2 WHERE creditor= $3;
        `;
    const update_time = new Date().toISOString();
    const values = [amount, update_time, creditor];
    console.log("Updating credit amount", values);
    await dbPool.query(query, values);
    return true;
  } catch (err) {
    console.error("Error in pdating credit amount:", creditor, amount, err);
    return false;
  }
  return await getPaymentByUniqueId(uniqueId);
}

async function insertCredit(creditor, amount) {
  try {
    const query = `
          INSERT INTO rg_balances (creditor, amount, update_time)
          VALUES ($1, $2, $3)
          RETURNING *;
        `;
    const payment_time = new Date().toISOString();
    const values = [creditor, amount, payment_time];
    console.log("inserting payment values", values);
    await dbPool.query(query, values);
    return true;
  } catch (err) {
    console.error("Error inserting payment:", err);
    return false;
  }
}

module.exports = {
  getRGCredit,
  getAllCreditors,
  getSumAllCreditors,
  upsertCredit,
  insertCredit,
  updateCredit,
};
