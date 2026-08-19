const express = require("express");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE & STATIC
// ==========================================
app.use(cors());
app.use(express.json());

// ĐÃ SỬA LẠI ĐƯỜNG DẪN: Chỉ file ở thư mục hiện tại, không dùng public nữa
app.use(express.static(__dirname));

// ==========================================
// FIREBASE FIRESTORE INITIALIZATION
// ==========================================
let db;
try {
    const serviceAccount = require("./firebase-key.json");

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log("🔥 Đã kết nối Firebase Firestore thành công!");
} catch (error) {
    console.error("❌ Lỗi kết nối Firestore:", error);
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
// API TRANSACTIONS (THU / CHI)
// ==========================================
app.get("/api/transactions", async (req, res) => {
    try {
        const snapshot = await db.collection("transactions").get();
        const transactions = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu giao dịch" });
    }
});

app.get("/api/statistics", async (req, res) => {
    try {
        const snapshot = await db.collection("transactions").get();
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
                expenseByCategory[transaction.category] = (expenseByCategory[transaction.category] || 0) + amount;
            }
        });

        res.json({
            success: true,
            data: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense,
                expenseByCategory
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi tính toán thống kê" });
    }
});

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
        await db.collection("transactions").doc(transaction.id).set(transaction);
        res.status(201).json({ success: true, message: "Đã thêm giao dịch", data: transaction });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lưu giao dịch" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection("transactions").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
        }

        await docRef.delete();
        res.json({ success: true, message: "Đã xóa giao dịch" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa giao dịch" });
    }
});

app.get("/api/transactions/:id", async (req, res) => {
    try {
        const doc = await db.collection("transactions").doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy giao dịch" });
        }
        res.json({ success: true, data: doc.data() });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy dữ liệu giao dịch" });
    }
});

// ==========================================
// API DEBTS (QUẢN LÝ NỢ)
// ==========================================
app.get("/api/debts", async (req, res) => {
    try {
        const snapshot = await db.collection("debts").get();
        const debts = snapshot.docs.map(doc => doc.data());
        res.json({ success: true, data: debts });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách nợ" });
    }
});

app.post("/api/debts", async (req, res) => {
    const { type, person, amount, date, note } = req.body;

    if (!type || !person || !amount || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin khoản nợ" });
    }
    if (type !== "borrow" && type !== "lend") {
        return res.status(400).json({ success: false, message: "Loại nợ không hợp lệ" });
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
        await db.collection("debts").doc(newDebt.id).set(newDebt);
        res.status(201).json({ success: true, message: "Đã thêm khoản nợ", data: newDebt });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi lưu khoản nợ" });
    }
});

app.put("/api/debts/:id/pay", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection("debts").doc(id);
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
        res.status(500).json({ success: false, message: "Lỗi cập nhật thanh toán" });
    }
});

app.delete("/api/debts/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const docRef = db.collection("debts").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ success: false, message: "Không tìm thấy khoản nợ" });
        }

        await docRef.delete();
        res.json({ success: true, message: "Đã xóa khoản nợ" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi xóa khoản nợ" });
    }
});

// ==========================================
// SPA FALLBACK & LISTEN
// ==========================================
app.get("/{*splat}", (req, res) => {
    // ĐÃ SỬA LẠI ĐƯỜNG DẪN: Chỉ thẳng ra index.html
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});
