const sql = require("mssql");
require("dotenv").config();

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT, 10),
  options: {
    encrypt: true, // for Azure, set to false for local SQL Server
    trustServerCertificate: true, // change to true for local dev / self-signed certs
  },
};

async function connectDB() {
  try {
    await sql.connect(sqlConfig);
    console.log("Connected to SQL Server");
  } catch (err) {
    console.error("Database connection failed: ", err);
  }
}

module.exports = { sql, connectDB };
