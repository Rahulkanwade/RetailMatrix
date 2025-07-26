const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const app = express();
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(cookieParser());


app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "auth_db"
});


function authenticateToken(req, res, next) {
  const token = req.cookies.token; // ✅ Read from cookie instead of headers

  if (!token) return res.status(401).json({ message: "Unauthorized: No token" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}


app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const sql = "INSERT INTO users (email, password) VALUES (?, ?)";
  db.query(sql, [email, hashedPassword], (err) => {
    if (err) return res.status(500).json({ error: "Signup failed" });
    res.json({ message: "Signup successful" });
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ error: "User not found" });
    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ id: user.id , email: user.email}, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,     // true if using HTTPS
      sameSite: "Lax",
      maxAge: 3600000     // 1 hour
    });
    res.json({ message: "Login successful" });

  });
});
app.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

app.get("/profile", (req, res) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
   const user = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: user.email });
  } catch (err) {
    res.status(403).json({ message: "Invalid token" });
  }
});




// ===== GET Labourers for Logged-in User =====
app.get("/labourers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM labourers WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching labourers" });
    res.json(results);
  });
});

// ===== POST Add Labourer =====
app.post("/labourers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });

  db.query("INSERT INTO labourers (name, userId) VALUES (?, ?)", [name, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error adding labourer" });
    res.json({ id: result.insertId, name });
  });
});

// ===== GET Salaries for Logged-in User =====
app.get("/salaries", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM salaries WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching salaries" });
    res.json(results);
  });
});

// ===== POST Add Salary Entry =====
app.post("/salaries", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { labourName, salaryAmount, day, date, time } = req.body;

  if (!labourName || !salaryAmount || !day || !date || !time) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query(
    "INSERT INTO salaries (labourName, salaryAmount, day, date, time, userId) VALUES (?, ?, ?, ?, ?, ?)",
    [labourName, salaryAmount, day, date, time, userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error adding salary" });
      res.json({ id: result.insertId, labourName, salaryAmount, day, date, time });
    }
  );
});



app.post('/add-expense', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, quantity, unit, price, date } = req.body;

  const query = 'INSERT INTO expenses (name, quantity, unit, price, date, userId) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(query, [name, quantity, unit, price, date, userId], (err, result) => {
    if (err) {
      console.error('Error inserting expense:', err);
      return res.status(500).send('Server error');
    }
    res.status(201).send('Expense added');
  });
});

app.get('/expenses', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query('SELECT * FROM expenses WHERE userId = ? ORDER BY date DESC', [userId], (err, results) => {
    if (err) {
      console.error('Error fetching expenses:', err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});


// Get all customers
app.get("/customers", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT * FROM customers WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch customers" });
    res.json(results);
  });
});

// Add new customer
app.post("/customers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  db.query("INSERT INTO customers (name, userId) VALUES (?, ?)", [name, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add customer" });
    res.json({ id: result.insertId, name });
  });
});


// Get all prices
app.get("/prices", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM prices WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch prices" });
    res.json(results);
  });
});

app.put("/prices", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { type, weight, price } = req.body;

  const query = `
    INSERT INTO prices (type, weight, price, userId)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE price = VALUES(price)
  `;
  db.query(query, [type, weight, price, userId], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update price" });
    res.json({ message: "Price updated" });
  });
});


// Get all orders
app.get("/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT * FROM orders WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch orders" });

    const parsed = results.map((order) => ({
      ...order,
      cakes: JSON.parse(order.cakes),
      pastries: JSON.parse(order.pastries)
    }));

    res.json(parsed);
  });
});


// Add new order
app.post("/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { customer, orderDate, deliveryDate, cakes, pastries } = req.body;

  const query = `
    INSERT INTO orders (customer, orderDate, deliveryDate, cakes, pastries, userId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [
    customer,
    orderDate,
    deliveryDate,
    JSON.stringify(cakes),
    JSON.stringify(pastries),
    userId
  ], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add order" });
    res.json({ id: result.insertId });
  });
});


// Update delivery date
app.put("/orders/:id", (req, res) => {
  const { deliveryDate } = req.body;
  const { id } = req.params;
  db.query("UPDATE orders SET deliveryDate = ? WHERE id = ?", [deliveryDate, id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update delivery date" });
    res.json({ message: "Updated" });
  });
});

// Delete order
app.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM orders WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete order" });
    res.json({ message: "Deleted" });
  });
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
