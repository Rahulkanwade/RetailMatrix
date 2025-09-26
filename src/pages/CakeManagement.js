import React, { useState, useEffect } from "react";
import {
    Table,
    Button,
    Modal,
    Form,
    Row,
    Col,
    Card,
    Badge,
    Container,
    Accordion,
    Alert,
    Spinner,
    ListGroup,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
    BsFillCartPlusFill,
    BsTrash,
    BsPlusCircle,
    BsCake,
    BsCalendar,
    BsPerson,
    BsExclamationCircle,
} from "react-icons/bs";

// This should be in a .env file in a real-world app
const API_URL = "http://localhost:5000";


const CakeManagement = () => {
    const [orders, setOrders] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customer: "",
        cakes: [],
        pastries: [],
        orderDate: "",
        deliveryDate: "Pending",
    });
    const [cakePrices, setCakePrices] = useState({
        "250gm": 105,
        "500gm": 165,
        "1kg": 320,
        "Special Order": 0,
    });
    const [pastryPrice, setPastryPrice] = useState(200);
    const [customers, setCustomers] = useState([]);
    const [newCustomerName, setNewCustomerName] = useState("");
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const predefinedWeights = ["250gm", "500gm", "1kg", "Special Order"];
    const today = new Date().toISOString().split("T")[0];
    const navigate = useNavigate(); // Initialize the hook

    const handleGoToPayments = () => {
        navigate("/PaymentManagement"); // Navigate to the specified path
    };
    useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchOrders(), fetchCustomers(), fetchPrices()]);
        } catch (err) {
            setError("Failed to load initial data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };
    fetchData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${API_URL}/orders`, { withCredentials: true });
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to load orders from the database.");
        }
    };

    const fetchCustomers = async () => {
        try {
            const response = await axios.get(`${API_URL}/customers`, { withCredentials: true });
            setCustomers(response.data.map(customer => customer.name));
        } catch (error) {
            console.error("Error fetching customers:", error);
            setError("Failed to load customers from the database.");
            setCustomers(["Customer A", "Customer B", "Customer C", "Customer D"]); // Fallback data
        }
    };

    const fetchPrices = async () => {
        try {
            const response = await axios.get(`${API_URL}/prices`, { withCredentials: true });
            const prices = response.data;
            const cakePricesObj = { ...cakePrices };
            prices.filter(price => price.type === "cake").forEach(price => {
                cakePricesObj[price.weight] = price.price;
            });
            setCakePrices(cakePricesObj);
            const pastryPriceData = prices.find(price => price.type === "pastry");
            if (pastryPriceData) {
                setPastryPrice(pastryPriceData.price);
            }
        } catch (error) {
            console.error("Error fetching prices:", error);
            setError("Failed to load prices from the database.");
        }
    };

    const handleNewCustomerAdd = async () => {
        const trimmedName = newCustomerName.trim();
        if (trimmedName && !customers.includes(trimmedName)) {
            try {
                await axios.post(`${API_URL}/customers`, { name: trimmedName });
                setCustomers([...customers, trimmedName]);
                setNewOrder({ ...newOrder, customer: trimmedName });
                setNewCustomerName("");
                setIsAddingCustomer(false);
            } catch (error) {
                console.error("Error adding customer:", error);
                setError("Failed to add customer to the database.");
            }
        } else if (trimmedName && customers.includes(trimmedName)) {
            setError("This customer already exists.");
        }
    };

    const handleCustomerChange = (e) => {
        const selectedCustomer = e.target.value;
        if (selectedCustomer === "addNew") {
            setIsAddingCustomer(true);
            setNewOrder({ ...newOrder, customer: "" });
        } else {
            setIsAddingCustomer(false);
            setNewOrder({ ...newOrder, customer: selectedCustomer });
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setNewOrder({
            customer: "",
            cakes: [],
            pastries: [],
            orderDate: "",
            deliveryDate: "Pending",
        });
        setError(""); // Clear error on modal close
    };

    const handleShow = () => setShowModal(true);

    const handleChange = (e) => {
        setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
    };

    const handleCakeChange = (index, field, value) => {
        // Enhanced quantity validation
        if (field === "quantity") {
            const qty = parseInt(value, 10); // Always specify radix
            if (isNaN(qty) || qty < 1) {
                console.warn(`Invalid quantity value: ${value}, skipping update`);
                return;
            }
        }

        if (field === "price") {
            const price = parseFloat(value);
            if (isNaN(price) || price < 0) {
                console.warn(`Invalid price value: ${value}, skipping update`);
                return;
            }
        }

        // Use functional state update to avoid race conditions
        setNewOrder(prevOrder => {
            const updatedCakes = [...prevOrder.cakes];

            if (field === "weight") {
                // Check for duplicates against current state
                if (updatedCakes.some((cake, i) => i !== index && cake.weight === value)) {
                    setError("This weight category has already been selected. Please choose a different one.");
                    return prevOrder; // Return unchanged state
                }

                updatedCakes[index] = {
                    weight: value,
                    quantity: 1,
                    customWeight: "",
                    price: value === "Special Order" ? "" : cakePrices[value],
                };
            } else {
                // Ensure we're updating the correct field with correct type
                if (field === "quantity") {
                    updatedCakes[index][field] = parseInt(value, 10);
                } else if (field === "price") {
                    updatedCakes[index][field] = parseFloat(value);
                } else {
                    updatedCakes[index][field] = value;
                }
            }

            return { ...prevOrder, cakes: updatedCakes };
        });
    };

   
    const handlePastryChange = (field, value) => {
        if (field === "quantity" && (parseInt(value) < 0 || isNaN(parseInt(value)))) return;
        const updatedPastries = [{ ...newOrder.pastries[0], [field]: value }];
        setNewOrder({ ...newOrder, pastries: updatedPastries });
    };

    const addCakeEntry = () => {
        const existingWeights = newOrder.cakes.map(cake => cake.weight);
        const availableWeight = predefinedWeights.find(weight => !existingWeights.includes(weight));

        if (availableWeight) {
            setNewOrder({
                ...newOrder,
                cakes: [...newOrder.cakes, { weight: availableWeight, quantity: 1, customWeight: "", price: cakePrices[availableWeight] }],
            });
        } else {
            setError("All weight categories have already been selected.");
        }
    };

    const addPastryEntry = () => {
        if (newOrder.pastries.length > 0) {
            setError("Only one pastry order is allowed per order.");
            return;
        }
        setNewOrder(prevOrder => ({
            ...prevOrder,
            pastries: [{ flavor: "Chocolate", quantity: 1, price: pastryPrice }],
        }));
    };

    const addOrder = async () => {
        setError(""); // Clear previous errors

        if (!newOrder.customer.trim()) {
            setError("Please select a customer.");
            return;
        }
        if (!newOrder.orderDate.trim()) {
            setError("Please select an order date.");
            return;
        }
        if (!newOrder.cakes?.length && !newOrder.pastries?.length) {
            setError("Please add at least one cake or pastry to the order.");
            return;
        }

        // Debug logging for quantities before processing
        console.log("Order quantities before processing:",
            newOrder.cakes.map(cake => ({
                weight: cake.weight,
                quantity: cake.quantity,
                type: typeof cake.quantity
            }))
        );

        const orderWithPrices = {
            ...newOrder,
            cakes: newOrder.cakes.map(cake => {
                const processedCake = {
                    ...cake,
                    quantity: parseInt(cake.quantity, 10), // Ensure integer
                    price: cake.weight === "Special Order" ?
                        parseInt(cake.price) || 0 :
                        cakePrices[cake.weight],
                };

                // Debug log for each cake
                console.log(`Processing ${cake.weight} cake:`, {
                    original: cake.quantity,
                    processed: processedCake.quantity
                });

                return processedCake;
            }),
            pastries: newOrder.pastries.map(pastry => ({
                ...pastry,
                quantity: parseInt(pastry.quantity, 10), // Ensure integer
                price: pastryPrice,
            })),
            deliveryDate: "Pending",
        };

        // Final validation of quantities
        const invalidQuantities = orderWithPrices.cakes.filter(cake =>
            isNaN(cake.quantity) || cake.quantity < 1
        );

        if (invalidQuantities.length > 0) {
            setError("All cake quantities must be valid numbers greater than 0.");
            console.error("Invalid quantities found:", invalidQuantities);
            return;
        }

        try {
            console.log("Sending order to server:", orderWithPrices);
            await axios.post(`${API_URL}/orders`, orderWithPrices);
            fetchOrders();
            handleClose();
        } catch (error) {
            console.error("Error adding order:", error);
            setError("Failed to add order to the database.");
        }
    };
    
    const updateDeliveryDate = async (orderId, date) => {
        try {
            await axios.put(`${API_URL}/orders/${orderId}`, { deliveryDate: date });
            setOrders(orders.map(order => order.id === orderId ? { ...order, deliveryDate: date } : order));
        } catch (error) {
            console.error("Error updating delivery date:", error);
            setError("Failed to update delivery date in the database.");
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            await axios.delete(`${API_URL}/orders/${orderId}`);
            setOrders(orders.filter(order => order.id !== orderId));
        } catch (error) {
            console.error("Error deleting order:", error);
            setError("Failed to delete order from the database.");
        }
    };

    const updatePrice = async (type, weight, price) => {
        try {
            await axios.put(`${API_URL}/prices`, { type, weight, price });
        } catch (error) {
            console.error("Error updating price:", error);
            setError("Failed to update price in the database.");
        }
    };

   const calculateDailyRevenue = () => {
    const dailyRevenue = {};
    orders.forEach((order) => {
        const dateKey = order.orderDate; // Keep original for grouping
        if (!dailyRevenue[dateKey]) {
            dailyRevenue[dateKey] = 0;
        }
        dailyRevenue[dateKey] += calculateOrderTotal(order);
    });
    return dailyRevenue;
};

    const calculateOrderTotal = (order) => {
        let total = 0;

        // Calculate cake total
        for (let cake of order.cakes) {
            const price = cake.price || 0;
            const quantity = cake.quantity || 0;
            total += quantity * price;
        }

        // Calculate pastry total
        for (let pastry of order.pastries) {
            const price = pastry.price || 0;
            const quantity = pastry.quantity || 0;
            total += quantity * price;
        }

        return total;
    };

    const dailyRevenue = calculateDailyRevenue();
    const totalMonthlyRevenue = Object.values(dailyRevenue).reduce((sum, amount) => sum + amount, 0);

   const formatDateTime = (isoString) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const options = {
            weekday: 'long',    // Friday
            day: 'numeric',     // 26
            month: 'long',      // September
            year: 'numeric'     // 2025
        };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Invalid date string:", isoString);
        return isoString;
    }
};

    return (
        <Container fluid className="py-5 px-4 bg-light min-vh-100">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <h2 className="text-primary fw-bold display-5">
                    <BsCake className="me-3" />
                    Retail Matrix
                </h2>
                <Button variant="primary" onClick={handleShow} className="d-flex align-items-center" size="lg">
                    <BsFillCartPlusFill className="me-2" /> Add New Order
                </Button>

            </div>

            {error && (
                <Alert variant="danger" className="mb-4 d-flex align-items-center">
                    <BsExclamationCircle className="me-2" />
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
                    <Spinner animation="border" variant="primary" className="me-2" />
                    <strong>Loading data...</strong>
                </div>
            ) : (
                <>
                    <Row className="mb-5">
                        <Col lg={4} className="mb-4">
                            <Card className="shadow-lg border-0 h-100">
                                <Card.Header className="bg-primary text-white py-3">
                                    <h4 className="mb-0">Price Management</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Accordion defaultActiveKey="0">
                                        <Accordion.Item eventKey="0">
                                            <Accordion.Header>
                                                <strong>Cake Prices</strong>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <Row className="gy-3">
                                                    {Object.keys(cakePrices).map((weight) => (
                                                        <Col xs={12} key={weight}>
                                                            <div className="d-flex align-items-center">
                                                                <Badge bg="light" text="dark" className="me-2 p-2 fs-6" style={{ minWidth: '80px', textAlign: 'center' }}>
                                                                    {weight}
                                                                </Badge>
                                                                <div className="input-group">
                                                                    <span className="input-group-text">₹</span>
                                                                    <input
                                                                        type="number"
                                                                        className="form-control"
                                                                        value={cakePrices[weight]}
                                                                        onChange={(e) => {
                                                                            const price = parseInt(e.target.value) || 0;
                                                                            if (price >= 0) {
                                                                                setCakePrices({ ...cakePrices, [weight]: price });
                                                                                updatePrice('cake', weight, price);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </Col>
                                                    ))}
                                                </Row>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                        <Accordion.Item eventKey="1">
                                            <Accordion.Header>
                                                <strong>Pastry Prices</strong>
                                            </Accordion.Header>
                                            <Accordion.Body>
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="light" text="dark" className="me-2 p-2 fs-6" style={{ minWidth: '80px', textAlign: 'center' }}>
                                                        Standard
                                                    </Badge>
                                                    <div className="input-group">
                                                        <span className="input-group-text">₹</span>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            value={pastryPrice}
                                                            onChange={(e) => {
                                                                const price = parseInt(e.target.value) || 0;
                                                                if (price >= 0) {
                                                                    setPastryPrice(price);
                                                                    updatePrice('pastry', 'standard', price);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </Accordion.Body>
                                        </Accordion.Item>
                                    </Accordion>
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col lg={8} className="mb-4">
                            <Card className="shadow-lg border-0 h-100">
                                <Card.Header className="bg-success text-white py-3">
                                    <h4 className="mb-0">Revenue Summary</h4>
                                </Card.Header>
                                <Card.Body>
                                    <Table striped bordered hover responsive className="mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Date</th>
                                                <th className="text-end">Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(dailyRevenue).map(([date, amount]) => (
                                                <tr key={date}>
                                                    <td>{formatDateTime(date)}</td>
                                                    <td className="text-end">₹{amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="table-success fw-bold">
                                                <th>Total Monthly Revenue</th>
                                                <th className="text-end">₹{totalMonthlyRevenue.toLocaleString()}</th>
                                            </tr>
                                        </tfoot>
                                    </Table>
                                </Card.Body>
                                <Button
                                    variant="outline-success"
                                    className="mb-3"
                                    onClick={handleGoToPayments}
                                >
                                    Go to Payment Management
                                </Button>
                            </Card>
                        </Col>
                    </Row>

                    <Card className="shadow-lg border-0 mb-4">
                        <Card.Header className="bg-info text-white py-3">
                            <h4 className="mb-0">Order Management</h4>
                        </Card.Header>
                        <Card.Body>
                            {/* Desktop/Tablet View */}
                            <div className="d-none d-md-block">
                                <Table striped bordered hover responsive className="mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Customer</th>
                                            <th>Order Date</th>
                                            <th>Delivery Date</th>
                                            <th>Order Details</th>
                                            <th>Total</th>
                                            <th className="text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => (
                                            <tr key={order.id || index}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <BsPerson className="me-2 text-primary" />
                                                        {order.customer}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <BsCalendar className="me-2 text-primary" />
                                                        {formatDateTime(order.orderDate)}
                                                    </div>
                                                </td>
                                                <td>
                                                    {order.deliveryDate === "Pending" ? (
                                                        <Form.Control
                                                            type="date"
                                                            min={order.orderDate}
                                                            onChange={(e) => updateDeliveryDate(order.id, e.target.value)}
                                                            className="border-primary"
                                                        />
                                                    ) : (
                                                        <Badge bg="success" className="px-3 py-2 w-100 fs-6">
                                                            {formatDateTime(order.deliveryDate)}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="order-details">
                                                        {order.cakes.map((cake, i) => (
                                                            <div key={i} className="mb-1">
                                                                <Badge bg="light" text="dark" className="me-2 fs-6">
                                                                    {cake.quantity}x
                                                                </Badge>
                                                                {cake.weight === "Special Order" ? `${cake.customWeight} (Special)` : cake.weight} cake
                                                                <span className="ms-2 text-muted">
                                                                    (₹{cake.price} each)
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {order.pastries.map((pastry, i) => (
                                                            <div key={i} className="mb-1">
                                                                <Badge bg="light" text="dark" className="me-2 fs-6">
                                                                    {pastry.quantity}x
                                                                </Badge>
                                                                {pastry.flavor} Pastry
                                                                <span className="ms-2 text-muted">
                                                                    (₹{pastry.price} each)
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="text-end fw-bold">
                                                    ₹{calculateOrderTotal(order).toLocaleString()}
                                                </td>
                                                <td className="text-center">
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => deleteOrder(order.id)}
                                                        className="d-flex align-items-center mx-auto"
                                                    >
                                                        <BsTrash className="me-1" /> Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            {/* Mobile View */}
                            <div className="d-md-none">
                                {orders.map((order, index) => (
                                    <Card key={order.id || index} className="mb-3">
                                        <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                                            <strong>Order #{index + 1}</strong>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => deleteOrder(order.id)}
                                            >
                                                <BsTrash />
                                            </Button>
                                        </Card.Header>
                                        <Card.Body>
                                            <ListGroup variant="flush">
                                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                                    <div><BsPerson className="me-2 text-primary" /> Customer</div>
                                                    <span className="text-end">{order.customer}</span>
                                                </ListGroup.Item>
                                                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                                                    <div><BsCalendar className="me-2 text-primary" /> Order Date</div>
                                                    <span className="text-end">{formatDateTime(order.orderDate)}</span>
                                                </ListGroup.Item>
                                                <ListGroup.Item>
                                                    <div className="mb-2"><strong>Delivery Date:</strong></div>
                                                    {order.deliveryDate === "Pending" ? (
                                                        <Form.Control
                                                            type="date"
                                                            min={order.orderDate}
                                                            onChange={(e) => updateDeliveryDate(order.id, e.target.value)}
                                                            className="border-primary"
                                                        />
                                                    ) : (
                                                        <Badge bg="success" className="px-3 py-2 w-100 fs-6">
                                                            {formatDateTime(order.deliveryDate)}
                                                        </Badge>
                                                    )}
                                                </ListGroup.Item>
                                                <ListGroup.Item>
                                                    <div className="mb-2"><strong>Order Details:</strong></div>
                                                    <div className="order-details">
                                                        {order.cakes.map((cake, i) => (
                                                            <div key={i} className="mb-1">
                                                                <Badge bg="light" text="dark" className="me-2 fs-6">
                                                                    {cake.quantity}x
                                                                </Badge>
                                                                {cake.weight === "Special Order" ? `${cake.customWeight} (Special)` : cake.weight} cake
                                                                <span className="ms-2 text-muted">
                                                                    (₹{cake.price} each)
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {order.pastries.map((pastry, i) => (
                                                            <div key={i} className="mb-1">
                                                                <Badge bg="light" text="dark" className="me-2 fs-6">
                                                                    {pastry.quantity}x
                                                                </Badge>
                                                                {pastry.flavor} Pastry
                                                                <span className="ms-2 text-muted">
                                                                    (₹{pastry.price} each)
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ListGroup.Item>
                                                <ListGroup.Item className="d-flex justify-content-between align-items-center fw-bold">
                                                    <span>Total</span>
                                                    <span>₹{calculateOrderTotal(order).toLocaleString()}</span>
                                                </ListGroup.Item>
                                            </ListGroup>
                                        </Card.Body>
                                    </Card>
                                ))}
                            </div>
                        </Card.Body>
                    </Card>
                </>
            )}

            <Modal show={showModal} onHide={handleClose} size="lg" centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <BsFillCartPlusFill className="me-2" /> Add New Order
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <BsPerson className="me-2" /> Customer Name
                                    </Form.Label>
                                    <Form.Select value={newOrder.customer} onChange={handleCustomerChange}>
                                        <option value="">Select Customer</option>
                                        {customers.map((customer, i) => (
                                            <option key={i} value={customer}>
                                                {customer}
                                            </option>
                                        ))}
                                        <option value="addNew">➕ Add New Customer</option>
                                    </Form.Select>
                                    {isAddingCustomer && (
                                        <div className="mt-2 d-flex">
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter new customer name"
                                                value={newCustomerName}
                                                onChange={(e) => setNewCustomerName(e.target.value)}
                                                className="me-2"
                                            />
                                            <Button variant="success" onClick={handleNewCustomerAdd}>
                                                <BsPlusCircle />
                                            </Button>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <BsCalendar className="me-2" /> Order Date
                                    </Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="orderDate"
                                        value={newOrder.orderDate}
                                        onChange={handleChange}
                                        max={today}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Card className="mb-3 bg-light border-0">
                            <Card.Header className="bg-primary text-white py-2">
                                <h5 className="mb-0">Cake Orders</h5>
                            </Card.Header>
                            <Card.Body>
                                {newOrder.cakes.map((cake, index) => (
                                    <div key={index} className="p-3 mb-3 border rounded bg-white">
                                        <h6 className="d-flex justify-content-between align-items-center">
                                            Cake {index + 1}
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => {
                                                    const updatedCakes = newOrder.cakes.filter((_, i) => i !== index);
                                                    setNewOrder({ ...newOrder, cakes: updatedCakes });
                                                }}
                                            >
                                                <BsTrash /> Remove
                                            </Button>
                                        </h6>
                                        <Row className="mb-2">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Weight</Form.Label>
                                                    <Form.Select
                                                        name="weight"
                                                        value={cake.weight}
                                                        onChange={(e) => handleCakeChange(index, "weight", e.target.value)}
                                                    >
                                                        {predefinedWeights.map((weight, i) => (
                                                            <option key={i} value={weight} disabled={newOrder.cakes.some(c => c.weight === weight && c.weight !== cake.weight)}>
                                                                {weight}
                                                            </option>
                                                        ))}
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>Quantity</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name="quantity"
                                                        value={cake.quantity}
                                                        min="1"
                                                        onChange={(e) => handleCakeChange(index, "quantity", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        {cake.weight === "Special Order" && (
                                            <Row className="mb-2">
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Custom Weight</Form.Label>
                                                        <Form.Control
                                                            type="text"
                                                            placeholder="e.g., 2kg or 750gm"
                                                            name="customWeight"
                                                            value={cake.customWeight}
                                                            onChange={(e) => handleCakeChange(index, "customWeight", e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col md={6}>
                                                    <Form.Group>
                                                        <Form.Label>Price (₹)</Form.Label>
                                                        <Form.Control
                                                            type="number"
                                                            placeholder="Enter price"
                                                            name="price"
                                                            value={cake.price}
                                                            onChange={(e) => handleCakeChange(index, "price", e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        )}
                                        <div className="d-flex justify-content-between align-items-center mt-3">
                                            <Badge bg="info" className="p-2 fs-6">
                                                Price: ₹{cake.weight === "Special Order" ? (cake.price || 0) : cakePrices[cake.weight]}
                                            </Badge>
                                            <Badge bg="success" className="p-2 ms-2 fs-6">
                                                Total: ₹{cake.quantity * (cake.weight === "Special Order" ? (cake.price || 0) : cakePrices[cake.weight])}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline-primary" onClick={addCakeEntry} className="w-100">
                                    <BsPlusCircle className="me-2" /> Add Cake
                                </Button>
                            </Card.Body>
                        </Card>

                        <Card className="mb-3 bg-light border-0">
                            <Card.Header className="bg-primary text-white py-2">
                                <h5 className="mb-0">Pastry Orders</h5>
                            </Card.Header>
                            <Card.Body>
                                {newOrder.pastries.length > 0 ? (
                                    <div className="p-3 border rounded bg-white">
                                        <Row>
                                            <Col md={5}>
                                                <Form.Group>
                                                    <Form.Label>Flavor</Form.Label>
                                                    <Form.Select
                                                        name="flavor"
                                                        value={newOrder.pastries[0].flavor}
                                                        onChange={(e) => handlePastryChange("flavor", e.target.value)}
                                                    >
                                                        <option value="Chocolate">Chocolate</option>
                                                        <option value="Vanilla">Vanilla</option>
                                                        <option value="Strawberry">Strawberry</option>
                                                        <option value="Butterscotch">Butterscotch</option>
                                                        <option value="Red Velvet">Red Velvet</option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>Quantity</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name="quantity"
                                                        value={newOrder.pastries[0].quantity}
                                                        min="1"
                                                        onChange={(e) => handlePastryChange("quantity", e.target.value)}
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={3} className="d-flex align-items-end">
                                                <Button
                                                    variant="danger"
                                                    className="mb-3 w-100"
                                                    onClick={() => setNewOrder({ ...newOrder, pastries: [] })}
                                                >
                                                    <BsTrash className="me-1" /> Remove
                                                </Button>
                                            </Col>
                                        </Row>
                                        <div className="mt-2">
                                            <Badge bg="info" className="p-2 fs-6">
                                                Price: ₹{pastryPrice}
                                            </Badge>
                                            <Badge bg="success" className="p-2 ms-2 fs-6">
                                                Total: ₹{newOrder.pastries[0].quantity * pastryPrice}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <Button variant="outline-primary" onClick={addPastryEntry} className="w-100">
                                        <BsPlusCircle className="me-2" /> Add Pastry
                                    </Button>
                                )}
                            </Card.Body>
                        </Card>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={addOrder}>
                        <BsFillCartPlusFill className="me-2" /> Add Order
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CakeManagement;