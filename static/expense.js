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
document.addEventListener("DOMContentLoaded", function () {
    fetchExpenses(); // Load existing expenses on page load

    // Fix: Ensure event listener is attached to button after DOM loads
    document.getElementById("addExpenseBtn").addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default form submission
        addExpense();
    });
});

function addExpense() {
    // Fetch emp_id dynamically from session
    fetch("/get_emp_id")
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }

        const empId = data.emp_id;  // Employee ID fetched from session
        const category = document.getElementById("category").value;
        const description = document.getElementById("description").value;
        const amount = document.getElementById("amount").value;
        const proof = document.getElementById("proof").files[0];

        if (!category || !description || !amount) {
            alert("Please fill all required fields.");
            return;
        }

        let formData = new FormData();
        formData.append("emp_id", empId);
        formData.append("category", category);
        formData.append("description", description);
        formData.append("amount", amount);
        if (proof) {
            formData.append("proof", proof);
        }

        fetch("/add_expense", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert("Expense added successfully!");
                fetchExpenses(); // Refresh the table
                document.getElementById("description").value = "";
                document.getElementById("amount").value = "";
                document.getElementById("proof").value = "";
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Something went wrong! Check the console for details.");
        });
    })
    .catch(error => {
        console.error("Error fetching emp_id:", error);
        alert("Failed to retrieve employee ID.");
    });
}

function fetchExpenses() {
    fetch("/get_expenses")
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById("expenseTable");
        table.innerHTML = ""; // Clear existing rows

        data.forEach(expense => {
            let proofDisplay = "No File";
            if (expense.proof !== "No File") {
                proofDisplay = `<a href="${expense.proof}" target="_blank">View</a>`;
            }

            // Create a table row for each expense
            const row = table.insertRow();
            row.innerHTML = `<td>${expense.category}</td>
                             <td style="max-width: 400px; word-wrap: break-word; white-space: normal;">${expense.description}</td>
                             <td>${expense.amount}</td>
                             <td>${proofDisplay}</td>
                             <td>${expense.status}</td>`; // Display status
        });

        // Store data in localStorage so it persists after page reload
        localStorage.setItem("expenses", JSON.stringify(data));
    })
    .catch(error => console.error("Error:", error));
}