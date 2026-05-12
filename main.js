let vouchers = JSON.parse(localStorage.getItem('vouchers')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let currentType = 'External';

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.getElementById(id).style.display = 'block';
    if(id === 'search-section') renderVouchers();
    if(id === 'expense-list-section') searchExpenses();
}

// Voucher Logic
function openVoucherForm(type) {
    currentType = type;
    document.getElementById('form-title').innerText = type === 'External' ? "အပြင်ကားဘောင်ချာ သွင်းခြင်း" : "Company ကားဘောင်ချာ သွင်းခြင်း";
    document.getElementById('company-select-div').style.display = (type === 'Company') ? 'block' : 'none';
    clearVoucherForm();
    showSection('voucher-form-section');
}

function clearVoucherForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('carNo').value = '';
    document.getElementById('carModel').value = '';
    document.getElementById('voucherNo').value = '';
    document.getElementById('driverPhone').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('entryDate').value = '';
    document.getElementById('companyName').value = '';
    document.getElementById('voucherImg').value = '';
}

async function saveVoucher() {
    const editId = document.getElementById('edit-id').value;
    const imgInput = document.getElementById('voucherImg');
    let imgBase64 = "";
    if(imgInput.files[0]) imgBase64 = await toBase64(imgInput.files[0]);

    const data = {
        id: editId || Date.now(),
        type: currentType,
        carNo: document.getElementById('carNo').value,
        carModel: document.getElementById('carModel').value,
        voucherNo: document.getElementById('voucherNo').value,
        phone: document.getElementById('driverPhone').value,
        amount: document.getElementById('amount').value,
        date: document.getElementById('entryDate').value,
        company: currentType === 'Company' ? document.getElementById('companyName').value : '',
        image: imgBase64 || (editId ? (vouchers.find(v => v.id == editId)?.image || "") : "")
    };

    if(!data.carNo || !data.date) return alert("ကားနံပါတ်နှင့် ရက်စွဲ ထည့်ပေးပါ");

    if(editId) {
        const index = vouchers.findIndex(v => v.id == editId);
        vouchers[index] = data;
    } else {
        vouchers.push(data);
    }

    localStorage.setItem('vouchers', JSON.stringify(vouchers));
    alert("ဘောင်ချာ သိမ်းဆည်းပြီးပါပြီ");
    showSection('voucher-menu');
}

function renderVouchers(data = vouchers) {
    const list = document.getElementById('voucher-list');
    list.innerHTML = '';
    const today = new Date();

    [...data].reverse().forEach(v => {
        const laborExp = addMonths(v.date, 6);
        const isExpired = today > new Date(laborExp);
        const typeColor = v.type === 'External' ? '#6c5ce7' : '#e67e22';

        list.innerHTML += `
            <div class="voucher-item" onclick="showDetail(${v.id}, 'voucher')">
                <div>
                    <span style="font-size:11px; font-weight:bold; color:${typeColor}">${v.type === 'External' ? 'အပြင်' : 'Company'}</span>
                    <strong style="margin-left:8px; font-size:17px;">${v.carNo}</strong><br>
                    <small style="color:#777;">No: ${v.voucherNo} | ${v.date}</small>
                </div>
                <div class="status-dot ${isExpired ? 'red' : 'green'}"></div>
            </div>
        `;
    });
}

// Expense Logic
function openExpenseForm() {
    document.getElementById('exp-edit-id').value = '';
    document.getElementById('expDesc').value = '';
    document.getElementById('expAmount').value = '';
    document.getElementById('expDate').value = '';
    document.getElementById('expNote').value = '';
    document.getElementById('expImg').value = '';
    document.getElementById('exp-form-title').innerText = "အသုံးစရိတ်မှတ်ရန်";
    showSection('expense-form-section');
}

async function saveExpense() {
    const editId = document.getElementById('exp-edit-id').value;
    const imgInput = document.getElementById('expImg');
    let imgBase64 = imgInput.files[0] ? await toBase64(imgInput.files[0]) : "";

    const data = {
        id: editId || Date.now(),
        desc: document.getElementById('expDesc').value,
        amount: document.getElementById('expAmount').value,
        date: document.getElementById('expDate').value,
        note: document.getElementById('expNote').value,
        image: imgBase64 || (editId ? (expenses.find(e => e.id == editId)?.image || "") : "")
    };

    if(!data.desc || !data.date) return alert("အကြောင်းအရာနှင့် ရက်စွဲ ထည့်ပါ");

    if(editId) {
        const index = expenses.findIndex(e => e.id == editId);
        expenses[index] = data;
    } else {
        expenses.push(data);
    }

    localStorage.setItem('expenses', JSON.stringify(expenses));
    alert("အသုံးစရိတ် သိမ်းပြီးပါပြီ");
    showSection('expense-menu');
}

function searchExpenses() {
    const searchDate = document.getElementById('searchExpDate').value;
    const filtered = searchDate ? expenses.filter(e => e.date === searchDate) : expenses;
    const list = document.getElementById('expense-display-list');
    list.innerHTML = filtered.length ? '' : '<p style="text-align:center; color:#999; margin-top:20px;">မှတ်တမ်းမရှိပါ။</p>';
    
    [...filtered].reverse().forEach(e => {
        list.innerHTML += `
            <div class="expense-item" onclick="showDetail(${e.id}, 'expense')">
                <div>
                    <strong>${e.desc}</strong><br>
                    <small>${e.amount} Ks | ${e.date}</small>
                </div>
                <span style="color:var(--success); font-size:20px;">›</span>
            </div>
        `;
    });
}

