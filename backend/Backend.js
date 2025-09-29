const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

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
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: false
  }
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

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("✅ Connected to Railway MySQL");
  }
});

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add token expiry check
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
    db.query(checkUserSql, [normalizedEmail], async (err, results) => {
      if (err) {
        console.error("Database error during user check:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "User already exists with this email" });
      }

      // Hash password with higher salt rounds for better security
      const hashedPassword = await bcrypt.hash(password, 12);
      
      const insertSql = "INSERT INTO users (email, password, createdAt) VALUES (?, ?, NOW())";
      db.query(insertSql, [normalizedEmail, hashedPassword], (err, result) => {
        if (err) {
          console.error("Database error during user creation:", err);
          // Check for duplicate entry error specifically
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: "User already exists with this email" });
          }
          return res.status(500).json({ error: "Failed to create user account" });
        }

        res.status(201).json({ 
          message: "Account created successfully",
          userId: result.insertId 
        });
      });
    });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
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

    // Normalize email
    const normalizedEmail = validator.normalizeEmail(email);

    const sql = "SELECT id, email, password, lastLoginAt FROM users WHERE email = ?";
    db.query(sql, [normalizedEmail], async (err, results) => {
      if (err) {
        console.error("Database error during login:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      // Generic error message to prevent user enumeration
      if (results.length === 0) {
        // Still hash password to prevent timing attacks
        await bcrypt.hash(password, 12);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const user = results[0];
      
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Update last login timestamp
      const updateLoginSql = "UPDATE users SET lastLoginAt = NOW() WHERE id = ?";
      db.query(updateLoginSql, [user.id], (err) => {
        if (err) {
          console.error("Error updating last login:", err);
          // Don't fail login for this
        }
      });

      // Create JWT token with shorter expiry for better security
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email,
          iat: Math.floor(Date.now() / 1000) // issued at
        }, 
        process.env.JWT_SECRET, 
        { 
          expiresIn: "24h", // Reduced from 1h to 24h for better UX, but could be shorter
          issuer: 'your-app-name',
          audience: 'your-app-users'
        }
      );

      // Set secure cookie
      res.cookie("token", token, {
  httpOnly: true,
  secure: false,  // Changed for mobile
  sameSite: 'none',
  maxAge: 24 * 60 * 60 * 1000,
  path: '/'
});

      res.json({ 
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email
        }
      });
    });

  } catch (error) {
    console.error("Login error:", error);
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

app.get("/profile", (req, res) => {
  const token = req.cookies.token;
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch fresh user data from database
    const sql = "SELECT id, email, createdAt, lastLoginAt FROM users WHERE id = ?";
    db.query(sql, [decoded.id], (err, results) => {
      if (err) {
        console.error("Database error fetching profile:", err);
        return res.status(500).json({ message: "Internal server error" });
      }

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
app.get("/customers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM customers WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch customers" });
    res.json(results);
  });
});

app.post("/customers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  db.query("INSERT INTO customers (name, userId) VALUES (?, ?)", [name, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add customer" });
    res.json({ id: result.insertId, name });
  });
});

app.get("/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch orders" });
    const parsed = results.map((order) => ({
      ...order,
      customerId: order.customerId || null,
      cakes: JSON.parse(order.cakes),
      pastries: JSON.parse(order.pastries)
    }));
    res.json(parsed);
  });
});

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

app.put("/orders/:id", (req, res) => {
  const { deliveryDate } = req.body;
  const { id } = req.params;
  db.query("UPDATE orders SET deliveryDate = ? WHERE id = ?", [deliveryDate, id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to update delivery date" });
    res.json({ message: "Updated" });
  });
});

app.delete("/orders/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM orders WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ error: "Failed to delete order" });
    res.json({ message: "Deleted" });
  });
});

