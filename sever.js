const express = require("express");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin"); // Thư viện kết nối Firebase

const app = express();

// Render sẽ cung cấp PORT. Khi chạy máy local sẽ dùng 3000.
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(cors());
app.use(express.json());

// ==========================================
// STATIC WEBSITE
// ==========================================
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// FIREBASE FIRESTORE INITIALIZATION
// ==========================================
let db;
try {
    // Đọc chìa khóa bảo mật từ Biến môi trường của Render
    const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    console.log("🔥 Đã kết nối Firebase Firestore thành công!");
} catch (error) {
    console.error("❌ Lỗi kết nối Firestore. Vui lòng kiểm tra biến môi trường FIREBASE_CREDENTIALS.", error);
}

// ==========================================
// API TEST
// ==========================================
app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "API quản lý chi tiêu và nợ (Firestore) đang hoạt động",
        server: "Node.js + Express + Firebase"
    });
});

// ==========================================
// API QUẢN LÝ THU / CHI (TRANSACTIONS)
// ==========================================

// Lấy danh sách thu/chi
app.get("/api/transactions", async (req, res) => {
    try {
        const snapshot = await db.collection('transactions').get();
        const transactions = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu giao dịch" });
    }
});

// Lấy thống kê
app.get("/api/statistics", async (req, res) => {
    try {
        const snapshot = await db.collection('transactions').get();
        const transactions = snapshot.docs.map(doc => doc.data());
        
        let totalIncome = 0;
        let totalExpense = 0;
        const expenseByCategory = {};

        transactions.forEach(transaction => {
            const amount = Number(transaction.amount);
            if (transaction.type === "income") {
                totalIncome += amount;
            }
            if (transaction.type === "expense") {
                totalExpense += amount;
                if (!expenseByCategory[transaction.category]) {
                    expenseByCategory[transaction.category] = 0;
                }
                expenseByCategory[transaction.category] += amount;
            }
        });

        const balance = totalIncome - totalExpense;
        res.json({
            success: true,
            data: { totalIncome, totalExpense, balance, expenseByCategory }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi tính toán thống kê" });
    }
});

// Thêm giao dịch mới
app.post("/api/transactions", async (req, res) => {
    const { type, amount, category, date, note } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin giao dịch" });
    }
    if (type !== "income" && type !== "expense") {
        return res.status(400).json({ success: false, message: "Loại giao dịch không hợp lệ" });
    }
    if (Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Số tiền phải lớn hơn 0" });
    }

    const transaction = {
        id: Date.now().toString(),
        type,
        amount: Number(amount),
        category,
        date,
        note: note || "Không có ghi chú",
        createdAt: new Date().toISOString()
    };

    try {
        // Ghi vào Firestore
        await db.collection('transactions').doc(transaction.id).set(transaction);
        res.status(201).json({ success: true, message: "Đã thêm giao dịch", data: transaction });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lưu giao dịch" });
    }
});

// Xóa giao dịch
app.delete("/api/transactions/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection('transactions').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
        }

        await docRef.delete();
        res.json({ success: true, message: "Đã xóa giao dịch" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi xóa giao dịch" });
    }
});

// Lấy giao dịch theo ID
app.get("/api/transactions/:id", async (req, res) => {
    try {
        const doc = await db.collection('transactions').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
        }
        res.json({ success: true, data: doc.data() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu giao dịch" });
    }
});


// ==========================================
// API QUẢN LÝ NỢ (DEBTS)
// ==========================================

// Lấy danh sách nợ
app.get("/api/debts", async (req, res) => {
    try {
        const snapshot = await db.collection('debts').get();
        const debts = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data: debts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách nợ" });
    }
});

// Thêm khoản nợ mới
app.post("/api/debts", async (req, res) => {
    const { type, person, amount, date, note } = req.body;

    if (!type || !person || !amount || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin khoản nợ" });
    }
    if (type !== "borrow" && type !== "lend") {
        return res.status(400).json({ success: false, message: "Loại nợ không hợp lệ (borrow/lend)" });
    }
    if (Number(amount) <= 0) {
        return res.status(400).json({ success: false, message: "Số tiền phải lớn hơn 0" });
    }

    const newDebt = {
        id: Date.now().toString(),
        type, 
        person,
        amount: Number(amount),
        date,
        note: note || "Không có ghi chú",
        status: "pending", 
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection('debts').doc(newDebt.id).set(newDebt);
        res.status(201).json({ success: true, message: "Đã thêm khoản nợ", data: newDebt });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lưu khoản nợ" });
    }
});

// Thanh toán nợ (Cập nhật trạng thái)
app.put("/api/debts/:id/pay", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection('debts').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khoản nợ" });
        }

        await docRef.update({
            status: "paid",
            paidAt: new Date().toISOString()
        });

        const updatedDoc = await docRef.get();
        res.json({ success: true, message: "Đã xác nhận thanh toán nợ", data: updatedDoc.data() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật thanh toán" });
    }
});

// Xóa khoản nợ
app.delete("/api/debts/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection('debts').doc(id);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khoản nợ" });
        }

        await docRef.delete();
        res.json({ success: true, message: "Đã xóa khoản nợ" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi xóa khoản nợ" });
    }
});

// ==========================================
// SPA FALLBACK
// ==========================================
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
