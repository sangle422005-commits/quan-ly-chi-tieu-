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
    console.error("❌ Lỗi kết nối Firestore:", error.message);
}

// ==========================================
// API TRANSACTIONS
// ==========================================
app.get("/api/transactions", async (req, res) => {
    try {
        const snapshot = await db.collection("transactions").get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error("Lỗi get transactions:", error);
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
            const amount = Number(transaction.amount) || 0;
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
        console.error("Lỗi statistics:", error);
        res.status(500).json({ success: false, message: "Lỗi tính toán thống kê" });
    }
});

app.post("/api/transactions", async (req, res) => {
    const { type, amount, category, date, note } = req.body;

    if (!type || !amount || !category || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin giao dịch" });
    }

    const transaction = {
        id: Date.now().toString(),
        type,
        amount: Number(amount),
        category,
        date,
        note: note || "",
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection("transactions").doc(transaction.id).set(transaction);
        res.status(201).json({ success: true, data: transaction });
    } catch (error) {
        console.error("Lỗi post transaction:", error);
        res.status(500).json({ success: false, message: "Lỗi lưu giao dịch" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection("transactions").doc(id).delete();
        res.json({ success: true, message: "Đã xóa giao dịch" });
    } catch (error) {
        console.error("Lỗi delete transaction:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa giao dịch" });
    }
});

// ==========================================
// API DEBTS
// ==========================================
app.get("/api/debts", async (req, res) => {
    try {
        const snapshot = await db.collection("debts").get();
        const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ success: true, data: debts });
    } catch (error) {
        console.error("Lỗi get debts:", error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách nợ" });
    }
});

app.post("/api/debts", async (req, res) => {
    const { type, person, amount, date, note } = req.body;

    if (!type || !person || !amount || !date) {
        return res.status(400).json({ success: false, message: "Thiếu thông tin khoản nợ" });
    }

    const newDebt = {
        id: Date.now().toString(),
        type,
        person,
        amount: Number(amount),
        date,
        note: note || "",
        status: "pending",
        createdAt: new Date().toISOString()
    };

    try {
        await db.collection("debts").doc(newDebt.id).set(newDebt);
        res.status(201).json({ success: true, data: newDebt });
    } catch (error) {
        console.error("Lỗi post debt:", error);
        res.status(500).json({ success: false, message: "Lỗi lưu khoản nợ" });
    }
});

app.put("/api/debts/:id/pay", async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection("debts").doc(id).update({
            status: "paid",
            paidAt: new Date().toISOString()
        });
        res.json({ success: true, message: "Đã thanh toán" });
    } catch (error) {
        console.error("Lỗi pay debt:", error);
        res.status(500).json({ success: false, message: "Lỗi cập nhật khoản nợ" });
    }
});

app.delete("/api/debts/:id", async (req, res) => {
    const id = req.params.id;
    try {
        await db.collection("debts").doc(id).delete();
        res.json({ success: true, message: "Đã xóa khoản nợ" });
    } catch (error) {
        console.error("Lỗi delete debt:", error);
        res.status(500).json({ success: false, message: "Lỗi xóa khoản nợ" });
    }
});

// ==========================================
// CATCH-ALL ROUTE (Express 4 Syntax)
// ==========================================
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