// --- General Payments Management ---
app.post("/payments/customer", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType } = req.body;
  if (!customerId || !customerName || !amount) {
    return res.status(400).json({ error: "Customer ID, name, and amount are required" });
  }
  const query = `
    INSERT INTO payments (customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(query, [customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add customer payment" });
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
  });
});

app.get("/payments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM payments WHERE userId = ? ORDER BY paymentDate DESC", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch payments" });
    res.json(results);
  });
});

app.post("/payments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes } = req.body;
  if (!orderId || !customerId || !amount) {
    return res.status(400).json({ error: "Order, customer, and amount are required" });
  }
  const query = `
    INSERT INTO payments (orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, userId)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'order', ?)
  `;
  db.query(query, [orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to add payment" });
    res.json({ id: result.insertId, orderId, customerId, customerName, amount, paymentMethod, paymentDate, notes });
  });
});

app.delete("/payments/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  db.query("DELETE FROM payments WHERE id = ? AND userId = ?", [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to delete payment" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  });
});

// --- Labourer & Salary Management ---
app.get("/labourers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM labourers WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching labourers" });
    res.json(results);
  });
});

app.post("/labourers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Name required" });
  db.query("INSERT INTO labourers (name, userId) VALUES (?, ?)", [name, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "Error adding labourer" });
    res.json({ id: result.insertId, name });
  });
});

app.get("/salaries", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM salaries WHERE userId = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching salaries" });
    res.json(results);
  });
});

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

// --- Price Management ---
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

// --- Expense Management ---

// Add these expense management endpoints to your existing backend code
// Place these after your existing routes, before the "Server Startup" section

// --- Expense Management ---

// Get all expenses for the authenticated user
app.get("/expenses", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT * FROM expenses 
    WHERE userId = ? 
    ORDER BY date DESC, createdAt DESC
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching expenses:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
    res.json(results);
  });
});

// Add new expenses (can handle multiple expenses at once)
app.post("/expenses", authenticateToken, (req, res) => {
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

  db.query(insertQuery, [expenseValues], (err, result) => {
    if (err) {
      console.error("Error adding expenses:", err);
      return res.status(500).json({ error: "Failed to add expenses" });
    }

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
  });
});

// Update an expense
app.put("/expenses/:id", authenticateToken, (req, res) => {
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

  db.query(updateQuery, [
    itemName,
    category,
    parseFloat(quantity),
    parseFloat(pricePerUnit),
    totalAmount,
    unit,
    date || new Date().toISOString().split('T')[0],
    expenseId,
    userId
  ], (err, result) => {
    if (err) {
      console.error("Error updating expense:", err);
      return res.status(500).json({ error: "Failed to update expense" });
    }

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
  });
});

// Delete an expense
app.delete("/expenses/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const expenseId = req.params.id;

  const deleteQuery = "DELETE FROM expenses WHERE id = ? AND userId = ?";

  db.query(deleteQuery, [expenseId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting expense:", err);
      return res.status(500).json({ error: "Failed to delete expense" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  });
});

// Get expense statistics
app.get("/expenses/stats", authenticateToken, (req, res) => {
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

  // Get overall stats
  db.query(overallQuery, [userId], (err, overallResults) => {
    if (err) {
      console.error("Error fetching overall expense stats:", err);
      return res.status(500).json({ error: "Failed to fetch expense statistics" });
    }

    // Get category-wise stats
    db.query(statsQuery, [userId], (err, categoryResults) => {
      if (err) {
        console.error("Error fetching category expense stats:", err);
        return res.status(500).json({ error: "Failed to fetch expense statistics" });
      }

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
    });
  });
});

// Get expenses by date range
app.get("/expenses/range", authenticateToken, (req, res) => {
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

  db.query(query, [userId, startDate, endDate], (err, results) => {
    if (err) {
      console.error("Error fetching expenses by date range:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }

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
  });
});

// Get expenses by category
app.get("/expenses/category/:category", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { category } = req.params;

  const query = `
    SELECT * FROM expenses 
    WHERE userId = ? AND category = ?
    ORDER BY date DESC, createdAt DESC
  `;

  db.query(query, [userId, category], (err, results) => {
    if (err) {
      console.error("Error fetching expenses by category:", err);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }

    const totalAmount = results.reduce((sum, expense) => sum + parseFloat(expense.totalAmount || 0), 0);

    res.json({
      expenses: results,
      summary: {
        category,
        count: results.length,
        totalAmount: totalAmount
      }
    });
  });
});
// --- Loan & Repayment Management ---
app.get("/loans", authenticateToken, (req, res) => {
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
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching loans:", err);
      return res.status(500).json({ message: "Error fetching loans" });
    }
    res.json(results);
  });
});

app.post("/loans", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { borrower, loanAmount } = req.body;
  if (!borrower || !borrower.trim()) {
    return res.status(400).json({ message: "Borrower name is required" });
  }
  if (!loanAmount || parseFloat(loanAmount) <= 0) {
    return res.status(400).json({ message: "Valid loan amount is required" });
  }
  const query = "INSERT INTO loans (borrower, loanAmount, userId) VALUES (?, ?, ?)";
  db.query(query, [borrower.trim(), parseFloat(loanAmount), userId], (err, result) => {
    if (err) {
      console.error("Error adding loan:", err);
      return res.status(500).json({ message: "Error adding loan" });
    }
    res.json({
      id: result.insertId,
      borrower: borrower.trim(),
      loanAmount: parseFloat(loanAmount),
      dateAdded: new Date().toISOString(),
      totalRepaid: 0,
      pendingAmount: parseFloat(loanAmount)
    });
  });
});

app.delete("/loans/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;
  db.query("DELETE FROM repayments WHERE loanId = ? AND userId = ?", [loanId, userId], (err) => {
    if (err) {
      console.error("Error deleting repayments:", err);
      return res.status(500).json({ message: "Error deleting loan repayments" });
    }
    db.query("DELETE FROM loans WHERE id = ? AND userId = ?", [loanId, userId], (err, result) => {
      if (err) {
        console.error("Error deleting loan:", err);
        return res.status(500).json({ message: "Error deleting loan" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json({ message: "Loan deleted successfully" });
    });
  });
});

app.get("/loans/:id/repayments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;
  const query = `
    SELECT r.* FROM repayments r
    JOIN loans l ON r.loanId = l.id
    WHERE r.loanId = ? AND r.userId = ? AND l.userId = ?
    ORDER BY r.date DESC
  `;
  db.query(query, [loanId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching repayments:", err);
      return res.status(500).json({ message: "Error fetching repayments" });
    }
    res.json(results);
  });
});

app.post("/loans/:id/repayments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;
  const { amount } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Valid repayment amount is required" });
  }
  db.query("SELECT * FROM loans WHERE id = ? AND userId = ?", [loanId, userId], (err, loanResults) => {
    if (err) {
      console.error("Error verifying loan:", err);
      return res.status(500).json({ message: "Error verifying loan" });
    }
    if (loanResults.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }
    const query = "INSERT INTO repayments (loanId, amount, userId) VALUES (?, ?, ?)";
    db.query(query, [loanId, parseFloat(amount), userId], (err, result) => {
      if (err) {
        console.error("Error adding repayment:", err);
        return res.status(500).json({ message: "Error adding repayment" });
      }
      res.json({
        id: result.insertId,
        loanId: parseInt(loanId),
        amount: parseFloat(amount),
        date: new Date().toISOString()
      });
    });
  });
});

app.delete("/repayments/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const repaymentId = req.params.id;
  const query = `
    DELETE r FROM repayments r
    JOIN loans l ON r.loanId = l.id
    WHERE r.id = ? AND r.userId = ? AND l.userId = ?
  `;
  db.query(query, [repaymentId, userId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting repayment:", err);
      return res.status(500).json({ message: "Error deleting repayment" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Repayment not found" });
    }
    res.json({ message: "Repayment deleted successfully" });
  });
});

app.get("/loans/stats", authenticateToken, (req, res) => {
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
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching loan stats:", err);
      return res.status(500).json({ message: "Error fetching loan statistics" });
    }
    const stats = results[0] || {
      totalLoaned: 0,
      totalRepaid: 0,
      totalPending: 0,
      totalLoans: 0
    };
    res.json(stats);
  });
});

// --- Supplier & Inventory Management ---
app.get("/suppliers", authenticateToken, (req, res) => {
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
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching suppliers:", err);
      return res.status(500).json({ message: "Error fetching suppliers" });
    }
    res.json(results);
  });
});

app.get("/suppliers/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const supplierId = req.params.id;
  const supplierQuery = "SELECT * FROM suppliers WHERE id = ? AND userId = ?";
  const productsQuery = "SELECT * FROM supplier_products WHERE supplierId = ? AND userId = ?";
  db.query(supplierQuery, [supplierId, userId], (err, supplierResults) => {
    if (err) {
      console.error("Error fetching supplier:", err);
      return res.status(500).json({ message: "Error fetching supplier" });
    }
    if (supplierResults.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    db.query(productsQuery, [supplierId, userId], (err, productsResults) => {
      if (err) {
        console.error("Error fetching supplier products:", err);
        return res.status(500).json({ message: "Error fetching supplier products" });
      }
      const supplier = supplierResults[0];
      supplier.products = productsResults;
      res.json(supplier);
    });
  });
});

app.post("/suppliers", authenticateToken, (req, res) => {
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
  db.query(supplierQuery, [name.trim(), contact, address || "", billDate, userId], (err, result) => {
    if (err) {
      console.error("Error adding supplier:", err);
      return res.status(500).json({ message: "Error adding supplier" });
    }
    const supplierId = result.insertId;
    if (products && products.length > 0) {
      const productPromises = products.map(product => {
        return new Promise((resolve, reject) => {
          const productQuery = `
            INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(productQuery, [
            supplierId,
            product.name,
            product.quantity,
            product.unit,
            product.price,
            product.category,
            userId
          ], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
      Promise.all(productPromises)
        .then(() => {
          res.json({
            id: supplierId,
            name: name.trim(),
            contact,
            address,
            billDate,
            products
          });
        })
        .catch((err) => {
          console.error("Error adding supplier products:", err);
          res.status(500).json({ message: "Supplier added but error adding products" });
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
  });
});

