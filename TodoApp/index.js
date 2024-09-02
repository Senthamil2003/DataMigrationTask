const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql, connectDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 6000;
const JWT_SECRET = process.env.JWT_SECRET;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to SQL Server and create tables if they do not exist
connectDB()
  .then(() => {
    createTablesIfNotExist();
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });

// Function to create tables if they don't exist
async function createTablesIfNotExist() {
  try {
    await sql.query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Todos' and xtype='U')
      CREATE TABLE Todos (
        id INT PRIMARY KEY IDENTITY(1,1),
        title NVARCHAR(255) NOT NULL,
        username NVARCHAR(255) NOT NULL,
        description NVARCHAR(500),
        targetDate DATE,
        status BIT
      );
      
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
      CREATE TABLE Users (
        id INT PRIMARY KEY IDENTITY(1,1),
        firstName NVARCHAR(255) NOT NULL,
        lastName NVARCHAR(255) NOT NULL,
        username NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL
      );
    `);
    console.log("Tables checked/created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}

function authenticateToken(req, res, next) {
  // Extract the token from the Authorization header
  const authHeader = req.headers["authorization"];

  if (!authHeader) return res.status(401).send("Access Denied");

  const token = authHeader.split(" ")[1]; // Extract the token from "Bearer <token>"

  if (!token) return res.status(401).send("Access Denied");

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send("Invalid Token");

   
    req.user = user;
    next();
  });
}

// User registration route
app.post("/register", async (req, res) => {
  const { firstName, lastName, username, password } = req.body;

  if (!firstName || !lastName || !username || !password) {
    return res.status(400).send("Please fill all the fields");
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await sql.query`INSERT INTO Users (firstName, lastName, username, password) VALUES (${firstName}, ${lastName}, ${username}, ${hashedPassword})`;
    res.status(201).send("User registered successfully");
  } catch (err) {
    if (err.number === 2627) {
      res.status(400).send("Username already exists");
    } else {
      res.status(500).send("Error registering user");
    }
  }
});

// User login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("Please fill all the fields");
  }

  try {
    const result =
      await sql.query`SELECT * FROM Users WHERE username = ${username}`;
    const user = result.recordset[0];

    if (!user) return res.status(400).send("User does not exist");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send("Invalid password");

    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).send("Error logging in");
  }
});

// CRUD Routes for Todo - protected by authentication middleware

// Get all todos for the authenticated user
app.get("/todos", authenticateToken, async (req, res) => {
  const username = req.user.username;
  console.log(username);
  try {
    const result =
      await sql.query`SELECT * FROM Todos WHERE username = ${username}`;
    res.json(result.recordset);
  } catch (err) {
    res.status(500).send("Error fetching todos");
  }
});

// Get a single todo by ID for the authenticated user
app.get("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  try {
    const result =
      await sql.query`SELECT * FROM Todos WHERE id = ${id} AND username = ${username}`;
    if (result.recordset.length === 0)
      return res.status(404).send("Todo not found");
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).send("Error fetching todo");
  }
});

// Create a new todo for the authenticated user
app.post("/todos", authenticateToken, async (req, res) => {
  const { title, description, targetDate, status } = req.body;
  const username = req.user.username;

  try {
    await sql.query`INSERT INTO Todos (title, username, description, targetDate, status) VALUES (${title}, ${username}, ${description}, ${targetDate}, ${status})`;
    res.status(201).send("Todo created");
  } catch (err) {
    res.status(500).send("Error creating todo");
  }
});

// Update a todo by ID for the authenticated user
app.put("/todos", authenticateToken, async (req, res) => {
  const { id } = req.query;
  const { title, description, targetDate, status } = req.body;
  console.log(id,title,description,targetDate,status)
  const username = req.user.username;
  console.log(username)

  try {
   var result= await sql.query`UPDATE Todos SET title = ${title}, description = ${description}, targetDate = ${targetDate}, status = ${status} WHERE id = ${Number(id)} AND username = ${username}`;
   console.log(result)
    res.send("Todo updated");
  } catch (err) {
    res.status(500).send("Error updating todo"+err);
  }
});

// Delete a todo by ID for the authenticated user
app.delete("/todos/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const username = req.user.username;

  try {
    await sql.query`DELETE FROM Todos WHERE id = ${id} AND username = ${username}`;
    res.send("Todo deleted");
  } catch (err) {
    res.status(500).send("Error deleting todo");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
