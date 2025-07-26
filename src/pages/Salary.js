import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Container, Table, Form, Button, Row, Col, Card, Alert } from "react-bootstrap";

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [labourNames, setLabourNames] = useState([]);
  const [newSalary, setNewSalary] = useState({ labourName: "", salaryAmount: "" });
  const [newLabour, setNewLabour] = useState("");
  const [notification, setNotification] = useState({ show: false, message: "", variant: "" });

  // Show notification
  const showNotification = useCallback((message, variant) => {
    setNotification({ show: true, message, variant });
    setTimeout(() => {
      setNotification({ show: false, message: "", variant: "" });
    }, 5000);
  }, []);

  // Fetch Labourers
  const fetchLabourers = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/labourers", { withCredentials: true });
      setLabourNames(response.data.map((labour) => labour.name));
    } catch (error) {
      console.error("Error fetching labourers", error);
      showNotification("Could not load workers list. Please check your connection.", "danger");
    }
  }, [showNotification]);

  // Fetch Salaries
  const fetchSalaries = useCallback(async () => {
    try {
      const response = await axios.get("http://localhost:5000/salaries", { withCredentials: true });
      setSalaries(response.data);
    } catch (error) {
      console.error("Error fetching salaries", error);
      showNotification("Could not load salary records. Please check your connection.", "danger");
    }
  }, [showNotification]);

  useEffect(() => {
    fetchLabourers();
    fetchSalaries();
  }, [fetchLabourers, fetchSalaries]);

  // Add Salary
  const addSalary = async () => {
    if (!newSalary.labourName || !newSalary.salaryAmount) {
      showNotification("Please fill in both worker name and salary amount", "warning");
      return;
    }

    const currentDate = new Date();
    const salaryEntry = {
      ...newSalary,
      day: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
     date: currentDate.toISOString().split('T')[0], // ⬅️ gives format like "2025-07-09"

      time: currentDate.toLocaleTimeString(),
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/salaries",
        salaryEntry,
        { withCredentials: true } // ✅ send token cookie
      );
      setSalaries([...salaries, response.data]);
      setNewSalary({ labourName: "", salaryAmount: "" });
      showNotification(`Salary of ₹${newSalary.salaryAmount} added for ${newSalary.labourName}`, "success");
    } catch (error) {
      console.error("Error adding salary", error);
      showNotification("Failed to add salary. Please try again.", "danger");
    }
  };


  // Add Labourer
  const addLabour = async () => {
    if (!newLabour.trim()) {
      showNotification("Please enter a valid worker name", "warning");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/labourers",
        { name: newLabour },
        { withCredentials: true } // ✅ Fix: Send cookie with JWT token
      );
      setLabourNames([...labourNames, newLabour]);
      setNewLabour("");
      showNotification(`Worker "${newLabour}" added successfully`, "success");
    } catch (error) {
      console.error("Error adding labourer", error);
      showNotification("Failed to add worker. Please try again.", "danger");
    }
  };


  // Organize salaries by labour name
  const salariesByLabour = {};
  salaries.forEach((salary) => {
    if (!salariesByLabour[salary.labourName]) {
      salariesByLabour[salary.labourName] = [];
    }
    salariesByLabour[salary.labourName].push({
      amount: parseFloat(salary.salaryAmount),
      day: salary.day,
      date: salary.date,
      time: salary.time,
    });
  });

  // Calculate Total Salaries Given in the Current Month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const totalSalaryThisMonth = salaries
    .filter((salary) => {
      const salaryDate = new Date(salary.date);
      return (
        salaryDate.getMonth() === currentMonth &&
        salaryDate.getFullYear() === currentYear
      );
    })
    .reduce((total, salary) => total + parseFloat(salary.salaryAmount), 0);

  // Get month name
  const monthName = new Date().toLocaleString('default', { month: 'long' });

  return (
    <Container className="py-4">
      <h1 className="text-center mb-4" style={{ fontSize: "32px", color: "#333" }}>Salary Management</h1>

      {notification.show && (
        <Alert variant={notification.variant} onClose={() => setNotification({ show: false })} dismissible>
          {notification.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col md={12} lg={6} className="mb-4">
          {/* Add Labour Form */}
          <Card className="border-primary" style={{ borderWidth: "2px" }}>
            <Card.Header className="bg-primary text-white" style={{ fontSize: "24px" }}>
              Add New Worker
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "18px" }}>Worker Name</Form.Label>
                  <Form.Control
                    type="text"
                    style={{ fontSize: "18px", height: "50px" }}
                    value={newLabour}
                    onChange={(e) => {
                      const capitalizedName = e.target.value
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase());
                      setNewLabour(capitalizedName);
                    }}
                    placeholder="Enter worker name"
                  />
                </Form.Group>
                <Button
                  onClick={addLabour}
                  className="w-100"
                  variant="primary"
                  size="lg"
                  style={{ fontSize: "20px" }}
                >
                  Add Worker
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={12} lg={6} className="mb-4">
          {/* Add Salary Form */}
          <Card className="border-success" style={{ borderWidth: "2px" }}>
            <Card.Header className="bg-success text-white" style={{ fontSize: "24px" }}>
              Add Salary Payment
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "18px" }}>Select Worker</Form.Label>
                  <Form.Select
                    style={{ fontSize: "18px", height: "50px" }}
                    value={newSalary.labourName}
                    onChange={(e) => setNewSalary({ ...newSalary, labourName: e.target.value })}
                  >
                    <option value="">Select Worker</option>
                    {labourNames.map((name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: "18px" }}>Salary Amount (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    style={{ fontSize: "18px", height: "50px" }}
                    value={newSalary.salaryAmount}
                    onChange={(e) => setNewSalary({ ...newSalary, salaryAmount: e.target.value })}
                    placeholder="Enter amount"
                  />
                </Form.Group>
                <Button
                  onClick={addSalary}
                  className="w-100"
                  variant="success"
                  size="lg"
                  style={{ fontSize: "20px" }}
                >
                  Add Salary
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Monthly Summary */}
      <Card className="mb-4 border-info" style={{ borderWidth: "2px" }}>
        <Card.Header className="bg-info text-white" style={{ fontSize: "24px" }}>
          {monthName} Summary
        </Card.Header>
        <Card.Body className="text-center">
          <h3 style={{ fontSize: "22px" }}>Total Salaries Paid This Month</h3>
          <h2 style={{ fontSize: "36px", color: "#28a745" }}>₹{totalSalaryThisMonth.toLocaleString('en-IN')}</h2>
          <h4 style={{ fontSize: "20px" }}>Total Workers: {labourNames.length}</h4>
        </Card.Body>
      </Card>

      {/* Salary Records */}
      <Card className="mb-4 border-dark" style={{ borderWidth: "2px" }}>
        <Card.Header className="bg-dark text-white" style={{ fontSize: "24px" }}>
          Salary Records
        </Card.Header>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table bordered hover className="mb-0">
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ fontSize: "18px", backgroundColor: "#e9ecef" }}>Worker Name</th>
                  <th style={{ fontSize: "18px", backgroundColor: "#e9ecef" }}>Salary Amount</th>
                  <th style={{ fontSize: "18px", backgroundColor: "#e9ecef" }}>Day</th>
                  <th style={{ fontSize: "18px", backgroundColor: "#e9ecef" }}>Date</th>
                  <th style={{ fontSize: "18px", backgroundColor: "#e9ecef" }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(salariesByLabour).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4" style={{ fontSize: "18px" }}>
                      No salary records available
                    </td>
                  </tr>
                ) : (
                  Object.keys(salariesByLabour).map((labourName, index) =>
                    salariesByLabour[labourName].map((salary, i) => (
                      <tr key={`${index}-${i}`}>
                        {i === 0 && (
                          <td
                            rowSpan={salariesByLabour[labourName].length}
                            className="align-middle"
                            style={{
                              fontSize: "18px",
                              fontWeight: "bold",
                              backgroundColor: "#e8f4f8"
                            }}
                          >
                            {labourName}
                          </td>
                        )}
                        <td style={{ fontSize: "18px", fontWeight: "bold", color: "#28a745" }}>
                          ₹{salary.amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: "18px" }}>{salary.day}</td>
                        <td style={{ fontSize: "18px" }}>{salary.date}</td>
                        <td style={{ fontSize: "18px" }}>{salary.time}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <td
                    colSpan="4"
                    className="text-end fw-bold"
                    style={{ fontSize: "20px" }}
                  >
                    Total Salaries This Month:
                  </td>
                  <td
                    className="fw-bold"
                    style={{ fontSize: "20px", color: "#28a745" }}
                  >
                    ₹{totalSalaryThisMonth.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Print Instructions */}
      <Card className="border-secondary mb-4">
        <Card.Body>
          <h4 style={{ fontSize: "20px" }}>Need a printed report?</h4>
          <p style={{ fontSize: "16px" }}>To print this page, press <kbd>Ctrl</kbd> + <kbd>P</kbd> on your keyboard (or <kbd>Cmd</kbd> + <kbd>P</kbd> on Mac).</p>
        </Card.Body>
      </Card>
    </Container>
  );
}