document.querySelector('.learn-more-btn').addEventListener('click', function() {
    alert('Learn more about ARITHWISE!');
});

function showPopup(message) {
    if (message) {
        alert(message);  // Simple alert for the success message
    }
}
function setRole(role) {
    document.getElementById("roleInput").value = role;
    // document.querySelector("form").submit();
}
document.addEventListener("DOMContentLoaded", function () {
    // let selectedRole = ""; // Store selected role
    let selectedRole = localStorage.getItem("selectedRole") || ""; // Store selected role

    document.querySelectorAll(".login-btn").forEach(button => {
        button.addEventListener("click", function () {
            selectedRole = this.getAttribute("data-role"); // Get role from data-role attribute
            localStorage.setItem("selectedRole", selectedRole);  // Store role persistently
            document.getElementById("roleInput").value = selectedRole; // Store role in hidden input
            
            // Highlight the selected button (optional for UX)
            document.querySelectorAll(".login-btn").forEach(btn => btn.classList.remove("selected-role"));
            this.classList.add("selected-role");

            console.log("Selected role:", selectedRole); // Debugging log
        });
    });

    document.querySelector(".sign-in-btn").addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default form submission

        const email = document.querySelector('input[type="email"]').value.trim();
        const password = document.querySelector('input[type="password"]').value.trim();
        if (!selectedRole) {
            alert("Please select a role before signing in!");
            return;
        }
        if (!email || !password) {
            alert("Email and password are required!");
            return;
        }

        fetch("/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, role: selectedRole }) // Send role for checking
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Login Successful: ${data.message}`);
                console.log("DEBUG: Redirecting to -", data.redirect); // ✅ Check redirect URL
                window.location.href = data.redirect; // Redirect user based on role
            } else {
                alert(`Error: ${data.message}`);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred during sign-in");
        });
    });
});
