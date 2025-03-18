document.addEventListener("DOMContentLoaded", function () {
    const chartOptions = {
        responsive: true,
        animation: {
            duration: 1500,
            easing: "easeInOutBounce"
        },
        plugins: {
            legend: { position: "top" },
            tooltip: { enabled: true }
        }
    };

    // Employee Distribution (3D Bar Chart)
    const myChartCtx = document.getElementById('myChart').getContext('2d');
    new Chart(myChartCtx, {
        type: 'bar',
        data: {
            labels: ['Consultants', 'Employees', 'Interns'],
            datasets: [{
                label: 'Number of People',
                data: [10, 50, 15],
                backgroundColor: ['blue', 'green', 'orange'],
                borderWidth: 2,
                borderRadius: 10
            }]
        },
        options: { ...chartOptions, indexAxis: 'y', scales: { x: { beginAtZero: true } } }
    });

    // Attendance Overview (3D Line Chart)
    const lineChartCtx = document.getElementById("attendanceLineChart").getContext("2d");
    new Chart(lineChartCtx, {
        type: "line",
        data: {
            labels: ["Present", "Absent", "Leaves", "Full Days", "Half Days"],
            datasets: [
                {
                    label: "All Employees",
                    data: [45, 5, 10, 35, 15],
                    borderColor: "#007bff",
                    backgroundColor: "rgba(0, 123, 255, 0.2)",
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: { ...chartOptions, scales: { y: { beginAtZero: true } } }
    });

    // Employee Hours Chart (3D Line Chart for Every Employee from Monday to Friday)
    let employeeHoursChart;
    function updateEmployeeChart() {
        const timeFilter = document.getElementById("timeFilter").value;
        const searchValue = document.getElementById("employeeSearch").value.toLowerCase();
        const employeeData = {
            weekly: {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                Alice: [8, 7, 9, 6, 8],
                Bob: [7, 6, 8, 7, 7],
                Charlie: [9, 8, 7, 9, 8],
                David: [6, 7, 6, 8, 7],
                Eve: [8, 7, 8, 7, 9]
            },
            today: {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                Alice: [8, 8, 8, 8, 8],
                Bob: [7, 7, 7, 7, 7],
                Charlie: [9, 9, 9, 9, 9],
                David: [6, 6, 6, 6, 6],
                Eve: [8, 8, 8, 8, 8]
            },
            monthly: {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                Alice: [160, 158, 162, 159, 160],
                Bob: [140, 138, 142, 139, 140],
                Charlie: [168, 165, 170, 167, 168],
                David: [152, 150, 154, 151, 152],
                Eve: [144, 142, 146, 143, 144]
            }
        };
        const filteredLabels = employeeData[timeFilter].labels;
        const datasets = Object.keys(employeeData[timeFilter])
            .filter(key => key !== "labels" && key.toLowerCase().includes(searchValue))
            .map(employee => ({
                label: employee,
                data: employeeData[timeFilter][employee],
                borderColor: getRandomColor(),
                backgroundColor: getRandomColor(0.2),
                borderWidth: 2,
                pointBackgroundColor: getRandomColor(),
                pointRadius: 6,
                pointHoverRadius: 8,
                tension: 0.4,
                fill: true
            }));
        if (employeeHoursChart) employeeHoursChart.destroy();
        employeeHoursChart = new Chart(document.getElementById("employeeHoursChart").getContext("2d"), {
            type: "line",
            data: { labels: filteredLabels, datasets },
            options: {
                responsive: true,
                animation: { duration: 2000, easing: "easeInOutBounce" },
                plugins: {
                    legend: { position: "top", labels: { color: "#ddd" } },
                    tooltip: { enabled: true, backgroundColor: "#000" }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: "rgba(255,255,255,0.1)" } },
                    x: { grid: { color: "rgba(255,255,255,0.1)" } }
                }
            }
        });
    }

    function getRandomColor(opacity = 1) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    if (document.getElementById("employeeHoursChart")) updateEmployeeChart();

    // Pie Chart for Employee Allocation
    new Chart(document.getElementById("employeeGraph").getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["Hexabeta", "Wineshipping", "HRMS", "TEAMS", "Edger", "Solar CRM", "Compiler"],
            datasets: [{
                data: [5, 4, 10, 6, 9, 8, 7],
                backgroundColor: ["#D72638", "#3F88C5", "#F49D37", "#14080E", "#6A0572", "#FF5700", "#1B998B"]
            }]
        },
        options: chartOptions
    });

    // Pie Chart for Meal Preferences
    new Chart(document.getElementById("mealChart").getContext("2d"), {
        type: "doughnut",
        data: {
            labels: ["YES", "NO"],
            datasets: [{ data: [18, 2], backgroundColor: ["#4CAF50", "#FF5733"] }]
        },
        options: chartOptions
    });

    // Pie Chart for Gender Distribution
    new Chart(document.getElementById("genderChart").getContext("2d"), {
        type: "pie",
        data: {
            labels: ["Male", "Female"],
            datasets: [{ data: [19, 6], backgroundColor: ["#3498db", "#e74c3c"] }]
        },
        options: chartOptions
    });
});
function updateChart() {
    console.log("Chart is being updated!");
    // Your chart update logic here
}
