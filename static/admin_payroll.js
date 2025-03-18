
let currentRow;

function generateslip(button, empId, name) {
    document.getElementById('employeeName').value = name;
    document.getElementById('salaryModal').style.display = 'block';
    currentRow = button.closest('tr');
}

function closeModal() {
    document.getElementById('salaryModal').style.display = 'none';
}

function calculateNetSalary() {
    let basic = parseFloat(document.getElementById('basicSalary').value) || 0;
    let tax = parseFloat(document.getElementById('taxDeduction').value) || 0;
    document.getElementById('netSalary').value = (basic - tax).toFixed(2);
}

function processSalary() {
    let name = document.getElementById('employeeName').value;
    let basic = document.getElementById('basicSalary').value;
    let tax = document.getElementById('taxDeduction').value;
    let net = document.getElementById('netSalary').value;
    let account = document.getElementById('accountNumber').value;
    let ifsc = document.getElementById('ifscCode').value;

    if (!basic || !account || !ifsc) {
        alert("Please fill all required fields!");
        return;
    }

    if (currentRow) {
        currentRow.querySelector('.status').textContent = 'Paid';
        currentRow.querySelector('.status').classList.remove('pending');
        currentRow.querySelector('.status').classList.add('received');
    }

    generatePDF(name, basic, tax, net, account, ifsc);
    alert("Salary processed successfully!");
    closeModal();
}

function generatePDF(name, basic, tax, net, account, ifsc) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Salary Slip", 90, 20);
    doc.setFontSize(12);
    
    doc.text(`Employee Name: ${name}`, 20, 40);
    doc.text(`Basic Salary: ₹${basic}`, 20, 50);
    doc.text(`Tax Deduction: ₹${tax}`, 20, 60);
    doc.text(`Net Salary: ₹${net}`, 20, 70);
    doc.text(`Account Number: ${account}`, 20, 80);
    doc.text(`IFSC Code: ${ifsc}`, 20, 90);
    
    doc.text("Thank you!", 90, 110);
    doc.save(`Salary_Slip_${name}.pdf`);
}
