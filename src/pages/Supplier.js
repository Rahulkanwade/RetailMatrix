import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
export default function EnhancedSupplierManagement() {
    // State management
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Predefined suppliers list (for reference/quick add)
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

    // Product categories
    const productCategories = [
        { id: 1, name: "खाद्य सामग्री (Food Items)" },
        { id: 2, name: "पैकेजिंग सामग्री (Packaging)" },
        { id: 3, name: "दुग्ध उत्पाद (Dairy)" },
        { id: 4, name: "मसाले (Spices)" },
        { id: 5, name: "अन्य (Other)" }
    ];

    // Common products
    const commonProducts = [
        { value: "मैदा (Flour)", label: "मैदा (Flour)", category: 1 },
        { value: "साखर (Sugar)", label: "साखर (Sugar)", category: 1 },
        { value: "तेल (Oil)", label: "तेल (Oil)", category: 1 },
        { value: "बेकिंग पाउडर (Baking Powder)", label: "बेकिंग पाउडर (Baking Powder)", category: 1 },
        { value: "डिब्बे (Containers)", label: "डिब्बे (Containers)", category: 2 },
        { value: "दूध (Milk)", label: "दूध (Milk)", category: 3 },
        { value: "इलायची (Cardamom)", label: "इलायची (Cardamom)", category: 4 },
    ];

    // Form states
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        contact: "",
        address: "",
        products: [],
        billDate: new Date().toISOString().split('T')[0]
    });

    // UI states
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [useCustomProduct, setUseCustomProduct] = useState(false);
    const [useExistingSupplier, setUseExistingSupplier] = useState(false);
    const [selectedExistingSupplier, setSelectedExistingSupplier] = useState("");
    const [contactError, setContactError] = useState("");

    // Advanced features states
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

    // API Base URL
    const API_BASE = 'http://localhost:5000';

    // API helper function
    const apiCall = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                credentials: 'include', // Important for cookie-based auth
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    };

    // Load suppliers on component mount
    useEffect(() => {
        loadSuppliers();
    }, []);
    useEffect(() => {
        let isMounted = true;

        const loadData = async () => {
            if (!isMounted) return;

            try {
                setLoading(true);
                setError("");
                const data = await apiCall('/suppliers');
                if (isMounted) {
                    setSuppliers(data);
                }
            } catch (error) {
                if (isMounted) {
                    setError(`Failed to load suppliers: ${error.message}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, []);
    // Load suppliers from backend
    const loadSuppliers = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await apiCall('/suppliers');

            // If the API doesn't return products with each supplier, fetch them individually
            const suppliersWithProducts = await Promise.all(
                data.map(async (supplier) => {
                    try {
                        const productsData = await apiCall(`/suppliers/${supplier.id}/products`);
                        return {
                            ...supplier,
                            products: Array.isArray(productsData) ? productsData : []
                        };
                    } catch (error) {
                        console.warn(`Could not load products for supplier ${supplier.id}:`, error);
                        return {
                            ...supplier,
                            products: []
                        };
                    }
                })
            );

            setSuppliers(suppliersWithProducts);
        } catch (error) {
            setError(`Failed to load suppliers: ${error.message}`);
            console.error('Error loading suppliers:', error);
        } finally {
            setLoading(false);
        }
    };

    
    // 5. Safer date handling
    const formatDateForInput = (dateString) => {
        if (!dateString) return new Date().toISOString().split('T')[0];

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return new Date().toISOString().split('T')[0];
            }
            return date.toISOString().split('T')[0];
        } catch {
            return new Date().toISOString().split('T')[0];
        }
    };
    // Handle contact change with validation
    const handleContactChange = (e) => {
        let value = e.target.value;

        // Remove all non-digit characters except +
        const cleanValue = value.replace(/[^\d+]/g, '');

        // Ensure it starts with +91 and limit to 13 characters
        if (!cleanValue.startsWith("+91")) {
            value = "+91" + cleanValue.replace(/\+/g, '');
        } else {
            value = cleanValue;
        }

        // Limit to +91 + 10 digits
        if (value.length > 13) {
            value = value.slice(0, 13);
        }

        setNewSupplier({ ...newSupplier, contact: value });

        // Validate: must be exactly +91 followed by 10 digits
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(value)) {
            setContactError("Contact number must be +91 followed by 10 digits.");
        } else {
            setContactError("");
        }
    };

    // Load supplier info when selecting from predefined list
    const handleExistingSupplierSelection = (supplierId) => {
        if (!supplierId) return;

        const supplier = predefinedSuppliers.find(s => s.id.toString() === supplierId);
        if (supplier) {
            setNewSupplier({
                name: supplier.name,
                contact: supplier.contact,
                address: supplier.address,
                products: [],
                billDate: new Date().toISOString().split('T')[0]
            });
        }
    };

    // Add or update supplier
    const addSupplier = async () => {
        // Validation
        if (!newSupplier.name.trim()) {
            setError("Supplier name is required");
            return;
        }
        if (!newSupplier.contact.trim()) {
            setError("Contact number is required");
            return;
        }
        if (contactError) {
            setError("Please fix contact number format");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const supplierData = {
                name: newSupplier.name.trim(),
                contact: newSupplier.contact,
                address: newSupplier.address || "",
                billDate: newSupplier.billDate,
                products: newSupplier.products
            };

            if (isEditing && selectedSupplier) {
                // Update existing supplier
                await apiCall(`/suppliers/${selectedSupplier.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(supplierData)
                });
                setIsEditing(false);
                setSelectedSupplier(null);
            } else {
                // Add new supplier
                await apiCall('/suppliers', {
                    method: 'POST',
                    body: JSON.stringify(supplierData)
                });
            }

            // Reset form
            setNewSupplier({
                name: "",
                contact: "",
                address: "",
                products: [],
                billDate: new Date().toISOString().split('T')[0]
            });
            setSelectedExistingSupplier("");
            setUseExistingSupplier(false);

            // Reload suppliers
            await loadSuppliers();

        } catch (error) {
            setError(`Failed to ${isEditing ? 'update' : 'add'} supplier: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Delete supplier
    const deleteSupplier = async (supplierId) => {
        if (!window.confirm("Are you sure you want to delete this supplier?")) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            await apiCall(`/suppliers/${supplierId}`, {
                method: 'DELETE'
            });
            await loadSuppliers();
        } catch (error) {
            setError(`Failed to delete supplier: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };


    const removeProductFromEdit = (productIndex) => {
    const updatedProducts = newSupplier.products.filter((_, index) => index !== productIndex);
    setNewSupplier({
        ...newSupplier,
        products: updatedProducts
    });
};
    // Edit supplier
    // Replace your existing editSupplier function with this improved version
    const editSupplier = async (supplier) => {
        try {
            setLoading(true);
            setError("");

            // First, try to fetch the complete supplier data including products
            let supplierWithProducts;
            try {
                supplierWithProducts = await apiCall(`/suppliers/${supplier.id}`);
            } catch (error) {
                console.warn('Could not fetch detailed supplier data, using existing data:', error);
                supplierWithProducts = supplier;
            }

            // Ensure products is always an array
            const products = Array.isArray(supplierWithProducts.products) ? supplierWithProducts.products : [];

            console.log('Editing supplier with products:', products); // Debug log

            // Format the date properly for the input field
            const formattedDate = supplierWithProducts.billDate
                ? new Date(supplierWithProducts.billDate).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0];

            // Set the form data with all supplier information
            setNewSupplier({
                name: supplierWithProducts.name || "",
                contact: supplierWithProducts.contact || "",
                address: supplierWithProducts.address || "",
                billDate: formattedDate,
                products: products
            });

            setIsEditing(true);
            setSelectedSupplier(supplierWithProducts);
            setContactError(""); // Clear any contact errors

        } catch (error) {
            setError(`Failed to load supplier for editing: ${error.message}`);
            console.error('Error in editSupplier:', error);
        } finally {
            setLoading(false);
        }
    };


    // Add product to supplier
    const addProduct = () => {
        if (!newProduct.name.trim() || newProduct.quantity <= 0 || newProduct.price <= 0) {
            setError("Please enter valid product details including price");
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
        setError("");
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
            billDate: new Date().toISOString().split('T')[0]
        });
        setSelectedExistingSupplier("");
    };

    // Generate filtered and sorted suppliers
    const getFilteredSuppliers = () => {
        return suppliers
            .filter(supplier => {
                const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (supplier.address && supplier.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    // 6. Consistent product array handling
    const calculateSupplierValue = (supplier) => {
        const products = supplier?.products;
        if (!Array.isArray(products)) return 0;

        return products.reduce((total, product) => {
            const price = Number(product.price) || 0;
            const quantity = Number(product.quantity) || 0;
            return total + (price * quantity);
        }, 0);
    };


    const fetchSupplierProducts = async (supplier) => {
        try {
            setLoadingProducts(true);
            setError("");

            // Set supplier first to show modal
            setSelectedSupplier(supplier);

            const productsData = await apiCall(`/suppliers/${supplier.id}/products`);

            // Only update products, preserve other supplier data
            setSelectedSupplier(prev => ({
                ...prev,
                products: Array.isArray(productsData) ? productsData : []
            }));

        } catch (error) {
            setError(`Failed to load products: ${error.message}`);
            setSelectedSupplier(null);
        } finally {
            setLoadingProducts(false);
        }
    };



    return (
        <div className="container-fluid p-4">
            {/* Error Display */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError("")}></button>
                </div>
            )}

            {/* Loading Indicator */}
            {loading && (
                <div className="text-center mb-3">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

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
                                {useExistingSupplier && !isEditing && (
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
                                            {predefinedSuppliers.map((supplier) => (
                                                <option key={supplier.id} value={supplier.id}>
                                                    {supplier.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

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

                                        {/* Display added products */}
                                        {newSupplier.products.length > 0 && (
    <div className="mt-3">
        <h6>{isEditing ? 'Current Products:' : 'Added Products:'}</h6>
        <ul className="list-group">
            {newSupplier.products.map((product, index) => (
                <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <strong>{product.name}</strong> - {product.quantity} {product.unit} @ ₹{product.price}/unit
                        <div className="small text-muted">
                            Category: {productCategories.find(cat => cat.id === product.category)?.name || 'Other'}
                            <br />
                            Total: ₹{product.price * product.quantity}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => removeProductFromEdit(index)}
                        title="Remove this product"
                    >
                        ×
                    </button>
                </li>
            ))}
        </ul>
        <div className="mt-2 text-end">
            <strong>Total Value: ₹{calculateSupplierValue(newSupplier)}</strong>
        </div>
    </div>
)}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className={`btn ${isEditing ? 'btn-warning' : 'btn-success'} w-100`}
                                    onClick={addSupplier}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : (isEditing ? "Update Supplier" : "Add Supplier")}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    {/* Supplier List */}
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h2 className="mb-0">Suppliers ({suppliers.length})</h2>
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
                                            <th onClick={() => handleSort("name")} style={{ cursor: 'pointer' }}>
                                                Supplier Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th>Contact</th>
                                            <th>Address</th>
                                            <th onClick={() => handleSort("date")} style={{ cursor: 'pointer' }}>
                                                Bill Date {sortField === "date" && (sortDirection === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th>Products</th>
                                            <th>Total Bill</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentSuppliers.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center">
                                                    {loading ? "Loading..." : "No suppliers found"}
                                                </td>
                                            </tr>
                                        ) : (
                                            currentSuppliers.map(supplier => (
                                                <tr key={supplier.id}>
                                                    <td>{supplier.name}</td>
                                                    <td>{supplier.contact}</td>
                                                    <td>{supplier.address || 'N/A'}</td>
                                                    <td>{supplier.billDate}</td>
                                                    <td>{supplier.productCount || supplier.products?.length || 0}</td>
                                                    <td>₹{supplier.totalValue || calculateSupplierValue(supplier)}</td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => editSupplier(supplier)}
                                                                disabled={loading}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => deleteSupplier(supplier.id)}
                                                                disabled={loading}
                                                            >
                                                                Delete
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-info"
                                                                data-bs-toggle="modal"
                                                                data-bs-target="#productsModal"
                                                                onClick={() => fetchSupplierProducts(supplier)}
                                                                disabled={loadingProducts}
                                                            >
                                                                View Products
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
                            {loadingProducts ? (
                                <div className="text-center">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p>Loading products...</p>
                                </div>
                            ) : (
                                selectedSupplier && (
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
                                                    {/* Use conditional rendering to handle an empty products array */}
                                                    {Array.isArray(selectedSupplier.products) && selectedSupplier.products.length > 0 ? (
                                                        selectedSupplier.products.map((product, index) => (
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
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="7" className="text-center">No products found for this supplier.</td>
                                                        </tr>
                                                    )}
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
                                )
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