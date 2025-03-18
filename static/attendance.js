document.addEventListener("DOMContentLoaded", function () {
    fetchAttendanceRecords();
    fetchTodayRecords();
    resetRecordsOnNewDay();
    
    const mealYesBtn = document.getElementById("meal-yes");
    const mealNoBtn = document.getElementById("meal-no");
    const sendBtn = document.getElementById("send-btn");
    const weeklyReportBtn = document.getElementById("weekly-report-btn");
    const selectedMealSpan = document.getElementById("selected-meal");
    const mealButtons = document.querySelectorAll(".meal-section button");

        // let mealChoice = null;
    let todayDate = new Date().toISOString().split("T")[0];
    let mealChoice = localStorage.getItem("selectedMealToday") || null; // Already selected meal check
    
    if (mealChoice) {
        updateMealSelection(mealChoice, false);  // false -> Don't update DB on load
    }
    if (mealYesBtn && mealNoBtn) {
        mealYesBtn.addEventListener("click", () => {
            mealChoice = "Yes";
            updateMealSelection("Yes");
        });
        mealNoBtn.addEventListener("click", () => {
            mealChoice = "No";
            updateMealSelection("No");
        });
    }
    if (sendBtn) {
        sendBtn.addEventListener("click", sendMealData);
    }
    // function updateMealSelection(choice) {
    //     mealChoice = choice;
    //     // selectedMealSpan.innerText = choice; // Update the span text
    //     updateTableWithMeal(new Date().toISOString().split("T")[0], choice); // Update the table

    // }
    function updateMealSelection(choice, updateDB = true) {
        mealChoice = choice;
        localStorage.setItem(`selectedMeal-${todayDate}`, choice);
        
        // Toggle button styles
        mealButtons.forEach(btn => btn.classList.remove("selected"));
        if (choice === "Yes") mealYesBtn.classList.add("selected");
        if (choice === "No") mealNoBtn.classList.add("selected");

        selectedMealSpan.innerText = choice; // Reflect in UI

        // Update the table with meal selection
        updateTableWithMeal(todayDate, choice);

        // Send meal data to backend if user clicked
        if (updateDB) sendMealData();
    }

    mealButtons.forEach(button => {
        button.addEventListener("click", function () {
            // Remove selected class from all meal buttons
            mealButtons.forEach(btn => btn.classList.remove("selected"));
            // Add selected class to clicked button
            this.classList.add("selected");
        });
    });
    resetRecordsOnNewDay();

});


function fetchAttendanceRecords() {
    fetch('/fetch-attendance')
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                console.error("Unexpected data format:", data);
                data = [];
            }

            if (data.length === 0) {
                console.log("No attendance records found.");
            } else {
                localStorage.setItem("attendanceRecords", JSON.stringify(data));
            }
            updateAttendanceTable(data);
        })
        .catch(error => console.error('Error fetching attendance:', error));
}

function updateAttendanceTable(records) {
    let table = document.querySelector(".checkin-section table");
    table.innerHTML = `<tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Total Hours</th></tr>`;

    if (!Array.isArray(records)) return;

    records.forEach(record => {
        let checkin_time = record?.checkin ?? "Not Checked-in";
        let checkout_time = record?.checkout ?? "Not Checked-out";
        let totalHours = calculateTotalHours(checkin_time, checkout_time);
        // let mealSelection = record?.meal ?? "Not Selected";

        table.innerHTML += `
            <tr>
                <td>${record.date}</td>
                <td>${checkin_time}</td>
                <td>${checkout_time}</td>
                <td>${totalHours}</td>
                
            </tr>
        `;
    });
}

window.onload = function () {
    fetchTodayRecords(); // Ensure the function runs after the page is fully loaded

    let savedData = localStorage.getItem("attendanceRecords");
    if (savedData) updateAttendanceTable(JSON.parse(savedData));
};
// window.onload = function () {
//     fetchTodayRecords(); // Ensure the function runs after the page is fully loaded
// };

function calculateTotalHours(loginTime, logoutTime) {
    if (!loginTime || loginTime === "-" || loginTime === "null") return "Not Checked-in";
    if (!logoutTime || logoutTime === "-" || logoutTime === "null") return "Pending";

    let login = new Date(`1970-01-01T${loginTime}`);
    let logout = new Date(`1970-01-01T${logoutTime}`);

    if (isNaN(logout.getTime())) return "Pending";
    if (logout < login) return "Error in data";

    let diffMs = logout - login;
    let diffHrs = Math.floor(diffMs / 3600000);
    let diffMins = Math.floor((diffMs % 3600000) / 60000);

    return `${diffHrs} hrs ${diffMins} mins`;
}

function sendCheckIn() {
    fetch('/store-login-time', { method: 'POST' })
        .then(response => response.json())
        .then(data => data.message && fetchAttendanceRecords())
        .catch(error => console.error('Error:', error));
}

function sendCheckOut() {
    fetch('/store-logout-time', { method: 'POST' })
        .then(response => response.json())
        .then(data => data.message && fetchAttendanceRecords())
        .catch(error => console.error('Error:', error));
}

function sendAttendanceData() {
    const today = new Date().toISOString().split("T")[0];
    let selectedMealElement = document.getElementById("selected-meal");
    let mealChoice = selectedMealElement ? selectedMealElement.innerText : "Not Selected";

    const attendanceData = {
        date: today,
        meal: mealChoice,
        type: "pending",
        status: "pending"
    };

    fetch("/store-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData)
    })
    .then(response => response.json())
    .then(data => {
        alert("Attendance data submitted successfully!");
        fetchAttendanceRecords();
    })
    .catch(error => console.error("Error storing attendance:", error));
}

