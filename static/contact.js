let employees = [];

// Fetch employees from Flask API
function fetchEmployees() {
    fetch('/get_employees')
        .then(response => response.json())
        .then(data => {
            employees = data;  // Store fetched employees
            displayEmployees(employees);  // Display all employees initially
        })
        .catch(error => console.error("Error fetching employees:", error));
}

// // Display employees in the table
// function displayEmployees(data) {
//     let tbody = document.getElementById("teamBody");
//     tbody.innerHTML = "";

//     if (data.length === 0) {
//         tbody.innerHTML = `<tr><td colspan="3">No employees found</td></tr>`;
//     } else {
//         data.forEach(emp => {
//             let row = `<tr>
//                 <td>${emp.first_name}</td>
//                 <td><a href="mailto:${emp.email}">${emp.email}</a></td>
//                 <td><a href="tel:${emp.phone}">${emp.phone}</a></td>
//             </tr>`;
//             tbody.innerHTML += row;
//         });
//     }
// }
function displayEmployees(data) {
    let tbody = document.getElementById("teamBody");
    tbody.innerHTML = "";

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4">No employees or admins found</td></tr>`;
    } else {
        data.forEach(emp => {
            let socialLinks = [];
            if (emp.linkedin) socialLinks.push(`<a href="${emp.linkedin}" target="_blank">LinkedIn</a>`);
            if (emp.twitter) socialLinks.push(`<a href="${emp.twitter}" target="_blank">Twitter</a>`);

            let row = `<tr>
                <td>${emp.first_name}</td>
                <td><a href="mailto:${emp.email}">${emp.email}</a></td>
                <td><a href="tel:${emp.phone}">${emp.phone}</a></td>
                <td>${socialLinks.join(" | ") || "N/A"}</td>
                <td>${emp.role}</td> <!-- Show role: Employee or Admin -->
            </tr>`;
            tbody.innerHTML += row;
        });
    }
}

// Search employee by name
function searchEmployee() {
    let input = document.getElementById("searchBar").value.toLowerCase();
    let filtered = employees.filter(emp => emp.name.toLowerCase().includes(input));

    if (input === "") {
        displayEmployees(employees); // Show all employees when input is empty
    } else {
        displayEmployees(filtered); // Show filtered results
    }
}

// Load employees when the page loads
document.addEventListener("DOMContentLoaded", function () {
    fetch('/get_employees')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById("teamBody");
            tbody.innerHTML = "";

            data.forEach(emp => {
                let socialLinks = [];
                if (emp.linkedin) socialLinks.push(`<a href="${emp.linkedin}" target="_blank">LinkedIn</a>`);
                if (emp.github) socialLinks.push(`<a href="${emp.github}" target="_blank">GitHub</a>`);
                if (emp.twitter) socialLinks.push(`<a href="${emp.twitter}" target="_blank">Twitter</a>`);

                let row = `<tr>
                    <td>${emp.first_name}</td>
                    <td><a href="mailto:${emp.email}">${emp.email}</a></td>
                    <td><a href="tel:${emp.phone}">${emp.phone}</a></td>
                    <td>${socialLinks.join(" | ") || "N/A"}</td>
                </tr>`;
                tbody.innerHTML += row;
            });
        })
        .catch(error => console.error('Error fetching employee data:', error));
});
function logoutUser() {
    console.log("Logout button clicked!"); // Debugging
    fetch('/logout', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                sessionStorage.clear();
                window.location.href = "/signin"; // Redirect to sign-in page
            } else {
                alert("Logout failed! Try again.");
            }
        })
        .catch(error => {
            console.error("Logout Error:", error);
            alert("Something went wrong. Please try again.");
        });
}

// Ensure button is clickable
document.addEventListener("DOMContentLoaded", function() {
    document.querySelector(".logout-btn").addEventListener("click", logoutUser);
});