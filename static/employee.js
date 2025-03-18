document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM fully loaded');
    checkFinancialDetails();
    // fetchFinancialDetails();
    checkPersonalDetails();
    // fetchPersonalDetails();
    checkSkillsInterestsDetails();
    // fetchSkillsInterestsDetails();
    checkSocialDetails();
    // fetchSocialDetails();

   
    // Optimized event listener for modal inputs
    document.querySelectorAll(".modal input, .modal select").forEach(input => {
        input.addEventListener("input", (event) => checkForm(event.target.closest(".modal").id));
    });

    // Optimized event listeners for form submissions using a single function
    const formSections = ["financial","personal" , "skillsInterests" , "socialForm"];
    formSections.forEach(section => { 
        document.getElementById(`${section}Form`)?.addEventListener("submit", (event) => {
            event.preventDefault();
            saveChanges(section);
        });
    
    });
    document.getElementById("saveFinancialButton")?.addEventListener("click", event => {
        event.preventDefault();
        saveChanges("financial");
    });

    document.getElementById("savePersonalButton")?.addEventListener("click", event => {
        event.preventDefault();
        saveChanges("personal");
    });

    document.getElementById("saveSkillsInterestsButton")?.addEventListener("click", async (event) => {
        event.preventDefault();
        saveChanges("skillsInterests");
    });

    document.getElementById("saveSocialButton").addEventListener("click", event => {
        event.preventDefault();
        saveChanges("social");
    });
    

    fetchFinancialDetails();
    fetchPersonalDetails();
    fetchSkillsInterestsDetails();
    fetchSocialDetails();
});


function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        checkForm(modalId);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
    }
}

function checkForm(modalId) {
    const fields = document.querySelectorAll(`#${modalId} input, #${modalId} select`);
    const saveButton = document.querySelector(`#${modalId} button[type='submit']`);
    if (saveButton) {
        saveButton.disabled = !Array.from(fields).every(field => field.value.trim());
    }
}