app.put("/suppliers/:id", authenticateToken, (req, res) => {
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
  db.query(updateQuery, [name.trim(), contact, address || "", billDate, supplierId, userId], (err, result) => {
    if (err) {
      console.error("Error updating supplier:", err);
      return res.status(500).json({ message: "Error updating supplier" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    db.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId], (err) => {
      if (err) {
        console.error("Error deleting old products:", err);
        return res.status(500).json({ message: "Error updating supplier products" });
      }
      if (products && products.length > 0) {
        const productPromises = products.map(product => {
          return new Promise((resolve, reject) => {
            const productQuery = `
              INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            db.query(productQuery, [
              supplierId,
              product.name,
              product.quantity,
              product.unit,
              product.price,
              product.category,
              userId
            ], (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });
        Promise.all(productPromises)
          .then(() => {
            res.json({ message: "Supplier updated successfully" });
          })
          .catch((err) => {
            console.error("Error adding updated products:", err);
            res.status(500).json({ message: "Supplier updated but error adding products" });
          });
      } else {
        res.json({ message: "Supplier updated successfully" });
      }
    });
  });
});

app.delete("/suppliers/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const supplierId = req.params.id;
  db.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId], (err) => {
    if (err) {
      console.error("Error deleting supplier products:", err);
      return res.status(500).json({ message: "Error deleting supplier products" });
    }
    db.query("DELETE FROM suppliers WHERE id = ? AND userId = ?", [supplierId, userId], (err, result) => {
      if (err) {
        console.error("Error deleting supplier:", err);
        return res.status(500).json({ message: "Error deleting supplier" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      res.json({ message: "Supplier deleted successfully" });
    });
  });
});

app.get("/suppliers/:id/products", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const supplierId = req.params.id;
  const query = `
    SELECT sp.* FROM supplier_products sp
    JOIN suppliers s ON sp.supplierId = s.id
    WHERE sp.supplierId = ? AND sp.userId = ? AND s.userId = ?
    ORDER BY sp.name
  `;
  db.query(query, [supplierId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching supplier products:", err);
      return res.status(500).json({ message: "Error fetching supplier products" });
    }
    res.json(results);
  });
});

app.post("/suppliers/:id/products", authenticateToken, (req, res) => {
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
  db.query("SELECT id FROM suppliers WHERE id = ? AND userId = ?", [supplierId, userId], (err, supplierResults) => {
    if (err) {
      console.error("Error verifying supplier:", err);
      return res.status(500).json({ message: "Error verifying supplier" });
    }
    if (supplierResults.length === 0) {
      return res.status(404).json({ message: "Supplier not found" });
    }
    const query = `
      INSERT INTO supplier_products (supplierId, name, quantity, unit, price, category, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [supplierId, name.trim(), quantity, unit, price, category, userId], (err, result) => {
      if (err) {
        console.error("Error adding supplier product:", err);
        return res.status(500).json({ message: "Error adding supplier product" });
      }
      res.json({
        id: result.insertId,
        supplierId: parseInt(supplierId),
        name: name.trim(),
        quantity,
        unit,
        price,
        category
      });
    });
  });
});

app.delete("/supplier-products/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const productId = req.params.id;
  const query = `
    DELETE sp FROM supplier_products sp
    JOIN suppliers s ON sp.supplierId = s.id
    WHERE sp.id = ? AND sp.userId = ? AND s.userId = ?
  `;
  db.query(query, [productId, userId, userId], (err, result) => {
    if (err) {
      console.error("Error deleting supplier product:", err);
      return res.status(500).json({ message: "Error deleting supplier product" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Supplier product not found" });
    }
    res.json({ message: "Supplier product deleted successfully" });
  });
});

app.get("/inventory", authenticateToken, (req, res) => {
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
  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching inventory:", err);
      return res.status(500).json({ message: "Error fetching inventory" });
    }
    res.json(results);
  });
});

app.get("/suppliers/stats", authenticateToken, (req, res) => {
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
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching supplier stats:", err);
      return res.status(500).json({ message: "Error fetching supplier statistics" });
    }
    const stats = results[0] || {
      totalSuppliers: 0,
      totalProducts: 0,
      totalValue: 0,
      averageOrderValue: 0
    };
    res.json(stats);
  });
});

// --- Bread Sales Management ---
app.get("/bread/price", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT price FROM bread_prices WHERE userId = ? ORDER BY dateUpdated DESC LIMIT 1", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching bread price:", err);
      return res.status(500).json({ message: "Error fetching bread price" });
    }
    const price = results.length > 0 ? results[0].price : 45;
    res.json({ price });
  });
});

