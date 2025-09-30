const express = require("express");
// const mysql = require("mysql2"); // REMOVED: Redundant import, using mysql2/promise instead
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const mysql = require('mysql2/promise'); // Using promise-based client
require("dotenv").config();

const app = express();
const allowedOrigins = [
  "http://localhost:3000", // for local testing
  "capacitor://localhost",  // for iOS/Android apps using Capacitor
  "http://localhost",       // Android WebView
  "https://retailmatrix-production-e3e0.up.railway.app/"
]; 

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins temporarily
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// --- Database Connection ---
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: { rejectUnauthorized: false }
});

const validator = require('validator');
const rateLimit = require('express-rate-limit');
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: { error: "Too many authentication attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/signup', authLimiter);
app.use('/login', authLimiter);

// Check database connection
async function checkDbConnection() {
  try {
    // Use pool.getConnection to verify connection
    const connection = await pool.getConnection();
    console.log("✅ Connected to Railway MySQL");
    connection.release();
  } catch (err) {
    console.error("Database connection failed:", err);
  }
}
checkDbConnection();
// Original db.connect... block has been replaced/removed as it was incorrect for a pool

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      return res.status(401).json({ message: "Session expired, please login again" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid session, please login again" });
    }
    console.error("Authentication error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
// --- Main Routes (Login, Logout, Profile) ---
app.get("/", (req, res) => {
  res.send("Backend is working ✅");
});

app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = validator.normalizeEmail(email);

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    // Check for password complexity (at least one uppercase, lowercase, number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
      });
    }

    // Check if user already exists
    const checkUserSql = "SELECT id FROM users WHERE email = ?";
    const [results] = await pool.query(checkUserSql, [normalizedEmail]); // REPLACED db.query with await pool.query

    if (results.length > 0) {
      return res.status(409).json({ error: "User already exists with this email" });
    }

    // Hash password with higher salt rounds for better security
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const insertSql = "INSERT INTO users (email, password, createdAt) VALUES (?, ?, NOW())";
    try {
      const [result] = await pool.query(insertSql, [normalizedEmail, hashedPassword]); // REPLACED db.query with await pool.query
      res.status(201).json({ 
        message: "Account created successfully",
        userId: result.insertId 
      });
    } catch (err) {
      console.error("Database error during user creation:", err);
      // Check for duplicate entry error specifically
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: "User already exists with this email" });
      }
      return res.status(500).json({ error: "Failed to create user account" });
    }


  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const normalizedEmail = validator.normalizeEmail(email);
    const [rows] = await pool.query("SELECT id, email, password FROM users WHERE email = ?", [normalizedEmail]);

    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "24h" });

    await pool.query("UPDATE users SET lastLoginAt = NOW() WHERE id = ?", [user.id]);

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Login error:", err);
    console.log("Received login request:", req.body);
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ set" : "❌ missing");

    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/logout", (req, res) => {
 res.clearCookie("token", {
  httpOnly: true,
  secure: false,
  sameSite: 'none',
  path: '/'
});
  res.json({ message: "Logged out successfully" });
});

app.get("/profile", async (req, res) => { // Made async
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from database
    const sql = "SELECT id, email, createdAt, lastLoginAt FROM users WHERE id = ?";
    const [results] = await pool.query(sql, [decoded.id]); // REPLACED db.query with await pool.query

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid session, please login again" });
    }
    console.error("Profile verification error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// --- Customer & Order Management ---
app.get("/customers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM customers WHERE userId = ?", [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch customers" });
  }
});

app.post("/customers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { name } = req.body;
  try {
    const [result] = await pool.query("INSERT INTO customers (name, userId) VALUES (?, ?)", [name, userId]); // REPLACED db.query with await pool.query
    res.json({ id: result.insertId, name });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add customer" });
  }
});

