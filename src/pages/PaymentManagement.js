import React, { useState, useEffect } from "react";

import { Table, Button, Modal, Form, Row, Col, Card, Badge, Container, Alert, ProgressBar } from "react-bootstrap";
import axios from "axios";
import {
    BsCurrencyRupee,
    BsWallet2,
    BsPlusCircle,
    BsPerson,
    BsCalendar,
    BsCreditCard,
    BsCheckCircle,
    BsExclamationTriangle,
    BsCake,
    BsEye,
    BsInfoCircle
} from "react-icons/bs";


// src/config.js
export const API_URL = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const roundToTwoDecimals = (num) => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
};
const formatDateToReadable = (dateString) => {
    const date = new Date(dateString);
    const options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    return date.toLocaleDateString('en-GB', options);
};

const PaymentManagement = () => {
    const [payments, setPayments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [newPayment, setNewPayment] = useState({
        customerId: "",
        customerName: "",
        amount: "",
        paymentMethod: "Cash",
        paymentDate: new Date().toISOString().split("T")[0],
        notes: "",
        paymentType: "customer"
    });

    const paymentMethods = ["Cash", "Card", "UPI", "Bank Transfer", "Cheque"];

    useEffect(() => {
        fetchPayments();
        fetchOrders();
        fetchCustomers();
    }, []);

    const fetchPayments = async () => {
        try {
            const response = await axios.get(`${API_URL}/payments`, { withCredentials: true });
            setPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
            // Mock data for development
            setPayments([
                {
                    id: 1,
                    customerId: 1,
                    customerName: "Customer A",
                    amount: 500,
                    paymentMethod: "Cash",
                    paymentDate: "2024-01-15",
                    notes: "Partial payment",
                    paymentType: "customer"
                }
            ]);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`, { withCredentials: true });
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            // Mock data for development
            setOrders([
                {
                    id: 1,
                    customer: "Customer A",
                    orderDate: "2024-01-15",
                    cakes: [{ weight: "1kg", quantity: 2, price: 320 }],
                    pastries: []
                }
            ]);
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_URL}/customers`, { withCredentials: true });
            setCustomers(response.data);
        } catch (error) {
            console.error("Error fetching customers:", error);
            // Mock data for development
            setCustomers([
                { id: 1, name: "Customer A" },
                { id: 2, name: "Customer B" },
                { id: 3, name: "Customer C" }
            ]);
        }
    };

    const addCustomerPayment = async () => {
        if (!newPayment.customerId || !newPayment.amount) {
            alert("Please select a customer and enter payment amount.");
            return;
        }

        const selectedCustomerData = getCustomerPaymentSummary().find(c =>
            c.customerName === newPayment.customerName ||
            getCustomerIdByName(c.customerName) === newPayment.customerId
        );

        if (!selectedCustomerData) {
            alert("Selected customer not found.");
            return;
        }

        const paymentAmount = parseFloat(newPayment.amount);

        if (paymentAmount <= 0 || isNaN(paymentAmount)) {
            alert("Payment amount must be a valid number greater than 0.");
            return;
        }

        if (paymentAmount > selectedCustomerData.totalRemaining) {
            alert(`Payment amount cannot exceed remaining balance of ₹${selectedCustomerData.totalRemaining.toLocaleString()}`);
            return;
        }

        try {
            const paymentData = {
                ...newPayment,
                amount: paymentAmount,
                paymentType: "customer",
                customerOrders: selectedCustomerData.orders.filter(order => order.remainingAmount > 0)
            };

            await axios.post(`${API_URL}/payments/customer`, paymentData, { withCredentials: true });
            fetchPayments();
            resetPaymentForm();
            setShowPaymentModal(false);
        } catch (error) {
            console.error("Error adding customer payment:", error);
            // For development, add to local state
            const mockPayment = {
                id: Date.now(),
                ...newPayment,
                amount: paymentAmount,
                paymentType: "customer"
            };
            setPayments([...payments, mockPayment]);
            resetPaymentForm();
            setShowPaymentModal(false);
        }
    };

    const resetPaymentForm = () => {
        setNewPayment({
            customerId: "",
            customerName: "",
            amount: "",
            paymentMethod: "Cash",
            paymentDate: new Date().toISOString().split("T")[0],
            notes: "",
            paymentType: "customer"
        });
    };

    const calculateOrderTotal = (order) => {
        const cakeTotal = order.cakes?.reduce((sum, cake) => {
            const cakePrice = parseFloat(cake.price) || 0;
            const cakeQuantity = parseFloat(cake.quantity) || 0;
            return sum + (cakeQuantity * cakePrice);
        }, 0) || 0;

        const pastryTotal = order.pastries?.reduce((sum, pastry) => {
            const pastryPrice = parseFloat(pastry.price) || 0;
            const pastryQuantity = parseFloat(pastry.quantity) || 0;
            return sum + (pastryQuantity * pastryPrice);
        }, 0) || 0;

        return roundToTwoDecimals(cakeTotal + pastryTotal);
    };

    const getCustomerIdByName = (customerName) => {
        const customer = customers.find(c => c.name === customerName);
        return customer?.id || customerName;
    };

    const getCustomerPaymentSummary = () => {
        const customerSummary = {};

        // Initialize customer summaries from orders
        orders.forEach(order => {
            const customerName = order.customer;
            if (!customerSummary[customerName]) {
                customerSummary[customerName] = {
                    customerName,
                    customerId: order.customerId || getCustomerIdByName(customerName),
                    totalOrders: 0,
                    totalOrderValue: 0,
                    totalPaid: 0,
                    totalRemaining: 0,
                    orders: []
                };
            }

            const orderTotal = calculateOrderTotal(order);
            customerSummary[customerName].totalOrders += 1;
            customerSummary[customerName].totalOrderValue += orderTotal;
            customerSummary[customerName].orders.push({
                ...order,
                orderTotal
            });
        });

        // Calculate total payments and remaining amounts for each customer
        Object.keys(customerSummary).forEach(customerName => {
            const customer = customerSummary[customerName];

            // Find all payments for this customer
            const customerPayments = payments.filter(payment => {
                const paymentCustomerName = payment.customerName || "";
                const paymentCustomerId = payment.customerId || "";
                return paymentCustomerName === customerName ||
                    paymentCustomerId === customer.customerId ||
                    paymentCustomerId.toString() === customer.customerId.toString();
            });

            // Calculate total paid with proper number handling and rounding
            customer.totalPaid = customerPayments.reduce((sum, payment) => {
                const paymentAmount = parseFloat(payment.amount) || 0;
                return sum + paymentAmount;
            }, 0);

            // Ensure totalOrderValue is a number and round both values
            customer.totalOrderValue = roundToTwoDecimals(parseFloat(customer.totalOrderValue) || 0);
            customer.totalPaid = roundToTwoDecimals(parseFloat(customer.totalPaid) || 0);

            // Calculate remaining amount with proper rounding
            customer.totalRemaining = Math.max(0, roundToTwoDecimals(customer.totalOrderValue - customer.totalPaid));

            // Distribute payments across orders (FIFO - First In, First Out)
            let remainingPaymentAmount = customer.totalPaid;
            customer.orders = customer.orders.map(order => {
                let orderPaid = 0;
                if (remainingPaymentAmount > 0 && order.orderTotal > 0) {
                    orderPaid = Math.min(remainingPaymentAmount, order.orderTotal);
                    remainingPaymentAmount = roundToTwoDecimals(remainingPaymentAmount - orderPaid);
                }

                // Round the order calculations
                orderPaid = roundToTwoDecimals(orderPaid);
                const orderRemaining = Math.max(0, roundToTwoDecimals(order.orderTotal - orderPaid));
                const paymentStatus = orderRemaining === 0 ? 'Paid' :
                    orderPaid === 0 ? 'Unpaid' : 'Partial';

                return {
                    ...order,
                    totalPaid: orderPaid,
                    remainingAmount: orderRemaining,
                    paymentStatus
                };
            });
        });

        return Object.values(customerSummary);
    };

    const handleCustomerSelect = (customerId, customerName) => {
        setNewPayment({
            ...newPayment,
            customerId: customerId,
            customerName: customerName
        });
    };

    const showCustomerDetails = (customer) => {
        setSelectedCustomer(customer);
        setShowDetailsModal(true);
    };

    const customerSummary = getCustomerPaymentSummary();
    const customersWithBalance = customerSummary.filter(customer => customer.totalRemaining > 0);

    return (
        <Container fluid className="py-4 px-4 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary fw-bold">
                    <BsWallet2 className="me-2" />
                    Payment Management
                </h2>
                <Button
                    variant="success"
                    onClick={() => setShowPaymentModal(true)}
                    className="d-flex align-items-center"
                    size="lg"
                >
                    <BsPlusCircle className="me-2" /> Add Customer Payment
                </Button>
            </div>

            {/* Customer Payment Summary */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow border-0">
                        <Card.Header className="bg-primary text-white">
                            <h4 className="mb-0">Customer Payment Summary</h4>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-light">
                                    <tr>
                                        <th>Customer</th>
                                        <th className="text-center">Orders</th>
                                        <th className="text-end">Total Value</th>
                                        <th className="text-end">Paid</th>
                                        <th className="text-end">Remaining</th>
                                        <th className="text-center">Payment Status</th>
                                        <th className="text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerSummary.map((customer, index) => {
                                        const paymentPercentage = customer.totalOrderValue > 0
                                            ? (customer.totalPaid / customer.totalOrderValue) * 100
                                            : 0;

                                        return (
                                            <tr key={index}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <BsPerson className="me-2" />
                                                        {customer.customerName}
                                                    </div>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg="info" className="px-3 py-2">
                                                        {customer.totalOrders}
                                                    </Badge>
                                                </td>
                                                <td className="text-end">₹{customer.totalOrderValue.toLocaleString()}</td>
                                                <td className="text-end">₹{customer.totalPaid.toLocaleString()}</td>
                                                <td className="text-end">
                                                    <span className={customer.totalRemaining > 0 ? 'text-danger fw-bold' : 'text-success'}>
                                                        ₹{customer.totalRemaining.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <div className="mb-1">
                                                        <ProgressBar
                                                            now={isNaN(paymentPercentage) ? 0 : paymentPercentage}
                                                            variant={paymentPercentage === 100 ? 'success' : paymentPercentage > 0 ? 'warning' : 'danger'}
                                                            style={{ height: '8px' }}
                                                        />
                                                    </div>
                                                    <Badge bg={paymentPercentage === 100 ? 'success' : paymentPercentage > 0 ? 'warning' : 'danger'}>
                                                        {isNaN(paymentPercentage) ? '0' : paymentPercentage.toFixed(0)}% Paid
                                                    </Badge>
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-2 justify-content-center">
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => showCustomerDetails(customer)}
                                                        >
                                                            <BsEye className="me-1" /> Details
                                                        </Button>
                                                        {customer.totalRemaining > 0 && (
                                                            <Button
                                                                variant="outline-success"
                                                                size="sm"
                                                                onClick={() => {
                                                                    handleCustomerSelect(customer.customerId, customer.customerName);
                                                                    setShowPaymentModal(true);
                                                                }}
                                                            >
                                                                <BsPlusCircle className="me-1" /> Pay
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Order Payment Details */}
            <Row className="mb-4">
                <Col md={12}>
                    <Card className="shadow border-0">
                        <Card.Header className="bg-info text-white">
                            <h4 className="mb-0">Order Payment Details</h4>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-light">
                                    <tr>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Order Date</th>
                                        <th className="text-end">Total Amount</th>
                                        <th className="text-end">Allocated Payment</th>
                                        <th className="text-end">Remaining</th>
                                        <th className="text-center">Status</th>
                                        <th>Order Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerSummary.flatMap(customer =>
                                        customer.orders.map((order, index) => (
                                            <tr key={`${customer.customerName}-${index}`}>
                                                <td>
                                                    <Badge bg="secondary" className="px-3 py-2">
                                                        #{order.id || index + 1}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <BsPerson className="me-2" />
                                                        {order.customer}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <BsCalendar className="me-2" />
                                                        {formatDateToReadable(order.orderDate)}
                                                    </div>
                                                </td>

                                                <td className="text-end">₹{(order.orderTotal || 0).toLocaleString()}</td>
                                                <td className="text-end text-success">₹{(order.totalPaid || 0).toLocaleString()}</td>
                                                <td className="text-end">
                                                    <span className={(order.remainingAmount || 0) > 0 ? 'text-danger fw-bold' : 'text-success'}>
                                                        ₹{(order.remainingAmount || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Badge bg={
                                                        order.paymentStatus === 'Paid' ? 'success' :
                                                            order.paymentStatus === 'Partial' ? 'warning' : 'danger'
                                                    } className="px-3 py-2">
                                                        {order.paymentStatus === 'Paid' && <BsCheckCircle className="me-1" />}
                                                        {order.paymentStatus === 'Partial' && <BsExclamationTriangle className="me-1" />}
                                                        {order.paymentStatus || 'Unpaid'}
                                                    </Badge>
                                                </td>
                                                <td>
                                                    <div className="order-details-small">
                                                        {order.cakes?.map((cake, i) => (
                                                            <div key={i} className="small mb-1">
                                                                <BsCake className="me-1" size={12} />
                                                                {cake.quantity}x {cake.weight} (₹{cake.price || 0})
                                                            </div>
                                                        ))}
                                                        {order.pastries?.map((pastry, i) => (
                                                            <div key={i} className="small mb-1">
                                                                🧁 {pastry.quantity}x {pastry.flavor} (₹{pastry.price || 0})
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Recent Payments */}
            <Row>
                <Col md={12}>
                    <Card className="shadow border-0">
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">Recent Customer Payments</h4>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th className="text-end">Amount</th>
                                        <th>Method</th>
                                        <th>Type</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.slice(-10).reverse().map((payment, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <BsCalendar className="me-2" />
                                                    {formatDateToReadable(payment.paymentDate)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <BsPerson className="me-2" />
                                                    {payment.customerName}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex align-items-center justify-content-end">
                                                    <BsCurrencyRupee className="me-1" />
                                                    <strong>{(parseFloat(payment.amount) || 0).toLocaleString()}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <Badge bg="info" className="px-3 py-2">
                                                    <BsCreditCard className="me-1" />
                                                    {payment.paymentMethod}
                                                </Badge>
                                            </td>
                                            <td>
                                                <Badge bg={payment.paymentType === 'customer' ? 'primary' : 'secondary'} className="px-2 py-1">
                                                    {payment.paymentType === 'customer' ? 'Customer Payment' : 'Order Payment'}
                                                </Badge>
                                            </td>
                                            <td>{payment.notes || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Add Customer Payment Modal */}
            <Modal show={showPaymentModal} onHide={() => { setShowPaymentModal(false); resetPaymentForm(); }} size="lg">
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>
                        <BsPlusCircle className="me-2" />
                        Add Customer Payment
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Alert variant="info" className="mb-3">
                        <BsInfoCircle className="me-2" />
                        <strong>Customer Payment:</strong> Pay any amount toward the customer's total outstanding balance.
                        The payment will be automatically allocated to their oldest unpaid orders first.
                    </Alert>

                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Customer</Form.Label>
                                    <Form.Select
                                        value={newPayment.customerName}
                                        onChange={(e) => {
                                            const selectedCustomer = customersWithBalance.find(c => c.customerName === e.target.value);
                                            if (selectedCustomer) {
                                                handleCustomerSelect(selectedCustomer.customerId, selectedCustomer.customerName);
                                            } else {
                                                setNewPayment({ ...newPayment, customerId: "", customerName: "" });
                                            }
                                        }}
                                    >
                                        <option value="">Select Customer</option>
                                        {customersWithBalance.map((customer) => (
                                            <option key={customer.customerId} value={customer.customerName}>
                                                {customer.customerName} (Outstanding: ₹{customer.totalRemaining.toLocaleString()})
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={newPayment.paymentDate}
                                        onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Amount (₹)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        placeholder="Enter any amount"
                                        value={newPayment.amount}
                                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                                        min="0.01"
                                        step="0.01"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Payment Method</Form.Label>
                                    <Form.Select
                                        value={newPayment.paymentMethod}
                                        onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value })}
                                    >
                                        {paymentMethods.map((method) => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={12}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Notes (Optional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Add any notes about this payment"
                                        value={newPayment.notes}
                                        onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {newPayment.customerName && (
                            <Alert variant="info">
                                <strong>Customer Summary:</strong>
                                {(() => {
                                    const customer = customersWithBalance.find(c => c.customerName === newPayment.customerName);
                                    if (customer) {
                                        return (
                                            <div className="mt-2">
                                                <div>Total Outstanding: ₹{customer.totalRemaining.toLocaleString()}</div>
                                                <div>Total Orders: {customer.totalOrders}</div>
                                                <div className="mt-2">
                                                    <small className="text-muted">
                                                        Payment will be allocated to oldest unpaid orders first.
                                                    </small>
                                                </div>
                                                {newPayment.amount && parseFloat(newPayment.amount) > 0 && !isNaN(parseFloat(newPayment.amount)) && (
                                                    <div className="mt-2">
                                                        <strong>After this payment:</strong>
                                                        <div>Remaining Balance: ₹{Math.max(0, customer.totalRemaining - parseFloat(newPayment.amount)).toLocaleString()}</div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                })()}
                            </Alert>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => { setShowPaymentModal(false); resetPaymentForm(); }}>Cancel</Button>
                    <Button variant="success" onClick={addCustomerPayment}>
                        <BsPlusCircle className="me-2" /> Add Payment
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Customer Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <BsPerson className="me-2" />
                        {selectedCustomer?.customerName} - Payment Details
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCustomer && (
                        <>
                            <Row className="mb-3">
                                <Col md={3}>
                                    <Card className="text-center border-info">
                                        <Card.Body>
                                            <h5 className="text-info">Total Orders</h5>
                                            <h3>{selectedCustomer.totalOrders}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center border-primary">
                                        <Card.Body>
                                            <h5 className="text-primary">Total Value</h5>
                                            <h3>₹{selectedCustomer.totalOrderValue.toLocaleString()}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center border-success">
                                        <Card.Body>
                                            <h5 className="text-success">Paid</h5>
                                            <h3>₹{selectedCustomer.totalPaid.toLocaleString()}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={3}>
                                    <Card className="text-center border-danger">
                                        <Card.Body>
                                            <h5 className="text-danger">Remaining</h5>
                                            <h3>₹{selectedCustomer.totalRemaining.toLocaleString()}</h3>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>

                            <h5 className="mb-3">Order Details</h5>
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Order #</th>
                                        <th>Date</th>
                                        <th>Total</th>
                                        <th>Allocated Payment</th>
                                        <th>Remaining</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedCustomer.orders.map((order, index) => (
                                        <tr key={index}>
                                            <td>#{order.id || index + 1}</td>
                                            <td>{formatDateToReadable(order.orderDate)}</td>

                                            <td>₹{order.orderTotal.toLocaleString()}</td>
                                            <td className="text-success">₹{order.totalPaid.toLocaleString()}</td>
                                            <td className={order.remainingAmount > 0 ? 'text-danger' : 'text-success'}>
                                                ₹{order.remainingAmount.toLocaleString()}
                                            </td>
                                            <td>
                                                <Badge bg={
                                                    order.paymentStatus === 'Paid' ? 'success' :
                                                        order.paymentStatus === 'Partial' ? 'warning' : 'danger'
                                                }>
                                                    {order.paymentStatus}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>Close</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default PaymentManagement;