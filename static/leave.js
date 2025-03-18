 $(document).ready(function() {
    // Initialize Select2 on the multi-select field
    $("#notify-to").select2({
        placeholder: "Select Person",
        allowClear: true
    });
    loadLeaveApplications();
    // Handle leave application form submission
    $("#leave-form").on("submit", function(event) {
        event.preventDefault();
        var formData = new FormData(this);
        
        fetch("/apply_leave", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                // Append the new leave application to the table
                var app = data.leave_application;
                var newRow = `<tr>
                    <td>${app.slot}</td>
                    <td>${app.start_date}</td>
                    <td>${app.end_date}</td>
                    <td>${app.apply_to}</td>
                    <td>${app.reason}</td>
                    <td>${app.document_path ? "Yes" : "No"}</td>
                    <td>${app.status}</td>
                </tr>`;
                loadLeaveApplications();
                $("#leave-table-body").prepend(newRow);
                $("#leave-form")[0].reset();
                $("#notify-to").val(null).trigger('change');
                showPopup(data.message);
            } else {
                alert("Error: " + data.error);
            }
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            alert("An error occurred. Please try again.");
        });
    });
    
    // Load existing leave applications on page load
    // loadLeaveApplications();
});

function showPopup(message) {
    $("#popup").text(message).fadeIn();
    setTimeout(function() {
        $("#popup").fadeOut();
    }, 3000);
}

function loadLeaveApplications() {
    fetch("/get_leave_applications")
    .then(response => response.json())
    .then(data => {
        if (data.leave_applications) {
            $("#leave-table-body").empty();
            data.leave_applications.forEach(app => {
                var row = `<tr>
                    <td>${app.slot}</td>
                    <td>${app.start_date}</td>
                    <td>${app.end_date}</td>
                    <td>${app.apply_to}</td>
                    <td>${app.reason}</td>
                    <td>${app.document_path ? "Yes" : "No"}</td>
                    <td>${app.status}</td>
                </tr>`;
                $("#leave-table-body").append(row);
            });
        }
    })
    .catch(error => {
        console.error("Error fetching leave applications:", error);
    });
}
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