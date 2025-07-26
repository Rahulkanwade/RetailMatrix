import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Row, Col, Card, Badge, Container, Accordion } from "react-bootstrap";
import axios from "axios";
import { BsFillCartPlusFill, BsTrash, BsPlusCircle, BsCake, BsCalendar, BsPerson } from "react-icons/bs";

const API_URL = "http://localhost:5000";

const CakeManagement = () => {
    const [orders, setOrders] = useState([]);
    const [show, setShow] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customer: "",
        cakes: [],
        pastries: [],
        orderDate: "",
        deliveryDate: "Pending"
    });
    const predefinedWeights = ["250gm", "500gm", "1kg", "Special Order"];
    const [cakePrices, setCakePrices] = useState({
        "250gm": 105,
        "500gm": 165,
        "1kg": 320,
        "Special Order": 0,
    });
    const [pastryPrice, setPastryPrice] = useState(200);
    const [customers, setCustomers] = useState([]);
    const [newCustomer, setNewCustomer] = useState("");
    const [isAddingCustomer, setIsAddingCustomer] = useState(false);
    const today = new Date().toISOString().split("T")[0];
    
    useEffect(() => {
        fetchOrders();
        fetchCustomers();
        fetchPrices();
    }, []);

    const fetchOrders = async () => {
        try {
            const response = await axios.get("http://localhost:5000/orders", { withCredentials: true });

            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            alert("Failed to load orders from database");
        }
    };

    const fetchCustomers = async () => {
        try {
           const response = await axios.get(`${API_URL}/customers`, { withCredentials: true });

            setCustomers(response.data.map(customer => customer.name));
        } catch (error) {
            console.error("Error fetching customers:", error);
            setCustomers(["Customer A", "Customer B", "Customer C", "Customer D"]);
        }
    };

    const fetchPrices = async () => {
    try {
     const response = await axios.get(`${API_URL}/prices`, { withCredentials: true });

        const prices = response.data;
        
        // Start with the current prices as a base
        const cakePricesObj = { ...cakePrices };
        
        // Update only the prices that came from the API
        prices.filter(price => price.type === 'cake').forEach(price => {
            cakePricesObj[price.weight] = price.price;
        });
        
        // Update the state with the merged prices
        setCakePrices(cakePricesObj);
        
        const pastryPriceData = prices.find(price => price.type === 'pastry');
        if (pastryPriceData) {
            setPastryPrice(pastryPriceData.price);
        }
    } catch (error) {
        console.error("Error fetching prices:", error);
    }
};

    const handleNewCustomerAdd = async () => {
        if (newCustomer.trim()) {
            try {
                await axios.post(`${API_URL}/customers`, { name: newCustomer.trim() });
                
                const updatedCustomers = [...customers, newCustomer.trim()];
                setCustomers(updatedCustomers);
                setNewOrder({ ...newOrder, customer: newCustomer.trim() });
                setNewCustomer("");
                setIsAddingCustomer(false);
            } catch (error) {
                console.error("Error adding customer:", error);
                alert("Failed to add customer to database");
            }
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

    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);
    const handleChange = (e) => {
        setNewOrder({ ...newOrder, [e.target.name]: e.target.value });
    };

    const handleCakeChange = (index, field, value) => {
        if (field === "quantity" || field === "price") {
            if (parseInt(value) < 0) return;
        }

        const updatedCakes = [...newOrder.cakes];

        if (field === "weight") {
            const existingWeights = newOrder.cakes.map(cake => cake.weight);
            if (existingWeights.includes(value)) {
                alert("This weight category has already been selected. Please choose a different one.");
                return;
            }
            updatedCakes[index] = {
                weight: value,
                quantity: 1,
                customWeight: "",
                price: value === "Special Order" ? "" : (cakePrices[value] || 0)
            };
        } else {
            updatedCakes[index][field] = value;
        }

        setNewOrder({ ...newOrder, cakes: updatedCakes });
    };

    const handlePastryChange = (field, value) => {
        if (field === "quantity" && parseInt(value) < 0) return;

        const updatedPastries = [{ ...newOrder.pastries[0], [field]: value }];
        setNewOrder({ ...newOrder, pastries: updatedPastries });
    };

    const addCakeEntry = () => {
        const existingWeights = newOrder.cakes.map(cake => cake.weight);
        const availableWeight = predefinedWeights.find(weight => !existingWeights.includes(weight));

        if (availableWeight) {
            setNewOrder({
                ...newOrder,
                cakes: [...newOrder.cakes, { weight: availableWeight, quantity: 1, customWeight: "" }]
            });
        } else {
            alert("All weight categories have already been selected.");
        }
    };

    const addPastryEntry = () => {
        if (newOrder.pastries.length > 0) {
            alert("Only one pastry order is allowed per order.");
            return;
        }
        setNewOrder(prevOrder => ({
            ...prevOrder,
            pastries: [{ flavor: "Chocolate", quantity: 1 }]
        }));
    };

    const addOrder = async () => {
        if (!newOrder.customer.trim()) {
            alert("Please select a customer.");
            return;
        }
        if (!newOrder.orderDate.trim()) {
            alert("Please select an order date.");
            return;
        }
        if (!newOrder.cakes?.length && !newOrder.pastries?.length) {
            alert("Please add at least one cake or pastry to the order.");
            return;
        }

        const orderWithPrices = {
            ...newOrder,
            cakes: newOrder.cakes.map(cake => ({
                ...cake,
                price: cake.weight === "Special Order" ? parseInt(cake.price) || 0 : (cakePrices[cake.weight] || 0)
            })),
            pastries: newOrder.pastries.map(pastry => ({
                ...pastry,
                price: pastryPrice
            })),
            deliveryDate: "Pending"
        };

        try {
            await axios.post(`${API_URL}/orders`, orderWithPrices);
            fetchOrders();
            setNewOrder({
                customer: "",
                cakes: [],
                pastries: [],
                orderDate: "",
                deliveryDate: "Pending"
            });
            handleClose();
        } catch (error) {
            console.error("Error adding order:", error);
            alert("Failed to add order to database");
        }
    };

    const updateDeliveryDate = async (index, date) => {
        try {
            const order = orders[index];
            await axios.put(`${API_URL}/orders/${order.id}`, { deliveryDate: date });
            
            const updatedOrders = [...orders];
            updatedOrders[index].deliveryDate = date;
            setOrders(updatedOrders);
        } catch (error) {
            console.error("Error updating delivery date:", error);
            alert("Failed to update delivery date in database");
        }
    };

    const deleteOrder = async (index) => {
        try {
            const order = orders[index];
            await axios.delete(`${API_URL}/orders/${order.id}`);
            setOrders(orders.filter((_, i) => i !== index));
        } catch (error) {
            console.error("Error deleting order:", error);
            alert("Failed to delete order from database");
        }
    };

    const updatePrice = async (type, weight, price) => {
        try {
            await axios.put(`${API_URL}/prices`, { type, weight, price });
        } catch (error) {
            console.error("Error updating price:", error);
            alert("Failed to update price in database");
        }
    };

    const calculateDailyRevenue = () => {
        const dailyRevenue = {};

        orders.forEach((order) => {
            if (!dailyRevenue[order.orderDate]) {
                dailyRevenue[order.orderDate] = 0;
            }
            const orderTotal = order.cakes.reduce((sum, cake) =>
                sum + (cake.quantity * (cake.price || 0)), 0);

            const pastryTotal = order.pastries.reduce((sum, pastry) =>
                sum + (pastry.quantity * (pastry.price || 0)), 0);

            dailyRevenue[order.orderDate] += orderTotal + pastryTotal;
        });

        return dailyRevenue;
    };

    const calculateOrderTotal = (order) => {
        const cakeTotal = order.cakes.reduce((sum, cake) => sum + (cake.quantity * (cake.price || 0)), 0);
        const pastryTotal = order.pastries.reduce((sum, pastry) => sum + (pastry.quantity * (pastry.price || 0)), 0);
        return cakeTotal + pastryTotal;
    };

    const dailyRevenue = calculateDailyRevenue();
    const totalMonthlyRevenue = Object.values(dailyRevenue).reduce((sum, amount) => sum + amount, 0);

    return (
        <Container fluid className="py-4 px-4 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-primary fw-bold">
                    <BsCake className="me-2" />
                    Sweet Delights Management
                </h2>
                <Button 
                    variant="primary" 
                    onClick={handleShow} 
                    className="d-flex align-items-center"
                    size="lg"
                >
                    <BsFillCartPlusFill className="me-2" /> Add New Order
                </Button>
            </div>

            <Row>
                <Col md={12} lg={4} className="mb-4">
                    <Card className="shadow border-0 h-100">
                        <Card.Header className="bg-primary text-white">
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
                                                        <Badge bg="light" text="dark" className="me-2 p-2">
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
                                            <Badge bg="light" text="dark" className="me-2 p-2">
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

                <Col md={12} lg={8} className="mb-4">
                    <Card className="shadow border-0">
                        <Card.Header className="bg-success text-white">
                            <h4 className="mb-0">Revenue Summary</h4>
                        </Card.Header>
                        <Card.Body>
                            <Table striped bordered hover responsive>
                                <thead className="table-light">
                                    <tr>
                                        <th>Date</th>
                                        <th className="text-end">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(dailyRevenue).map(([date, amount]) => (
                                        <tr key={date}>
                                            <td>{date}</td>
                                            <td className="text-end">₹{amount.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="table-success">
                                        <th>Total Monthly Revenue</th>
                                        <th className="text-end">₹{totalMonthlyRevenue.toLocaleString()}</th>
                                    </tr>
                                </tfoot>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Card className="shadow border-0 mb-4">
                <Card.Header className="bg-info text-white">
                    <h4 className="mb-0">Order Management</h4>
                </Card.Header>
                <Card.Body>
                    <Table striped bordered hover responsive className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>#</th>
                                <th>Customer</th>
                                <th>Order Date</th>
                                <th>Delivery Date</th>
                                <th>Order Details</th>
                                <th>Total</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <BsPerson className="me-2" />
                                            {order.customer}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <BsCalendar className="me-2" />
                                            {order.orderDate}
                                        </div>
                                    </td>
                                    <td>
                                        {order.deliveryDate === "Pending" ? (
                                            <Form.Control
                                                type="date"
                                                min={order.orderDate}
                                                max={today}
                                                onChange={(e) => updateDeliveryDate(index, e.target.value)}
                                                className="border-primary"
                                            />
                                        ) : (
                                            <Badge bg="success" className="px-3 py-2 w-100">
                                                {order.deliveryDate}
                                            </Badge>
                                        )}
                                    </td>
                                    <td>
                                        <div className="order-details">
                                            {order.cakes.map((cake, i) => (
                                                <div key={i} className="mb-1">
                                                    <Badge bg="light" text="dark" className="me-2">
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
                                                    <Badge bg="light" text="dark" className="me-2">
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
                                    <td className="text-end">
                                        <strong>₹{calculateOrderTotal(order).toLocaleString()}</strong>
                                    </td>
                                    <td>
                                        <Button 
                                            variant="danger" 
                                            size="sm" 
                                            onClick={() => deleteOrder(index)}
                                            className="d-flex align-items-center mx-auto"
                                        >
                                            <BsTrash className="me-1" /> Delete
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>
                        <BsFillCartPlusFill className="me-2" />
                        Add New Order
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <BsPerson className="me-2" />
                                        Customer Name
                                    </Form.Label>
                                    <Form.Select 
                                        className="mb-3" 
                                        value={newOrder.customer} 
                                        onChange={handleCustomerChange}
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((customer, i) => (
                                            <option key={i} value={customer}>{customer}</option>
                                        ))}
                                        <option value="addNew">➕ Add New Customer</option>
                                    </Form.Select>

                                    {isAddingCustomer && (
                                        <div className="mt-2">
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter new customer name"
                                                value={newCustomer}
                                                onChange={(e) => setNewCustomer(e.target.value)}
                                            />
                                            <Button 
                                                variant="success" 
                                                size="sm" 
                                                className="mt-2"
                                                onClick={handleNewCustomerAdd}
                                            >
                                                <BsPlusCircle className="me-1" /> Add Customer
                                            </Button>
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        <BsCalendar className="me-2" />
                                        Order Date
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
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">Cake Orders</h5>
                            </Card.Header>
                            <Card.Body>
                                {newOrder.cakes.map((cake, index) => (
                                    <div key={index} className="mb-3 p-3 border rounded bg-white">
                                        <h6 className="mb-3">Cake {index + 1}</h6>
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
                                                            <option key={i} value={weight}>{weight}</option>
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
                                                        onChange={(e) => handleCakeChange(index, "quantity", Math.max(1, parseInt(e.target.value) || 1))}
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
                                                            placeholder="Enter custom weight" 
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
                                            <div>
                                                <Badge bg="info" className="p-2">
                                                    Price: ₹{cake.weight === "Special Order" ? (cake.price || 0) : cakePrices[cake.weight]}
                                                </Badge>
                                                <Badge bg="success" className="p-2 ms-2">
                                                    Total: ₹{cake.quantity * (cake.weight === "Special Order" ? (cake.price || 0) : cakePrices[cake.weight])}
                                                </Badge>
                                            </div>
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                onClick={() => {
                                                    const updatedCakes = [...newOrder.cakes];
                                                    updatedCakes.splice(index, 1);
                                                    setNewOrder({...newOrder, cakes: updatedCakes});
                                                }}
                                            >
                                                <BsTrash /> Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                
                                <Button 
                                    variant="outline-primary" 
                                    onClick={addCakeEntry} 
                                    className="w-100"
                                >
                                    <BsPlusCircle className="me-2" /> Add Cake
                                </Button>
                            </Card.Body>
                        </Card>

                        <Card className="mb-3 bg-light border-0">
                            <Card.Header className="bg-primary text-white">
                                <h5 className="mb-0">Pastry Orders</h5>
                            </Card.Header>
                            <Card.Body>
                                {newOrder.pastries.length > 0 ? (
                                    <div className="mb-3 p-3 border rounded bg-white">
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
                                                        onChange={(e) => handlePastryChange("quantity", Math.max(1, parseInt(e.target.value) || 1))}
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
                                            <Badge bg="info" className="p-2">
                                                Price: ₹{pastryPrice}
                                            </Badge>
                                            <Badge bg="success" className="p-2 ms-2">
                                                Total: ₹{newOrder.pastries[0].quantity * pastryPrice}
                                            </Badge>
                                        </div>
                                    </div>
                                ) : (
                                    <Button 
                                        variant="outline-primary" 
                                        onClick={addPastryEntry} 
                                        className="w-100"
                                    >
                                        <BsPlusCircle className="me-2" /> Add Pastry
                                    </Button>
                                )}
                            </Card.Body>
                        </Card>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button variant="primary" onClick={addOrder}>
                        <BsFillCartPlusFill className="me-2" /> Add Order
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CakeManagement;