async function saveChanges(section) {  //Make function async
    let updatedData = {};
    let url = '';
    let updateFunctions = {};
    let alertMessage = '';

    try {
        
        if (section === "financial") {
            const bankNameField = document.getElementById("editBankName");
            const accountNumberField = document.getElementById("editAccountNumber");
            const ifscField = document.getElementById("editIFSC");
            const accountNameField = document.getElementById("editAccountName");
            const bankAddressField = document.getElementById("editBankAddress");
            const pincodeField = document.getElementById("editPincode");

            if (!bankNameField || !accountNumberField || !ifscField || !accountNameField || !bankAddressField || !pincodeField) {
                throw new Error("One or more financial fields are missing in the DOM!");
            }

            updatedData = {
                bank_name: bankNameField.value,
                account_number: accountNumberField.value,
                ifsc_code: ifscField.value,
                account_name: accountNameField.value,
                bank_address: bankAddressField.value,
                pincode: pincodeField.value
            };

            url = '/store_financial_detail';
            updateFunctions = {
                BankName: updatedData.bank_name,
                AccountNumber: updatedData.account_number,
                IFSC: updatedData.ifsc_code,
                AccountName: updatedData.account_name,
                BankAddress: updatedData.bank_address,
                Pincode: updatedData.pincode
            };
            alertMessage = "Financial details updated successfully!";

            Object.entries(updateFunctions).forEach(([key, value]) => {
                document.getElementById(`display${key}`).textContent = value;
            });
            checkFinancialDetails();
            closeModal(`financialModal`);

            const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedData)
                });
        
                const data = await response.json();
        
                if (data.success || (data.message && !data.error)) {
                    alert(alertMessage);
                } else {
                    alert("Error updating details: " + (data.error || 'Unknown error'));
                }

        }

        else if (section === "personal") {
    
                const emailField = document.getElementById("email");
                const addressField = document.getElementById("address");
                const phoneField = document.getElementById("primary");
                const emergencyField = document.getElementById("emergency");
                const genderField = document.getElementById("gender");
                const selectedGender = genderField.value.trim();
                const allowedGenders = ["Male", "Female", "Other"];

                if (!emailField || !addressField || !phoneField || !emergencyField || !genderField) {
                    throw new Error("One or more fields are missing in the DOM!"); // Throw error instead of returning
                }
                console.log("Selected Gender:", selectedGender);
                if (!selectedGender) {
                    alert("Please select a gender!");
                    return;
                }
                if (!allowedGenders.includes(selectedGender)) {
                    alert("Invalid gender selected!");
                    return;
                }
                updatedData = {
                    email: emailField.value,
                    address: addressField.value,
                    phone: phoneField.value,
                    emergency_number: emergencyField.value,
                    gender: selectedGender
                };

                url = '/update_employee';
                updateFunctions = {
                    Email: updatedData.email,
                    Address: updatedData.address,
                    Primary: updatedData.phone,
                    Emergency: updatedData.emergency_number,
                    Gender: updatedData.gender,
                };
                alertMessage = "Personal details updated successfully!";
    
                Object.entries(updateFunctions).forEach(([key, value]) => {
                    // document.getElementById(`display${key}`).textContent = value;
                    const displayElement = document.getElementById(`display${key}`);
                    if (displayElement) {
                        displayElement.textContent = value;
                    } else {
                        console.warn(`Element with ID display${key} not found`);
                    }
                    
                
                });
                checkPersonalDetails();
                closeModal(`personalModal`);

            const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData)
                    });
            
                    const data = await response.json();
            
                    if (data.success || (data.message && !data.error)) {
                        alert(alertMessage);
                    } else {
                        alert("Error updating details: " + (data.error || 'Unknown error'));
                    }
                
            } 
        else if (section === "skillsInterests") {
            const skillsField = document.getElementById("editSkills").value.split(",").map(s => s.trim());
            const softSkillsField = document.getElementById("editSoftSkills").value.split(",").map(s => s.trim());
            const interestsField = document.getElementById("editInterests").value.split(",").map(s => s.trim());
    
            const updatedData = {
                skills: skillsField,
                soft_skills: softSkillsField,
                interests: interestsField
            };
    
            const url = '/store_skills_interests';
            alertMessage = "Skills and interests updated successfully!";
            
            document.getElementById("displaySkills").textContent = skillsField.join(", ");
            document.getElementById("displaySoftSkills").textContent = softSkillsField.join(", ");
            document.getElementById("displayInterests").textContent = interestsField.join(", ");
            
            checkSkillsInterestsDetails();
        closeModal('skillsInterestsModal');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        const data = await response.json();

        if (data.success || (data.message && !data.error)) {
            alert(alertMessage);
        } else {
            alert("Error updating details: " + (data.error || 'Unknown error'));
        }
    }
        else if (section === "social") {

            const linkedinField = document.getElementById("editLinkedIn");
            const githubField  = document.getElementById("editGitHub");
            const twitterField  = document.getElementById("editTwitter");

            if (!linkedinField  || !githubField  || !twitterField  ) {
                throw new Error("One or more social fields are missing in the DOM!");
            }

            updatedData = {
                linkedin: linkedinField.value.trim(),
                github: githubField.value,
                twitter: twitterField.value
            };
            url = '/store_social_links';
            alertMessage = "Social details updated successfully!";
            updateFunctions = {
                LinkedIn : updatedData.linkedin,
                GitHub: updatedData.github,
                Twitter: updatedData.twitter
            };
            alertMessage = "Social details updated successfully!";
            
            Object.entries(updateFunctions).forEach(([key, value]) => {
                document.getElementById(`display${key}`).textContent = value;
            });
            fetchSocialDetails();
            closeModal("socialModal");
        

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData)
            });
    
            const data = await response.json();
    
            if (data.success || (data.message && !data.error)) {
                alert(alertMessage);
            } else {
                alert("Error updating details: " + (data.error || 'Unknown error'));
            } 

        }
    } 
    catch (error) 
    {
        console.error("Error:", error);
        // alert("Failed to update details. Please try again.");
        alert(error);

    }
}

function fetchPersonalDetails() {
    fetch("/get_employee_details")
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Personal Data:", data);

            if (data.employee) {
                // Update display elements
                document.getElementById("displayEmail").textContent = data.employee.email || "Not provided";
                document.getElementById("displayAddress").textContent = data.employee.address || "Not provided";
                document.getElementById("displayPrimary").textContent = data.employee.phone || "Not provided";
                document.getElementById("displayEmergency").textContent = data.employee.emergency_number || "Not provided";
                document.getElementById("displayGender").textContent = data.employee.gender || "Not provided";  //Update display

                // Update the modal's <select> element
                const genderDropdown = document.getElementById("gender");
                if (genderDropdown) {
                    genderDropdown.value = data.employee.gender || ""; //Set dropdown value
                }

            } else {
                console.warn("Employee data is missing from the API response.");
            }
        })
        .catch(error => console.error("Error fetching personal details:", error));
}

function fetchFinancialDetails() {
    fetch("/get_financial_detail")
        .then(response => response.json())
        .then(data => {
            console.log("Fetched Financial Data:", data);
            document.getElementById("displayBankName").textContent = data.bank_name || "Not provided";
            document.getElementById("displayAccountNumber").textContent = data.account_number || "Not provided";
            document.getElementById("displayIFSC").textContent = data.ifsc_code || "Not provided";
            document.getElementById("displayAccountName").textContent = data.account_name || "Not provided";
            document.getElementById("displayBankAddress").textContent = data.bank_address || "Not provided";
            document.getElementById("displayPincode").textContent = data.pincode || "Not provided";
        })
        .catch(error => console.error("Error fetching financial details:", error));
} 


