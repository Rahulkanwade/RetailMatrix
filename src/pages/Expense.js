import React, { useState, useEffect } from "react";
import { Table, Form, Button, Container, Row, Col, Card, InputGroup } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const ExpenseCalculator = () => {
  const [expenses, setExpenses] = useState([
    // Mock data for demonstration
    { name: "तेल", quantity: "2", unit: "लिटर", price: "180", date: "2025-09-17" },
    { name: "साखर", quantity: "1", unit: "किलो", price: "45", date: "2025-09-17" },
    { name: "तांदूळ", quantity: "5", unit: "किलो", price: "350", date: "2025-09-16" },
    { name: "दूध", quantity: "1", unit: "लिटर", price: "60", date: "2025-09-16" },
    { name: "गहू", quantity: "10", unit: "किलो", price: "400", date: "2025-09-15" }
  ]);
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
    // Initial setup or data loading would go here
  }, []);
  const getCurrentDate = () => new Date().toISOString().split("T")[0];



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

    const newExpense = { ...form, date: new Date().toISOString().split("T")[0] };

    // Add to mock data for demonstration
    setExpenses(prev => [newExpense, ...prev]);
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
        const localDate = new Date(exp.date).toLocaleDateString("en-CA");
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

  const customStyles = {
    primaryGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    successGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warningGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    infoGradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    cardShadow: '0 10px 30px rgba(0,0,0,0.1)',
    headerGradient: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <Container fluid className="py-4">
        {/* Header */}
        <div className="text-center mb-5">
          <h1
            className="display-4 fw-bold text-white mb-2"
            style={{
              background: customStyles.headerGradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            खर्च व्यवस्थापक
          </h1>
          <p className="lead text-muted">व्यावसायिक खर्च व्यवस्थापन प्रणाली</p>
        </div>

        {/* Add Expense Form */}
        <Card
          className="border-0 mb-5"
          style={{
            boxShadow: customStyles.cardShadow,
            borderRadius: '20px',
            overflow: 'hidden'
          }}
        >
          <Card.Header
            className="text-white py-4"
            style={{
              background: customStyles.primaryGradient,
              border: 'none'
            }}
          >
            <div className="d-flex align-items-center">
              <div
                className="rounded-circle bg-white bg-opacity-25 p-2 me-3"
                style={{ width: '50px', height: '50px' }}
              >
                <svg width="34" height="34" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                  <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
              </div>
              <div>
                <h4 className="mb-0">नवीन खर्च जोडा</h4>
                <small className="opacity-75">तपशील भरून खर्च नोंदवा</small>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-4">
            <Form onSubmit={handleSubmit}>
              <Row className="g-4">
                <Col xs={12} lg={6} xl={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2">वस्तू</Form.Label>
                    <Form.Select
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-control-lg border-0 shadow-sm"
                      style={{ borderRadius: '10px', backgroundColor: '#f8f9fc' }}
                      required
                    >
                      {expenseOptions.map((option, index) => (
                        <option key={index} value={option}>{option}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} lg={6} xl={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2">प्रमाण</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="quantity"
                      placeholder="प्रमाण"
                      value={form.quantity}
                      onChange={handleChange}
                      className="form-control-lg border-0 shadow-sm"
                      style={{ borderRadius: '10px', backgroundColor: '#f8f9fc' }}
                      required
                    />
                  </Form.Group>
                </Col>

                <Col xs={12} lg={6} xl={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2">युनिट</Form.Label>
                    <Form.Select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className="form-control-lg border-0 shadow-sm"
                      style={{ borderRadius: '10px', backgroundColor: '#f8f9fc' }}
                      required
                    >
                      {unitOptions[form.name].map((unit, index) => (
                        <option key={index} value={unit}>{unit}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col xs={12} lg={6} xl={3}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-dark mb-2">किंमत</Form.Label>
                    <InputGroup className="shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                      <InputGroup.Text
                        className="border-0 bg-light"
                        style={{ backgroundColor: '#f8f9fc !important' }}
                      >
                        ₹
                      </InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="price"
                        placeholder="0.00"
                        value={form.price}
                        onChange={handleChange}
                        className="form-control-lg border-0"
                        style={{ backgroundColor: '#f8f9fc' }}
                        required
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <div className="text-center mt-4">
                <Button
                  type="submit"
                  className="px-5 py-3 fw-semibold border-0 shadow-sm"
                  size="lg"
                  style={{
                    background: customStyles.successGradient,
                    borderRadius: '50px',
                    transition: 'all 0.3s ease',
                    fontSize: '1.1rem'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                    <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3v-3z" />
                  </svg>
                  खर्च जोडा
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        {/* Summary Cards */}
        <Row className="mb-5 g-4">
          <Col xs={12} lg={4}>
            <Card
              className="border-0 text-center h-100"
              style={{
                boxShadow: customStyles.cardShadow,
                borderRadius: '20px',
                background: customStyles.successGradient
              }}
            >
              <Card.Body className="p-4 text-white">
                <div className="mb-3">
                  <div
                    className="rounded-circle bg-white bg-opacity-25 mx-auto d-flex align-items-center justify-content-center"
                    style={{ width: '70px', height: '70px' }}
                  >
                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z" />
                    </svg>
                  </div>
                </div>
                <h6 className="mb-2 opacity-90">आजचा खर्च</h6>
                <h2 className="mb-0 fw-bold">₹{calculateDailyExpense()}</h2>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={4}>
            <Card
              className="border-0 text-center h-100"
              style={{
                boxShadow: customStyles.cardShadow,
                borderRadius: '20px',
                background: customStyles.warningGradient
              }}
            >
              <Card.Body className="p-4 text-white">
                <div className="mb-3">
                  <div
                    className="rounded-circle bg-white bg-opacity-25 mx-auto d-flex align-items-center justify-content-center"
                    style={{ width: '70px', height: '70px' }}
                  >
                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                    </svg>
                  </div>
                </div>
                <h6 className="mb-2 opacity-90">मासिक खर्च</h6>
                <h2 className="mb-0 fw-bold">₹{calculateMonthlyExpense()}</h2>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} lg={4}>
            <Card
              className="border-0 text-center h-100"
              style={{
                boxShadow: customStyles.cardShadow,
                borderRadius: '20px',
                background: customStyles.infoGradient,
                color: '#2c3e50'
              }}
            >
              <Card.Body className="p-4">
                <div className="mb-3">
                  <div
                    className="rounded-circle bg-white bg-opacity-50 mx-auto d-flex align-items-center justify-content-center"
                    style={{ width: '70px', height: '70px' }}
                  >
                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                    </svg>
                  </div>
                </div>
                <h6 className="mb-2 opacity-75">निवडलेला कालावधी</h6>
                <h2 className="mb-0 fw-bold">₹{calculateTotal(filteredExpenses)}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Category Summary */}
        <Card
          className="border-0 mb-5"
          style={{
            boxShadow: customStyles.cardShadow,
            borderRadius: '20px'
          }}
        >
          <Card.Header
            className="bg-white py-4 border-0"
            style={{ borderRadius: '20px 20px 0 0' }}
          >
            <h5 className="mb-0 fw-bold text-dark">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="me-2 text-primary">
                <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
              </svg>
              श्रेणीनुसार तपशील
            </h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Row className="g-3">
              {getCategoryTotals().map(([category, total], index) => (
                <Col key={index} xs={6} sm={4} lg={2}>
                  <Card
                    className="border-0 text-center h-100"
                    style={{
                      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                      borderRadius: '15px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-5px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
                    }}
                  >
                    <Card.Body className="p-3">
                      <div
                        className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                        style={{
                          width: '40px',
                          height: '40px',
                          background: index % 2 === 0 ? customStyles.primaryGradient : customStyles.successGradient,
                          color: 'white'
                        }}
                      >
                        {category.charAt(0)}
                      </div>
                      <h6 className="mb-1 text-muted small">{category}</h6>
                      <h5 className="mb-0 fw-bold text-primary">₹{total.toFixed(2)}</h5>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Expense List */}
        <Card
          className="border-0"
          style={{
            boxShadow: customStyles.cardShadow,
            borderRadius: '20px'
          }}
        >
          <Card.Header
            className="bg-white py-4 border-0 d-flex justify-content-between align-items-center"
            style={{ borderRadius: '20px 20px 0 0' }}
          >
            <div className="d-flex align-items-center">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="me-2 text-primary">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
              <h5 className="mb-0 fw-bold text-dark">खर्चाचा इतिहास</h5>
            </div>
            <Form.Select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-auto border-0 shadow-sm"
              style={{
                borderRadius: '10px',
                backgroundColor: '#f8f9fc'
              }}
            >
              <option value="today">आजचा</option>
              <option value="7days">मागील ७ दिवस</option>
              <option value="30days">मागील ३० दिवस</option>
              <option value="90days">मागील ९० दिवस</option>
            </Form.Select>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0" style={{ borderRadius: '0 0 20px 20px', overflow: 'hidden' }}>
                <thead style={{ backgroundColor: '#f8f9fc' }}>
                  <tr>
                    <th className="px-4 py-3 fw-semibold text-dark border-0">वस्तू</th>
                    <th className="text-center py-3 fw-semibold text-dark border-0">प्रमाण</th>
                    <th className="text-center py-3 fw-semibold text-dark border-0">युनिट</th>
                    <th className="text-center py-3 fw-semibold text-dark border-0">किंमत</th>
                    <th className="text-center py-3 fw-semibold text-dark border-0">तारीख</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map((expense, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f3f5' }}>
                        <td className="px-4 py-3 border-0">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle me-3 d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{
                                width: '35px',
                                height: '35px',
                                background: expense.name === "तेल" ? customStyles.warningGradient :
                                  expense.name === "साखर" ? customStyles.infoGradient :
                                    expense.name === "तांदूळ" ? customStyles.successGradient :
                                      expense.name === "गहू" ? customStyles.primaryGradient :
                                        customStyles.successGradient,
                                fontSize: '14px'
                              }}
                            >
                              {expense.name.charAt(0)}
                            </div>
                            <span className="fw-semibold text-dark">{expense.name}</span>
                          </div>
                        </td>
                        <td className="text-center py-3 border-0 fw-medium">{expense.quantity}</td>
                        <td className="text-center py-3 border-0 text-muted">{expense.unit}</td>
                        <td className="text-center py-3 border-0 fw-bold text-success">₹{parseFloat(expense.price).toFixed(2)}</td>
                        <td className="text-center py-3 border-0 text-muted small">{new Date(expense.date).toLocaleDateString("mr-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-5 border-0 text-muted">
                        <div>
                          <svg width="64" height="64" fill="currentColor" viewBox="0 0 16 16" className="mb-3 opacity-50">
                            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                          </svg>
                          <p className="mb-0">या कालावधीसाठी कोणताही खर्च आढळला नाही</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot style={{ backgroundColor: '#f8f9fc' }}>
                  <tr>
                    <td colSpan="3" className="text-end fw-bold py-3 px-4 border-0 text-dark">एकूण:</td>
                    <td className="text-center fw-bold py-3 border-0 text-success fs-5">₹{calculateTotal(filteredExpenses)}</td>
                    <td className="border-0"></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ExpenseCalculator;