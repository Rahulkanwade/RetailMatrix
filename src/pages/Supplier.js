import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

import * as bootstrap from 'bootstrap';


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

    // Form states
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        contact: "",
        address: "",
        products: [],
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
  

    // Product addition states
    const [newProduct, setNewProduct] = useState({
        name: "",
        quantity: 0,
        unit: "packet",
        price: 0,
        category: 1
    });

  
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

        const updatedProducts = [...newSupplier.products, { ...newProduct }];

        setNewSupplier({
            ...newSupplier,
            products: updatedProducts,
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

    // Calculate total purchase value per supplier
    const calculateSupplierValue = (supplier) => {
        return supplier.products.reduce((total, product) => {
            return total + (product.price * product.quantity);
        }, 0);
    };

    return (
        <div className="container-fluid p-4">
            

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
                                                                    setNewSupplier({
                                                                        ...newSupplier,
                                                                        products: updatedProducts,
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