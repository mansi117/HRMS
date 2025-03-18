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