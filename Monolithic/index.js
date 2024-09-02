const express = require('express');
const path = require('path');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');

const app = express();
const port = 5000;

// Connection string
const dbConfig = {
  driver: 'msnodesqlv8',
  server: '75RBBX3\\SQLEXPRESS',
  database: 'migration',
  user: 'sentha',
  password: 'password',
  options: {
    encrypt: false,
  },
};

app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend')));

async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('Connected to SQL Server successfully!');

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
    console.log('Checked for table existence and created if it did not exist.');
    await pool.close();
  } catch (err) {
    console.error('Error connecting to SQL Server:', err);
  }
}

connectToDatabase();

app.get('/api/data', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query('SELECT * FROM data');
    res.json(result.recordset);
    await pool.close();
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).send('Error fetching data from the database');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
