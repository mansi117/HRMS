let employees = [];

document.addEventListener("DOMContentLoaded", function () {
    fetchEmployeeData();
});

async function fetchEmployeeData() {
    try {
        const response = await fetch("/fetch_employee_list");
        employees = await response.json();

        if (employees.error) {
            console.error("Error fetching data:", employees.error);
            return;
        }

        // Add full name dynamically
        employees = employees.map(emp => ({
            ...emp,
            profile_name: `${emp.first_name} ${emp.last_name}`
        }));

        renderEmployees(employees);
    } catch (error) {
        console.error("Error fetching employees:", error);
    }
}

function renderEmployees(data) {
    const employeeContainer = document.getElementById("employeeContainer");

    if (!employeeContainer) {
        console.error("Error: Employee container not found in DOM.");
        return;
    }

    if (!data.length) {
        employeeContainer.innerHTML = `<div class="no-results">No employees found.</div>`;
        return;
    }

    employeeContainer.innerHTML = data.map(emp => createEmployeeCard(emp)).join("");

    document.querySelectorAll(".employee-card").forEach(card => {
        card.addEventListener("click", function () {
            let empID = this.getAttribute("data-emp-id");
            fetchEmployeeDetails(empID);
        });
    });
}

function createEmployeeCard(emp) {
    const profileImage = emp.photo?.trim() ? emp.photo : "https://via.placeholder.com/70";

    return `
        <div class="employee-card" data-emp-id="${emp.emp_id}">
            <img src="${profileImage}" alt="${emp.profile_name}">
            <h3>${emp.profile_name}</h3>
            <p>ID: ${emp.emp_id}</p>
            <p>Category: ${emp.category}</p>
        </div>
    `;
}

// Fetch employee details and display in popup
async function fetchEmployeeDetails(empID) {
    try {
        const response = await fetch('/get_employee_data', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ EMP_ID: empID })
        });

        const data = await response.json();
        if (data.error) {
            alert("Error: " + data.error);
            return;
        }
        // let selectedEmployee = employees.find(emp => emp.emp_id === empID);
        // if (!selectedEmployee) {
        //     console.error("Employee not found in list");
        //     return;
        // }
        empID = String(empID).trim();

        let selectedEmployee = employees.find(emp => String(emp.emp_id).trim() === empID);
        if (!selectedEmployee) {
            console.error("❌ Employee not found in list. Possible ID mismatch:", empID);
            return;
        }
        // Assign full name to match the first screen
        if (data.personal) {
            data.personal.full_name = selectedEmployee.profile_name; 
        }
        
        showEmployeePopup(data);
    } catch (error) {
        console.error("Error fetching employee data:", error);
    }
}

// Display popup with employee details
function showEmployeePopup(employee) {
    if (!employee || !employee.personal) {
        console.error("Employee data not found.");
        return;
    }
    const fullName = employee.personal?.full_name ?? "N/A";
    document.getElementById("popupName").textContent = fullName;
    
    // const firstName = employee.personal?.first_name ?? "N/A";
    // const lastName = employee.personal?.last_name ?? "";
    // document.getElementById("popupName").textContent = `${firstName} ${lastName}`.trim();

    // Fix Image URL Issue
    const profileImage = employee.personal?.photo || "https://via.placeholder.com/150";
    document.getElementById("popupImage").src = profileImage;
    document.getElementById("popupType").textContent = employee.personal?.category || "N/A";
    document.getElementById("popupEmpId").textContent = employee.personal?.emp_id || "N/A";
    document.getElementById("popupDate_of_birth").textContent = employee.personal?.date_of_birth || "N/A";
    document.getElementById("popupEmail").textContent = employee.personal?.email || "N/A";
    document.getElementById("popupAddress").textContent = employee.personal?.address || "N/A";
    document.getElementById("popupPrimary").textContent = employee.personal?.phone|| "N/A";
    document.getElementById("popupEmergency").textContent = employee.personal?.emergency_number || "N/A";
    document.getElementById("popupGender").textContent = employee.personal?.gender || "N/A";

    // Set Financial Details
    document.getElementById("popupBank").textContent = employee.financial?.bank_name || "N/A";
    document.getElementById("popupAccount").textContent = employee.financial?.account_number || "N/A";
    document.getElementById("popupIFSC").textContent = employee.financial?.ifsc_code || "N/A";
    document.getElementById("popupAccountName").textContent = employee.financial?.account_name || "N/A";
    document.getElementById("popupBankAddress").textContent = employee.financial?.bank_address || "N/A";
    document.getElementById("popupPincode").textContent = employee.financial?.pincode || "N/A";

    // Set Skills & Interests
    document.getElementById("popupSkills").textContent = employee.skills?.skills || "N/A";
    // document.getElementById("popupCertifications").textContent = employee.skills?.certifications || "N/A";
    document.getElementById("popupSoftSkills").textContent = employee.skills?.soft_skills || "N/A";
    document.getElementById("popupInterests").textContent = employee.skills?.interests || "N/A";

    // Set Social Links
    document.getElementById("popupLinkedIn").href = employee.social?.linkedin || "#";
    document.getElementById("popupGitHub").href = employee.social?.github || "#";
    document.getElementById("popupTwitter").href = employee.social?.twitter || "#";

    // Show popup
    document.getElementById("popupContainer").style.display = "flex";
}

function closePopup() {
    document.getElementById("popupContainer").style.display = "none";
}
