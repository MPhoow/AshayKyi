// Firebase Configuration Setup
const firebaseConfig = {
  apiKey: "AIzaSyCWYrHDizus_lJWfsNw_P-EWvaklLc3Ejo",
  authDomain: "ashaykyi-f93e1.firebaseapp.com",
  databaseURL: "https://ashaykyi-f93e1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ashaykyi-f93e1",
  storageBucket: "ashaykyi-f93e1.firebasestorage.app",
  messagingSenderId: "647510690440",
  appId: "1:647510690440:web:6489bca73b04b8274a2d3d",
  measurementId: "G-4DEN9LVCSK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Sync States
let vouchers = [];
let expenses = [];
let currentType = 'External';
let passwordAttempts = 0;

// Firebase Cloud Realtime Sync Listener
database.ref('vouchers').on('value', (snapshot) => {
    const data = snapshot.val();
    vouchers = data ? Object.values(data) : [];
    if(document.getElementById('search-section').style.display === 'block') {
        searchVouchers();
    }
});

database.ref('expenses').on('value', (snapshot) => {
    const data = snapshot.val();
    expenses = data ? Object.values(data) : [];
    if(document.getElementById('expense-list-section').style.display === 'block') {
        searchExpenses();
    }
});

// Lock Screen Authentication
function checkPassword() {
    const pass = document.getElementById('passInput').value;
    if(pass === '1218') {
        document.getElementById('lock-screen').style.display = 'none';
        document.getElementById('app-interface').style.display = 'block';
    } else {
        passwordAttempts++;
        document.getElementById('lock-error').innerText = "ဝင်ရောက်မရပါ";
        if(passwordAttempts >= 3) {
            document.getElementById('forgot-btn').style.display = 'inline-block';
        }
    }
}

function showHint() {
    document.getElementById('hint-text').innerText = "Hints: 12";
}

// App Section Navigation Routing
function showSection(id) {
    document.querySelectorAll('.section-clean').forEach(s => s.style.display = 'none');
    document.getElementById('main-menu').style.display = (id === 'main-menu') ? 'flex' : 'none';
    
    const targetSection = document.getElementById(id);
    if(targetSection) targetSection.style.display = 'block';
    
    if(id === 'search-section') renderVouchers();
}

function showToast() {
    const toast = document.getElementById('toast-alert');
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ================= VOUCHER LOGIC ENGINE =================
function openVoucherForm(type) {
    currentType = type;
    document.getElementById('form-title').innerText = type === 'External' ? "အပြင်ကားဘောင်ချာ သွင်းခြင်း" : "Company ကားဘောင်ချာ သွင်းခြင်း";
    document.getElementById('company-fields').style.display = (type === 'Company') ? 'block' : 'none';
    document.getElementById('external-fields').style.display = (type === 'External') ? 'block' : 'none';
    resetVoucherForm();
    showSection('voucher-form-section');
}

function resetVoucherForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('carNo').value = '';
    document.getElementById('carModel').value = '';
    document.getElementById('voucherNo').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('entryDate').value = '';
    document.getElementById('extRemainingAmount').value = '';
    document.getElementById('companyName').value = '';
    document.getElementById('driverPhone').value = '';
    document.getElementById('driverRK').value = '';
    document.getElementById('advancePaidAmount').value = '';
    document.getElementById('voucherImg').value = '';
}

async function saveVoucher() {
    const editId = document.getElementById('edit-id').value;
    const imgInput = document.getElementById('voucherImg');
    let imgBase64 = "";
    
    if(imgInput.files[0]) imgBase64 = await toBase64(imgInput.files[0]);

    const targetId = editId ? parseInt(editId) : Date.now();
    const data = {
        id: targetId,
        type: currentType,
        carNo: document.getElementById('carNo').value.trim(),
        carModel: document.getElementById('carModel').value.trim(),
        voucherNo: document.getElementById('voucherNo').value.trim(),
        amount: document.getElementById('amount').value,
        date: document.getElementById('entryDate').value,
        extRemaining: currentType === 'External' ? document.getElementById('extRemainingAmount').value : '',
        company: currentType === 'Company' ? document.getElementById('companyName').value : '',
        phone: currentType === 'Company' ? document.getElementById('driverPhone').value : '',
        driverRK: currentType === 'Company' ? document.getElementById('driverRK').value : '',
        advancePaid: currentType === 'Company' ? document.getElementById('advancePaidAmount').value : '',
        image: imgBase64 || (editId ? vouchers.find(v => v.id == editId).image : "")
    };

    if(!data.carNo || !data.date || !data.voucherNo) {
        alert("ကားနံပါတ်၊ ဘောင်ချာနံပါတ် နှင့် ရက်စွဲကို မဖြစ်မနေ ဖြည့်သွင်းပေးပါ။");
        return;
    }

    database.ref('vouchers/' + targetId).set(data, (error) => {
        if (error) {
            alert("Error: " + error.message);
        } else {
            showToast();
            resetVoucherForm(); 
            showSection('voucher-menu'); // သွင်းပြီးပါက အပြင်ကား/Company ကား ရွေးချယ်သည့်နေရာသို့ တိုက်ရိုက်ပြန်သွားရန်
        }
    });
}

function renderVouchers(data = vouchers) {
    const list = document.getElementById('voucher-list');
    list.innerHTML = data.length ? '' : '<p style="text-align:center; color:#7f8c8d;">မှတ်တမ်းမရှိသေးပါ။</p>';
    const today = new Date();

    [...data].reverse().forEach(v => {
        const laborExp = addMonths(v.date, 6);
        const isExpired = today > new Date(laborExp);

        list.innerHTML += `
            <div class="record-card" onclick="showDetail(${v.id})">
                <div>
                    <span class="${v.type==='Company'?'badge-comp':'badge-ext'}">${v.type==='Company'? v.company : 'အပြင်ကား'}</span><br>
                    <strong style="font-size:18px; display:inline-block; margin-top:5px;">${v.carNo}</strong><br>
                    <small style="color:#7f8c8d;">ဘောင်ချာ: ${v.voucherNo} | ရက်စွဲ: ${v.date}</small>
                </div>
                <div class="status-container">
                    ${isExpired ? '<span class="expired-text">အာမခံကုန်ဆုံးနေပါပြီ</span>' : ''}
                    <div class="status-dot ${isExpired ? 'red-dot' : 'green-dot'}"></div>
                </div>
            </div>
        `;
    });
}

function showDetail(id) {
    const v = vouchers.find(i => i.id == id);
    const laborExp = addMonths(v.date, 6);
    const partExp = addMonths(v.date, 3);
    const today = new Date();
    const isExpired = today > new Date(laborExp);
    
    document.getElementById('detail-content').innerHTML = `
        <span class="${v.type==='Company'?'badge-comp':'badge-ext'}">${v.type === 'External' ? 'အပြင်ကားဘောင်ချာ' : 'Company ကားဘောင်ချာ'}</span>
        <h2 style="margin: 10px 0 5px 0; color:var(--dark-slate);">${v.carNo}</h2>
        <hr style="border:0; border-top:1px solid #eee;">
        <p><b>ကားအမျိုးအစား:</b> ${v.carModel || '-'}</p>
        <p><b>ဘောင်ချာနံပါတ်:</b> ${v.voucherNo}</p>
        <p><b>ကျသင့်ငွေ:</b> ${v.amount} ကျပ်</p>
        ${v.type === 'External' ? `<p><b>ကျန်ငွေ:</b> ${v.extRemaining || 0} ကျပ်</p>` : ''}
        <p><b>ထည့်သွင်းသည့်ရက်စွဲ:</b> ${v.date}</p>
        
        ${v.type === 'Company' ? `
            <p><b>Company နာမည်:</b> ${v.company}</p>
            <p><b>ကားဆရာဖုန်း:</b> ${v.phone || '-'}</p>
            <p><b>ကားဆရာအာရကေ:</b> ${v.driverRK || '-'}</p>
            <p><b>ကြိုစိုက်ထားပေးရသောငွေ:</b> ${v.advancePaid || 0} ကျပ်</p>
        ` : ''}
        
        <div style="background:#f8f9fa; padding:12px; border-radius:12px; margin:15px 0; font-size:14px;">
            <div style="margin-bottom:6px;"><i class="fa-solid fa-shield-halved"></i> <b>လက်ခအာမခံ (၆လ):</b> ${laborExp}</div>
            <div><i class="fa-solid fa-box-tissue"></i> <b>ပစ္စည်းအာမခံ (၃လ):</b> ${partExp}</div>
            ${isExpired ? '<div style="margin-top:8px; text-align:center;"><span class="expired-text" style="font-size:14px;"><i class="fa-solid fa-circle-exclamation"></i> အာမခံကုန်ဆုံးနေပါပြီ</span></div>' : ''}
        </div>
        
        ${v.image ? `<img src="${v.image}" style="width:100%; border-radius:12px; margin-top:5px; max-height: 250px; object-fit: contain; background: #eee;">` : '<p style="color:#ccc;font-size:12px;text-align:center;">ဓာတ်ပုံမရှိပါ။</p>'}
        
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn btn-sub" style="margin:0; padding:10px;" onclick="editVoucher(${v.id})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn" style="background:var(--expired-red); color:white; margin:0; padding:10px;" onclick="deleteVoucher(${v.id})"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
        <button class="btn btn-close" onclick="closeModal()">ပိတ်မည်</button>
    `;
    document.getElementById('detail-modal').style.display = 'flex';
}

function searchVouchers() {
    const term = document.getElementById('vSearch').value.toLowerCase().trim();
    const filtered = vouchers.filter(v => v.carNo.toLowerCase().includes(term) || v.voucherNo.toLowerCase().includes(term));
    renderVouchers(filtered);
}

function deleteVoucher(id) {
    if(confirm("ဤဘောင်ချာမှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?")) {
        database.ref('vouchers/' + id).remove().then(() => {
            closeModal();
            renderVouchers();
        });
    }
}

function editVoucher(id) {
    const v = vouchers.find(i => i.id == id);
    closeModal(); openVoucherForm(v.type);
    document.getElementById('edit-id').value = v.id;
    document.getElementById('carNo').value = v.carNo;
    document.getElementById('carModel').value = v.carModel;
    document.getElementById('voucherNo').value = v.voucherNo;
    document.getElementById('amount').value = v.amount;
    document.getElementById('entryDate').value = v.date;
    if(v.type === 'External') {
        document.getElementById('extRemainingAmount').value = v.extRemaining;
    } else if(v.type === 'Company') {
        document.getElementById('companyName').value = v.company;
        document.getElementById('driverPhone').value = v.phone;
        document.getElementById('driverRK').value = v.driverRK;
        document.getElementById('advancePaidAmount').value = v.advancePaid;
    }
}

// ================= EXPENSE LOGIC ENGINE =================
function openExpenseForm() {
    resetExpenseForm();
    showSection('expense-form-section');
}

function resetExpenseForm() {
    document.getElementById('edit-exp-id').value = '';
    document.getElementById('expDesc').value = '';
    document.getElementById('expAmount').value = '';
    document.getElementById('expDate').value = '';
    document.getElementById('expNote').value = '';
    document.getElementById('expImg').value = '';
}

async function saveExpense() {
    const editExpId = document.getElementById('edit-exp-id').value;
    const imgInput = document.getElementById('expImg');
    let imgBase = imgInput.files[0] ? await toBase64(imgInput.files[0]) : "";

    const targetExpId = editExpId ? parseInt(editExpId) : Date.now();
    const data = {
        id: targetExpId,
        desc: document.getElementById('expDesc').value.trim(),
        amount: document.getElementById('expAmount').value,
        date: document.getElementById('expDate').value,
        note: document.getElementById('expNote').value.trim(),
        image: imgBase || (editExpId ? expenses.find(e => e.id == editExpId).image : "")
    };

    if(!data.desc || !data.amount || !data.date) {
        alert("အကြောင်းအရာ၊ ပမာဏ နှင့် နေ့စွဲကို ဖြည့်စွက်ပေးပါ။");
        return;
    }

    database.ref('expenses/' + targetExpId).set(data, (error) => {
        if(error) {
            alert("Error: " + error.message);
        } else {
            showToast(); 
            resetExpenseForm(); 
            showSection('expense-menu');
        }
    });
}

function searchExpenses() {
    const targetDate = document.getElementById('searchExpDate').value;
    if(!targetDate) return; 
    
    const filtered = expenses.filter(e => e.date === targetDate);
    const display = document.getElementById('expense-display');
    display.innerHTML = filtered.length ? '' : '<p style="text-align:center; color:#7f8c8d;">ဤနေ့စွဲတွင် စာရင်းမရှိပါ။</p>';
    
    filtered.reverse().forEach(e => {
        display.innerHTML += `
            <div class="record-card" onclick="showExpenseDetail(${e.id})">
                <div>
                    <strong>${e.desc}</strong><br>
                    <span style="color:var(--dark-slate);font-weight:bold;">${e.amount} ကျပ်</span><br>
                    <small style="color:#7f8c8d;">နေ့စွဲ: ${e.date}</small>
                </div>
                <i class="fa-solid fa-chevron-right" style="color:#ccc;"></i>
            </div>
        `;
    });
}

function showExpenseDetail(id) {
    const e = expenses.find(i => i.id == id);
    document.getElementById('detail-content').innerHTML = `
        <span class="badge-ext">အသုံးစရိတ်မှတ်တမ်း</span>
        <h2 style="margin: 10px 0 5px 0;">${e.desc}</h2>
        <hr style="border:0; border-top:1px solid #eee;">
        <p><b>အသုံးပြုငွေ:</b> ${e.amount} ကျပ်</p>
        <p><b>နေ့စွဲ:</b> ${e.date}</p>
        <p><b>မှတ်ချက်:</b><br><span style="white-space: pre-wrap; color:#555;">${e.note || '-'}</span></p>
        ${e.image ? `<img src="${e.image}" style="width:100%; border-radius:12px; margin-top:5px; max-height: 250px; object-fit: contain; background: #eee;">` : ''}
        
        <div style="display:flex; gap:10px; margin-top:20px;">
            <button class="btn btn-sub" style="margin:0; padding:10px;" onclick="editExpense(${e.id})"><i class="fa-solid fa-pen"></i> Edit</button>
            <button class="btn" style="background:var(--expired-red); color:white; margin:0; padding:10px;" onclick="deleteExpense(${e.id})"><i class="fa-solid fa-trash"></i> Delete</button>
        </div>
        <button class="btn btn-close" onclick="closeModal()">ပိတ်မည်</button>
    `;
    document.getElementById('detail-modal').style.display = 'flex';
}

function deleteExpense(id) {
    if(confirm("ဤအသုံးစရိတ်မှတ်တမ်းကို ဖျက်ရန် သေချာပါသလား?")) {
        database.ref('expenses/' + id).remove().then(() => {
            closeModal(); 
            document.getElementById('expense-display').innerHTML = '';
        });
    }
}

function editExpense(id) {
    const e = expenses.find(i => i.id == id);
    closeModal(); showSection('expense-form-section');
    document.getElementById('edit-exp-id').value = e.id;
    document.getElementById('expDesc').value = e.desc;
    document.getElementById('expAmount').value = e.amount;
    document.getElementById('expDate').value = e.date;
    document.getElementById('expNote').value = e.note;
}

// Global Image Utilities
const toBase64 = file => new Promise((res) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => res(reader.result);
});

function addMonths(dateStr, months) {
    let d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
}

function closeModal() { document.getElementById('detail-modal').style.display = 'none'; }