function fetchSkillsInterestsDetails() {
    fetch("/get_skills_interests")
        .then(response => response.json())
        .then(data => {
            document.getElementById("displaySkills").textContent = data.skills.join(", ") || "Not provided";
            document.getElementById("displaySoftSkills").textContent = data.soft_skills.join(", ") || "Not provided";
            document.getElementById("displayInterests").textContent = data.interests.join(", ") || "Not provided";
        })
        .catch(error => console.error("Error fetching skills and interests:", error));
}

function fetchSocialDetails() {
    fetch("/get_social_links")
        .then(response => response.json())
        .then(data => {
            document.getElementById("displayLinkedIn").href = data.linkedin || "#";
            document.getElementById("displayLinkedIn").textContent = data.linkedin || "Not provided";
            document.getElementById("displayGitHub").href = data.github || "#";
            document.getElementById("displayGitHub").textContent = data.github || "Not provided";
            document.getElementById("displayTwitter").href = data.twitter || "#";
            document.getElementById("displayTwitter").textContent = data.twitter || "Not provided";
        })
        .catch(error => console.error("Error fetching social details:", error));
}

function updateDisplay(fields, section) {
    fields.forEach(field => {
        const editValue = document.getElementById(`edit${field}`)?.value;
        const displayField = document.getElementById(`display${field}`);
        if (displayField) {
            displayField.innerText = editValue ? editValue : "Not provided";
        }
    });
}



function checkFinancialDetails() {
    const bankName = document.getElementById("displayBankName")?.innerText.trim();
    const addAccountBtn = document.getElementById("addAccountBtn");
    const financialDetails = document.getElementById("financialDetails");

    if (addAccountBtn && financialDetails) {
        if (bankName && bankName !== "Not provided") {
            addAccountBtn.style.display = "none";
            financialDetails.style.display = "block";
        } else {
            addAccountBtn.style.display = "block";
            financialDetails.style.display = "none";
        }
    }
}
function checkPersonalDetails() {
    const email = document.getElementById("displayEmail")?.innerText.trim();
    const address = document.getElementById("displayAddress")?.innerText.trim();
    const phone = document.getElementById("displayPrimary")?.innerText.trim();
    const emergency = document.getElementById("displayEmergency")?.innerText.trim();
    const genderElement = document.getElementById("displayGender");
    const gender = genderElement ? genderElement.innerText.trim() : "";
    
    const addPersonalBtn = document.getElementById("addPersonalBtn"); // Button to add personal details
    const PersonalDetails = document.getElementById("PersonalDetails"); // Section to display personal details

    if (addPersonalBtn && PersonalDetails) {
        // Check if at least one personal detail is provided
        if (
            (email && email !== "Not provided") ||
            (address && address !== "Not provided") ||
            (phone && phone !== "Not provided") ||
            (emergency && emergency !== "Not provided") ||
            (gender && gender !== "Not provided")
        ) {
            addPersonalBtn.style.display = "none"; // Hide "Add Details" button
            PersonalDetails.style.display = "block"; // Show personal details section
        } else {
            addPersonalBtn.style.display = "block"; // Show "Add Details" button
            PersonalDetails.style.display = "none"; // Hide personal details section
        }
    }
}

function checkSkillsInterestsDetails() {
    let skillsElement = document.getElementById("displaySkills");
    let softSkillsElement = document.getElementById("displaySoftSkills");
    let interestsElement = document.getElementById("displayInterests");

    // Ensure elements exist before modifying them
    if (skillsElement) {
        skillsElement.style.display = "block";
    }
    if (softSkillsElement) {
        softSkillsElement.style.display = "block";
    }
    if (interestsElement) {
        interestsElement.style.display = "block";
    }
}

function checkSocialDetails() {
    const linkedin = document.getElementById("displayLinkedIn")?.innerText.trim();
    const github = document.getElementById("displayGitHub")?.innerText.trim();
    const twitter = document.getElementById("displayTwitter")?.innerText.trim();
    const addSocialBtn = document.getElementById("addSocialBtn");
    const socialDetails = document.getElementById("socialDetails");


    if (addSocialBtn && socialDetails) {
        if ((linkedin && linkedin !== "Not provided") ||
            (github && github !== "Not provided") ||
            (twitter && twitter !== "Not provided")) {
            addSocialBtn.style.display = "none";
            socialDetails.style.display = "block";
        } else {
            addSocialBtn.style.display = "block";
            socialDetails.style.display = "none";
        }
    }
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