app.get("/orders", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC", [userId]); // REPLACED db.query with await pool.query
    const parsed = results.map((order) => ({
      ...order,
      customerId: order.customerId || null,
      cakes: JSON.parse(order.cakes),
      pastries: JSON.parse(order.pastries)
    }));
    res.json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.post("/orders", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { customer, orderDate, deliveryDate, cakes, pastries } = req.body;
  const query = `
    INSERT INTO orders (customer, orderDate, deliveryDate, cakes, pastries, userId)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await pool.query(query, [ // REPLACED db.query with await pool.query
      customer,
      orderDate,
      deliveryDate,
      JSON.stringify(cakes),
      JSON.stringify(pastries),
      userId
    ]);
    res.json({ id: result.insertId });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add order" });
  }
});

app.put("/orders/:id", async (req, res) => { // Made async
  const { deliveryDate } = req.body;
  const { id } = req.params;
  try {
    await pool.query("UPDATE orders SET deliveryDate = ? WHERE id = ?", [deliveryDate, id]); // REPLACED db.query with await pool.query
    res.json({ message: "Updated" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update delivery date" });
  }
});

app.delete("/orders/:id", async (req, res) => { // Made async
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM orders WHERE id = ?", [id]); // REPLACED db.query with await pool.query
    res.json({ message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

// --- General Payments Management ---
app.post("/payments/customer", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType } = req.body;
  if (!customerId || !customerName || !amount) {
    return res.status(400).json({ error: "Customer ID, name, and amount are required" });
  }
  const query = `
    INSERT INTO payments (customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await pool.query(query, [customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId]); // REPLACED db.query with await pool.query
    res.json({
      id: result.insertId,
      customerId,
      customerName,
      amount,
      paymentMethod,
      paymentDate,
      notes,
      paymentType
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add customer payment" });
  }
});

app.get("/payments", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM payments WHERE userId = ? ORDER BY paymentDate DESC", [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch payments" });
  }
});

app.post("/payments", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes } = req.body;
  if (!orderId || !customerId || !amount) {
    return res.status(400).json({ error: "Order, customer, and amount are required" });
  }
  const query = `
    INSERT INTO payments (orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'order', ?)
  `;
  try {
    const [result] = await pool.query(query, [orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes, userId]); // REPLACED db.query with await pool.query
    res.json({ id: result.insertId, orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes });
  } catch (err) {
    return res.status(500).json({ error: "Failed to add payment" });
  }
});

app.delete("/payments/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM payments WHERE id = ? AND userId = ?", [id, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to delete payment" });
  }
});

// --- Labourer & Salary Management ---
app.get("/labourers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM labourers WHERE userId = ?", [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching labourers" });
  }
});

app.post("/labourers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  try {
    const [result] = await pool.query("INSERT INTO labourers (name, userId) VALUES (?, ?)", [name, userId]); // REPLACED db.query with await pool.query
    res.json({ id: result.insertId, name });
  } catch (err) {
    return res.status(500).json({ message: "Error adding labourer" });
  }
});

app.get("/salaries", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM salaries WHERE userId = ?", [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching salaries" });
  }
});

app.post("/salaries", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { labourName, salaryAmount, day, date, time } = req.body;
  if (!labourName || !salaryAmount || !day || !date || !time) {
    return res.status(400).json({ message: "All fields required" });
  }
  try {
    const [result] = await pool.query( // REPLACED db.query with await pool.query
      "INSERT INTO salaries (labourName, salaryAmount, day, date, time, userId) VALUES (?, ?, ?, ?, ?, ?)",
      [labourName, salaryAmount, day, date, time, userId]
    );
    res.json({ id: result.insertId, labourName, salaryAmount, day, date, time });
  } catch (err) {
    return res.status(500).json({ message: "Error adding salary" });
  }
});

// --- Price Management ---
app.get("/prices", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT * FROM prices WHERE userId = ?", [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch prices" });
  }
});

