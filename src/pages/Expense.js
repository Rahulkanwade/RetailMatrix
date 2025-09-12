import React, { useState, useEffect } from "react";
import { Table, Form, Button, Container, Row, Col, Card, Badge } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const ExpenseCalculator = () => {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ name: "तेल", quantity: "", unit: "लिटर", price: "" });
  const [filterPeriod, setFilterPeriod] = useState("7days");

  const expenseOptions = ["तेल", "साखर", "तांदूळ", "गहू", "दूध"];
  const unitOptions = {
    "तेल": ["लिटर", "मिली"],
    "साखर": ["किलो", "ग्रॅम"],
    "तांदूळ": ["किलो", "ग्रॅम"],
    "गहू": ["किलो", "ग्रॅम"],
    "दूध": ["लिटर", "मिली"],
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const getCurrentDate = () => new Date().toISOString().split("T")[0];

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/expenses', { withCredentials: true });

      setExpenses(res.data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name") {
      setForm({ ...form, name: value, unit: unitOptions[value][0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.unit || !form.price) return;

   const newExpense = { ...form, date: new Date().toISOString().split("T")[0] }; // "2025-07-09"

    try {
      await axios.post("http://localhost:5000/add-expense", newExpense, {
  withCredentials: true,
});

      fetchExpenses();
    } catch (err) {
      console.error("Error adding expense:", err);
    }

    setForm({ name: "तेल", quantity: "", unit: "लिटर", price: "" });
  };

  const getFilteredExpenses = () => {
    const currentDate = new Date();
    let filterDate = new Date();
    
    switch (filterPeriod) {
      case "today":
        return expenses.filter(expense => 
          expense.date.substring(0, 10) === getCurrentDate()
        );
      case "7days":
        filterDate.setDate(currentDate.getDate() - 7);
        break;
      case "30days":
        filterDate.setDate(currentDate.getDate() - 30);
        break;
      case "90days":
        filterDate.setDate(currentDate.getDate() - 90);
        break;
      default:
        filterDate.setDate(currentDate.getDate() - 7);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= filterDate && expenseDate <= currentDate;
    });
  };

  const calculateTotal = (expenses) => {
    return expenses.reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);
  };

 const calculateDailyExpense = () => {
  const today = new Date().toISOString().split("T")[0];

  return expenses
    .filter(exp => {
      const localDate = new Date(exp.date).toLocaleDateString("en-CA"); // "YYYY-MM-DD"
      return localDate === today;
    })
    .reduce((total, item) => total + parseFloat(item.price), 0)
    .toFixed(2);
};



  const calculateMonthlyExpense = () => {
    return expenses
      .filter(expense => expense.date.slice(0, 7) === getCurrentDate().slice(0, 7))
      .reduce((total, item) => total + parseFloat(item.price), 0).toFixed(2);
  };

  const getCategoryTotals = () => {
    const totals = {};
    
    expenses.forEach(expense => {
      if (!totals[expense.name]) {
        totals[expense.name] = 0;
      }
      totals[expense.name] += parseFloat(expense.price);
    });
    
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  };

  const filteredExpenses = getFilteredExpenses();

  return (
    <Container fluid className="p-4 bg-light">
      <Card className="shadow-lg border-0 mb-4">
        <Card.Header className="bg-dark text-white">
          <h2 className="text-center mb-0 py-2">खर्च व्यवस्थापक</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {/* Add Expense Form */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">नवीन खर्च जोडा</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col xs={12} md={6} lg={3}>
                    <Form.Group>
                      <Form.Label>वस्तू</Form.Label>
                      <Form.Select 
                        name="name" 
                        value={form.name} 
                        onChange={handleChange} 
                        className="form-control-lg"
                        required
                      >
                        {expenseOptions.map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6} lg={3}>
                    <Form.Group>
                      <Form.Label>प्रमाण</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.01" 
                        name="quantity" 
                        placeholder="प्रमाण प्रविष्ट करा" 
                        value={form.quantity} 
                        onChange={handleChange} 
                        className="form-control-lg"
                        required 
                      />
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6} lg={3}>
                    <Form.Group>
                      <Form.Label>युनिट</Form.Label>
                      <Form.Select 
                        name="unit" 
                        value={form.unit} 
                        onChange={handleChange} 
                        className="form-control-lg"
                        required
                      >
                        {unitOptions[form.name].map((unit, index) => (
                          <option key={index} value={unit}>{unit}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6} lg={3}>
                    <Form.Group>
                      <Form.Label>किंमत (₹)</Form.Label>
                      <Form.Control 
                        type="number" 
                        step="0.01" 
                        name="price" 
                        placeholder="किंमत प्रविष्ट करा" 
                        value={form.price} 
                        onChange={handleChange} 
                        className="form-control-lg"
                        required 
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="text-center mt-3">
                  <Button 
                    type="submit" 
                    variant="primary" 
                    className="px-5 py-2"
                    size="lg"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    खर्च जोडा
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4 g-3">
            <Col xs={12} md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Header className="bg-success text-white">
                  <h5 className="mb-0">आजचा खर्च</h5>
                </Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h2 className="mb-0">₹{calculateDailyExpense()}</h2>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12} md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Header className="bg-primary text-white">
                  <h5 className="mb-0">मासिक खर्च</h5>
                </Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h2 className="mb-0">₹{calculateMonthlyExpense()}</h2>
                </Card.Body>
              </Card>
            </Col>
            
            <Col xs={12} md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Header className="bg-info text-white">
                  <h5 className="mb-0">निवडलेला कालावधी</h5>
                </Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center">
                  <h2 className="mb-0">₹{calculateTotal(filteredExpenses)}</h2>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Category Summary */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">श्रेणीनुसार तपशील</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {getCategoryTotals().map(([category, total], index) => (
                  <Col key={index} xs={6} md={4} lg={2}>
                    <Card className="text-center border-0 shadow-sm">
                      <Card.Body className="p-2">
                        <h6>{category}</h6>
                        <h5 className="mb-0 text-primary">₹{total.toFixed(2)}</h5>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          {/* Expense List */}
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-secondary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">खर्चाचा इतिहास</h5>
              <Form.Select 
                style={{ width: 'auto' }}
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                className="ms-auto"
              >
                <option value="today">आजचा</option>
                <option value="7days">मागील ७ दिवस</option>
                <option value="30days">मागील ३० दिवस</option>
                <option value="90days">मागील ९० दिवस</option>
              </Form.Select>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="px-3">वस्तू</th>
                      <th className="text-center">प्रमाण</th>
                      <th className="text-center">युनिट</th>
                      <th className="text-center">किंमत (₹)</th>
                      <th className="text-center">तारीख</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length > 0 ? (
                      filteredExpenses.map((expense, index) => (
                        <tr key={index}>
                          <td className="px-3">
                            <div className="d-flex align-items-center">
                              <Badge 
                                bg={
                                  expense.name === "Oil" ? "warning" :
                                  expense.name === "Sugar" ? "info" :
                                  expense.name === "Rice" ? "success" :
                                  expense.name === "Wheat" ? "secondary" :
                                  "primary"
                                }
                                className="me-2"
                              >
                                {expense.name.charAt(0)}
                              </Badge>
                              <span className="fw-medium">{expense.name}</span>
                            </div>
                          </td>
                          <td className="text-center">{expense.quantity}</td>
                          <td className="text-center">{expense.unit}</td>
                          <td className="text-center fw-bold">₹{parseFloat(expense.price).toFixed(2)}</td>
                          <td className="text-center">{new Date(expense.date).toLocaleDateString("mr-IN")}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center py-3">या कालावधीसाठी कोणताही खर्च आढळला नाही</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-light">
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">एकूण:</td>
                      <td className="text-center fw-bold">₹{calculateTotal(filteredExpenses)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ExpenseCalculator;