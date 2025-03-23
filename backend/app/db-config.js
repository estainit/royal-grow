module.exports = {
  user: "root",
  host: "db",
  database: "root",
  password: "root",
  port: 5433, // Default PostgreSQL port
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
};