app.put("/prices", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { type, weight, price } = req.body;
  const query = `
    INSERT INTO prices (type, weight, price, userId)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE price = VALUES(price)
  `;
  try {
    await pool.query(query, [type, weight, price, userId]); // REPLACED db.query with await pool.query
    res.json({ message: "Price updated" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to update price" });
  }
});

// --- Expense Management ---

// Get all expenses for the authenticated user
app.get("/expenses", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT * FROM expenses 
    WHERE userId = ? 
    ORDER BY date DESC, createdAt DESC
  `;
  
  try {
    const [results] = await pool.query(query, [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Add new expenses (can handle multiple expenses at once)
app.post("/expenses", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { expenses } = req.body;

  // Validate input
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return res.status(400).json({ error: "Expenses array is required" });
  }

  // Validate each expense item
  const invalidExpenses = expenses.filter(expense => 
    !expense.itemName || 
    !expense.category || 
    !expense.quantity || 
    !expense.pricePerUnit || 
    !expense.unit ||
    parseFloat(expense.quantity) <= 0 ||
    parseFloat(expense.pricePerUnit) <= 0
  );

  if (invalidExpenses.length > 0) {
    return res.status(400).json({ 
      error: "All expense fields are required and quantity/price must be positive" 
    });
  }

  // Prepare bulk insert query
  const insertQuery = `
    INSERT INTO expenses (itemName, category, quantity, pricePerUnit, totalAmount, date, unit, userId)
    VALUES ?
  `;

  const expenseValues = expenses.map(expense => [
    expense.itemName,
    expense.category,
    parseFloat(expense.quantity),
    parseFloat(expense.pricePerUnit),
    parseFloat(expense.quantity) * parseFloat(expense.pricePerUnit), // totalAmount
    expense.date || new Date().toISOString().split('T')[0], // current date if not provided
    expense.unit,
    userId
  ]);

  try {
    const [result] = await pool.query(insertQuery, [expenseValues]); // REPLACED db.query with await pool.query

    // Return the added expenses with generated IDs
    const addedExpenses = expenses.map((expense, index) => ({
      id: result.insertId + index,
      ...expense,
      quantity: parseFloat(expense.quantity),
      pricePerUnit: parseFloat(expense.pricePerUnit),
      totalAmount: parseFloat(expense.quantity) * parseFloat(expense.pricePerUnit),
      date: expense.date || new Date().toISOString().split('T')[0],
      userId
    }));

    res.status(201).json({
      message: "Expenses added successfully",
      expenses: addedExpenses
    });
  } catch (err) {
    console.error("Error adding expenses:", err);
    return res.status(500).json({ error: "Failed to add expenses" });
  }
});

// Update an expense
app.put("/expenses/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const expenseId = req.params.id;
  const { itemName, category, quantity, pricePerUnit, unit, date } = req.body;

  // Validate input
  if (!itemName || !category || !quantity || !pricePerUnit || !unit) {
    return res.status(400).json({ error: "All expense fields are required" });
  }

  if (parseFloat(quantity) <= 0 || parseFloat(pricePerUnit) <= 0) {
    return res.status(400).json({ error: "Quantity and price must be positive" });
  }

  const totalAmount = parseFloat(quantity) * parseFloat(pricePerUnit);
  
  const updateQuery = `
    UPDATE expenses 
    SET itemName = ?, category = ?, quantity = ?, pricePerUnit = ?, 
        totalAmount = ?, unit = ?, date = ?
    WHERE id = ? AND userId = ?
  `;

  try {
    const [result] = await pool.query(updateQuery, [ // REPLACED db.query with await pool.query
      itemName,
      category,
      parseFloat(quantity),
      parseFloat(pricePerUnit),
      totalAmount,
      unit,
      date || new Date().toISOString().split('T')[0],
      expenseId,
      userId
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ 
      message: "Expense updated successfully",
      expense: {
        id: parseInt(expenseId),
        itemName,
        category,
        quantity: parseFloat(quantity),
        pricePerUnit: parseFloat(pricePerUnit),
        totalAmount,
        unit,
        date: date || new Date().toISOString().split('T')[0]
      }
    });
  } catch (err) {
    console.error("Error updating expense:", err);
    return res.status(500).json({ error: "Failed to update expense" });
  }
});

// Delete an expense
app.delete("/expenses/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const expenseId = req.params.id;

  const deleteQuery = "DELETE FROM expenses WHERE id = ? AND userId = ?";

  try {
    const [result] = await pool.query(deleteQuery, [expenseId, userId]); // REPLACED db.query with await pool.query

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    return res.status(500).json({ error: "Failed to delete expense" });
  }
});

// Get expense statistics
app.get("/expenses/stats", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  
  const statsQuery = `
    SELECT 
      COUNT(*) as totalExpenses,
      SUM(totalAmount) as totalAmount,
      AVG(totalAmount) as averageExpense,
      category,
      SUM(totalAmount) as categoryTotal,
      COUNT(*) as categoryCount
    FROM expenses 
    WHERE userId = ?
    GROUP BY category
    ORDER BY categoryTotal DESC
  `;

  const overallQuery = `
    SELECT 
      COUNT(*) as totalExpenses,
      SUM(totalAmount) as totalAmount,
      AVG(totalAmount) as averageExpense
    FROM expenses 
    WHERE userId = ?
  `;

  try {
    // Get overall stats
    const [overallResults] = await pool.query(overallQuery, [userId]); // REPLACED db.query with await pool.query

    // Get category-wise stats
    const [categoryResults] = await pool.query(statsQuery, [userId]); // REPLACED db.query with await pool.query

    const overall = overallResults[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      averageExpense: 0
    };

    res.json({
      overall: {
        totalExpenses: parseInt(overall.totalExpenses || 0),
        totalAmount: parseFloat(overall.totalAmount || 0),
        averageExpense: parseFloat(overall.averageExpense || 0)
      },
      byCategory: categoryResults.map(cat => ({
        category: cat.category,
        totalAmount: parseFloat(cat.categoryTotal || 0),
        count: parseInt(cat.categoryCount || 0),
        percentage: overall.totalAmount > 0 ? 
          ((parseFloat(cat.categoryTotal || 0) / parseFloat(overall.totalAmount)) * 100) : 0
      }))
    });
  } catch (err) {
    console.error("Error fetching expense stats:", err);
    return res.status(500).json({ error: "Failed to fetch expense statistics" });
  }
});

// Get expenses by date range
app.get("/expenses/range", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Start date and end date are required" });
  }

  const query = `
    SELECT * FROM expenses 
    WHERE userId = ? AND date BETWEEN ? AND ?
    ORDER BY date DESC, createdAt DESC
  `;

  try {
    const [results] = await pool.query(query, [userId, startDate, endDate]); // REPLACED db.query with await pool.query

    const totalAmount = results.reduce((sum, expense) => sum + parseFloat(expense.totalAmount || 0), 0);

    res.json({
      expenses: results,
      summary: {
        count: results.length,
        totalAmount: totalAmount,
        startDate,
        endDate
      }
    });
  } catch (err) {
    console.error("Error fetching expenses by date range:", err);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

// Get expenses by category
app.get("/expenses/category/:category", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { category } = req.params;

  const query = `
    SELECT * FROM expenses 
    WHERE userId = ? AND category = ?
    ORDER BY date DESC, createdAt DESC
  `;

  try {
    const [results] = await pool.query(query, [userId, category]); // REPLACED db.query with await pool.query

    const totalAmount = results.reduce((sum, expense) => sum + parseFloat(expense.totalAmount || 0), 0);

    res.json({
      expenses: results,
      summary: {
        category,
        count: results.length,
        totalAmount: totalAmount
      }
    });
  } catch (err) {
    console.error("Error fetching expenses by category:", err);
    return res.status(500).json({ error: "Failed to fetch expenses" });
  }
});
// --- Loan & Repayment Management ---
app.get("/loans", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT l.*,
           COALESCE(SUM(r.amount), 0) as totalRepaid,
           (l.loanAmount - COALESCE(SUM(r.amount), 0)) as pendingAmount
    FROM loans l
    LEFT JOIN repayments r ON l.id = r.loanId
    WHERE l.userId = ?
    GROUP BY l.id
    ORDER BY pendingAmount DESC, l.dateAdded DESC
  `;
  try {
    const [results] = await pool.query(query, [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching loans:", err);
    return res.status(500).json({ message: "Error fetching loans" });
  }
});

app.post("/loans", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { borrower, loanAmount } = req.body;
  if (!borrower || !borrower.trim()) {
    return res.status(400).json({ message: "Borrower name is required" });
  }
  if (!loanAmount || parseFloat(loanAmount) <= 0) {
    return res.status(400).json({ message: "Valid loan amount is required" });
  }
  const query = "INSERT INTO loans (borrower, loanAmount, userId) VALUES (?, ?, ?)";
  try {
    const [result] = await pool.query(query, [borrower.trim(), parseFloat(loanAmount), userId]); // REPLACED db.query with await pool.query
    res.json({
      id: result.insertId,
      borrower: borrower.trim(),
      loanAmount: parseFloat(loanAmount),
      dateAdded: new Date().toISOString(),
      totalRepaid: 0,
      pendingAmount: parseFloat(loanAmount)
    });
  } catch (err) {
    console.error("Error adding loan:", err);
    return res.status(500).json({ message: "Error adding loan" });
  }
});

app.delete("/loans/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const loanId = req.params.id;
  try {
    await pool.query("DELETE FROM repayments WHERE loanId = ? AND userId = ?", [loanId, userId]); // REPLACED db.query with await pool.query
    const [result] = await pool.query("DELETE FROM loans WHERE id = ? AND userId = ?", [loanId, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }
    res.json({ message: "Loan deleted successfully" });
  } catch (err) {
    console.error("Error deleting loan or repayments:", err);
    return res.status(500).json({ message: "Error deleting loan or loan repayments" });
  }
});

app.get("/loans/:id/repayments", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const loanId = req.params.id;
  const query = `
    SELECT r.* FROM repayments r
    JOIN loans l ON r.loanId = l.id
    WHERE r.loanId = ? AND r.userId = ? AND l.userId = ?
    ORDER BY r.date DESC
  `;
  try {
    const [results] = await pool.query(query, [loanId, userId, userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching repayments:", err);
    return res.status(500).json({ message: "Error fetching repayments" });
  }
});

app.post("/loans/:id/repayments", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const loanId = req.params.id;
  const { amount } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Valid repayment amount is required" });
  }
  try {
    const [loanResults] = await pool.query("SELECT * FROM loans WHERE id = ? AND userId = ?", [loanId, userId]); // REPLACED db.query with await pool.query
    if (loanResults.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }
    const query = "INSERT INTO repayments (loanId, amount, userId) VALUES (?, ?, ?)";
    const [result] = await pool.query(query, [loanId, parseFloat(amount), userId]); // REPLACED db.query with await pool.query
    res.json({
      id: result.insertId,
      loanId: parseInt(loanId),
      amount: parseFloat(amount),
      date: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error adding repayment:", err);
    return res.status(500).json({ message: "Error adding repayment" });
  }
});

app.delete("/repayments/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const repaymentId = req.params.id;
  const query = `
    DELETE r FROM repayments r
    JOIN loans l ON r.loanId = l.id
    WHERE r.id = ? AND r.userId = ? AND l.userId = ?
  `;
  try {
    const [result] = await pool.query(query, [repaymentId, userId, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Repayment not found" });
    }
    res.json({ message: "Repayment deleted successfully" });
  } catch (err) {
    console.error("Error deleting repayment:", err);
    return res.status(500).json({ message: "Error deleting repayment" });
  }
});

app.get("/loans/stats", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT
      COALESCE(SUM(l.loanAmount), 0) as totalLoaned,
      COALESCE(SUM(r.totalRepaid), 0) as totalRepaid,
      COALESCE(SUM(l.loanAmount) - SUM(r.totalRepaid), 0) as totalPending,
      COUNT(DISTINCT l.id) as totalLoans
    FROM loans l
    LEFT JOIN (
      SELECT loanId, SUM(amount) as totalRepaid
      FROM repayments
      WHERE userId = ?
      GROUP BY loanId
    ) r ON l.id = r.loanId
    WHERE l.userId = ?
  `;
  try {
    const [results] = await pool.query(query, [userId, userId]); // REPLACED db.query with await pool.query
    const stats = results[0] || {
      totalLoaned: 0,
      totalRepaid: 0,
      totalPending: 0,
      totalLoans: 0
    };
    res.json(stats);
  } catch (err) {
    console.error("Error fetching loan stats:", err);
    return res.status(500).json({ message: "Error fetching loan statistics" });
  }
});

// --- Supplier & Inventory Management ---
app.get("/suppliers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT s.*,
           COUNT(sp.id) as productCount,
           COALESCE(SUM(sp.price * sp.quantity), 0) as totalValue
    FROM suppliers s
    LEFT JOIN supplier_products sp ON s.id = sp.supplierId
    WHERE s.userId = ?
    GROUP BY s.id
    ORDER BY s.dateAdded DESC
  `;
  try {
    const [results] = await pool.query(query, [userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching suppliers:", err);
    return res.status(500).json({ message: "Error fetching suppliers" });
  }
});

app.get("/suppliers/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const supplierId = req.params.id;
  const supplierQuery = "SELECT * FROM suppliers WHERE id = ? AND userId = ?";
  const productsQuery = "SELECT * FROM supplier_products WHERE supplierId = ? AND userId = ?";
  try {
    const [supplierResults] = await pool.query(supplierQuery, [supplierId, userId]); // REPLACED db.query with await pool.query
    if (supplierResults.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    const [productsResults] = await pool.query(productsQuery, [supplierId, userId]); // REPLACED db.query with await pool.query
    const supplier = supplierResults[0];
    supplier.products = productsResults;
    res.json(supplier);
  } catch (err) {
    console.error("Error fetching supplier or products:", err);
    return res.status(500).json({ message: "Error fetching supplier" });
  }
});

app.post("/suppliers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { name, contact, address, billDate, products } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Supplier name is required" });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ message: "Contact number is required" });
  }
  const contactRegex = /^\+91\d{10}$/;
  if (!contactRegex.test(contact)) {
    return res.status(400).json({ message: "Contact number must be in format +91XXXXXXXXXX" });
  }
  const supplierQuery = `
    INSERT INTO suppliers (name, contact, address, billDate, userId)
    VALUES (?, ?, ?, ?, ?)
  `;
  try {
    const [result] = await pool.query(supplierQuery, [name.trim(), contact, address || "", billDate, userId]); // REPLACED db.query with await pool.query
    const supplierId = result.insertId;
    if (products && products.length > 0) {
      const productPromises = products.map(product => {
        const productQuery = `
          INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return pool.query(productQuery, [ // Used pool.query directly
          supplierId,
          product.name,
          product.quantity,
          product.unit,
          product.price,
          product.category,
          userId
        ]);
      });
      await Promise.all(productPromises);
      res.json({
        id: supplierId,
        name: name.trim(),
        contact,
        address,
        billDate,
        products
      });
    } else {
      res.json({
        id: supplierId,
        name: name.trim(),
        contact,
        address,
        billDate,
        products: []
      });
    }
  } catch (err) {
    console.error("Error adding supplier or products:", err);
    res.status(500).json({ message: "Error adding supplier" });
  }
});

app.put("/suppliers/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const supplierId = req.params.id;
  const { name, contact, address, billDate, products } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Supplier name is required" });
  }
  if (!contact || !contact.trim()) {
    return res.status(400).json({ message: "Contact number is required" });
  }
  const contactRegex = /^\+91\d{10}$/;
  if (!contactRegex.test(contact)) {
    return res.status(400).json({ message: "Contact number must be in format +91XXXXXXXXXX" });
  }
  const updateQuery = `
    UPDATE suppliers
    SET name = ?, contact = ?, address = ?, billDate = ?
    WHERE id = ? AND userId = ?
  `;
  try {
    const [result] = await pool.query(updateQuery, [name.trim(), contact, address || "", billDate, supplierId, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    await pool.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId]); // REPLACED db.query with await pool.query
    if (products && products.length > 0) {
      const productPromises = products.map(product => {
        const productQuery = `
          INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        return pool.query(productQuery, [ // Used pool.query directly
          supplierId,
          product.name,
          product.quantity,
          product.unit,
          product.price,
          product.category,
          userId
        ]);
      });
      await Promise.all(productPromises);
      res.json({ message: "Supplier updated successfully" });
    } else {
      res.json({ message: "Supplier updated successfully" });
    }
  } catch (err) {
    console.error("Error updating supplier or products:", err);
    return res.status(500).json({ message: "Error updating supplier" });
  }
});

