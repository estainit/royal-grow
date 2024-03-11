const { Pool } = require('pg');
const config = require('./db-config'); 

const pool = new Pool(config);

async function query(text, values) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, values);
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  query,
};
