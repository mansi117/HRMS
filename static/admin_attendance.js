let attendanceData = [];
// Function to fetch check-in data from backend,yesterday
async function fetchCheckinData() {
    try {
        let response = await fetch('/fetch_checkin_data');
        let data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching check-in data:', error);
        return [];
    }
}

// // Function to fetch attendance records from backend,today
// async function fetchAttendanceRecords() {
//     try {
//         let response = await fetch('/fetch_attendance_records');
//         let data = await response.json();
//         return data;
//     } catch (error) {
//         console.error('Error fetching attendance records:', error);
//         return [];
//     }
// }

async function fetchAttendanceRecords() {
    try {
        let response = await fetch('/fetch_attendance_records');
        let data = await response.json();

        // Ensure "full day" as default if type is missing
        data.forEach(record => {
            if (!record.type || record.type.trim() === "") {
                record.type = "full day";
            }
        });

        return data;
    } catch (error) {
        console.error('Error fetching attendance records:', error);
        return [];
    }
}



// Fetch employee names for dropdown
async function fetchEmployeeNames() {
    try {
        let response = await fetch('/fetch_employee_names');
        let employees = await response.json();
        
        let employeeSelect = document.getElementById("specificEmployeeSelect");
        employeeSelect.innerHTML = '<option value="">Select Employee</option>'; // Default option

        employees.forEach(employee => {
            let option = document.createElement("option");
            option.value = employee;
            option.textContent = employee;
            employeeSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error fetching employee names:', error);
    }
}
// Function to render check-in and attendance tables
async function renderTables() {
    let checkinTable = document.querySelector(".checkin-section table");
    let attendanceTable = document.querySelector(".attendance-section table");

    let checkinData = await fetchCheckinData();
    attendanceData = await fetchAttendanceRecords();

    checkinTable.innerHTML = `
    <tr>
        <th>Date</th><th>Employee</th><th>Check-in</th><th>Check-out</th><th>Total Hours</th>
    </tr>
    `;

    attendanceTable.innerHTML = `
    <tr>
        <th>Date</th><th>Employee</th><th>Meal</th><th>Type</th><th>Status</th><th>Actions</th>
    </tr>
    `;

    checkinData.forEach(record => {
        checkinTable.innerHTML += `
        <tr>
            <td>${record.date}</td>
            <td><a href="#" onclick="selectEmployee('${record.employee}')">${record.employee}</a></td>
            <td>${record.checkIn}</td>
            <td>${record.checkOut}</td>
            <td>${record.totalHours}</td>
        </tr>
        `;
    });

    attendanceData.forEach((record, index) => {
        let actionButtons = record.status === 'Pending'
            ? `<button class="approve-btn" onclick="updateStatus(${index}, 'approved')">Approve</button>
               <button class="reject-btn" onclick="updateStatus(${index}, 'rejected')">Reject</button>`
            : `<button id="edit-btn-${index}" class="edit-btn" onclick="toggleEditStatus(${index})">Edit Status</button>
               <div id="edit-buttons-${index}" class="edit-buttons" style="display: none;">
                   <button class="approve-btn" onclick="updateStatus(${index}, 'approved')">Approve</button>
                   <button class="reject-btn" onclick="updateStatus(${index}, 'rejected')">Reject</button>
               </div>`;

        attendanceTable.innerHTML += `
        <tr>
            <td>${record.date}</td>
            <td>${record.employee}</td>
            <td>${record.meal}</td>
            <td>
                <select onchange="updateType(${index}, this.value)">
                    <option value="full day" ${record.type === "full day" ? "selected" : ""}>Full Day</option>
                    <option value="half day" ${record.type === "half day" ? "selected" : ""}>Half Day</option>
                    <option value="work from home" ${record.type === "work from home" ? "selected" : ""}>Work from Home</option>
                </select>
            </td>
            <td><span id="status-${index}">${record.status}</span></td>
            <td>${actionButtons}</td>
        </tr>
        `;
    });
    // function updateMealCount() {
    //     let yesCount = 0;
    //     let noCount = 0;
    
    //     attendanceData.forEach(record => {
    //         if (record.status === "approved") {
    //             if (record.type === "full day" || record.type === "half day") {
    //                 if (record.meal === "yes") {
    //                     yesCount++;
    //                 } else if (record.meal === "no") {
    //                     noCount++;
    //                 }
    //             }
    //         }
    //         if (record.type === "work from home") {
    //             noCount++; // Work from home wale direct "no" me count honge
    //         }
    //     });
    
    //     document.getElementById("yesMealCount").innerText = yesCount;
    //     document.getElementById("noMealCount").innerText = noCount;
    // }
    function updateMealCount() {
        let yesCount = 0;
        let noCount = 0;
        console.log("Attendance Data:", attendanceData); // Debugging ke liye

    
        attendanceData.forEach(record => {
            let { type, meal, status } = record;
            console.log(`Checking record: ${JSON.stringify(record)}`); // Check record values

            if (status === "approved") { // Sirf approved wale count honge
                if (type === "full day" || type === "half day") {
                    // if (meal === "YES") {
                    if (meal && meal.toLowerCase() === "yes") {
                        yesCount++;
                    } else if (meal && meal.toLowerCase() === "no") {
                        noCount++;
                    }
                } else if (type === "work from home") {
                    noCount++; // Work from home wale hamesha 'no' honge
                }
            }
        });
        // console.log("Yes Count:", ${yesCount}, "No Count:", noCount); // Debugging ke liye
        console.log(`Final Yes Count: ${yesCount}, No Count: ${noCount}`); // Debugging ke liye

    
        document.getElementById("yesMealCount").innerText = yesCount;
        document.getElementById("noMealCount").innerText = noCount;
    }
    
    
    updateMealCount();
}

async function showSpecificEmployee() {
    let selectedEmployee = document.getElementById("specificEmployeeSelect").value;
    let specificEmployeeTable = document.getElementById("specificEmployeeTable");

    specificEmployeeTable.innerHTML = `
        <tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Total Hours</th><th>Meal</th><th>Status</th></tr>
    `;

    if (!selectedEmployee || selectedEmployee === "all") {
        return; // Do nothing if no specific employee is selected
    }

    try {
        let response = await fetch(`/fetch_employee_history/${selectedEmployee}`);
        let employeeHistory = await response.json();

        employeeHistory.forEach(record => {
            specificEmployeeTable.innerHTML += `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.checkIn || 'N/A'}</td>
                    <td>${record.checkOut || 'N/A'}</td>
                    <td>${record.totalHours || 'N/A'}</td>
                    <td>${record.meal || 'N/A'}</td>
                    <td>${record.status || 'N/A'}</td>
                </tr>
            `;
        });
    } catch (error) {
        console.error('Error fetching employee history:', error);
    }
}

// async function updateStatus(index, newStatus) {
//     let record = attendanceData[index];

//     // Send update request to the backend
//     let response = await fetch('/update_attendance_status', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             date: record.date,
//             employee: record.employee,
//             status: newStatus,
//             type: record.type || "full day"  // Ensure 'type' is always sent

//         })
//     });

//     if (response.ok) {
//         attendanceData[index].status = newStatus;
//         document.getElementById(`status-${index}`).innerText = newStatus;
//     } else {
//         console.error('Failed to update attendance status');
//     }
// }

async function updateStatus(index, newStatus) {
    let record = attendanceData[index];

    // Ensure type is not empty, set default to "full day"
    if (!record.type || record.type.trim() === "") {
        record.type = "full day";
    }

    // Send update request to the backend
    let response = await fetch('/update_attendance_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: record.date,
            employee: record.employee,
            status: newStatus,
            type: record.type  // Ensure 'type' is always sent
        })
    });

    if (response.ok) {
        attendanceData[index].status = newStatus;
        document.getElementById(`status-${index}`).innerText = newStatus;
    } else {
        console.error('Failed to update attendance status');
    }
}