app.delete("/suppliers/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const supplierId = req.params.id;
  try {
    await pool.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId]); // REPLACED db.query with await pool.query
    const [result] = await pool.query("DELETE FROM suppliers WHERE id = ? AND userId = ?", [supplierId, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    res.json({ message: "Supplier deleted successfully" });
  } catch (err) {
    console.error("Error deleting supplier or products:", err);
    return res.status(500).json({ message: "Error deleting supplier" });
  }
});

app.get("/suppliers/:id/products", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const supplierId = req.params.id;
  const query = `
    SELECT sp.* FROM supplier_products sp
    JOIN suppliers s ON sp.supplierId = s.id
    WHERE sp.supplierId = ? AND sp.userId = ? AND s.userId = ?
    ORDER BY sp.name
  `;
  try {
    const [results] = await pool.query(query, [supplierId, userId, userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching supplier products:", err);
    return res.status(500).json({ message: "Error fetching supplier products" });
  }
});

app.post("/suppliers/:id/products", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const supplierId = req.params.id;
  const { name, quantity, unit, price, category } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Product name is required" });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }
  if (!price || price <= 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }
  try {
    const [supplierResults] = await pool.query("SELECT id FROM suppliers WHERE id = ? AND userId = ?", [supplierId, userId]); // REPLACED db.query with await pool.query
    if (supplierResults.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    const query = `
      INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [supplierId, name.trim(), quantity, unit, price, category, userId]); // REPLACED db.query with await pool.query
    res.json({
      id: result.insertId,
      supplierId: parseInt(supplierId),
      name: name.trim(),
      quantity,
      unit,
      price,
      category
    });
  } catch (err) {
    console.error("Error adding supplier product:", err);
    return res.status(500).json({ message: "Error adding supplier product" });
  }
});

app.delete("/supplier-products/:id", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const productId = req.params.id;
  const query = `
    DELETE sp FROM supplier_products sp
    JOIN suppliers s ON sp.supplierId = s.id
    WHERE sp.id = ? AND sp.userId = ? AND s.userId = ?
  `;
  try {
    const [result] = await pool.query(query, [productId, userId, userId]); // REPLACED db.query with await pool.query
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier product not found" });
    }
    res.json({ message: "Supplier product deleted successfully" });
  } catch (err) {
    console.error("Error deleting supplier product:", err);
    return res.status(500).json({ message: "Error deleting supplier product" });
  }
});

app.get("/inventory", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT
      name,
      SUM(quantity) as totalQuantity,
      unit,
      category,
      AVG(price) as averagePrice,
      MAX(sp.dateAdded) as lastUpdated
    FROM supplier_products sp
    JOIN suppliers s ON sp.supplierId = s.id
    WHERE sp.userId = ? AND s.userId = ?
    GROUP BY name, unit, category
    ORDER BY name
  `;
  try {
    const [results] = await pool.query(query, [userId, userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching inventory:", err);
    return res.status(500).json({ message: "Error fetching inventory" });
  }
});

app.get("/suppliers/stats", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT
      COUNT(DISTINCT s.id) as totalSuppliers,
      COUNT(sp.id) as totalProducts,
      COALESCE(SUM(sp.price * sp.quantity), 0) as totalValue,
      COALESCE(AVG(sp.price * sp.quantity), 0) as averageOrderValue
    FROM suppliers s
    LEFT JOIN supplier_products sp ON s.id = sp.supplierId
    WHERE s.userId = ?
  `;
  try {
    const [results] = await pool.query(query, [userId]); // REPLACED db.query with await pool.query
    const stats = results[0] || {
      totalSuppliers: 0,
      totalProducts: 0,
      totalValue: 0,
      averageOrderValue: 0
    };
    res.json(stats);
  } catch (err) {
    console.error("Error fetching supplier stats:", err);
    return res.status(500).json({ message: "Error fetching supplier statistics" });
  }
});

// --- Bread Sales Management ---
app.get("/bread/price", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  try {
    const [results] = await pool.query("SELECT price FROM bread_prices WHERE userId = ? ORDER BY dateUpdated DESC LIMIT 1", [userId]); // REPLACED db.query with await pool.query
    const price = results.length > 0 ? results[0].price : 45;
    res.json({ price });
  } catch (err) {
    console.error("Error fetching bread price:", err);
    return res.status(500).json({ message: "Error fetching bread price" });
  }
});


app.put("/bread/price", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { price } = req.body;
  if (!price || price <= 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }
  const query = "INSERT INTO bread_prices (userId, price) VALUES (?, ?)";
  try {
    await pool.query(query, [userId, parseFloat(price)]); // REPLACED db.query with await pool.query
    res.json({ price: parseFloat(price), message: "Price updated successfully" });
  } catch (err) {
    console.error("Error updating bread price:", err);
    return res.status(500).json({ message: "Error updating bread price" });
  }
});

app.get("/bread/customers", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT
      bc.id,
      bc.name,
      COALESCE(sales_total.totalBills, 0) as totalBills,
      COALESCE(payments_total.totalPaid, 0) as totalPaid,
      COALESCE(sales_total.totalBills, 0) - COALESCE(payments_total.totalPaid, 0) as balance
    FROM bread_customers bc
    LEFT JOIN (
      SELECT customerId, SUM(billAmount) as totalBills
      FROM bread_sales
      WHERE userId = ?
      GROUP BY customerId
    ) sales_total ON bc.id = sales_total.customerId
    LEFT JOIN (
      SELECT customerId, SUM(amount) as totalPaid
      FROM bread_payments
      WHERE userId = ?
      GROUP BY customerId
    ) payments_total ON bc.id = payments_total.customerId
    WHERE bc.userId = ?
  `;
  try {
    const [results] = await pool.query(query, [userId, userId, userId]); // REPLACED db.query with await pool.query
    res.json(results);
  } catch (err) {
    console.error("Error fetching bread customers:", err);
    return res.status(500).json({ message: "Error fetching customers" });
  }
});

app.get("/bread/customers/:id/details", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const customerId = req.params.id;
  const customerQuery = "SELECT * FROM bread_customers WHERE id = ? AND userId = ?";
  const salesQuery = `
    SELECT * FROM bread_sales
    WHERE customerId = ? AND userId = ?
    ORDER BY saleDate DESC, saleTime DESC
  `;
  const paymentsQuery = `
    SELECT * FROM bread_payments
    WHERE customerId = ? AND userId = ?
    ORDER BY paymentDate DESC, paymentTime DESC
  `;
  try {
    const [customerResults] = await pool.query(customerQuery, [customerId, userId]); // REPLACED db.query with await pool.query
    if (customerResults.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customer = customerResults[0];
    const [salesResults] = await pool.query(salesQuery, [customerId, userId]); // REPLACED db.query with await pool.query
    const [paymentsResults] = await pool.query(paymentsQuery, [customerId, userId]); // REPLACED db.query with await pool.query
    customer.sales = salesResults;
    customer.payments = paymentsResults;
    res.json(customer);
  } catch (err) {
    console.error("Error fetching customer details:", err);
    return res.status(500).json({ message: "Error fetching customer details" });
  }
});

app.post("/bread/sales", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { customerName, quantity, pricePerDozen } = req.body;
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ message: "Customer name is required" });
  }
  if (!quantity || quantity <= 0) {
    return res.status(400).json({ message: "Valid quantity is required" });
  }
  if (!pricePerDozen || pricePerDozen <= 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }
  const billAmount = parseFloat(quantity) * parseFloat(pricePerDozen);
  const checkCustomerQuery = "SELECT id FROM bread_customers WHERE name = ? AND userId = ?";

  try {
    let customerId;
    const [customerResults] = await pool.query(checkCustomerQuery, [customerName.trim(), userId]); // REPLACED db.query with await pool.query

    if (customerResults.length > 0) {
      customerId = customerResults[0].id;
    } else {
      const createCustomerQuery = "INSERT INTO bread_customers (name, userId) VALUES (?, ?)";
      const [result] = await pool.query(createCustomerQuery, [customerName.trim(), userId]); // REPLACED db.query with await pool.query
      customerId = result.insertId;
    }

    const saleQuery = `
      INSERT INTO bread_sales (customerId, customerName, quantity, pricePerDozen, billAmount, userId)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(saleQuery, [customerId, customerName.trim(), quantity, pricePerDozen, billAmount, userId]); // REPLACED db.query with await pool.query
    
    res.json({
      id: result.insertId,
      customerId,
      customerName: customerName.trim(),
      quantity: parseFloat(quantity),
      pricePerDozen: parseFloat(pricePerDozen),
      billAmount,
      saleDate: new Date().toISOString().split('T')[0],
      saleTime: new Date().toTimeString().split(' ')[0]
    });
  } catch (err) {
    console.error("Error processing sale:", err);
    return res.status(500).json({ message: "Error processing sale" });
  }
});

app.post("/bread/payments", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const { customerName, amount } = req.body;
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ message: "Customer name is required" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid payment amount is required" });
  }
  const findCustomerQuery = "SELECT id FROM bread_customers WHERE name = ? AND userId = ?";
  
  try {
    const [customerResults] = await pool.query(findCustomerQuery, [customerName.trim(), userId]); // REPLACED db.query with await pool.query
    if (customerResults.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customerId = customerResults[0].id;
    
    const balanceQuery = `
      SELECT
        COALESCE(SUM(bs.billAmount), 0) - COALESCE(SUM(bp.amount), 0) as balance
      FROM bread_customers bc
      LEFT JOIN bread_sales bs ON bc.id = bs.customerId
      LEFT JOIN bread_payments bp ON bc.id = bp.customerId
      WHERE bc.id = ? AND bc.userId = ?
    `;
    const [balanceResults] = await pool.query(balanceQuery, [customerId, userId]); // REPLACED db.query with await pool.query
    
    const currentBalance = balanceResults[0]?.balance || 0;
    if (parseFloat(amount) > currentBalance) {
      return res.status(400).json({ message: "Payment amount cannot exceed outstanding balance" });
    }
    
    const paymentQuery = `
      INSERT INTO bread_payments (customerId, customerName, amount, userId)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.query(paymentQuery, [customerId, customerName.trim(), parseFloat(amount), userId]); // REPLACED db.query with await pool.query
    
    res.json({
      id: result.insertId,
      customerId,
      customerName: customerName.trim(),
      amount: parseFloat(amount),
      paymentDate: new Date().toISOString().split('T')[0],
      paymentTime: new Date().toTimeString().split(' ')[0]
    });
  } catch (err) {
    console.error("Error processing payment:", err);
    return res.status(500).json({ message: "Error processing payment" });
  }
});

