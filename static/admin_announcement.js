
// Open modal
function openModal() {
    document.getElementById("announcementModal").style.display = "flex";
}

// Close modal
function closeModal() {
    document.getElementById("announcementModal").style.display = "none";
    clearFields();
}

// Add or update announcement
function addOrUpdateAnnouncement() {
    let subject = document.getElementById("subject").value.trim();  // Changed to subject
    let description = document.getElementById("description").value.trim();  // Changed to description
    let link = document.getElementById("link").value.trim();  // Changed to link
    let editIndex = document.getElementById("editIndex").value;

    if (!subject || !description) {
        alert("Subject and Description are required!");
        return;
    }

    console.log("Adding/updating announcement...");
    console.log("Subject:", subject, "Description:", description, "Link:", link);

    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];

    // Handle link input: if no link provided, set fileUrl as empty string or null
    let fileUrl = link || null;

    // Call saveAnnouncement directly (no file handling)
    saveAnnouncement(subject, description, fileUrl, editIndex);
}

// Save Announcement
function saveAnnouncement(subject, description, fileUrl, editIndex) {
    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];

    // If there is no link or file, we store it as "No Link"
    if (!fileUrl) {
        fileUrl = "No Link";
    }

    // Edit or add new announcement based on editIndex
    if (editIndex === "") {
        announcements.push({ subject, description, fileUrl });
    } else {
        announcements[editIndex] = { subject, description, fileUrl };
    }

    // Store in localStorage
    localStorage.setItem("announcements", JSON.stringify(announcements));

    // Refresh the displayed announcements
    displayAnnouncements();

    // Close the modal after saving
    closeModal();
}

// Display announcements
function displayAnnouncements() {
    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
    let tableBody = document.getElementById("announcementTable");
    tableBody.innerHTML = "";  // Clear existing table

    // Loop through the announcements and display them in the table
    announcements.forEach((announcement, index) => {
        let fileType = announcement.fileUrl && announcement.fileUrl !== "No Link"
            ? `<a href="${announcement.fileUrl}" target="_blank">View File</a>`  // If there’s a link, display the file
            : "No File / No Link";  // If no link or file

        // Create a table row for each announcement
        let row = `<tr>
            <td>${index + 1}</td>
            <td>${announcement.subject}</td>  <!-- Changed to subject -->
            <td>${announcement.description}</td>  <!-- Changed to description -->
            <td>${fileType}</td>
            <td>
                <button class="btn-edit" onclick="editAnnouncement(${index})">Edit</button>
                <button class="btn-delete" onclick="deleteAnnouncement(${index})">Delete</button>
            </td>
        </tr>`;
       
        tableBody.innerHTML += row;  // Add row to the table
    });
}

// Edit announcement
function editAnnouncement(index) {
    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
    document.getElementById("subject").value = announcements[index].subject;  // Changed to subject
    document.getElementById("description").value = announcements[index].description;  // Changed to description
    document.getElementById("link").value = announcements[index].fileUrl !== "No Link" ? announcements[index].fileUrl : "";  // Show link if available
    document.getElementById("editIndex").value = index;  // Set the edit index
    openModal();  // Open modal for editing
}

// Delete announcement
function deleteAnnouncement(index) {
    let announcements = JSON.parse(localStorage.getItem("announcements")) || [];
    announcements.splice(index, 1);  // Remove the announcement at the given index
    localStorage.setItem("announcements", JSON.stringify(announcements));  // Update localStorage
    displayAnnouncements();  // Refresh the displayed announcements
}

// Clear input fields in the modal
function clearFields() {
    document.getElementById("subject").value = "";  // Changed to subject
    document.getElementById("description").value = "";  // Changed to description
    document.getElementById("link").value = "";
    document.getElementById("editIndex").value = "";
}

// Initialize announcements on page load
window.onload = displayAnnouncements;

