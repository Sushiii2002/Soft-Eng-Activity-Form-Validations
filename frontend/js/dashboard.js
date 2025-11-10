// dashboard.js
// Initialize the sales chart
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkAuth();
    
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [{
                label: 'Sales (₱)',
                data: [120, 190, 300, 500, 200, 300, 450, 600],
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderColor: 'rgba(37, 99, 235, 1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Add interactive functionality
    const widgets = document.querySelectorAll('.widget');
    
    widgets.forEach(widget => {
        widget.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        widget.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Simulate real-time updates
    function updateSalesData() {
        const salesElement = document.querySelector('.sales-overview p');
        if (!salesElement) return;
        
        const currentAmount = parseFloat(salesElement.textContent.replace('Net Sales: ₱', '').replace(',', ''));
        const randomIncrement = (Math.random() * 100).toFixed(2);
        const newAmount = (currentAmount + parseFloat(randomIncrement)).toFixed(2);
        
        // Format with commas for thousands
        const formattedAmount = new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(newAmount);
        
        salesElement.textContent = `Net Sales: ${formattedAmount}`;
        
        // Update chart data
        const newData = salesChart.data.datasets[0].data.map(value => {
            return value + Math.floor(Math.random() * 50);
        });
        salesChart.data.datasets[0].data = newData;
        salesChart.update();
    }
    
    // Update sales data every 30 seconds
    setInterval(updateSalesData, 30000);
    
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {

        });
    });
    
    // Handle logout button
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
});

/**
 * Check if user is authenticated
 */
function checkAuth() {
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
       
       if (!sessionId) {
           // Only redirect if not authenticated
           window.location.href = '/frontend/pages/login.html';
           return;
       }
       
    // Validate session with server
    fetch('/api/validate-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId })
    })
    .then(response => response.json())
    .then(result => {
        if (!result.success || !result.valid) {
            // Session invalid, redirect to login
            localStorage.removeItem('sessionId');
            sessionStorage.removeItem('sessionId');
            window.location.href = '/frontend/pages/login.html';
        } else {
            // Update user info display
            updateUserInfo(result.user);
        }
    })
    .catch(error => {
        console.error('Auth check error:', error);
    });
}

/**
 * Update user info in header
 */
function updateUserInfo(user) {
    const userInfoSpan = document.querySelector('.user-info span');
    if (userInfoSpan && user) {
        userInfoSpan.textContent = `Welcome, ${user.username} (${user.role})`;
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    
    try {
        const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
        
        // Call logout API
        await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId })
        });
        
        // Clear storage
        localStorage.removeItem('sessionId');
        sessionStorage.removeItem('sessionId');
        
        // Redirect to login
        window.location.href = '/frontend/pages/login.html';
        
    } catch (error) {
        console.error('Logout error:', error);
        // Still redirect even if there's an error
        localStorage.removeItem('sessionId');
        sessionStorage.removeItem('sessionId');
        window.location.href = '/frontend/pages/login.html';
    }
}