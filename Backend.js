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
// Update existing GET orders endpoint
app.get("/orders", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT * FROM orders WHERE userId = ? ORDER BY orderDate DESC", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch orders" });

    const parsed = results.map((order) => ({
      ...order,
      customerId: order.customerId || null, // Ensure customerId is included
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






// ===== PAYMENTS MANAGEMENT =====


// Add customer payment (new endpoint needed)
app.post("/payments/customer", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { customerId, customerName, amount, paymentMethod, paymentDate, notes, paymentType, customerOrders } = req.body;

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

// Update existing GET payments endpoint
app.get("/payments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  db.query("SELECT * FROM payments WHERE userId = ? ORDER BY paymentDate DESC", [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch payments" });
    res.json(results);
  });
});

// Update existing POST payments endpoint
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

// Delete a payment
app.delete("/payments/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query("DELETE FROM payments WHERE id = ? AND userId = ?", [id, userId], (err, result) => {
    if (err) return res.status(500).json({ error: "Failed to delete payment" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Payment not found" });
    res.json({ message: "Payment deleted" });
  });
});








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

// ===== POST Add New Loan =====
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

// ===== DELETE Loan =====
app.delete("/loans/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;
  
  // First delete all repayments for this loan
  db.query("DELETE FROM repayments WHERE loanId = ? AND userId = ?", [loanId, userId], (err) => {
    if (err) {
      console.error("Error deleting repayments:", err);
      return res.status(500).json({ message: "Error deleting loan repayments" });
    }
    
    // Then delete the loan
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

// ===== GET Repayments for a specific loan =====
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

// ===== POST Add Repayment =====
app.post("/loans/:id/repayments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const loanId = req.params.id;
  const { amount } = req.body;
  
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: "Valid repayment amount is required" });
  }
  
  // First verify the loan belongs to the user
  db.query("SELECT * FROM loans WHERE id = ? AND userId = ?", [loanId, userId], (err, loanResults) => {
    if (err) {
      console.error("Error verifying loan:", err);
      return res.status(500).json({ message: "Error verifying loan" });
    }
    
    if (loanResults.length === 0) {
      return res.status(404).json({ message: "Loan not found" });
    }
    
    // Add the repayment
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

// ===== DELETE Repayment =====
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

// ===== GET Loan Statistics =====
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


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
