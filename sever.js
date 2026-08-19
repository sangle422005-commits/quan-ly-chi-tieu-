const express = require("express");
const cors = require("cors");
const path = require("path");
const admin = require("firebase-admin");

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
    // Thông tin Credentials được nhúng trực tiếp vào Server
    const serviceAccount = {
      "type": "service_account",
      "project_id": "sangles-28185",
      "private_key_id": "fdc6163a08fb66fc747bd7e0b59fc30a17364a72",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsIRb2gFH9XCb3\nkXvjlRP2gONZEO1Q9HXiJUAa9MXxKzo2qM+LjUJvY/d4Y91d/m9Qp8bvUrV9ZTsx\nQhp2+EQCrYUZvhrfHPQkLKNzCEp2kHRozZhUFHqKg787riQY4QZ7QKsaLZUPdHp3\nxHACDzj1qNi3YPYGhYKnMuh1LDZrWWJSqBTVYYz9RHJNMuVePGkWGxgVq8DXyZi0\n1AzMueViUAdo/PVZADVkolEDp8jmz0c0M0F5Dsu5J6AyA3onMtBvK19Ma7RvFXG/\niNaZqbgFv6pQxFgS1i89XDiCrD5fmizPCYKAf/0qb/skwQPqPFdOq9tOZUQV7S7K\nOshsK3vNAgMBAAECggEAC5lL4v7A8knYOwd71IPyV+0rJLsjcA3rtvpGnb+6ajwS\nTKZHHK1p+Xfq2vBzysZ/OW1M1kn5qSz99khGNe0YfCEK3odfvS1wytKSjbOp0jUo\nEFCGVWgZ3SVFPiAdFkDCPzebhVnmo6d4LIOOqVIy8Y7X/Py/fK9YygEqsTac+30V\nUXRpBfDW1D0M7n8E9RVXOb3UvKZuaYgYO8gV8rGb/JNPD+WzWiR87lam53mram4n\n7Nqpo1Bg5PFvj6BOzBI764iVAnYMNd4+EzUUHor5MJkxzAodJ0acQEQ/a9tOfDqb\nj2wkblWsxAIy/Ftv6YS+dgyy97we9P18BX5nC+CCgQKBgQDU1e6G2dsk/W9+Pc3L\nRU1eYVm2OghPD+3QTvGVTZhE5Ll7coYCIBgLe5r2CEwJ9n6rqMlPwRID5LzblQr8\nM8LSYqodiMsuX16CIQNRzByeYAij0dlr5cmmLjr0KwHU4Xlgb6HM0RQG3bVHL/QR\neIvEgbeW0hSKe5DUtrJpJxZZQQKBgQDPCb/utk794gYGFfLAYAFt0/fkvjWjYoTa\nU8KyO1fYptNPNYnwkxE9cjeA9qEwbR4bFcfEaGK3Yvjlzm9yzwCTqRkQqX1MNCaW\nVyml8cRDa1tQqbkgNZp4ctEsERhAupgIeZXrWyXzA4uzQeJex97kRzEEkbNgeC6O\nScRWrJyTjQKBgQCAzg+S0NmNI0uMTP70m7Zc/fF7FNfecTdtL7mIr/MNDpcqHH75\nXk7u9Bkt+It8JA849+cNOz0Z2h5pjWOeifzHsipdwWGlaNYbTrthj3NqbZgM/Hzm\njaRhy+ylxDlRijsYn7Z967KBDUAeGulMgXWksRRYVD9WJ73Y3dBPTvZ5gQKBgQCy\nQjfCJa/vgmsjVER1hHPWhzoZ9fei3FF81b99zAB/5mtr+LHys/2VBUFqxW7Vji3s\nrh0ZK7NLKGkbHFny5O4fNOoC4ZujQAe1TAjs+zO7xLSTx/5AEEcWy+zzXyidmssK\nCP2e7hTHntbqmaB5cOelbvJyd6yVNAUJt9PXuLj7hQKBgDMLNz8mGa+HqgrDUtki\nKA5+aACx9fh7WH6Hu7YBF3V29b7x7N15zPEKxpg0kPhG+qAkyPtCxX3KVfL+i1P6\nApRMy9nO4qKBkJnXELp3i4M+UJW2Fw30T2pQM8rWoSXFl1uVeyCI6v/TBApMLxYk\nf9uZGVBLQiBg984ih2PTTz4i\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@sangles-28185.iam.gserviceaccount.com",
      "client_id": "117876037084214884475",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40sangles-28185.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    
    db = admin.firestore();
    console.log("🔥 Đã kết nối Firebase Firestore thành công!");
} catch (error) {
    console.error("❌ Lỗi kết nối Firestore.", error);
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
