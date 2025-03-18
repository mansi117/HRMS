
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("photo").addEventListener("change", function () {
        const fileName = this.files[0] ? this.files[0].name : "";
        document.getElementById("photo-file-name").textContent = fileName;
    });

    document.getElementById("resume_path").addEventListener("change", function () {
        const fileName = this.files[0] ? this.files[0].name : "";
        document.getElementById("resume-file-name").textContent = fileName;
    });

    document.querySelector(".create-account-btn").addEventListener("click", function (event) {
        event.preventDefault();

        // Collect input data
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm-password").value.trim();
        const date_of_birth = document.getElementById("date_of_birth").value.trim();
        const address = document.getElementById("address").value.trim();
        const photo = document.getElementById("photo").files[0];
        const resume_path = document.getElementById("resume_path").files[0];
        const type = document.getElementById("type").value.trim(); // Get selected type

        console.log("First Name:", firstName);
        console.log("Last Name:", lastName);
        console.log("Email:", email);
        console.log("Phone:", phone);
        console.log("Password:", password);
        console.log("Confirm Password:", confirmPassword);
        console.log("DOB:", date_of_birth);
        console.log("Address:", address);
        console.log("Photo:", photo ? photo.name : "No file selected");
        console.log("Resume:", resume_path ? resume_path.name : "No file selected");
        console.log("Type:", type);

        // Basic validation
        if (!firstName || !lastName || !email || !phone || !password || !confirmPassword || !date_of_birth || !address || !photo || !resume_path || !type) {
            alert("Please fill in all required fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Prepare FormData
        const formData = new FormData();
        formData.append("first_name", firstName);
        formData.append("last_name", lastName);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("password", password);
        formData.append("confirm_password", confirmPassword);
        formData.append("date_of_birth", date_of_birth);
        formData.append("address", address);
        formData.append("photo", photo);
        formData.append("resume_path", resume_path);
        formData.append("type", type); // Add type to form data

        // Send data to backend
        fetch('/register', {
            method: 'POST',
            body: formData // No need to stringify, and no 'Content-Type' header
        })
        .then(response => response.json()) // Parse response
        .then(data => {
            console.log(data);
            if (data.success) {
                alert(`Message: ${data.message}`);
                window.location.href = '/signin';
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred during registration.');
        });
    });
});