// async function updateType(index, newType) {
//     let record = attendanceData[index];
//     record.type = newType; // Update type in local data

//     let response = await fetch('/update_attendance_status', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             date: record.date,
//             employee: record.employee,
//             status: record.status,
//             type: newType // Send updated type to backend
//         })
//     });

//     if (!response.ok) {
//         console.error('Failed to update attendance type');
//     }
// }

async function updateType(index, newType) {
    let record = attendanceData[index];

    // Default value if nothing is selected
    if (!newType || newType.trim() === "") {
        newType = "full day";
    }

    record.type = newType; // Update type in local data
    record.isModified = true; // Mark as modified

    let response = await fetch('/update_attendance_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            date: record.date,
            employee: record.employee,
            status: record.status,
            type: newType // Send updated type to backend
        })
    });

    if (!response.ok) {
        console.error('Failed to update attendance type');
    }
}
// ..................

// // Function to send attendance records to the database
// async function sendAttendance() {
//     let response = await fetch('/submit_attendance_data', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(attendanceData)
//     });

//     if (response.ok) {
//         alert("Attendance data sent successfully!");
//     } else {
//         alert("Failed to send attendance data.");
//     }
// }
async function sendAttendance() {
    // Filter data to send only new or modified records
    let modifiedRecords = attendanceData.filter(record => 
        record.status !== "approved" || record.isModified
    );

    if (modifiedRecords.length === 0) {
        alert("No new or modified records to submit.");
        return;
    }

    let response = await fetch('/submit_attendance_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modifiedRecords)
    });

    if (response.ok) {
        alert("Attendance data sent successfully!");
    } else {
        alert("Failed to send attendance data.");
    }
}

// Mark records as modified when changed
function updateStatus(index, newStatus) {
    attendanceData[index].status = newStatus;
    attendanceData[index].isModified = true; // Mark as modified
    document.getElementById(`status-${index}`).innerText = newStatus;
}

function updateType(index, newType) {
    attendanceData[index].type = newType;
    attendanceData[index].isModified = true; // Mark as modified
}


function toggleEditStatus(index) {
    let editButtons = document.getElementById(`edit-buttons-${index}`);
    let editBtn = document.getElementById(`edit-btn-${index}`);

    if (editButtons && editBtn) {
    let isVisible = editButtons.style.display === "block";
    editButtons.style.display = isVisible ? "none" : "block";
    editBtn.style.display = isVisible ? "inline-block" : "none";
    }
    }

    // / // Function to filter and show specific employee's records
function selectEmployee(employee) {
    document.getElementById("specificEmployeeSelect").value = employee;
    showSpecificEmployee();
    }
    
// Ensure tables are rendered on page load
document.addEventListener("DOMContentLoaded", () => {
    renderTables();
    fetchEmployeeNames();
});

