document.addEventListener("DOMContentLoaded", function () {
    fetchLeaveRequests();
});

let leaveRequests = []; // Global array to store leave requests

function renderTable() {
    console.log("renderTable function executed.");
    console.log("leaveRequests:", leaveRequests); // Log leaveRequests
    const tableBody = document.getElementById("leaveTableBody");
    tableBody.innerHTML = "";
    leaveRequests.forEach(request => {
        console.log("Request Status:", request.status); // Log each request's status
        if (request.status !== "rejected") { // Rejected leaves won't be shown
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${request.id}</td>
                <td>${request.name}</td>
                <td>${request.reason}</td>
                <td><a href="${request.doc}" target="_blank">View</a></td>
                <td>${request.fromDate}</td>
                <td>${request.toDate}</td>
                <td class="status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>
                <td>
                    ${request.status === "pending" ?
                        `<button class="btn-edit" onclick="updateStatus(${request.leave_id}, 'Approved')">Approve</button>
                         <button class="btn-delete" onclick="updateStatus(${request.leave_id}, 'Rejected')">Reject</button>` 
                        : ''}
                </td>
            `;
            tableBody.appendChild(row);
        }
    });
    renderUpcomingLeaves();
    renderCurrentLeaves();
}

function updateStatus(leaveId, newStatus) {
    console.log(`Updating leave ${leaveId} to ${newStatus}...`);
    fetch("/update_leave_status", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ leave_id: leaveId, status: newStatus })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Server returned error: " + response.status);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log(`Leave ID ${leaveId} ${newStatus} successfully!`);
            // Update only the selected leave in the array
            let requestIndex = leaveRequests.findIndex(req => req.leave_id === leaveId);
            if (requestIndex !== -1) {
                leaveRequests[requestIndex].status = newStatus;
                if (newStatus === "rejected") {
                    leaveRequests.splice(requestIndex, 1); // Remove rejected leave from list
                }
            }
            renderTable(); // Re-render table
        } else {
            alert("Failed to update leave: " + data.message);
        }
    })
    .catch(error => console.error("Error updating leave status:", error));
}

function renderUpcomingLeaves() {

    const upcomingBody = document.getElementById("upcomingLeavesBody");

    upcomingBody.innerHTML = "";
 
    const today = new Date();

    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
 
    const upcomingLeaves = leaveRequests.filter(request => {

        let fromDate = new Date(request.fromDate);

        fromDate.setHours(0, 0, 0, 0); // Reset time for comparison

        return request.status.toLowerCase() === "approved" && fromDate > today;

    });
 
    console.log("Upcoming Leaves Data:", upcomingLeaves); // Debugging log
 
    upcomingLeaves.forEach(request => {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.name}</td>
            <td>${request.reason}</td>
            <td>${request.fromDate}</td>
            <td>${request.toDate}</td>
            <td class="status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</td>

        `;

        upcomingBody.appendChild(row);

    });

}
function renderCurrentLeaves() {
    const currentBody = document.getElementById("currentLeavesBody");
    currentBody.innerHTML = "";
    const today = new Date();
    console.log("Today's Date:", today); // Debugging log
 
    const currentLeaves = leaveRequests.filter(request => {

        let fromDate = new Date(request.fromDate);
        let toDate = new Date(request.toDate);
        console.log(`Checking: ${request.name}, From: ${fromDate}, To: ${toDate}, Status: ${request.status}`);
        return request.status === "approved" && fromDate <= today && toDate >= today;

    });
 
    console.log("Current Leaves Data:", currentLeaves); // Log filtered results
    currentLeaves.forEach(request => {

        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${request.id}</td>
        <td>${request.name}</td>
        <td>${request.reason}</td>
        <td>${request.fromDate}</td>
        <td>${request.toDate}</td>

        `;

        currentBody.appendChild(row);
    });
}
function fetchLeaveRequests() {
    fetch("/get_leave_requests")
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Leave Requests:", data); // Log fetched data
            leaveRequests = data; // Assign fetched data
            
            renderTable();
        })
        .catch(error => console.error("Error fetching leave data:", error));
}
