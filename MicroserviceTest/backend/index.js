const express = require("express");
const path = require("path");
const sql = require("mssql");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Connection string using environment variables
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  options: {
    encrypt: true,
    trustServerCertificate: true,
    instancename: process.env.DB_INSTANCE_NAME || "SQLEXPRESS",
  },
};

app.use(cors());
app.use(express.json()); // To parse JSON bodies

// Function to connect to the database and ensure the table exists
async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log("Connected to SQL Server successfully!");

    const createTableQuery = `
      IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'data')
      BEGIN
        CREATE TABLE data (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(50),
          age INT
        );
        PRINT 'Table created.';
      END
      ELSE
      BEGIN
        PRINT 'Table already exists.';
      END
    `;

    await pool.request().query(createTableQuery);
    console.log("Checked for table existence and created if it did not exist.");
    await pool.close();
  } catch (err) {
    console.error("Error connecting to SQL Server:", err);
    process.exit(1); 
  }
}

connectToDatabase();

// Endpoint to get data from the database
app.get("/api/data", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query("SELECT * FROM data");
    res.json(result.recordset);
    await pool.close();
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).send("Error fetching data from the database");
  }
});

// Endpoint to insert data into the database
app.post("/insert", async (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).send("Name and age are required");
  }

  try {
    const pool = await sql.connect(dbConfig);
    const insertQuery = "INSERT INTO data (name, age) VALUES (@name, @age)";
    await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("age", sql.Int, age)
      .query(insertQuery);
    res.status(201).send("Data inserted successfully");
    await pool.close();
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).send("Error inserting data into the database");
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://:${port}`);
});
