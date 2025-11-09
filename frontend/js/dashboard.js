// Initialize the sales chart
document.addEventListener('DOMContentLoaded', function() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [{
                label: 'Sales ($)',
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
        const currentAmount = parseFloat(salesElement.textContent.replace('Net Sales: $', '').replace(',', ''));
        const randomIncrement = (Math.random() * 100).toFixed(2);
        const newAmount = (currentAmount + parseFloat(randomIncrement)).toFixed(2);
        
        // Format with commas for thousands
        const formattedAmount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
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
    
    // Add click handlers for action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const actionText = this.querySelector('.action-text').textContent;
            alert(`Navigating to: ${actionText}`);
            // In a real application, this would navigate to the appropriate page
        });
    });
});