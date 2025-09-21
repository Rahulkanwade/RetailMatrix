const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

require("dotenv").config();

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(cookieParser());


app.use(express.json());

const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  ssl: {
    rejectUnauthorized: false   // 👈 important for Railway
  }
});


db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("✅ Connected to Railway MySQL");
  }
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
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
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
// Add these routes to your existing Express server (after the existing routes)

// ===== SUPPLIER MANAGEMENT =====

// Get all suppliers for logged-in user
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

// Get supplier with products
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

// Add new supplier
app.post("/suppliers", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, contact, address, billDate, products } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Supplier name is required" });
  }

  if (!contact || !contact.trim()) {
    return res.status(400).json({ message: "Contact number is required" });
  }

  // Validate contact format (+91XXXXXXXXXX)
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

    // Add products if provided
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

// Update supplier
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

  // Validate contact format
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

    // Delete existing products and add new ones
    db.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId], (err) => {
      if (err) {
        console.error("Error deleting old products:", err);
        return res.status(500).json({ message: "Error updating supplier products" });
      }

      // Add new products if provided
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

// Delete supplier
app.delete("/suppliers/:id", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const supplierId = req.params.id;

  // First delete all products for this supplier
  db.query("DELETE FROM supplier_products WHERE supplierId = ? AND userId = ?", [supplierId, userId], (err) => {
    if (err) {
      console.error("Error deleting supplier products:", err);
      return res.status(500).json({ message: "Error deleting supplier products" });
    }

    // Then delete the supplier
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

// ===== SUPPLIER PRODUCTS MANAGEMENT =====

// Get all products for a supplier
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

// Add product to supplier
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

  // Verify supplier belongs to user
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

// Delete supplier product
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

// ===== INVENTORY MANAGEMENT =====

// Get inventory summary
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

// Get supplier statistics
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
// Get all products for a single supplier
app.get("/suppliers/:supplierId/products", authenticateToken, (req, res) => {
  const { supplierId } = req.params;
  const userId = req.user.id;

  const query = `
        SELECT * FROM supplier_products 
        WHERE supplierId = ? AND userId = ?
        ORDER BY dateAdded DESC
    `;

  db.query(query, [supplierId, userId], (err, results) => {
    if (err) {
      console.error("Error fetching supplier products:", err);
      return res.status(500).json({ message: "Error fetching products" });
    }
    res.json(results);
  });
});





// Add these routes to your existing backend.js file

// ===== BREAD SALES MANAGEMENT =====


app.get("/bread/price", authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.query("SELECT price FROM bread_prices WHERE userId = ? ORDER BY dateUpdated DESC LIMIT 1", [userId], (err, results) => {
    if (err) {
      console.error("Error fetching bread price:", err);
      return res.status(500).json({ message: "Error fetching bread price" });
    }

    // Default price if none set
    const price = results.length > 0 ? results[0].price : 45;
    res.json({ price });
  });
});

// Update bread price
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

// Get all bread customers for logged-in user
// Remove the simpler version and keep only:
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

    res.json(results); // Remove the formatting that converts numbers back to strings
  });
});

// Get detailed customer data with sales and payments
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

// Add new bread sale
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

  // First, ensure customer exists
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
          saleDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          saleTime: new Date().toTimeString().split(' ')[0]  // HH:MM:SS
        });
      });
    };

    if (customerResults.length > 0) {
      // Customer exists
      processSale(customerResults[0].id);
    } else {
      // Create new customer
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

// Record bread payment
app.post("/bread/payments", authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { customerName, amount } = req.body;

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ message: "Customer name is required" });
  }

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: "Valid payment amount is required" });
  }

  // Find customer
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

    // Check current balance
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

      // Record payment
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

    // Ensure numbers are properly formatted
    res.json({
      totalSales: parseFloat(stats.totalSales || 0),
      totalPaid: parseFloat(stats.totalPaid || 0),
      totalOutstanding: parseFloat(stats.totalOutstanding || 0),
      customerCount: parseInt(stats.customerCount || 0)
    });
  });
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