app.put("/bread/price", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { price } = req.body;
  if (!price || price <= 0) {
    return res.status(400).json({ message: "Valid price is required" });
  }
  const query = "INSERT INTO bread_prices (userId, price) VALUES (?, ?)";
  db.query(query, [userId, parseFloat(price)], (err, result) => {
    if (err) {
      console.error("Error updating bread price:", err);
      return res.status(500).json({ message: "Error updating bread price" });
    }
    res.json({ price: parseFloat(price), message: "Price updated successfully" });
  });
});

app.get("/bread/customers", authenticateToken, (req, res) => {
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
  db.query(query, [userId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching bread customers:", err);
      return res.status(500).json({ message: "Error fetching customers" });
    }
    res.json(results);
  });
});

app.get("/bread/customers/:id/details", authenticateToken, (req, res) => {
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
  db.query(customerQuery, [customerId, userId], (err, customerResults) => {
    if (err || customerResults.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    const customer = customerResults[0];
    db.query(salesQuery, [customerId, userId], (err, salesResults) => {
      if (err) {
        console.error("Error fetching customer sales:", err);
        return res.status(500).json({ message: "Error fetching customer sales" });
      }
      db.query(paymentsQuery, [customerId, userId], (err, paymentsResults) => {
        if (err) {
          console.error("Error fetching customer payments:", err);
          return res.status(500).json({ message: "Error fetching customer payments" });
        }
        customer.sales = salesResults;
        customer.payments = paymentsResults;
        res.json(customer);
      });
    });
  });
});

app.post("/bread/sales", authenticateToken, (req, res) => {
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
  db.query(checkCustomerQuery, [customerName.trim(), userId], (err, customerResults) => {
    if (err) {
      console.error("Error checking customer:", err);
      return res.status(500).json({ message: "Error processing sale" });
    }
    const processSale = (customerId) => {
      const saleQuery = `
        INSERT INTO bread_sales (customerId, customerName, quantity, pricePerDozen, billAmount, userId)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(saleQuery, [customerId, customerName.trim(), quantity, pricePerDozen, billAmount, userId], (err, result) => {
        if (err) {
          console.error("Error adding bread sale:", err);
          return res.status(500).json({ message: "Error adding sale" });
        }
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
      });
    };
    if (customerResults.length > 0) {
      processSale(customerResults[0].id);
    } else {
      const createCustomerQuery = "INSERT INTO bread_customers (name, userId) VALUES (?, ?)";
      db.query(createCustomerQuery, [customerName.trim(), userId], (err, result) => {
        if (err) {
          console.error("Error creating customer:", err);
          return res.status(500).json({ message: "Error creating customer" });
        }
        processSale(result.insertId);
      });
    }
  });
});

app.post("/bread/payments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { customerName, amount } = req.body;
  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ message: "Customer name is required" });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid payment amount is required" });
  }
  const findCustomerQuery = "SELECT id FROM bread_customers WHERE name = ? AND userId = ?";
  db.query(findCustomerQuery, [customerName.trim(), userId], (err, customerResults) => {
    if (err) {
      console.error("Error finding customer:", err);
      return res.status(500).json({ message: "Error processing payment" });
    }
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
    db.query(balanceQuery, [customerId, userId], (err, balanceResults) => {
      if (err) {
        console.error("Error checking balance:", err);
        return res.status(500).json({ message: "Error checking balance" });
      }
      const currentBalance = balanceResults[0]?.balance || 0;
      if (parseFloat(amount) > currentBalance) {
        return res.status(400).json({ message: "Payment amount cannot exceed outstanding balance" });
      }
      const paymentQuery = `
        INSERT INTO bread_payments (customerId, customerName, amount, userId)
        VALUES (?, ?, ?, ?)
      `;
      db.query(paymentQuery, [customerId, customerName.trim(), parseFloat(amount), userId], (err, result) => {
        if (err) {
          console.error("Error recording payment:", err);
          return res.status(500).json({ message: "Error recording payment" });
        }
        res.json({
          id: result.insertId,
          customerId,
          customerName: customerName.trim(),
          amount: parseFloat(amount),
          paymentDate: new Date().toISOString().split('T')[0],
          paymentTime: new Date().toTimeString().split(' ')[0]
        });
      });
    });
  });
});

app.get("/bread/stats", authenticateToken, (req, res) => {
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
  db.query(query, [userId, userId, userId, userId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching bread stats:", err);
      return res.status(500).json({ message: "Error fetching statistics" });
    }
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
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 5000;  // Railway gives you PORT automatically
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});