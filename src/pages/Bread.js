import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Table,
  Badge,
  Nav,
  Alert,
  Modal,
  InputGroup,
  Spinner,
  Accordion
} from 'react-bootstrap';

const BreadSalesManager = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [breadPrice, setBreadPrice] = useState(45);
  const [newSale, setNewSale] = useState({ customerName: '', quantity: '' });
  const [payment, setPayment] = useState({ customerName: '', amount: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(45);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    totalSales: 0,
    totalPaid: 0,
    customerCount: 0
  });
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

  // API call helper with authentication
  const apiCall = async (url, options = {}) => {
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE}${url}`, config);

      if (!response.ok) {
        if (response.status === 401) {
          // Redirect to login or handle authentication error
          window.location.href = '/login';
          return;
        }
        const error = await response.json();
        throw new Error(error.message || 'API call failed');
      }

      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {

    try {
      setLoading(true);

      const [priceData, customersData, statsData] = await Promise.all([
        apiCall('/bread/price'),
        apiCall('/bread/customers'),
        apiCall('/bread/stats')
      ]);

      setBreadPrice(priceData.price);
      setNewPrice(priceData.price);
      const processedCustomers = customersData.map(customer => ({
        ...customer,
        totalBills: parseFloat(customer.totalBills || 0),
        totalPaid: parseFloat(customer.totalPaid || 0),
        balance: parseFloat(customer.balance || 0)
      }));
      setCustomers(processedCustomers);
      setStats(statsData);
    } catch (error) {
      showAlert('Error loading data: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const updateBreadPrice = async () => {
    if (newPrice <= 0) {
      showAlert('Please enter a valid price', 'danger');
      return;
    }

    try {
      setLoading(true);
      await apiCall('/bread/price', {
        method: 'PUT',
        body: JSON.stringify({ price: newPrice }),
      });

      setBreadPrice(newPrice);
      setShowPriceModal(false);
      showAlert(`Bread price updated to ₹${newPrice} per dozen`, 'success');
    } catch (error) {
      showAlert('Error updating price: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const addSale = async () => {
    if (!newSale.customerName.trim() || !newSale.quantity || newSale.quantity <= 0) {
      showAlert('Please enter valid customer name and quantity', 'danger');
      return;
    }

    try {
      setLoading(true);

      const saleData = await apiCall('/bread/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerName: newSale.customerName.trim(),
          quantity: parseFloat(newSale.quantity),
          pricePerDozen: breadPrice,
        }),
      });

      // Reload data to get updated customer list and stats
      await loadInitialData();

      setNewSale({ customerName: '', quantity: '' });
      showAlert(`Sale added successfully! Bill: ₹${saleData.billAmount.toFixed(2)}`, 'success');
    } catch (error) {
      showAlert('Error adding sale: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const recordPayment = async () => {
    if (!payment.customerName.trim() || !payment.amount || payment.amount <= 0) {
      showAlert('Please enter valid customer name and payment amount', 'danger');
      return;
    }

    const selectedCustomer = customers.find(c => c.name === payment.customerName.trim());
    if (!selectedCustomer) {
      showAlert('Customer not found', 'danger');
      return;
    }

    const paymentAmount = parseFloat(payment.amount);
    if (paymentAmount > parseFloat(selectedCustomer.balance)) {
      showAlert(`Payment amount (₹${paymentAmount}) cannot exceed outstanding balance (₹${parseFloat(selectedCustomer.balance).toFixed(2)})`, 'danger');
      return;
    }

    try {
      setLoading(true);

      const paymentResponse = await apiCall('/bread/payments', {
        method: 'POST',
        body: JSON.stringify({
          customerName: payment.customerName.trim(),
          amount: paymentAmount,
        }),
      });

      // Reload data to get updated customer list and stats
      await loadInitialData();

      setPayment({ customerName: '', amount: '' });

      const remainingBalance = Math.max(0, parseFloat(selectedCustomer.balance) - paymentAmount);
      const isFullyPaid = remainingBalance <= 0.01; // Use small epsilon for float comparison

      showAlert(
        `Payment of ₹${paymentAmount.toFixed(2)} recorded successfully! ${isFullyPaid ? 'Customer account is now fully settled.' : `Remaining balance: ₹${remainingBalance.toFixed(2)}`
        }`,
        'success'
      );
    } catch (error) {
      console.error('PAYMENT ERROR:', error);
      showAlert('Error recording payment: ' + error.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  // Convert customers array to object format for compatibility with existing UI logic
  const customersObj = customers.reduce((acc, customer) => {
    if (customer && customer.name) {
      acc[customer.name] = {
        name: customer.name,
        totalBills: parseFloat(customer.totalBills || 0),
        totalPaid: parseFloat(customer.totalPaid || 0),
        balance: parseFloat(customer.balance || 0),
        sales: [],
        payments: []
      };
    }
    return acc;
  }, {});

  const loadCustomerHistory = async (customerName) => {
    try {
      const customer = customers.find(c => c.name === customerName);
      if (!customer) return;

      const historyData = await apiCall(`/bread/customers/${customer.id}/details`);
      setSelectedCustomerHistory(historyData);
    } catch (error) {
      console.error('Error loading customer history:', error);
      setSelectedCustomerHistory(null);
    }
  };

  const formatDateTime = (dateStr, timeStr) => {
    try {
      // Handle ISO format dates
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return `${dateStr} ${timeStr}`; // Fallback to original if parsing fails
      }

      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const dayName = date.toLocaleDateString('en-IN', { weekday: 'long' });

      // Extract time from timeStr or use current time
      const time = timeStr || date.toLocaleTimeString('en-IN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      return `${day}-${month}-${year} ${time}, ${dayName}`;
    } catch (error) {
      return `${dateStr} ${timeStr}`; // Fallback
    }
  };

  const customStyles = `
    .modern-container {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      min-height: 100vh;
      padding: 0;
    }
    
    .glass-card {
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 1.5rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      min-height: 140px;
    }
    
    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .nav-modern {
      background: white;
      border-radius: 1.5rem;
      padding: 0.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: none;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .nav-modern .nav-link {
      border: none;
      border-radius: 1rem;
      color: #64748b;
      font-weight: 600;
      padding: 0.75rem 1rem;
      margin: 0.25rem;
      transition: all 0.3s ease;
      background: transparent;
      font-size: 0.9rem;
      text-align: center;
      white-space: nowrap;
    }
    
    @media (max-width: 768px) {
      .nav-modern .nav-link {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;
        margin: 0.1rem;
      }
    }
    
    .nav-modern .nav-link:hover {
      background: #f1f5f9;
      color: #3b82f6;
    }
    
    .nav-modern .nav-link.active {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }
    
    .form-modern .form-control,
    .form-modern .form-select {
      background: white;
      border-radius: 0.75rem;
      border: 2px solid #e2e8f0;
      transition: all 0.3s ease;
      font-size: 1rem;
      padding: 0.875rem 1rem;
    }
    
    @media (max-width: 576px) {
      .form-modern .form-control,
      .form-modern .form-select {
        font-size: 16px; /* Prevent zoom on iOS */
      }
    }
    
    .form-modern .form-control:focus,
    .form-modern .form-select:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .btn-modern {
      border-radius: 0.75rem;
      font-weight: 600;
      padding: 0.875rem 2rem;
      transition: all 0.3s ease;
      border: none;
      text-transform: none;
    }
    
    @media (max-width: 576px) {
      .btn-modern {
        padding: 0.75rem 1.5rem;
        font-size: 0.9rem;
      }
    }
    
    .btn-modern:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
    
    .btn-primary.btn-modern {
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }
    
    .btn-success.btn-modern {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    
    .btn-info.btn-modern {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
    }

    .table-responsive {
      border-radius: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    
    .table-modern {
      margin-bottom: 0;
      border: none;
    }
    
    .table-modern thead th {
      background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
      border: none;
      color: #475569;
      font-weight: 600;
      padding: 1rem;
      font-size: 0.9rem;
      white-space: nowrap;
    }
    
    .table-modern tbody tr {
      border: none;
      transition: all 0.2s ease;
    }
    
    .table-modern tbody tr:hover {
      background: #f8fafc;
    }
    
    .table-modern tbody td {
      border: none;
      padding: 1rem;
      vertical-align: middle;
      font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
      .table-modern thead th,
      .table-modern tbody td {
        padding: 0.5rem 0.25rem;
        font-size: 0.8rem;
      }
    }
    
    .badge-modern {
      padding: 0.5rem 1rem;
      font-weight: 600;
      border-radius: 2rem;
      font-size: 0.775rem;
      white-space: nowrap;
    }
    
    @media (max-width: 576px) {
      .badge-modern {
        padding: 0.25rem 0.5rem;
        font-size: 0.7rem;
      }
    }
    
    .alert-floating {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1050;
      border-radius: 0.75rem;
      border: none;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(20px);
      max-width: calc(100vw - 2rem);
    }
    
    @media (max-width: 576px) {
      .alert-floating {
        top: 0.5rem;
        right: 0.5rem;
        left: 0.5rem;
        max-width: none;
      }
    }
    
    .header-title {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      border-radius: 1.5rem;
      padding: 2rem;
    }
    
    @media (max-width: 768px) {
      .header-title {
        padding: 1.5rem;
        text-align: center;
      }
      
      .header-title h1 {
        font-size: 1.75rem;
      }
      
      .header-title p {
        font-size: 1rem;
      }
    }
    
    .empty-state {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 1.5rem;
      padding: 3rem 2rem;
    }
    
    @media (max-width: 576px) {
      .empty-state {
        padding: 2rem 1rem;
      }
    }
    
    .modal-modern .modal-content {
      border: none;
      border-radius: 1.5rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(20px);
    }
    
    .modal-modern .modal-header {
      border: none;
      border-radius: 1.5rem 1.5rem 0 0;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    }

    .modal-modern .modal-title {
      color: #1e293b;
      font-weight: 700;
    }
    
    .modal-modern .modal-body {
      padding: 1.5rem;
    }
    
    .modal-modern .modal-footer {
      border: none;
      padding: 1rem 1.5rem;
    }

    .card-header-modern {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-bottom: none;
      border-radius: 1.5rem 1.5rem 0 0;
      padding: 1.5rem;
    }
    
    @media (max-width: 576px) {
      .card-header-modern {
        padding: 1rem;
      }
    }
    
    .card-footer-modern {
      background: #f8fafc;
      border-top: none;
      border-radius: 0 0 1.5rem 1.5rem;
      padding: 1rem 1.5rem;
    }
    
    @media (max-width: 576px) {
      .card-footer-modern {
        padding: 1rem;
      }
    }

    .customer-card {
      background: white;
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
    }
    
    .history-scroll {
      max-height: 400px;
      overflow-y: auto;
    }
    
    @media (max-width: 768px) {
      .history-scroll {
        max-height: 250px;
      }
    }

    .price-button-responsive {
      white-space: nowrap;
    }
    
    @media (max-width: 768px) {
      .price-button-responsive {
        font-size: 0.9rem;
        padding: 0.5rem 1rem;
      }
    }

    .container-fluid {
      padding-left: 1rem;
      padding-right: 1rem;
    }
    
    @media (max-width: 576px) {
      .container-fluid {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }
    }
  `;

  if (loading && customers.length === 0) {
    return (
      <div className="modern-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" size="lg" />
          <p className="mt-3 text-muted">Loading bread sales data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <div className="modern-container">
        <Container fluid className="py-3">
          {/* Floating Alert */}
          {alert.show && (
            <Alert variant={alert.variant} className="alert-floating">
              {alert.message}
            </Alert>
          )}

          {/* Modern Header */}
          <Row className="mb-4">
            <Col>
              <div className="header-title">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                  <div className="mb-3 mb-md-0">
                    <h1 className="mb-2 fw-bold text-white">🍞 Bread Sales Management</h1>
                    <p className="mb-0 opacity-75 fs-6">Professional sales tracking & customer management system</p>
                  </div>
                  <Button
                    className="btn-modern price-button-responsive"
                    variant="light"
                    onClick={() => setShowPriceModal(true)}
                    disabled={loading}
                  >
                    Current Price: ₹{breadPrice}/dozen
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Modern Navigation */}
          <Row className="mb-4">
            <Col>
              <Nav variant="tabs" className="nav-modern d-flex">
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'dashboard'}
                    onClick={() => setActiveTab('dashboard')}
                  >
                    📊 Dashboard
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'sales'}
                    onClick={() => setActiveTab('sales')}
                  >
                    🛒 Add Sale
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'payments'}
                    onClick={() => setActiveTab('payments')}
                  >
                    💰 Payment
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'customers'}
                    onClick={() => setActiveTab('customers')}
                  >
                    👥 Customers
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === 'history'}
                    onClick={() => setActiveTab('history')}
                  >
                    📜 History
                  </Nav.Link>
                </Nav.Item>
              </Nav>
            </Col>
          </Row>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Statistics Cards */}
              <Row className="mb-4 g-3">
                <Col xl={3} md={6} sm={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="text-center d-flex flex-column justify-content-center">
                      <div className="h3 text-danger mb-2">₹{stats.totalOutstanding.toLocaleString()}</div>
                      <h6 className="text-muted text-uppercase fw-bold mb-0">Outstanding Amount</h6>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6} sm={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="text-center d-flex flex-column justify-content-center">
                      <div className="h3 text-success mb-2">₹{stats.totalSales.toLocaleString()}</div>
                      <h6 className="text-muted text-uppercase fw-bold mb-0">Total Sales</h6>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6} sm={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="text-center d-flex flex-column justify-content-center">
                      <div className="h3 text-primary mb-2">₹{stats.totalPaid.toLocaleString()}</div>
                      <h6 className="text-muted text-uppercase fw-bold mb-0">Total Paid</h6>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6} sm={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="text-center d-flex flex-column justify-content-center">
                      <div className="h3 text-info mb-2">{stats.customerCount}</div>
                      <h6 className="text-muted text-uppercase fw-bold mb-0">Total Customers</h6>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Recent Overview */}
              {Object.keys(customersObj).length > 0 ? (
                <Row>
                  <Col>
                    <Card className="glass-card border-0">
                      <Card.Header className="card-header-modern">
                        <h4 className="mb-0 fw-bold text-dark">📋 Customer Overview</h4>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <div className="table-responsive">
                          <Table className="table-modern" hover>
                            <thead>
                              <tr>
                                <th>Customer</th>
                                <th className="text-end">Bills</th>
                                <th className="text-end">Paid</th>
                                <th className="text-end">Balance</th>
                                <th className="text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {customers.slice(0, 10).map((customer, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2 d-none d-sm-block">
                                        <span className="text-primary fw-bold" style={{fontSize: '0.8rem'}}>
                                          {customer.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="fw-semibold">{customer.name}</div>
                                        <small className="text-muted d-none d-sm-block">ID: {customer.id}</small>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="text-end fw-semibold">₹{customer.totalBills.toLocaleString()}</td>
                                  <td className="text-end fw-semibold">₹{customer.totalPaid.toLocaleString()}</td>
                                  <td className="text-end fw-bold">₹{customer.balance.toLocaleString()}</td>
                                  <td className="text-center">
                                    <Badge
                                      className="badge-modern"
                                      bg={customer.balance > 0 ? 'warning' : 'success'}
                                    >
                                      {customer.balance > 0 ? 'Pending' : 'Paid'}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Row>
                  <Col>
                    <div className="empty-state text-center">
                      <div className="display-1 mb-3">🍞</div>
                      <h3 className="text-muted mb-3">No sales data yet</h3>
                      <p className="text-muted mb-4">Start by adding your first bread sale!</p>
                      <Button
                        className="btn-modern"
                        variant="primary"
                        size="lg"
                        onClick={() => setActiveTab('sales')}
                      >
                        Add Your First Sale
                      </Button>
                    </div>
                  </Col>
                </Row>
              )}
            </>
          )}

          {/* Add Sale Tab */}
          {activeTab === 'sales' && (
            <Row className="justify-content-center">
              <Col xl={10} lg={12}>
                <Card className="glass-card border-0">
                  <Card.Header className="card-header-modern">
                    <h4 className="mb-0 fw-bold text-dark">🛒 Add New Sale</h4>
                  </Card.Header>
                  <Card.Body>
                    <Form className="form-modern">
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold text-dark">Customer Name</Form.Label>
                          <Form.Select
                            value={newSale.customerName}
                        onChange={(e) => {
                              setNewSale({ ...newSale, customerName: e.target.value });
                              if (e.target.value) {
                                loadCustomerHistory(e.target.value);
                              } else {
                                setSelectedCustomerHistory(null);
                              }
                            }}
                          >
                            <option value="">Select a customer...</option>
                            {customers.map((customer, index) => (
                              <option key={index} value={customer.name}>
                                {customer.name} - Balance: ₹{customer.balance}
                              </option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold text-dark">Quantity (dozens)</Form.Label>
                          <Form.Control
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Enter quantity"
                            value={newSale.quantity}
                            onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                          />
                        </Col>
                      </Row>
                      <Row className="g-3">
                        <Col>
                          <div className="bg-light bg-opacity-50 p-3 rounded-3 mt-3">
                            <Row className="g-2">
                              <Col md={4} sm={12}>
                                <div className="text-center text-md-start">
                                  <strong>Price per dozen:</strong><br />
                                  <span className="text-primary fs-5">₹{breadPrice}</span>
                                </div>
                              </Col>
                              <Col md={4} sm={6}>
                                <div className="text-center text-md-start">
                                  <strong>Total quantity:</strong><br />
                                  <span className="text-info fs-5">{newSale.quantity || 0} dozens</span>
                                </div>
                              </Col>
                              <Col md={4} sm={6}>
                                <div className="text-center text-md-start">
                                  <strong>Bill amount:</strong><br />
                                  <span className="text-success fs-5">
                                    ₹{(parseFloat(newSale.quantity || 0) * breadPrice).toFixed(2)}
                                  </span>
                                </div>
                              </Col>
                            </Row>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                  </Card.Body>
                  <Card.Footer className="card-footer-modern">
                    <div className="d-flex justify-content-end">
                      <Button
                        className="btn-modern"
                        variant="success"
                        onClick={addSale}
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Adding Sale...
                          </>
                        ) : (
                          '✅ Add Sale'
                        )}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
          )}

          {/* Record Payment Tab */}
          {activeTab === 'payments' && (
            <Row className="justify-content-center">
              <Col xl={10} lg={12}>
                <Card className="glass-card border-0">
                  <Card.Header className="card-header-modern">
                    <h4 className="mb-0 fw-bold text-dark">💰 Record Payment</h4>
                  </Card.Header>
                  <Card.Body>
                    <Form className="form-modern">
                      <Row className="g-3">
                        <Col md={6}>
                          <Form.Label className="fw-semibold text-dark">Select Customer</Form.Label>
                          <Form.Select
                            value={payment.customerName}
                            onChange={(e) => setPayment({ ...payment, customerName: e.target.value })}
                          >
                            <option value="">Choose a customer...</option>
                            {customers
                              .filter(customer => customer.balance > 0)
                              .map((customer, index) => (
                                <option key={index} value={customer.name}>
                                  {customer.name} - Pending: ₹{customer.balance.toLocaleString()}
                                </option>
                              ))}
                          </Form.Select>
                          <Form.Text className="text-muted">
                            Only customers with pending payments are shown
                          </Form.Text>
                        </Col>
                        <Col md={6}>
                          <Form.Label className="fw-semibold text-dark">Payment Amount (₹)</Form.Label>
                          <InputGroup>
                            <InputGroup.Text>₹</InputGroup.Text>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              max={
                                customers.find(c => c.name === payment.customerName)?.balance || 0
                              }
                              placeholder="Enter amount"
                              value={payment.amount}
                              onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                              disabled={!payment.customerName}
                            />
                          </InputGroup>
                          {payment.customerName && (
                            <Form.Text className="text-muted">
                              Maximum: ₹{customers.find(c => c.name === payment.customerName)?.balance.toLocaleString() || 0}
                            </Form.Text>
                          )}
                        </Col>
                      </Row>

                      {payment.customerName && (
                        <Row className="mt-3">
                          <Col>
                            {(() => {
                              const selectedCustomer = customers.find(c => c.name === payment.customerName);
                              return (
                                <Alert variant="info" className="border-0 rounded-3">
                                  <Row className="g-3">
                                    <Col lg={6}>
                                      <div className="d-flex align-items-center mb-2">
                                        <div className="rounded-circle bg-info bg-opacity-10 p-2 me-3">
                                          <span className="text-info fw-bold">
                                            {selectedCustomer?.name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <strong>{selectedCustomer?.name}</strong><br />
                                          <small className="text-muted">Customer ID: {selectedCustomer?.id}</small>
                                        </div>
                                      </div>
                                    </Col>
                                    <Col lg={6}>
                                      <Row className="text-center g-2">
                                        <Col sm={4}>
                                          <div className="fw-bold text-muted small">Total Bills</div>
                                          <div className="text-dark">₹{selectedCustomer?.totalBills.toLocaleString()}</div>
                                        </Col>
                                        <Col sm={4}>
                                          <div className="fw-bold text-muted small">Paid So Far</div>
                                          <div className="text-success">₹{selectedCustomer?.totalPaid.toLocaleString()}</div>
                                        </Col>
                                        <Col sm={4}>
                                          <div className="fw-bold text-muted small">Pending</div>
                                          <div className="text-danger">₹{selectedCustomer?.balance.toLocaleString()}</div>
                                        </Col>
                                      </Row>
                                    </Col>
                                  </Row>

                                  {payment.amount && (
                                    <div className="mt-3 pt-3 border-top">
                                      <Row className="text-center g-2">
                                        <Col md={4} sm={12}>
                                          <div className="fw-bold text-muted small">Payment Amount</div>
                                          <div className="text-primary fs-5">₹{parseFloat(payment.amount || 0).toFixed(2)}</div>
                                        </Col>
                                        <Col md={4} sm={6}>
                                          <div className="fw-bold text-muted small">Remaining After Payment</div>
                                          <div className="text-warning fs-5">
                                            ₹{Math.max(0, (selectedCustomer?.balance || 0) - parseFloat(payment.amount || 0)).toFixed(2)}
                                          </div>
                                        </Col>
                                        <Col md={4} sm={6}>
                                          <div className="fw-bold text-muted small">Status</div>
                                          <div>
                                            {(selectedCustomer?.balance || 0) <= parseFloat(payment.amount || 0) ? (
                                              <Badge bg="success" className="badge-modern">✅ Fully Paid</Badge>
                                            ) : (
                                              <Badge bg="warning" className="badge-modern">⏳ Partial Payment</Badge>
                                            )}
                                          </div>
                                        </Col>
                                      </Row>
                                    </div>
                                  )}
                                </Alert>
                              );
                            })()}
                          </Col>
                        </Row>
                      )}

                      {customers.filter(customer => customer.balance > 0).length === 0 && (
                        <Row className="mt-3">
                          <Col>
                            <Alert variant="success" className="border-0 rounded-3 text-center">
                              <div className="display-6 mb-3">🎉</div>
                              <h5>All customers have cleared their payments!</h5>
                              <p className="mb-0 text-muted">No pending payments to record at the moment.</p>
                            </Alert>
                          </Col>
                        </Row>
                      )}
                    </Form>
                  </Card.Body>
                  <Card.Footer className="card-footer-modern">
                    <div className="d-flex justify-content-end">
                      <Button
                        className="btn-modern"
                        variant="primary"
                        onClick={recordPayment}
                        disabled={loading || !payment.customerName || !payment.amount || payment.amount <= 0}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Recording...
                          </>
                        ) : (
                          '💳 Record Payment'
                        )}
                      </Button>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            </Row>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <Row>
              <Col>
                {Object.keys(customersObj).length > 0 ? (
                  <Card className="glass-card border-0">
                    <Card.Header className="card-header-modern">
                      <h4 className="mb-0 fw-bold text-dark">👥 All Customers</h4>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="table-responsive">
                        <Table className="table-modern" hover>
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Customer</th>
                              <th className="text-end">Total Bills</th>
                              <th className="text-end">Total Paid</th>
                              <th className="text-end">Outstanding</th>
                              <th className="text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customers.map((customer, index) => (
                              <tr key={customer.id}>
                                <td className="fw-semibold text-muted">{index + 1}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-2 d-none d-sm-block">
                                      <span className="text-primary fw-bold" style={{fontSize: '0.8rem'}}>
                                        {customer.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="fw-semibold">{customer.name}</div>
                                      <small className="text-muted d-none d-sm-block">ID: {customer.id}</small>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-end fw-semibold">₹{customer.totalBills.toLocaleString()}</td>
                                <td className="text-end fw-semibold text-success">₹{customer.totalPaid.toLocaleString()}</td>
                                <td className="text-end fw-bold text-danger">₹{customer.balance.toLocaleString()}</td>
                                <td className="text-center">
                                  <Badge
                                    className="badge-modern"
                                    bg={customer.balance > 0 ? 'warning' : 'success'}
                                  >
                                    {customer.balance > 0 ? `₹${customer.balance} Due` : 'Settled'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                    <Card.Footer className="card-footer-modern">
                      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center">
                        <div className="text-muted mb-2 mb-sm-0">
                          Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-muted">
                          Total Outstanding: <strong className="text-danger">₹{stats.totalOutstanding.toLocaleString()}</strong>
                        </div>
                      </div>
                    </Card.Footer>
                  </Card>
                ) : (
                  <div className="empty-state text-center">
                    <div className="display-1 mb-3">👥</div>
                    <h3 className="text-muted mb-3">No customers yet</h3>
                    <p className="text-muted mb-4">Add your first sale to create customer records!</p>
                    <Button
                      className="btn-modern"
                      variant="primary"
                      size="lg"
                      onClick={() => setActiveTab('sales')}
                    >
                      Add First Sale
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          )}

          {/* Customer History Tab */}
          {activeTab === 'history' && (
            <Row>
              <Col lg={4} className="mb-4">
                <Card className="glass-card border-0">
                  <Card.Header className="card-header-modern">
                    <h5 className="mb-0 fw-bold text-dark">Select Customer</h5>
                  </Card.Header>
                  <Card.Body>
                    <Form.Select
                      value={selectedCustomerHistory?.name || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          loadCustomerHistory(e.target.value);
                        } else {
                          setSelectedCustomerHistory(null);
                        }
                      }}
                    >
                      <option value="">Choose a customer...</option>
                      {customers.map((customer, index) => (
                        <option key={index} value={customer.name}>
                          {customer.name} - Balance: ₹{customer.balance}
                        </option>
                      ))}
                    </Form.Select>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                {selectedCustomerHistory ? (
                  <Card className="glass-card border-0">
                    <Card.Header className="card-header-modern">
                      <h5 className="mb-0 fw-bold text-dark">
                        History for {selectedCustomerHistory.name}
                      </h5>
                    </Card.Header>
                    <Card.Body>
                      <Row className="g-4">
                        <Col md={6}>
                          <h6 className="text-primary mb-3">📈 Sales History</h6>
                          <div className="history-scroll">
                            {selectedCustomerHistory.sales?.length > 0 ? (
                              selectedCustomerHistory.sales.map((sale, index) => (
                                <div key={index} className="customer-card">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <strong className="text-primary">{sale.quantity} dozens</strong>
                                      <br />
                                      <small className="text-muted">
                                        {formatDateTime(sale.saleDate, sale.saleTime)}
                                      </small>
                                    </div>
                                    <div className="text-end">
                                      <div className="fw-bold text-success">₹{sale.billAmount}</div>
                                      <small className="text-muted">₹{sale.pricePerDozen}/dozen</small>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-muted py-5">
                                <div className="display-6 mb-3">🛒</div>
                                <p>No sales history found</p>
                              </div>
                            )}
                          </div>
                        </Col>

                        <Col md={6}>
                          <h6 className="text-success mb-3">💰 Payment History</h6>
                          <div className="history-scroll">
                            {selectedCustomerHistory.payments?.length > 0 ? (
                              selectedCustomerHistory.payments.map((payment, index) => (
                                <div key={index} className="customer-card">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <div className="fw-bold text-success">₹{payment.amount}</div>
                                      <small className="text-muted">
                                        {formatDateTime(payment.paymentDate, payment.paymentTime)}
                                      </small>
                                    </div>
                                    <Badge bg="success" className="badge-modern">Paid</Badge>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-muted py-5">
                                <div className="display-6 mb-3">💰</div>
                                <p>No payment history found</p>
                              </div>
                            )}
                          </div>
                        </Col>
                      </Row>

                      {/* Summary Section for Mobile */}
                      <div className="d-block d-md-none mt-4">
                        <Accordion>
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>Customer Summary</Accordion.Header>
                            <Accordion.Body>
                              <Row className="text-center g-3">
                                <Col xs={4}>
                                  <div className="fw-bold text-muted small">Total Bills</div>
                                  <div className="text-dark">₹{selectedCustomerHistory.totalBills || 0}</div>
                                </Col>
                                <Col xs={4}>
                                  <div className="fw-bold text-muted small">Total Paid</div>
                                  <div className="text-success">₹{selectedCustomerHistory.totalPaid || 0}</div>
                                </Col>
                                <Col xs={4}>
                                  <div className="fw-bold text-muted small">Balance</div>
                                  <div className="text-danger">₹{selectedCustomerHistory.balance || 0}</div>
                                </Col>
                              </Row>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </div>
                    </Card.Body>
                  </Card>
                ) : (
                  <div className="empty-state text-center">
                    <div className="display-1 mb-3">📜</div>
                    <h3 className="text-muted mb-3">Select a customer</h3>
                    <p className="text-muted">Choose a customer from the dropdown to view their complete sales and payment history</p>
                  </div>
                )}
              </Col>
            </Row>
          )}

          {/* Price Update Modal */}
          <Modal
            show={showPriceModal}
            onHide={() => setShowPriceModal(false)}
            centered
            className="modal-modern"
          >
            <Modal.Header closeButton>
              <Modal.Title>🏷️ Update Bread Price</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form className="form-modern">
                <Form.Group>
                  <Form.Label className="fw-semibold">Price per dozen (₹)</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>₹</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      autoFocus
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Current price: ₹{breadPrice} per dozen
                  </Form.Text>
                </Form.Group>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                variant="secondary"
                onClick={() => setShowPriceModal(false)}
                className="btn-modern"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={updateBreadPrice}
                disabled={loading || newPrice <= 0}
                className="btn-modern"
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Updating...
                  </>
                ) : (
                  '💾 Update Price'
                )}
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default BreadSalesManager;