app.get("/bread/stats", authenticateToken, async (req, res) => { // Made async
  const userId = req.user.id;
  const query = `
    SELECT
      COALESCE((SELECT SUM(billAmount) FROM bread_sales WHERE userId = ?), 0) as totalSales,
      COALESCE((SELECT SUM(amount) FROM bread_payments WHERE userId = ?), 0) as totalPaid,
      COALESCE((SELECT SUM(billAmount) FROM bread_sales WHERE userId = ?), 0) -
      COALESCE((SELECT SUM(amount) FROM bread_payments WHERE userId = ?), 0) as totalOutstanding,
      COUNT(DISTINCT bc.id) as customerCount
    FROM bread_customers bc
    WHERE bc.userId = ?
  `;
  try {
    const [results] = await pool.query(query, [userId, userId, userId, userId, userId]); // REPLACED db.query with await pool.query
    const stats = results[0] || {
      totalSales: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      customerCount: 0
    };
    res.json({
      totalSales: parseFloat(stats.totalSales || 0),
      totalPaid: parseFloat(stats.totalPaid || 0),
      totalOutstanding: parseFloat(stats.totalOutstanding || 0),
      customerCount: parseInt(stats.customerCount || 0)
    });
  } catch (err) {
    console.error("Error fetching bread stats:", err);
    return res.status(500).json({ message: "Error fetching statistics" });
  }
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;  // Railway gives you PORT automatically
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});