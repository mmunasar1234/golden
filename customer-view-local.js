const tbody = document.getElementById("customersBody");
const countPill = document.getElementById("countPill");
const editModal = document.getElementById("editModal");
const selectAllCb = document.getElementById("selectAllCb");
const printSelectedBtn = document.getElementById("printSelectedBtn");

function formatMoney(value) {
    if (value === undefined || value === null || value === "") return "-";
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return n.toFixed(2);
}

function formatDateField(data) {
    if (data?.date) return data.date;
    if (data?.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
            return data.createdAt.toDate().toLocaleDateString();
        }
        return new Date(data.createdAt).toLocaleDateString();
    }
    return "-";
}

function loadInvoices() {
    const stored = localStorage.getItem("golden_invoices");
    return stored ? JSON.parse(stored) : [];
}

function saveInvoices(invoices) {
    localStorage.setItem("golden_invoices", JSON.stringify(invoices));
}

function renderRows() {
    const invoices = loadInvoices();
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!invoices || invoices.length === 0) {
        const tr = document.createElement("tr");
        tr.className = "empty-row";
        const td = document.createElement("td");
        td.colSpan = 11;
        td.textContent = "Weliba wax customer ah lama kaydin (Local).";
        tr.appendChild(td);
        tbody.appendChild(tr);
        if (countPill) countPill.textContent = "0 customers";
        if (selectAllCb) selectAllCb.disabled = true;
        if (printSelectedBtn) printSelectedBtn.style.display = 'none';
        return;
    }

    if (selectAllCb) selectAllCb.disabled = false;
    if (printSelectedBtn) printSelectedBtn.style.display = 'inline-block';

    // Iterate backwards to show newest first, but keep the original ARRAY INDEX for easy editing/deleting
    for (let i = invoices.length - 1; i >= 0; i--) {
        const data = invoices[i];
        const tr = document.createElement("tr");

        const cbTd = document.createElement("td");
        cbTd.className = "select-cell";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "row-cb";
        cb.value = i;
        cbTd.appendChild(cb);
        tr.appendChild(cbTd);

        const cells = [
            data.fullName || "-",
            data.phone || "-",
            data.district || "-",
            formatDateField(data),
            data.qty || "-",
            formatMoney(data.amount),
            formatMoney(data.totalAmount),
            formatMoney(data.paid),
            formatMoney(data.reset),
        ];

        cells.forEach((value) => {
            const td = document.createElement("td");
            td.textContent = value;
            tr.appendChild(td);
        });

        // Actions Column
        const actionTd = document.createElement("td");

        const editBtn = document.createElement("button");
        editBtn.className = "action-btn";
        editBtn.textContent = "Edit";
        editBtn.onclick = () => openEditModal(i);
        actionTd.appendChild(editBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "action-btn delete";
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = () => deleteInvoice(i);
        actionTd.appendChild(deleteBtn);

        tr.appendChild(actionTd);
        tbody.appendChild(tr);
    }

    if (selectAllCb) {
        selectAllCb.checked = false;
        selectAllCb.onchange = (e) => {
            const isChecked = e.target.checked;
            document.querySelectorAll(".row-cb").forEach(cb => {
                cb.checked = isChecked;
            });
        };
    }

    if (countPill) {
        const count = invoices.length;
        countPill.textContent = `${count} customer${count === 1 ? "" : "s"}`;
    }
}

function deleteInvoice(index) {
    if (confirm("Ma hubtaa inaad tirtirto xogtaan? (Are you sure you want to delete?)")) {
        const invoices = loadInvoices();
        invoices.splice(index, 1); // Remove item at index
        saveInvoices(invoices);
        renderRows(); // Refresh
    }
}

function openEditModal(index) {
    const invoices = loadInvoices();
    const data = invoices[index];

    document.getElementById("editIndex").value = index;
    document.getElementById("editName").value = data.fullName || "";
    document.getElementById("editPhone").value = data.phone || "";
    document.getElementById("editDistrict").value = data.district || "";
    document.getElementById("editDate").value = data.date || "";
    document.getElementById("editQty").value = data.qty || "";
    document.getElementById("editAmount").value = data.amount || "";
    document.getElementById("editPaid").value = data.paid || "";

    editModal.style.display = "flex";
}

document.getElementById("cancelEditBtn")?.addEventListener("click", () => {
    editModal.style.display = "none";
});

document.getElementById("saveEditBtn")?.addEventListener("click", () => {
    const index = parseInt(document.getElementById("editIndex").value, 10);
    const invoices = loadInvoices();

    if (isNaN(index) || !invoices[index]) return;

    const data = invoices[index];

    data.fullName = document.getElementById("editName").value;
    data.phone = document.getElementById("editPhone").value;
    data.district = document.getElementById("editDistrict").value;
    data.date = document.getElementById("editDate").value;

    const qtyRaw = document.getElementById("editQty").value;
    const amountRaw = document.getElementById("editAmount").value;
    const paidRaw = document.getElementById("editPaid").value;

    const qty = Number(qtyRaw) || 0;
    const amount = Number(amountRaw) || 0;
    const paid = Number(paidRaw) || 0;

    const totalAmount = qty * amount;
    const reset = Math.max(totalAmount - paid, 0);

    data.qty = qty ? String(qty) : "";
    data.amount = amount ? amount.toFixed(2) : "";
    data.totalAmount = totalAmount ? totalAmount.toFixed(2) : "";
    data.paid = paid ? paid.toFixed(2) : "";
    data.reset = reset ? reset.toFixed(2) : "";

    saveInvoices(invoices);

    editModal.style.display = "none";
    renderRows();
});

document.addEventListener("DOMContentLoaded", renderRows);

if (printSelectedBtn) {
    printSelectedBtn.addEventListener("click", () => {
        const checkboxes = document.querySelectorAll(".row-cb:checked");
        if (checkboxes.length === 0) {
            alert("Fadlan dooro ugu yaraan hal invoice (Please select at least one invoice).");
            return;
        }

        // Add class to body to trigger print CSS
        document.body.classList.add("print-mode");

        // Mark only checked rows
        document.querySelectorAll("tbody tr").forEach(tr => {
            const cb = tr.querySelector(".row-cb");
            if (cb && cb.checked) {
                tr.classList.add("print-selected");
            } else {
                tr.classList.remove("print-selected");
            }
        });

        // Small delay to let DOM apply classes before printing
        setTimeout(() => {
            window.print();

            // Cleanup after print dialog closes
            document.body.classList.remove("print-mode");
            document.querySelectorAll("tbody tr").forEach(tr => {
                tr.classList.remove("print-selected");
            });
        }, 100);
    });
}

window.addEventListener('storage', function (e) {
    if (e.key === 'golden_invoices') {
        renderRows();
    }
});