function updateTableWithMeal(date, mealChoice) {
    let table = document.querySelector(".attendance-section table");
    let existingRow = [...table.rows].find(row => row.cells[0]?.innerText === date);

    if (existingRow) {
        existingRow.cells[1].innerText = mealChoice; // Update meal column
    } else {
        table.innerHTML += `
            <tr>
                <td>${date}</td>
                <td>${mealChoice}</td>
                <td>pending</td>
                <td>pending</td>
            </tr>
        `;
    }
}


function convertTo24Hour(time12h) {
    if (!time12h || time12h === "-" || time12h === "null") return "00:00:00";

    let [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (modifier === "PM" && hours !== "12") hours = String(parseInt(hours, 10) + 12);
    else if (modifier === "AM" && hours === "12") hours = "00";

    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
}


function sendMealData() {
    const mealChoice = document.querySelector(".meal-section button.selected");

    if (!mealChoice) {
        alert("Please select a meal option before sending.");
        return;
    }

    fetch('/store-meal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            meal: mealChoice.innerText.trim() // Trim spaces to prevent empty values
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert("Meal data stored successfully!");
            fetchTodayRecords(); // Refresh the table after storing
        } else {
            alert("Error: " + data.error);
        }
    })
    .catch(error => console.error('Error:', error));
}
function fetchTodayRecords() {
    fetch("/fetch-today-records", { method: "GET" })
    .then(response => response.json())
    .then(data => {
        let tableBody = document.querySelector("#attendanceTable tbody");
        tableBody.innerHTML = ""; // Clear old records

        if (!data || !data.session_data) {
            console.warn("No records found for today.");
            return;
        }

        let totalMinutes = 0;

        data.session_data.forEach(session => {
            let login = session.checkin ? new Date(`1970-01-01T${session.checkin}`) : null;
            let logout = session.checkout ? new Date(`1970-01-01T${session.checkout}`) : null;

            let diffMinutes = 0;
            if (login && logout) {
                diffMinutes = (logout - login) / 60000; // Convert to minutes
            }

            totalMinutes += diffMinutes;

            let row = `
                <tr>
                    <td>${session.checkin || "Not Checked-in"}</td>
                    <td>${session.checkout || "Pending"}</td>
                    <td>${Math.floor(diffMinutes / 60)} hrs ${diffMinutes % 60} mins</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Show Total Time at the bottom
        tableBody.innerHTML += `
            <tr>
                <td colspan="2"><strong>Total Hours</strong></td>
                <td><strong>${Math.floor(totalMinutes / 60)} hrs ${totalMinutes % 60} mins</strong></td>
            </tr>
        `;
    })
    .catch(error => console.error("Error fetching records:", error));
}
function sortSessionsByTime(sessions) {
    return sessions.sort((a, b) => new Date(`1970-01-01T${a.checkin}`) - new Date(`1970-01-01T${b.checkin}`));
}

function fetchTodayRecords() {
    fetch("/fetch-today-records")
    .then(response => response.json())
    .then(data => {
        let tableBody = document.querySelector("#attendanceTable tbody");
        tableBody.innerHTML = "";

        if (!data || !data.session_data) return;

        let sortedSessions = sortSessionsByTime(data.session_data);
        let totalMinutes = 0;

        sortedSessions.forEach(session => {
            let login = session.checkin ? new Date(`1970-01-01T${session.checkin}`) : null;
            let logout = session.checkout ? new Date(`1970-01-01T${session.checkout}`) : null;
            
            let diffMinutes = (login && logout) ? (logout - login) / 60000 : 0;
            totalMinutes += diffMinutes;

            let row = `
                <tr>
                    <td>${session.checkin || "Not Checked-in"}</td>
                    <td>${session.checkout || "Pending"}</td>
                    <td>${Math.floor(diffMinutes / 60)} hrs ${diffMinutes % 60} mins</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

        // Total Hours Row
        tableBody.innerHTML += `
            <tr>
                <td colspan="2"><strong>Total Hours</strong></td>
                <td><strong>${Math.floor(totalMinutes / 60)} hrs ${totalMinutes % 60} mins</strong></td>
            </tr>
        `;
    })
    .catch(error => console.error("Error fetching records:", error));
}

function updateTable(data) {
    console.log("updateTable() is running...");

    const tableBody = document.querySelector(".attendance-records tbody");

    if (!tableBody) {
        console.error("Table body element not found in the DOM. Aborting update.");
        return;
    }

    console.log("Updating table with new data...");
    tableBody.innerHTML = "";

    if (Array.isArray(data) && data.length > 0) {
        data.forEach(record => {
            const row = `
                <tr>
                    <td>${record.date}</td>
                    <td>${record.meal}</td>
                    <td>${record.type}</td>
                    <td>${record.status}</td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    } else {
        tableBody.innerHTML = `<tr><td colspan="4">No records found for today.</td></tr>`;
    }
}

// Function to reset localStorage when a new day starts
function resetRecordsOnNewDay() {
    const storedDate = localStorage.getItem("storedDate");
    const todayDate = new Date().toISOString().split("T")[0];

    if (storedDate !== todayDate) {
        localStorage.removeItem("todayRecords");
        localStorage.setItem("storedDate", todayDate);
        fetchTodayRecords();  // Fetch fresh data for the new day

    }
}
setInterval(() => {
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() === 0) {
        resetRecordsOnNewDay();
    }
}, 60000); 
// Run reset function on page load
resetRecordsOnNewDay();
