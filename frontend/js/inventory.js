// Sample inventory data
let inventoryData = [
    { id: 1, name: 'Heavy Duty Hammer', sku: 'HDW-001', category: 'Tools', stock: 45, minStock: 10, price: 24.99, icon: '🔨' },
    { id: 2, name: 'Power Drill Set', sku: 'HDW-002', category: 'Tools', stock: 12, minStock: 5, price: 89.99, icon: '🔧' },
    { id: 3, name: 'Safety Goggles', sku: 'SAF-001', category: 'Safety', stock: 3, minStock: 15, price: 12.50, icon: '🥽' },
    { id: 4, name: 'Construction Nails (5kg)', sku: 'HDW-003', category: 'Hardware', stock: 28, minStock: 20, price: 15.75, icon: '📌' },
    { id: 5, name: 'Paint Roller Set', sku: 'CNS-001', category: 'Construction', stock: 1, minStock: 8, price: 18.99, icon: '🎨' },
    { id: 6, name: 'Extension Cord 50ft', sku: 'ELC-001', category: 'Electrical', stock: 22, minStock: 10, price: 32.50, icon: '🔌' },
    { id: 7, name: 'Measuring Tape', sku: 'TOL-001', category: 'Tools', stock: 35, minStock: 15, price: 9.99, icon: '📏' },
    { id: 8, name: 'Work Gloves', sku: 'SAF-002', category: 'Safety', stock: 0, minStock: 20, price: 8.50, icon: '🧤' }
];

let currentFilter = 'all';
let editingId = null;

// Render inventory table
function renderInventory() {
    const tbody = document.getElementById('inventoryBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredData = inventoryData.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                            item.sku.toLowerCase().includes(searchTerm);
        
        if (currentFilter === 'all') return matchesSearch;
        if (currentFilter === 'low') return matchesSearch && item.stock < item.minStock && item.stock > 0;
        if (currentFilter === 'critical') return matchesSearch && item.stock === 0;
        return matchesSearch;
    });

    tbody.innerHTML = filteredData.map(item => {
        const stockStatus = item.stock === 0 ? 'critical' : 
                          item.stock < item.minStock ? 'low' : 'good';
        const statusText = item.stock === 0 ? 'Out of Stock' : 
                         item.stock < item.minStock ? 'Low Stock' : 'In Stock';
        
        return `
            <tr>
                <td>
                    <div class="product-cell">
                        <div class="product-image">${item.icon}</div>
                        <div class="product-info">
                            <span class="product-name">${item.name}</span>
                            <span class="product-sku">${item.sku}</span>
                        </div>
                    </div>
                </td>
                <td>${item.category}</td>
                <td>${item.stock}</td>
                <td>${item.minStock}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td><span class="stock-badge stock-${stockStatus}">${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="editProduct(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="deleteProduct(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter buttons
document.addEventListener('DOMContentLoaded', function() {
    // Initialize inventory display
    renderInventory();

    // Filter button handlers
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderInventory();
        });
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', renderInventory);

    // Modal controls
    const modal = document.getElementById('productModal');
    const addProductBtn = document.getElementById('addProductBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveProductBtn = document.getElementById('saveProductBtn');

    addProductBtn.addEventListener('click', () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Add New Product';
        document.getElementById('productForm').reset();
        modal.classList.add('active');
    });

    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    saveProductBtn.addEventListener('click', () => {
        const form = document.getElementById('productForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const productData = {
            name: document.getElementById('productName').value,
            sku: document.getElementById('productSKU').value,
            category: document.getElementById('productCategory').value,
            stock: parseInt(document.getElementById('productStock').value),
            minStock: parseInt(document.getElementById('productMinStock').value),
            price: parseFloat(document.getElementById('productPrice').value),
            icon: '📦'
        };

        if (editingId) {
            const index = inventoryData.findIndex(p => p.id === editingId);
            inventoryData[index] = { ...inventoryData[index], ...productData };
        } else {
            const newId = Math.max(...inventoryData.map(p => p.id)) + 1;
            inventoryData.push({ id: newId, ...productData });
        }

        modal.classList.remove('active');
        renderInventory();
    });
});

// Edit product function
function editProduct(id) {
    const product = inventoryData.find(p => p.id === id);
    if (!product) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productName').value = product.name;
    document.getElementById('productSKU').value = product.sku;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productMinStock').value = product.minStock;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productModal').classList.add('active');
}

// Delete product function
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        inventoryData = inventoryData.filter(p => p.id !== id);
        renderInventory();
    }
}