// Detail & Utility Functions
function showDetail(id, type) {
    const content = document.getElementById('detail-content');
    if(type === 'voucher') {
        const v = vouchers.find(i => i.id == id);
        content.innerHTML = `
            <h2 style="color:var(--blue); margin:0;">${v.carNo}</h2>
            <p style="color:#666;">${v.carModel} | ${v.phone || '-'}</p>
            <hr>
            <p><b>အမျိုးအစား:</b> ${v.type} ${v.company ? '['+v.company+']' : ''}</p>
            <p><b>ဘောင်ချာနံပါတ်:</b> ${v.voucherNo}</p>
            <p><b>ကျသင့်ငွေ:</b> ${v.amount} ကျပ်</p>
            <p><b>ရက်စွဲ:</b> ${v.date}</p>
            <div style="background:#f9f9f9; padding:12px; border-radius:10px; border-left:4px solid var(--success);">
                <p style="margin:5px 0;">🛠 <b>လက်ခအာမခံ (၆လ):</b> ${addMonths(v.date, 6)}</p>
                <p style="margin:5px 0;">📦 <b>ပစ္စည်းအာမခံ (၃လ):</b> ${addMonths(v.date, 3)}</p>
            </div>
            ${v.image ? `<img src="${v.image}" style="width:100%; border-radius:10px; margin-top:15px; border:1px solid #ddd;">` : ''}
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn" style="background:#f1c40f;" onclick="editVoucher(${v.id})">ပြင်ဆင်မည်</button>
                <button class="btn" style="background:#e74c3c; color:white;" onclick="deleteItem(${v.id}, 'voucher')">ဖျက်မည်</button>
            </div>
        `;
    } else {
        const e = expenses.find(i => i.id == id);
        content.innerHTML = `
            <h2 style="color:var(--success); margin:0;">အသုံးစရိတ် အသေးစိတ်</h2>
            <hr>
            <p><b>အကြောင်းအရာ:</b> ${e.desc}</p>
            <p><b>ပမာဏ:</b> ${e.amount} ကျပ်</p>
            <p><b>နေ့စွဲ:</b> ${e.date}</p>
            <p><b>မှတ်ချက်:</b><br>${e.note || '-'}</p>
            ${e.image ? `<img src="${e.image}" style="width:100%; border-radius:10px; margin-top:15px; border:1px solid #ddd;">` : ''}
            <div style="display:flex; gap:10px; margin-top:20px;">
                <button class="btn" style="background:#f1c40f;" onclick="editExpense(${e.id})">ပြင်ဆင်မည်</button>
                <button class="btn" style="background:#e74c3c; color:white;" onclick="deleteItem(${e.id}, 'expense')">ဖျက်မည်</button>
            </div>
        `;
    }
    document.getElementById('detail-modal').style.display = 'flex';
}

function deleteItem(id, type) {
    if(!confirm("ဖျက်ရန် သေချာပါသလား?")) return;
    if(type === 'voucher') {
        vouchers = vouchers.filter(v => v.id != id);
        localStorage.setItem('vouchers', JSON.stringify(vouchers));
        renderVouchers();
    } else {
        expenses = expenses.filter(e => e.id != id);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        searchExpenses();
    }
    closeModal();
}

function editVoucher(id) {
    const v = vouchers.find(i => i.id == id);
    closeModal();
    openVoucherForm(v.type);
    document.getElementById('edit-id').value = v.id;
    document.getElementById('carNo').value = v.carNo;
    document.getElementById('carModel').value = v.carModel;
    document.getElementById('voucherNo').value = v.voucherNo;
    document.getElementById('driverPhone').value = v.phone || '';
    document.getElementById('amount').value = v.amount;
    document.getElementById('entryDate').value = v.date;
    if(v.type === 'Company') document.getElementById('companyName').value = v.company;
}

function editExpense(id) {
    const e = expenses.find(i => i.id == id);
    closeModal();
    showSection('expense-form-section');
    document.getElementById('exp-edit-id').value = e.id;
    document.getElementById('expDesc').value = e.desc;
    document.getElementById('expAmount').value = e.amount;
    document.getElementById('expDate').value = e.date;
    document.getElementById('expNote').value = e.note;
    document.getElementById('exp-form-title').innerText = "အသုံးစရိတ် ပြင်ဆင်ရန်";
}

function searchVouchers() {
    const term = document.getElementById('voucherSearch').value.toLowerCase();
    const filtered = vouchers.filter(v => v.carNo.toLowerCase().includes(term) || v.voucherNo.toLowerCase().includes(term));
    renderVouchers(filtered);
}

const toBase64 = file => new Promise((res) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
});

function addMonths(dateStr, months) {
    let d = new Date(dateStr);
    if(isNaN(d.getTime())) return "-";
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
}

function closeModal() { document.getElementById('detail-modal').style.display = 'none'; }
