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
  Spinner
} from 'react-bootstrap';

const BreadSalesManager = () => {
  // State management - keeping all existing state unchanged
  const [customers, setCustomers] = useState({});
  const [breadPrice, setBreadPrice] = useState(45);
  const [newSale, setNewSale] = useState({ customerName: '', quantity: '' });
  const [payment, setPayment] = useState({ customerName: '', amount: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(45);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: '', variant: 'success' });

  // All existing functionality preserved - no changes to business logic
  useEffect(() => {
    const savedData = JSON.parse(localStorage.getItem('breadSalesData') || '{}');
    const savedPrice = parseFloat(localStorage.getItem('breadPrice') || '45');
    
    if (Object.keys(savedData).length > 0) {
      setCustomers(savedData);
    }
    setBreadPrice(savedPrice);
    setNewPrice(savedPrice);
  }, []);

  useEffect(() => {
    localStorage.setItem('breadSalesData', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('breadPrice', breadPrice.toString());
  }, [breadPrice]);

  const showAlert = (message, variant = 'success') => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ show: false, message: '', variant: 'success' }), 3000);
  };

  const updateBreadPrice = () => {
    if (newPrice <= 0) {
      showAlert('Please enter a valid price', 'danger');
      return;
    }
    setBreadPrice(newPrice);
    setShowPriceModal(false);
    showAlert(`Bread price updated to ₹${newPrice} per dozen`, 'success');
  };

  const addSale = async () => {
    if (!newSale.customerName.trim() || !newSale.quantity || newSale.quantity <= 0) {
      showAlert('Please enter valid customer name and quantity', 'danger');
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      const billAmount = parseFloat(newSale.quantity) * breadPrice;
      const saleRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        quantity: parseFloat(newSale.quantity),
        pricePerDozen: breadPrice,
        amount: billAmount,
        paid: false
      };

      setCustomers(prev => ({
        ...prev,
        [newSale.customerName]: {
          ...prev[newSale.customerName],
          name: newSale.customerName,
          sales: [...(prev[newSale.customerName]?.sales || []), saleRecord],
          totalBills: (prev[newSale.customerName]?.totalBills || 0) + billAmount,
          totalPaid: prev[newSale.customerName]?.totalPaid || 0,
          balance: (prev[newSale.customerName]?.balance || 0) + billAmount
        }
      }));

      setNewSale({ customerName: '', quantity: '' });
      setLoading(false);
      showAlert(`Sale added successfully! Bill: ₹${billAmount.toFixed(2)}`, 'success');
    }, 500);
  };

  const recordPayment = async () => {
    if (!payment.customerName.trim() || !payment.amount || payment.amount <= 0) {
      showAlert('Please enter valid customer name and payment amount', 'danger');
      return;
    }

    if (!customers[payment.customerName]) {
      showAlert('Customer not found', 'danger');
      return;
    }

    const paymentAmount = parseFloat(payment.amount);
    const currentBalance = customers[payment.customerName].balance || 0;

    if (paymentAmount > currentBalance) {
      showAlert('Payment amount cannot exceed outstanding balance', 'danger');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const paymentRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-IN'),
        time: new Date().toLocaleTimeString('en-IN'),
        amount: paymentAmount
      };

      setCustomers(prev => ({
        ...prev,
        [payment.customerName]: {
          ...prev[payment.customerName],
          payments: [...(prev[payment.customerName]?.payments || []), paymentRecord],
          totalPaid: (prev[payment.customerName]?.totalPaid || 0) + paymentAmount,
          balance: currentBalance - paymentAmount
        }
      }));

      setPayment({ customerName: '', amount: '' });
      setLoading(false);
      showAlert(`Payment of ₹${paymentAmount.toFixed(2)} recorded successfully!`, 'success');
    }, 500);
  };

  const getTotals = () => {
    const customersList = Object.values(customers);
    return {
      totalOutstanding: customersList.reduce((sum, customer) => sum + (customer.balance || 0), 0),
      totalSales: customersList.reduce((sum, customer) => sum + (customer.totalBills || 0), 0),
      totalPaid: customersList.reduce((sum, customer) => sum + (customer.totalPaid || 0), 0),
      customerCount: customersList.length
    };
  };

  const totals = getTotals();

  // New, modern styling
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
      padding: 2rem;
    }
    
    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
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
      display: inline-flex;
    }
    
    .nav-modern .nav-link {
      border: none;
      border-radius: 1rem;
      color: #64748b;
      font-weight: 600;
      padding: 1rem 1.75rem;
      margin: 0 0.25rem;
      transition: all 0.3s ease;
      background: transparent;
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

    .table-modern {
      border-radius: 1.5rem;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: none;
    }
    
    .table-modern thead th {
      background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
      border: none;
      color: #475569;
      font-weight: 600;
      padding: 1.5rem;
    }
    
    .table-modern tbody tr {
      border: none;
      transition: all 0.2s ease;
    }
    
    .table-modern tbody tr:hover {
      background: #f8fafc;
      transform: scale(1.01);
    }
    
    .table-modern tbody td {
      border: none;
      padding: 1rem 1.5rem;
      vertical-align: middle;
    }
    
    .badge-modern {
      padding: 0.5rem 1rem;
      font-weight: 600;
      border-radius: 2rem;
      font-size: 0.875rem;
    }
    
    .alert-floating {
      position: fixed;
      top: 2rem;
      right: 2rem;
      z-index: 1050;
      border-radius: 0.75rem;
      border: none;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      backdrop-filter: blur(20px);
    }
    
    .header-title {
      background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
      color: white;
      border-radius: 1.5rem;
      padding: 2.5rem 3rem;
    }
    
    .empty-state {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 1.5rem;
      padding: 3rem;
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
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    }

    .modal-modern .modal-title {
      color: #1e293b;
      font-weight: 700;
    }
    
    .modal-modern .modal-body {
      padding: 2rem;
    }
    
    .modal-modern .modal-footer {
      border: none;
      padding: 1.5rem 2rem;
    }

    .card-header-modern {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-bottom: none;
      border-radius: 1.5rem 1.5rem 0 0;
      padding: 2rem;
    }
    .card-footer-modern {
      background: #f8fafc;
      border-top: none;
      border-radius: 0 0 1.5rem 1.5rem;
      padding: 1rem 2rem;
    }
  `;

  return (
    <>
      <style>{customStyles}</style>
      <div className="modern-container">
        <Container fluid className="py-4 px-5">
          {/* Floating Alert */}
          {alert.show && (
            <Alert variant={alert.variant} className="alert-floating">
              {alert.message}
            </Alert>
          )}

          {/* Modern Header */}
          <Row className="mb-5">
            <Col>
              <div className="header-title">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h1 className="mb-2 fw-bold text-white">🍞 Bread Sales Management</h1>
                    <p className="mb-0 opacity-75 fs-5">Professional sales tracking & customer management system</p>
                  </div>
                  <Button 
                    className="btn-modern"
                    variant="light"
                    size="lg" 
                    onClick={() => setShowPriceModal(true)}
                  >
                    Current Price: ₹{breadPrice}/dozen
                  </Button>
                </div>
              </div>
            </Col>
          </Row>

          {/* Modern Navigation */}
          <Row className="mb-5 justify-content-center">
            <Col xs="auto">
              <Nav className="nav-modern">
                {[
                  { key: 'dashboard', label: 'Dashboard' },
                  { key: 'sales', label: 'Add Sale' },
                  { key: 'payments', label: 'Record Payment' },
                  { key: 'customers', label: 'Customer Details' }
                ].map(tab => (
                  <Nav.Item key={tab.key}>
                    <Nav.Link
                      active={activeTab === tab.key}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.label}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Col>
          </Row>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <>
              {/* Metrics Cards */}
              <Row className="mb-5 g-4">
                <Col xl={3} md={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="d-flex align-items-center p-4">
                      <div className="flex-grow-1">
                        <div className="text-muted fw-semibold small text-uppercase mb-2">Total Outstanding</div>
                        <div className="h2 mb-0 fw-bold text-danger">₹{totals.totalOutstanding.toFixed(2)}</div>
                      </div>
                      <div className="ms-3">
                        <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-danger">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="d-flex align-items-center p-4">
                      <div className="flex-grow-1">
                        <div className="text-muted fw-semibold small text-uppercase mb-2">Total Sales</div>
                        <div className="h2 mb-0 fw-bold text-success">₹{totals.totalSales.toFixed(2)}</div>
                      </div>
                      <div className="ms-3">
                        <div className="bg-success bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-success">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
                          </svg>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="d-flex align-items-center p-4">
                      <div className="flex-grow-1">
                        <div className="text-muted fw-semibold small text-uppercase mb-2">Total Collected</div>
                        <div className="h2 mb-0 fw-bold text-info">₹{totals.totalPaid.toFixed(2)}</div>
                      </div>
                      <div className="ms-3">
                        <div className="bg-info bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-info">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M20 8v6M23 11l-3 3-3-3"/>
                          </svg>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} md={6}>
                  <Card className="metric-card border-0 h-100">
                    <Card.Body className="d-flex align-items-center p-4">
                      <div className="flex-grow-1">
                        <div className="text-muted fw-semibold small text-uppercase mb-2">Total Customers</div>
                        <div className="h2 mb-0 fw-bold text-primary">{totals.customerCount}</div>
                      </div>
                      <div className="ms-3">
                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-flex align-items-center justify-content-center">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-primary">
                            <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                          </svg>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Customer Summary */}
              <Row>
                <Col>
                  <Card className="glass-card border-0 p-0">
                    <Card.Header className="card-header-modern d-flex justify-content-between align-items-center">
                      <div>
                        <h4 className="mb-1 fw-bold">Customer Balance Summary</h4>
                        <p className="text-muted mb-0">Overview of all customer accounts and balances</p>
                      </div>
                      <Badge className="badge-modern" bg="secondary">{totals.customerCount} customers</Badge>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {Object.keys(customers).length === 0 ? (
                        <div className="empty-state text-center">
                          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-muted mb-4 opacity-50">
                            <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                          </svg>
                          <h4 className="text-muted mb-2">No customers yet</h4>
                          <p className="text-muted mb-4">Start by adding your first sale to create customer records</p>
                          <Button variant="primary" className="btn-modern" onClick={() => setActiveTab('sales')}>
                            Add First Sale
                          </Button>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table className="table-modern mb-0">
                            <thead>
                              <tr>
                                <th>Customer Name</th>
                                <th>Total Bills</th>
                                <th>Amount Paid</th>
                                <th>Outstanding Balance</th>
                                <th>Status</th>
                                <th>Last Activity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.values(customers)
                                .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                                .map((customer) => {
                                  const lastSale = customer.sales?.[customer.sales.length - 1];
                                  return (
                                    <tr key={customer.name}>
                                      <td className="fw-semibold">{customer.name}</td>
                                      <td>₹{(customer.totalBills || 0).toFixed(2)}</td>
                                      <td className="text-success fw-semibold">₹{(customer.totalPaid || 0).toFixed(2)}</td>
                                      <td className={`fw-semibold ${customer.balance > 0 ? 'text-danger' : 'text-success'}`}>
                                        ₹{(customer.balance || 0).toFixed(2)}
                                      </td>
                                      <td>
                                        {customer.balance > 0 ? (
                                          <Badge className="badge-modern" bg="danger">₹{customer.balance.toFixed(2)} Pending</Badge>
                                        ) : (
                                          <Badge className="badge-modern" bg="success">Cleared</Badge>
                                        )}
                                      </td>
                                      <td className="text-muted">
                                        {lastSale ? lastSale.date : 'No sales'}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}

          {/* Add Sale Tab */}
          {activeTab === 'sales' && (
            <Row className="justify-content-center">
              <Col lg={8} xl={6}>
                <Card className="glass-card border-0">
                  <Card.Header className="card-header-modern bg-transparent border-0 p-4">
                    <h3 className="mb-1 fw-bold">Add New Sale</h3>
                    <p className="text-muted mb-0">Current price: ₹{breadPrice} per dozen</p>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Form className="form-modern">
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold mb-2">Customer Name</Form.Label>
                        <Form.Control
                          type="text"
                          size="lg"
                          value={newSale.customerName}
                          onChange={(e) => setNewSale({...newSale, customerName: e.target.value})}
                          placeholder="Enter customer name"
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold mb-2">Quantity (Dozens)</Form.Label>
                        <InputGroup size="lg">
                          <Form.Control
                            type="number"
                            step="0.5"
                            min="0"
                            value={newSale.quantity}
                            onChange={(e) => setNewSale({...newSale, quantity: e.target.value})}
                            placeholder="0.0"
                          />
                          <InputGroup.Text className="bg-light border-2 border-start-0 text-muted fw-semibold">dozens</InputGroup.Text>
                        </InputGroup>
                        {newSale.quantity && (
                          <Alert variant="info" className="mt-3 border-0" style={{background: 'linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%)'}}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-semibold">Bill Amount:</span>
                              <span className="fw-bold h4 mb-0 text-info">₹{(parseFloat(newSale.quantity) * breadPrice).toFixed(2)}</span>
                            </div>
                          </Alert>
                        )}
                      </Form.Group>
                      
                      <Button 
                        variant="success" 
                        size="lg" 
                        className="w-100 btn-modern"
                        onClick={addSale}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Adding Sale...
                          </>
                        ) : (
                          'Add Sale'
                        )}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Record Payment Tab */}
          {activeTab === 'payments' && (
            <Row className="justify-content-center">
              <Col lg={8} xl={6}>
                <Card className="glass-card border-0">
                  <Card.Header className="card-header-modern bg-transparent border-0 p-4">
                    <h3 className="mb-1 fw-bold">Record Payment</h3>
                    <p className="text-muted mb-0">Process customer payments and update balances</p>
                  </Card.Header>
                  <Card.Body className="p-4">
                    <Form className="form-modern">
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold mb-2">Customer Name</Form.Label>
                        <Form.Select
                          size="lg"
                          value={payment.customerName}
                          onChange={(e) => setPayment({...payment, customerName: e.target.value})}
                        >
                          <option value="">Select customer with pending balance</option>
                          {Object.values(customers)
                            .filter(customer => customer.balance > 0)
                            .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                            .map((customer) => (
                              <option key={customer.name} value={customer.name}>
                                {customer.name} - ₹{customer.balance.toFixed(2)} pending
                              </option>
                            ))}
                        </Form.Select>
                      </Form.Group>
                      
                      {payment.customerName && customers[payment.customerName] && (
                        <Alert variant="warning" className="border-0 mb-4" style={{background: 'linear-gradient(135deg, #fff3cd 0%, #ffeeba 100%)'}}>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">Outstanding Balance:</span>
                            <Badge className="badge-modern h5 mb-0" bg="danger">₹{customers[payment.customerName].balance.toFixed(2)}</Badge>
                          </div>
                        </Alert>
                      )}
                      
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold mb-2">Payment Amount</Form.Label>
                        <InputGroup size="lg">
                          <InputGroup.Text className="bg-light border-2 border-end-0 text-muted fw-semibold">₹</InputGroup.Text>
                          <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={payment.amount}
                            onChange={(e) => setPayment({...payment, amount: e.target.value})}
                            placeholder="0.00"
                            className="border-start-0"
                          />
                        </InputGroup>
                      </Form.Group>
                      
                      <Button 
                        variant="info" 
                        size="lg" 
                        className="w-100 btn-modern"
                        onClick={recordPayment}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Recording Payment...
                          </>
                        ) : (
                          'Record Payment'
                        )}
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Customer Details Tab */}
          {activeTab === 'customers' && (
            <Row>
              <Col>
                {Object.keys(customers).length === 0 ? (
                  <Card className="glass-card border-0">
                    <Card.Body className="empty-state text-center py-5">
                      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className="text-muted mb-4 opacity-50">
                        <path stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>
                      </svg>
                      <h4 className="text-muted mb-2">No customer data available</h4>
                      <p className="text-muted mb-4">Add sales to see detailed customer information</p>
                      <Button variant="primary" className="btn-modern" onClick={() => setActiveTab('sales')}>
                        Add First Sale
                      </Button>
                    </Card.Body>
                  </Card>
                ) : (
                  Object.values(customers)
                    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
                    .map((customer) => (
                      <Card key={customer.name} className="glass-card border-0 mb-4 p-0">
                        <Card.Header className="card-header-modern d-flex justify-content-between align-items-center">
                          <h5 className="mb-0 fw-bold">{customer.name}</h5>
                          <div>
                            {customer.balance > 0 ? (
                              <Badge className="badge-modern fs-6" bg="danger">₹{customer.balance.toFixed(2)} Pending</Badge>
                            ) : (
                              <Badge className="badge-modern fs-6" bg="success">✅ All Clear</Badge>
                            )}
                          </div>
                        </Card.Header>
                        <Card.Body className="p-4">
                          <Row>
                            <Col lg={6} className="mb-4 mb-lg-0">
                              <h6 className="mb-3 fw-bold text-primary">🛒 Sales History <Badge bg="primary" className="ms-2 badge-modern-sm">{customer.sales?.length || 0}</Badge></h6>
                              {customer.sales && customer.sales.length > 0 ? (
                                <div className="table-responsive">
                                  <Table size="sm" hover className="table-modern">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Date</th>
                                        <th>Qty</th>
                                        <th>Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {customer.sales.map((sale) => (
                                        <tr key={sale.id}>
                                          <td>
                                            <div className="small fw-semibold">
                                              {sale.date}
                                            </div>
                                            <div className="text-muted" style={{fontSize: '0.75rem'}}>{sale.time}</div>
                                          </td>
                                          <td>{sale.quantity} dz</td>
                                          <td className="fw-bold text-success">₹{sale.amount.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-muted text-center py-3">
                                  <div className="opacity-50 mb-2">📋</div>
                                  <small>No sales recorded</small>
                                </div>
                              )}
                            </Col>
                            <Col lg={6}>
                              <h6 className="mb-3 fw-bold text-info">💰 Payment History <Badge bg="info" className="ms-2 badge-modern-sm">{customer.payments?.length || 0}</Badge></h6>
                              {customer.payments && customer.payments.length > 0 ? (
                                <div className="table-responsive">
                                  <Table size="sm" hover className="table-modern">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Date</th>
                                        <th>Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {customer.payments.map((payment) => (
                                        <tr key={payment.id}>
                                          <td>
                                            <div className="small fw-semibold">
                                              {payment.date}
                                            </div>
                                            <div className="text-muted" style={{fontSize: '0.75rem'}}>{payment.time}</div>
                                          </td>
                                          <td className="text-success fw-bold">₹{payment.amount.toFixed(2)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              ) : (
                                <div className="text-muted text-center py-3">
                                  <div className="opacity-50 mb-2">💸</div>
                                  <small>No payments recorded</small>
                                </div>
                              )}
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))
                )}
              </Col>
            </Row>
          )}

          {/* Price Update Modal */}
          <Modal show={showPriceModal} onHide={() => setShowPriceModal(false)} centered className="modal-modern">
            <Modal.Header closeButton>
              <Modal.Title>🏷️ Update Bread Price</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-4">
                <Alert variant="light" className="border-0 mb-0 p-3" style={{ background: '#f8fafc' }}>
                  <div className="fw-bold text-muted mb-1">Current Price:</div>
                  <div className="h4 fw-bold mb-0 text-primary">₹{breadPrice} per dozen</div>
                </Alert>
              </div>
              <Form.Group>
                <Form.Label className="fw-semibold mb-2">New Price per Dozen</Form.Label>
                <InputGroup size="lg" className="form-modern">
                  <InputGroup.Text>₹</InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPrice}
                    onChange={(e) => setNewPrice(parseFloat(e.target.value))}
                  />
                  <InputGroup.Text>/dozen</InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="outline-secondary" onClick={() => setShowPriceModal(false)} className="btn-modern">
                Cancel
              </Button>
              <Button variant="primary" onClick={updateBreadPrice} className="btn-modern">
                Update Price
              </Button>
            </Modal.Footer>
          </Modal>
        </Container>
      </div>
    </>
  );
};

export default BreadSalesManager;