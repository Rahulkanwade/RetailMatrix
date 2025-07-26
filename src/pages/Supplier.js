import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as bootstrap from 'bootstrap'; // ✅ required for modal handling
import { CSVLink } from 'react-csv';     // ✅ used for CSV export
import jsPDF from 'jspdf';              // ✅ used for PDF export
import 'jspdf-autotable';

export default function EnhancedSupplierManagement() {
    // Predefined suppliers list
    const predefinedSuppliers = [
        {
            id: 1,
            name: "पडतानी मिल",
            contact: "+919876543210",
            address: "मालपाणी हेल्थ क्लब, रोड, कासारवाडी, संगमनेर, महाराष्ट्र ४२२६०५"
        },
        {
            id: 2,
            name: "तापडे",
            contact: "+919850557700",
            address: "अकोले बायपास Rd, संगमनेर, महाराष्ट्र"
        },
        {
            id: 3,
            name: "श्री साई ट्रेडर्स / पवार",
            contact: "+919822760071",
            address: "लिंक रोड, बागवान पुरा, संगमनेर, महाराष्ट्र"
        }
    ];

    // Initial state for suppliers
    const [suppliers, setSuppliers] = useState([]);
    const [availableSuppliers] = useState(predefinedSuppliers);

    // Product categories
    const productCategories = [
        { id: 1, name: "खाद्य सामग्री (Food Items)" },
        { id: 2, name: "पैकेजिंग सामग्री (Packaging)" },
        { id: 3, name: "दुग्ध उत्पाद (Dairy)" },
        { id: 4, name: "मसाले (Spices)" },
        { id: 5, name: "अन्य (Other)" }
    ];

    // Common products in Marathi with English translations and categories
    const commonProducts = [
        { value: "मैदा (Flour)", label: "मैदा (Flour)", category: 1, inventory: 0 },
        { value: "साखर (Sugar)", label: "साखर (Sugar)", category: 1, inventory: 0 },
        { value: "तेल (Oil)", label: "तेल (Oil)", category: 1, inventory: 0 },
        { value: "बेकिंग पाउडर (Baking Powder)", label: "बेकिंग पाउडर (Baking Powder)", category: 1, inventory: 0 },
        { value: "डिब्बे (Containers)", label: "डिब्बे (Containers)", category: 2, inventory: 0 },
        { value: "दूध (Milk)", label: "दूध (Milk)", category: 3, inventory: 0 },
        { value: "इलायची (Cardamom)", label: "इलायची (Cardamom)", category: 4, inventory: 0 },
    ];

    // Product inventory state
    const [inventory, setInventory] = useState(commonProducts);

    // Payment history state
    const [payments, setPayments] = useState([]);

    // Form states
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        contact: "",
        address: "",
        products: [],
        pendingPayments: 0,
        dateAdded: new Date().toISOString().split('T')[0],
        billDate: new Date().toISOString().split('T')[0]
    });

    // UI states
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [useCustomProduct, setUseCustomProduct] = useState(false);
    const [useExistingSupplier, setUseExistingSupplier] = useState(false);
    const [selectedExistingSupplier, setSelectedExistingSupplier] = useState("");
    const [contactError, setContactError] = useState("");

    // New states for advanced features
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(4);
    const [sortField, setSortField] = useState("name");
    const [sortDirection, setSortDirection] = useState("asc");
    const [filterCategory, setFilterCategory] = useState("");

    // Payment modal states
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Report states
    const [reportStartDate, setReportStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [reportEndDate, setReportEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    // Product addition states
    const [newProduct, setNewProduct] = useState({
        name: "",
        quantity: 0,
        unit: "packet",
        price: 0,
        category: 1
    });

    // Summary metrics
    const totalPendingPayments = suppliers.reduce((total, supplier) => total + supplier.pendingPayments, 0);
    const totalSuppliers = suppliers.length;
    const totalProducts = inventory.reduce((total, item) => total + item.inventory, 0);
    const totalPayments = payments.reduce((total, payment) => total + payment.amount, 0);

    // Handle contact change with validation
    const handleContactChange = (e) => {
        let value = e.target.value;

        // Ensure it starts with +91
        if (!value.startsWith("+91")) {
            value = "+91" + value.replace(/\D/g, ""); // Remove non-numeric characters and enforce +91
        } else {
            value = "+91" + value.slice(3).replace(/\D/g, ""); // Keep +91 and allow only numbers after it
        }

        // Restrict input to exactly 10 digits after +91
        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        setNewSupplier({ ...newSupplier, contact: value });

        if (value.length < 13) {
            setContactError("Contact number must be 10 digits.");
        } else {
            setContactError("");
        }
    };

    // Load supplier info when selecting from predefined list
    const handleExistingSupplierSelection = (supplierId) => {
        if (!supplierId) return;

        const supplier = availableSuppliers.find(s => s.id.toString() === supplierId);
        if (supplier) {
            setNewSupplier({
                name: supplier.name,
                contact: supplier.contact,
                address: supplier.address,
                products: [],
                pendingPayments: 0,
                dateAdded: new Date().toISOString().split('T')[0],
                billDate: new Date().toISOString().split('T')[0]
            });
        }
    };

    // Add supplier
    const addSupplier = () => {
        // Validation
        if (!newSupplier.name.trim()) {
            alert("Supplier name is required");
            return;
        }
        if (!newSupplier.contact.trim()) {
            alert("Contact number is required");
            return;
        }

        if (isEditing && selectedSupplier) {
            // Update existing supplier
            setSuppliers(suppliers.map(sup =>
                sup.id === selectedSupplier.id
                    ? { ...newSupplier, id: selectedSupplier.id }
                    : sup
            ));
            setIsEditing(false);
            setSelectedSupplier(null);
        } else {
            // Add new supplier
            const newSupplierWithId = {
                ...newSupplier,
                id: Date.now()
            };
            setSuppliers([...suppliers, newSupplierWithId]);
        }

        // Update inventory for each product
        if (newSupplier.products.length > 0) {
            updateInventory(newSupplier.products);
        }

        // Reset form
        setNewSupplier({
            name: "",
            contact: "",
            address: "",
            products: [],
            pendingPayments: 0,
            dateAdded: new Date().toISOString().split('T')[0],
            billDate: new Date().toISOString().split('T')[0]
        });
        setSelectedExistingSupplier("");
        setUseExistingSupplier(false);
    };

    // Update inventory when adding products
    const updateInventory = (products) => {
        const updatedInventory = [...inventory];

        products.forEach(product => {
            const existingIndex = updatedInventory.findIndex(
                item => item.value === product.name
            );

            if (existingIndex !== -1) {
                updatedInventory[existingIndex].inventory += Number(product.quantity);
            } else {
                // Find category or default to "Other"
                const categoryId = product.category || 5;
                updatedInventory.push({
                    value: product.name,
                    label: product.name,
                    category: categoryId,
                    inventory: Number(product.quantity)
                });
            }
        });

        setInventory(updatedInventory);
    };

    // Delete supplier
    const deleteSupplier = (supplierId) => {
        if (window.confirm("Are you sure you want to delete this supplier?")) {
            setSuppliers(suppliers.filter(sup => sup.id !== supplierId));
        }
    };

    // Edit supplier
    const editSupplier = (supplier) => {
        setNewSupplier({ ...supplier });
        setIsEditing(true);
        setSelectedSupplier(supplier);
    };

    // Add product to supplier
    const addProduct = () => {
        if (!newProduct.name.trim() || newProduct.quantity <= 0 || newProduct.price <= 0) {
            alert("Please enter valid product details including price");
            return;
        }

        // Use the product without adding bill date to each one (we'll use the supplier's bill date)
        const updatedProducts = [...newSupplier.products, { ...newProduct }];

        // Calculate total pending payment
        const productTotal = newProduct.price * newProduct.quantity;
        const newPendingPayments = Number(newSupplier.pendingPayments) + productTotal;

        setNewSupplier({
            ...newSupplier,
            products: updatedProducts,
            pendingPayments: newPendingPayments
        });

        // Reset product form
        setNewProduct({
            name: "",
            quantity: 0,
            unit: "packet",
            price: 0,
            category: 1
        });
    };

    // Record payment
    const recordPayment = () => {
        if (!selectedSupplier || paymentAmount <= 0) {
            alert("Invalid payment details");
            return;
        }

        const payment = {
            id: Date.now(),
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.name,
            amount: paymentAmount,
            method: paymentMethod,
            date: paymentDate
        };

        // Add payment to history
        setPayments([...payments, payment]);

        // Update supplier's pending payments
        setSuppliers(suppliers.map(sup =>
            sup.id === selectedSupplier.id
                ? { ...sup, pendingPayments: Math.max(0, sup.pendingPayments - paymentAmount) }
                : sup
        ));

        // Reset payment states
        setPaymentAmount(0);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setSelectedSupplier(null);
    };

    // Handle product selection or manual entry
    const handleProductSelection = (value) => {
        const selectedProduct = commonProducts.find(p => p.value === value);
        if (selectedProduct) {
            setNewProduct({
                ...newProduct,
                name: value,
                category: selectedProduct.category
            });
        } else {
            setNewProduct({ ...newProduct, name: value });
        }
    };

    // Toggle between predefined products and custom entry
    const toggleProductEntry = () => {
        setUseCustomProduct(!useCustomProduct);
        setNewProduct({
            ...newProduct,
            name: "",
            category: 1
        });
    };

    // Toggle between new supplier and existing supplier
    const toggleSupplierEntry = () => {
        setUseExistingSupplier(!useExistingSupplier);
        setNewSupplier({
            name: "",
            contact: "",
            address: "",
            products: [],
            pendingPayments: 0,
            dateAdded: new Date().toISOString().split('T')[0],
            billDate: new Date().toISOString().split('T')[0]
        });
        setSelectedExistingSupplier("");
    };

    // Generate filtered and sorted suppliers
    const getFilteredSuppliers = () => {
        return suppliers
            .filter(supplier => {
                const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    supplier.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    supplier.contact.includes(searchTerm);

                return matchesSearch;
            })
            .sort((a, b) => {
                if (sortField === "name") {
                    return sortDirection === "asc"
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                } else if (sortField === "pendingPayments") {
                    return sortDirection === "asc"
                        ? a.pendingPayments - b.pendingPayments
                        : b.pendingPayments - a.pendingPayments;
                } else if (sortField === "date") {
                    return sortDirection === "asc"
                        ? new Date(a.billDate) - new Date(b.billDate)
                        : new Date(b.billDate) - new Date(a.billDate);
                }
                return 0;
            });
    };

    // Pagination logic
    const filteredSuppliers = getFilteredSuppliers();
    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstItem, indexOfLastItem);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Sort functionality
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Generate filtered payments for reports
    const getFilteredPayments = () => {
        return payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            const startDate = new Date(reportStartDate);
            const endDate = new Date(reportEndDate);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date

            return paymentDate >= startDate && paymentDate <= endDate;
        });
    };

    // Export payment report to PDF
    const exportToPDF = () => {
        const filteredPayments = getFilteredPayments();
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text('Payment Report', 14, 22);

        // Add date range
        doc.setFontSize(12);
        doc.text(`From: ${reportStartDate} To: ${reportEndDate}`, 14, 30);

        // Add total
        const total = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
        doc.text(`Total Amount: ₹${total}`, 14, 38);

        // Create table
        const tableColumn = ["Date", "Supplier", "Amount", "Method"];
        const tableRows = [];

        filteredPayments.forEach(payment => {
            const paymentData = [
                payment.date,
                payment.supplierName,
                `₹${payment.amount}`,
                payment.method.toUpperCase()
            ];
            tableRows.push(paymentData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            styles: { fontSize: 10 }
        });

        doc.save(`payment-report-${reportStartDate}-to-${reportEndDate}.pdf`);
    };

    // CSV data for export
    const csvData = [
        ["Date", "Supplier", "Amount", "Method"],
        ...getFilteredPayments().map(payment => [
            payment.date,
            payment.supplierName,
            payment.amount,
            payment.method
        ])
    ];

    // Calculate total purchase value per supplier
    const calculateSupplierValue = (supplier) => {
        return supplier.products.reduce((total, product) => {
            return total + (product.price * product.quantity);
        }, 0);
    };

    return (
        <div className="container-fluid p-4">
            {/* Summary Dashboard */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h2 className="mb-0">Dashboard Summary</h2>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-3 mb-3">
                                    <div className="card bg-info text-white h-100">
                                        <div className="card-body">
                                            <h5 className="card-title">Total Pending</h5>
                                            <h2 className="mb-0">₹{totalPendingPayments}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="card bg-success text-white h-100">
                                        <div className="card-body">
                                            <h5 className="card-title">Total Paid</h5>
                                            <h2 className="mb-0">₹{totalPayments}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="card bg-warning text-dark h-100">
                                        <div className="card-body">
                                            <h5 className="card-title">Suppliers</h5>
                                            <h2 className="mb-0">{totalSuppliers}</h2>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3 mb-3">
                                    <div className="card bg-secondary text-white h-100">
                                        <div className="card-body">
                                            <h5 className="card-title">Inventory Items</h5>
                                            <h2 className="mb-0">{totalProducts}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-4">
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                            <h2 className="mb-0">{isEditing ? "Edit Supplier" : "Add Supplier"}</h2>
                            {!isEditing && (
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id="supplierTypeSwitch"
                                        checked={useExistingSupplier}
                                        onChange={toggleSupplierEntry}
                                    />
                                    <label className="form-check-label text-white" htmlFor="supplierTypeSwitch">
                                        Use Existing
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="card-body">
                            <form>
                                {useExistingSupplier ? (
                                    <div className="mb-3">
                                        <label className="form-label">Select Supplier</label>
                                        <select
                                            className="form-select"
                                            value={selectedExistingSupplier}
                                            onChange={(e) => {
                                                setSelectedExistingSupplier(e.target.value);
                                                handleExistingSupplierSelection(e.target.value);
                                            }}
                                        >
                                            <option value="">-- Select Supplier --</option>
                                            {availableSuppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                <div className="mb-3">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Supplier Name"
                                        value={newSupplier.name}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                        required
                                        disabled={useExistingSupplier && selectedExistingSupplier}
                                    />
                                </div>
                                <div className="mb-3">
                                    <input
                                        className="form-control"
                                        type="tel"
                                        placeholder="+91XXXXXXXXXX"
                                        value={newSupplier.contact}
                                        onChange={handleContactChange}
                                        required
                                    />
                                    {contactError && <small className="text-danger">{contactError}</small>}
                                </div>
                                <div className="mb-3">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Address"
                                        value={newSupplier.address}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <input
                                        className="form-control"
                                        type="number"
                                        placeholder="Pending Payments"
                                        value={newSupplier.pendingPayments}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, pendingPayments: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Bill Date</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={newSupplier.billDate}
                                        onChange={(e) => setNewSupplier({ ...newSupplier, billDate: e.target.value })}
                                    />
                                </div>

                                {/* Product Addition Section */}
                                <div className="card mb-3">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <span>Add Product</span>
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="productTypeSwitch"
                                                checked={useCustomProduct}
                                                onChange={toggleProductEntry}
                                            />
                                            <label className="form-check-label" htmlFor="productTypeSwitch">
                                                Custom Product
                                            </label>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="row">
                                            <div className="col-md-6 mb-2">
                                                {useCustomProduct ? (
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        placeholder="Product Name"
                                                        value={newProduct.name}
                                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                                    />
                                                ) : (
                                                    <select
                                                        className="form-select"
                                                        value={newProduct.name}
                                                        onChange={(e) => handleProductSelection(e.target.value)}
                                                    >
                                                        <option value="">-- Select Product --</option>
                                                        {commonProducts.map((product, index) => (
                                                            <option key={index} value={product.value}>
                                                                {product.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                            <div className="col-md-6 mb-2">
                                                <select
                                                    className="form-select"
                                                    value={newProduct.category}
                                                    onChange={(e) => setNewProduct({ ...newProduct, category: Number(e.target.value) })}
                                                >
                                                    {productCategories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="row">
                                            <div className="col-md-4 mb-2">
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    placeholder="Quantity"
                                                    value={newProduct.quantity}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setNewProduct({ ...newProduct, quantity: Math.max(0, value) });
                                                    }}
                                                    min="0"
                                                />
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <select
                                                    className="form-select"
                                                    value={newProduct.unit}
                                                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                                >
                                                    <option value="kg">किलो (kg)</option>
                                                    <option value="liter">लिटर (liter)</option>
                                                    <option value="g">ग्रॅम (g)</option>
                                                    <option value="packet">कट्टा (packet)</option>
                                                </select>
                                            </div>
                                            <div className="col-md-4 mb-2">
                                                <input
                                                    className="form-control"
                                                    type="number"
                                                    placeholder="Price per Unit"
                                                    value={newProduct.price}
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        setNewProduct({ ...newProduct, price: Math.max(0, value) });
                                                    }}
                                                    min="0"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-secondary mt-2"
                                            onClick={addProduct}
                                        >
                                            Add Product
                                        </button>

                                        {/* Display added products before submitting */}
                                        {newSupplier.products.length > 0 && newSupplier.products.every(p => p.name && p.quantity > 0 && p.price > 0) && (
                                            <div className="mt-3">

                                                <h6>Added Products:</h6>
                                                <ul className="list-group">
                                                    {newSupplier.products.map((product, index) => (
                                                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                                                            <div>
                                                                {product.name} - {product.quantity} {product.unit} @ ₹{product.price}/unit
                                                                <div className="small text-muted">
                                                                    Total: ₹{product.price * product.quantity}
                                                                </div>
                                                            </div>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => {
                                                                    const updatedProducts = newSupplier.products.filter((_, i) => i !== index);
                                                                    const removedProductValue = product.price * product.quantity;
                                                                    setNewSupplier({
                                                                        ...newSupplier,
                                                                        products: updatedProducts,
                                                                        pendingPayments: newSupplier.pendingPayments - removedProductValue
                                                                    });
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 text-end">
                                                    <strong>Total Value: ₹{
                                                        newSupplier.products.reduce((total, product) =>
                                                            total + (product.price * product.quantity), 0)
                                                    }</strong>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`btn ${isEditing ? 'btn-warning' : 'btn-success'} w-100`}
                                    onClick={addSupplier}
                                >
                                    {isEditing ? "Update Supplier" : "Add Supplier"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Inventory Summary */}
                    <div className="card mb-4">
                        <div className="card-header bg-secondary text-white">
                            <h2 className="mb-0">Inventory Summary</h2>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Filter by Category</label>
                                <select
                                    className="form-select"
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                >
                                    <option value="">All Categories</option>
                                    {productCategories.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory
                                            .filter(item => !filterCategory || item.category.toString() === filterCategory)
                                            .map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.label}</td>
                                                    <td>
                                                        {productCategories.find(cat => cat.id === item.category)?.name || 'Other'}
                                                    </td>
                                                    <td>{item.inventory}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Payment Report */}
                    <div className="card mb-4">
                        <div className="card-header bg-success text-white">
                            <h2 className="mb-0">Payment Reports</h2>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={reportStartDate}
                                        onChange={(e) => setReportStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">End Date</label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        value={reportEndDate}
                                        onChange={(e) => setReportEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="d-flex gap-2 mb-3">
                                <button className="btn btn-primary" onClick={exportToPDF}>Export PDF</button>
                                <CSVLink
                                    data={csvData}
                                    filename={`payment-report-${reportStartDate}-to-${reportEndDate}.csv`}
                                    className="btn btn-secondary"
                                    target="_blank"
                                >
                                    Export CSV
                                </CSVLink>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-sm table-striped">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Supplier</th>
                                            <th>Amount</th>
                                            <th>Method</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredPayments().map((payment, index) => (
                                            <tr key={index}>
                                                <td>{payment.date}</td>
                                                <td>{payment.supplierName}</td>
                                                <td>₹{payment.amount}</td>
                                                <td>{payment.method.toUpperCase()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    {/* Supplier List */}
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h2 className="mb-0">Suppliers</h2>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <input
                                        className="form-control"
                                        type="text"
                                        placeholder="Search suppliers..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                    >
                                        <option value="4">4 per page</option>
                                        <option value="8">8 per page</option>
                                        <option value="12">12 per page</option>
                                    </select>
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={`${sortField}-${sortDirection}`}
                                        onChange={(e) => {
                                            const [field, direction] = e.target.value.split('-');
                                            setSortField(field);
                                            setSortDirection(direction);
                                        }}
                                    >
                                        <option value="name-asc">Name (A-Z)</option>
                                        <option value="name-desc">Name (Z-A)</option>
                                        <option value="pendingPayments-asc">Pending (Low-High)</option>
                                        <option value="pendingPayments-desc">Pending (High-Low)</option>
                                        <option value="date-asc">Date (Old-New)</option>
                                        <option value="date-desc">Date (New-Old)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-striped table-hover">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort("name")}>Supplier Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}</th>
                                            <th>Contact</th>
                                            <th>Address</th>
                                            <th onClick={() => handleSort("date")}>Bill Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}</th>
                                            <th>Total Bill</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>


                                    <tbody>
                                        {currentSuppliers.map(supplier => (
                                            <tr key={supplier.id}>
                                                <td>{supplier.name}</td>
                                                <td>{supplier.contact}</td>
                                                <td>{supplier.address}</td>

                                                <td>{supplier.billDate}</td>
                                                <td>
                                                    ₹{calculateSupplierValue(supplier)}
                                                </td>

                                                <td>
                                                    <div className="d-flex gap-1">
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => editSupplier(supplier)}
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => deleteSupplier(supplier.id)}
                                                        >
                                                            Delete
                                                        </button>

                                                        <button
                                                            className="btn btn-sm btn-info"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#productsModal"
                                                            onClick={() => setSelectedSupplier(supplier)}
                                                        >
                                                            View Products
                                                        </button>
                                                    </div>

                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <nav>
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => paginate(index + 1)}
                                                >
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                    <div className="card mb-4">
                        <div className="card-header bg-warning text-dark">
                            <h2 className="mb-0">Record Payment</h2>
                        </div>
                        <div className="card-body">
                            <form>
                                <div className="mb-3">
                                    <label className="form-label">Select Supplier</label>
                                    <select
                                        className="form-select"
                                        value={selectedSupplier?.id || ""}
                                        onChange={(e) => {
                                            const supplierId = e.target.value;
                                            const supplier = suppliers.find(s => s.id.toString() === supplierId);
                                            setSelectedSupplier(supplier || null);
                                            setPaymentAmount(supplier?.pendingPayments || 0);
                                        }}
                                    >
                                        <option value="">-- Select Supplier --</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier.id} value={supplier.id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedSupplier && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Outstanding Amount</label>
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={`₹${selectedSupplier.pendingPayments}`}
                                                readOnly
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Payment Amount</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                value={paymentAmount}
                                                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                                max={selectedSupplier.pendingPayments}
                                                min={0}
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Payment Method</label>
                                            <select
                                                className="form-select"
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="upi">UPI</option>
                                                <option value="bank">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                            </select>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Payment Date</label>
                                            <input
                                                className="form-control"
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={() => {
                                                if (!selectedSupplier || paymentAmount <= 0) {
                                                    alert("Enter valid payment");
                                                    return;
                                                }
                                                recordPayment();
                                                setSelectedSupplier(null);
                                                setPaymentAmount(0);
                                            }}
                                        >
                                            Record Payment
                                        </button>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>

                    <div className="card mb-4">
                        <div className="card-header bg-success text-white">
                            <h2 className="mb-0">Payment History</h2>
                        </div>
                        <div className="card-body">
                            {payments.length === 0 ? (
                                <p className="text-muted">No payments recorded yet.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-striped table-sm">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Date</th>
                                                <th>Supplier</th>
                                                <th>Amount</th>
                                                <th>Method</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {payments.map((payment, index) => (
                                                <tr key={payment.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{payment.date}</td>
                                                    <td>{payment.supplierName}</td>
                                                    <td>₹{payment.amount}</td>
                                                    <td>{payment.method.toUpperCase()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Payment Modal */}
            <div className="modal fade" id="paymentModal" tabIndex="-1" aria-labelledby="paymentModalLabel" aria-hidden="true">
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title" id="paymentModalLabel">Record Payment</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {selectedSupplier && (
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label">Supplier</label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={selectedSupplier.name}
                                            readOnly
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Outstanding Amount</label>
                                        <input
                                            className="form-control"
                                            type="text"
                                            value={`₹${selectedSupplier.pendingPayments}`}
                                            readOnly
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Payment Amount</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                            max={selectedSupplier.pendingPayments}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Payment Method</label>
                                        <select
                                            className="form-select"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="upi">UPI</option>
                                            <option value="bank">Bank Transfer</option>
                                            <option value="cheque">Cheque</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Payment Date</label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => {
                                    recordPayment();
                                    // Close modal using bootstrap
                                    const modal = document.getElementById('paymentModal');
                                    const bsModal = bootstrap.Modal.getInstance(modal);
                                    if (bsModal) bsModal.hide(); // ✅ prevent crash if modal is not open

                                }}
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Modal */}
            <div className="modal fade" id="productsModal" tabIndex="-1" aria-labelledby="productsModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header bg-info text-white">
                            <h5 className="modal-title" id="productsModalLabel">Supplier Products</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            {selectedSupplier && (
                                <>
                                    <div className="mb-3">
                                        <h4>{selectedSupplier.name}</h4>
                                        <p className="text-muted">{selectedSupplier.contact} | {selectedSupplier.address}</p>
                                        <div className="d-flex justify-content-between">
                                            <p><strong>Bill Date:</strong> {selectedSupplier.billDate}</p>
                                            <p><strong>Total Value:</strong> ₹{calculateSupplierValue(selectedSupplier)}</p>
                                        </div>
                                    </div>

                                    <h5>Products</h5>
                                    <div className="table-responsive">
                                        <table className="table table-striped">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Product</th>
                                                    <th>Category</th>
                                                    <th>Quantity</th>
                                                    <th>Unit</th>
                                                    <th>Price/Unit</th>
                                                    <th>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedSupplier.products.map((product, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{product.name}</td>
                                                        <td>
                                                            {productCategories.find(cat => cat.id === product.category)?.name || 'Other'}
                                                        </td>
                                                        <td>{product.quantity}</td>
                                                        <td>{product.unit}</td>
                                                        <td>₹{product.price}</td>
                                                        <td>₹{product.price * product.quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan="6" className="text-end"><strong>Total</strong></td>
                                                    <td><strong>₹{calculateSupplierValue(selectedSupplier)}</strong></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}