
let expenses = [];
let approvedExpenses = [];

// Load expenses from local storage and server
function loadExpenses() {
    const savedExpenses = localStorage.getItem("expenses");
    if (savedExpenses) {
        expenses = JSON.parse(savedExpenses);
    }

    const savedApprovedExpenses = localStorage.getItem("approvedExpenses");
    if (savedApprovedExpenses) {
        approvedExpenses = JSON.parse(savedApprovedExpenses);
    }

    renderExpenses();
    loadApprovedExpenses();

    fetch('/fetch_expenses')
        .then(response => response.json())
        .then(data => {
            expenses = data;
            localStorage.setItem("expenses", JSON.stringify(expenses));
            renderExpenses();
            loadApprovedExpenses();
        })
        .catch(error => console.error('Error fetching expenses:', error));
}

// Render all expenses table
function renderExpenses() {
    const table = document.getElementById("expenseTable");
    table.innerHTML = "";

    expenses.forEach(expense => {
        let row = table.insertRow();
        row.innerHTML = `
            <td>${expense.employee}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>${expense.amount}</td>
             <td>
                ${expense.proof ? `<a href="${expense.proof}" target="_blank" style="color:blue; text-decoration:underline;">View</a>` : 'No File'}
            </td>
            <td id="status-${expense.id}">${expense.status || 'Pending'}</td>
            <td id="actions-${expense.id}">
                ${expense.status === "Pending" ? `
                    <button class="approve-btn" onclick="updateStatus(${expense.id}, 'approve')">Approve</button>
                    <button class="reject-btn" onclick="updateStatus(${expense.id}, 'reject')">Reject</button>
                ` : `
                    <button class="edit-btn" onclick="editStatus(${expense.id})">Edit</button>
                `}
            </td>
        `;
    });

    loadApprovedExpenses();
}

// Update expense status
function updateStatus(id, status) {
    fetch("/update_expense_status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ exp_id: id, status: status })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            const expense = expenses.find(e => e.id === id);
            if (expense) {
                expense.status = status.charAt(0).toUpperCase() + status.slice(1);
                localStorage.setItem("expenses", JSON.stringify(expenses));

                if (status.toLowerCase() === "approve") {
                    approvedExpenses.push(expense);
                    localStorage.setItem("approvedExpenses", JSON.stringify(approvedExpenses));
                }
            }

            loadApprovedExpenses();  
            renderExpenses();
        } else {
            alert("Error updating status: " + data.error);
        }
    })
    .catch(error => console.error("Error updating status:", error));
}
function editStatus(id) {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
            expense.status = "Pending";
            renderExpenses();
        }
    }
// Load Approved Expenses Table
function loadApprovedExpenses() {
    const approvedTable = document.getElementById("approvedExpenseTable");
    approvedTable.innerHTML = "";

    approvedExpenses.forEach(expense => {
        let row = approvedTable.insertRow();
        row.innerHTML = `
            <td>${expense.employee}</td>
            <td>${expense.category}</td>
            <td>${expense.description}</td>
            <td>${expense.amount}</td>
             <td>
                ${expense.proof ? `<a href="${expense.proof}" target="_blank" style="color:blue; text-decoration:underline;">View</a>` : 'No File'}
            </td>
            <td>${expense.status}</td>
        `;
    });
}

// Initialize
loadExpenses();
